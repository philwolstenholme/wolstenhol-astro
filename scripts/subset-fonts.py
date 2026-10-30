# /// script
# requires-python = ">=3.10"
# dependencies = ["fonttools[woff]>=4.50", "opentype-sanitizer>=9.1"]
# ///
"""
Subset the self-hosted Roboto Slab webfonts into a small preloaded "core" file
and an "extended" file per weight, and write the @font-face CSS and preload list
that go with them. Run by hand; the output is committed. Nothing about fonts
happens during `astro build`.

    npm run build              # so dist/ reflects current content
    npm run fonts:subset       # = uv run scripts/subset-fonts.py
    npm run fonts:check        # exit 1 if content needs a rerun

(Without uv: `pip install "fonttools[woff]" opentype-sanitizer` and run it with
python3.)

Rerun it when:
  - the source fonts in scripts/font-sources/ change, or a weight is added;
  - CSS starts using an OpenType feature that's dropped here (e.g.
    `diagonal-fractions` needs `frac`, `lang="ca"` content needs `locl`);
  - content starts using a character the source font has that's outside
    Latin-1/Latin Extended-A and isn't already in a subset (€, ™, ′, ‹ …).
    `--check` after a build reports exactly this.

How the characters are split:
  - core (preloaded): ASCII, NBSP and the punctuation most pages use, plus —
    unless --strict-core — every candidate glyph that has a kerning pair with
    one already in core. Browsers shape each @font-face file separately, so a
    kerning pair split across two files is silently dropped ("Café" would
    re-space between f and é). Pulling those glyphs into core keeps rendering
    identical to the unsplit font.
  - extended (unicode-range, only fetched when a page needs one of its
    characters): the rest of Latin-1 and Latin Extended-A plus any other
    character the content uses, limited to what the source font actually has.
    Anything the source font lacks (CJK, emoji, most of Latin Extended-A) is
    left to the system fallback fonts, as it always has been. It also carries,
    outside its unicode-range, the letters FreeType's autohinter measures (see
    AUTOHINT_REFERENCE).

What else is cut: OpenType features the site never turns on (see
LAYOUT_FEATURES), glyph names, the STAT table and most name records. TrueType
hinting is kept unless --no-hinting: Windows (and Linux with full hinting)
runs it, so dropping it re-rasterises every glyph there.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import subprocess
import sys
import tempfile
import unicodedata
from io import BytesIO
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "scripts/font-sources"
OUT_FONT_DIR = ROOT / "public/fonts"
OUT_CSS = ROOT / "src/styles/roboto-slab.generated.css"
OUT_PRELOADS = ROOT / "src/data/fontPreloads.generated.ts"
PUBLIC_URL = "/fonts"

FONTS = [
    {
        "file": "roboto-slab-v12-latin-regular.woff2",
        "local": ["Roboto Slab Regular", "RobotoSlab-Regular"],
        "slug": "roboto-slab-400",
        "weight": 400,
    },
    {
        "file": "roboto-slab-v12-latin-700.woff2",
        "local": ["Roboto Slab Bold", "RobotoSlab-Bold"],
        "slug": "roboto-slab-700",
        "weight": 700,
    },
]

# ASCII, NBSP (used by `&nbsp;` in templates) and curly quotes, en/em dashes
# and the ellipsis (also drawn by `truncate`/`line-clamp`).
CORE_BASE = set(range(0x20, 0x7F)) | {0xA0, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026}
LATIN_1 = set(range(0xA0, 0x100))
LATIN_EXT_A = set(range(0x100, 0x180))

# FreeType's autohinter (used for "slight" hinting, the common Linux/ChromeOS
# default) ignores the font's own hints and measures its alignment zones from
# these reference characters (afblue.dat, Latin). A file without them gets
# different zones, so its glyphs rasterise differently from the full font. The
# extended file carries them in its cmap but not in its unicode-range, so
# browsers never draw them from it.
AUTOHINT_REFERENCE = {ord(c) for c in "THEZOCQSLU fijkdbh uvxzoesc nrpqgjy 0" if c != " "}

# The source font has frac, liga, locl and kern. Only liga (fi/fl) and kern
# are on by default and the site never turns on `frac` (no
# `diagonal-fractions`); `locl` only applies to Catalan (`lang="ca"`).
LAYOUT_FEATURES = ["kern", "liga"]

# Text the site renders comes from here: the built pages, the content layer
# store (covers paginated/HTMX/server-rendered content too) and the templates.
TEXT_SOURCES = [
    (ROOT / "dist", ["**/*.html"]),
    (ROOT / "node_modules/.astro", ["data-store.json"]),
    (ROOT / "src", ["**/*.astro", "**/*.tsx", "**/*.ts", "**/*.md", "**/*.mdx", "**/*.json", "**/*.css"]),
]


def collect_used_codepoints() -> set[int]:
    dist = ROOT / "dist"
    if not any(dist.glob("**/*.html")):
        sys.exit("No built pages in dist/. Run `npm run build` first so the scan sees current content.")
    used: set[int] = set()
    for base, patterns in TEXT_SOURCES:
        for pattern in patterns:
            for path in base.glob(pattern):
                if ".generated." in path.name:
                    continue
                text = path.read_text(encoding="utf-8", errors="ignore")
                if path.suffix == ".json":
                    # Decode \uXXXX escapes without caring about the structure.
                    text += json.dumps(json.loads(text), ensure_ascii=False) if text.strip() else ""
                used.update(ord(c) for c in html.unescape(text))
    return used


def kerning_pairs(font: TTFont) -> set[tuple[str, str]]:
    """Every (left, right) glyph pair with a non-zero kern adjustment."""
    pairs: set[tuple[str, str]] = set()
    if "GPOS" not in font:
        return pairs
    glyph_order = font.getGlyphOrder()
    for lookup in font["GPOS"].table.LookupList.Lookup:
        for table in lookup.SubTable:
            table = getattr(table, "ExtSubTable", table)
            if not hasattr(table, "Coverage"):
                continue
            if hasattr(table, "PairSet"):
                for first, pair_set in zip(table.Coverage.glyphs, table.PairSet, strict=True):
                    for record in pair_set.PairValueRecord:
                        if record.Value1 and getattr(record.Value1, "XAdvance", 0):
                            pairs.add((first, record.SecondGlyph))
            elif hasattr(table, "Class1Record"):
                class1: dict[int, list[str]] = {}
                class2: dict[int, list[str]] = {}
                for glyph in table.Coverage.glyphs:
                    class1.setdefault(table.ClassDef1.classDefs.get(glyph, 0), []).append(glyph)
                for glyph in glyph_order:
                    class2.setdefault(table.ClassDef2.classDefs.get(glyph, 0), []).append(glyph)
                for i, record1 in enumerate(table.Class1Record):
                    for j, record2 in enumerate(record1.Class2Record):
                        if record2.Value1 and getattr(record2.Value1, "XAdvance", 0):
                            pairs.update((a, b) for a in class1.get(i, []) for b in class2.get(j, []))
    return pairs


def kerning_closure(font: TTFont, core: set[int], candidates: set[int]) -> set[int]:
    """Grow `core` with candidates that kern against something already in it."""
    cmap = font.getBestCmap()
    by_glyph: dict[str, set[int]] = {}
    for codepoint in candidates:
        by_glyph.setdefault(cmap[codepoint], set()).add(codepoint)
    pairs = kerning_pairs(font)
    core = set(core)
    while True:
        core_glyphs = {cmap[c] for c in core}
        added = set()
        for left, right in pairs:
            if left in core_glyphs and right not in core_glyphs:
                added |= by_glyph.get(right, set())
            if right in core_glyphs and left not in core_glyphs:
                added |= by_glyph.get(left, set())
        added -= core
        if not added:
            return core
        core |= added


def make_subset(source: Path, codepoints: set[int], hinting: bool) -> bytes:
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = LAYOUT_FEATURES
    options.hinting = hinting
    options.glyph_names = False
    # Copyright, family, style, version (carries the modification notice) and
    # licence URL. Browsers don't read the rest.
    options.name_IDs = [0, 1, 2, 5, 14]
    options.notdef_outline = False
    # STAT only matters to apps' font menus.
    options.drop_tables = [*options.drop_tables, "STAT"]
    font = TTFont(source, recalcTimestamp=False)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    # Apache-2.0 §4(b): modified files must say they were changed.
    name = font["name"]
    version = name.getDebugName(5)
    name.setName(f"{version}; subset for wolstenhol.me", 5, 3, 1, 0x409)
    out = BytesIO()
    font.flavor = "woff2"
    font.save(out)
    return out.getvalue()


def describe(codepoint: int) -> str:
    char = chr(codepoint)
    return f"U+{codepoint:04X}" if unicodedata.category(char)[0] in "CZ" else char


def unicode_range(codepoints: set[int]) -> str:
    ranges: list[str] = []
    ordered = sorted(codepoints)
    start = prev = ordered[0]
    for codepoint in [*ordered[1:], None]:
        if codepoint is not None and codepoint == prev + 1:
            prev = codepoint
            continue
        ranges.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
        if codepoint is not None:
            start = prev = codepoint
    return ", ".join(ranges)


def verify(data: bytes, expected: set[int], hinting: bool, label: str) -> TTFont:
    """Font tools have quirks; check the output is what was asked for."""
    font = TTFont(BytesIO(data))
    got = set(font.getBestCmap())
    if got != expected:
        sys.exit(f"{label}: cmap mismatch, missing {sorted(expected - got)}, extra {sorted(got - expected)}")
    features = {
        record.FeatureTag
        for tag in ("GSUB", "GPOS")
        if tag in font and font[tag].table.FeatureList
        for record in font[tag].table.FeatureList.FeatureRecord
    }
    if features - set(LAYOUT_FEATURES):
        sys.exit(f"{label}: unexpected OpenType features {sorted(features - set(LAYOUT_FEATURES))}")
    hinted = any(tag in font for tag in ("fpgm", "prep", "cvt "))
    if hinted != hinting:
        sys.exit(f"{label}: hinting tables {'present' if hinted else 'missing'}, expected the opposite")
    try:
        import ots  # opentype-sanitizer: the same checks Chrome and Firefox run.

        with tempfile.NamedTemporaryFile(suffix=".woff2") as tmp:
            tmp.write(data)
            tmp.flush()
            result = ots.sanitize(tmp.name, capture_output=True)
        if result.returncode != 0:
            sys.exit(f"{label}: rejected by OpenType Sanitizer:\n{result.stderr.decode()}")
    except ImportError:
        print("  (opentype-sanitizer not installed, skipping the browser sanitizer check)")
    return font


def plan(used: set[int], strict_core: bool) -> list[dict]:
    plans = []
    for spec in FONTS:
        source = SOURCE_DIR / spec["file"]
        font = TTFont(source)
        available = set(font.getBestCmap())
        candidates = available & (used | LATIN_1 | LATIN_EXT_A | CORE_BASE)
        core = CORE_BASE & available
        if not strict_core:
            core = kerning_closure(font, core, candidates)
        extended = candidates - core
        plans.append(
            {
                **spec,
                "core": core,
                "extended": extended,
                "hidden": (AUTOHINT_REFERENCE & available) - extended,
                "source": source,
                "unused": available - candidates,
            }
        )
    return plans


def check(used: set[int]) -> int:
    """Report characters the content uses that the committed subsets don't cover."""
    css = OUT_CSS.read_text() if OUT_CSS.exists() else ""
    covered: set[int] = set()
    for match in re.finditer(r"unicode-range:\s*([^;]+);", css):
        for part in match.group(1).split(","):
            lo, _, hi = part.strip().removeprefix("U+").partition("-")
            covered.update(range(int(lo, 16), int(hi or lo, 16) + 1))
    missing: set[int] = set()
    for spec in FONTS:
        available = set(TTFont(SOURCE_DIR / spec["file"]).getBestCmap())
        missing |= (used & available) - covered - {0x09, 0x0A, 0x0D}
    if missing:
        print("Content uses characters the source font has but the subsets don't:")
        print("  " + " ".join(f"U+{c:04X} {describe(c)}" for c in sorted(missing)))
        print("Rerun `uv run scripts/subset-fonts.py`.")
        return 1
    print("Subsets cover every character the content uses.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="only report whether a rerun is needed")
    parser.add_argument(
        "--strict-core",
        action="store_true",
        help="core is only ASCII + common punctuation; smaller, but kerning between core and extended glyphs is lost",
    )
    parser.add_argument(
        "--no-hinting",
        action="store_true",
        help="drop TrueType hinting; smaller, but changes rasterisation where hints are applied (Windows)",
    )
    args = parser.parse_args()

    used = collect_used_codepoints()
    if args.check:
        return check(used)

    hinting = not args.no_hinting
    OUT_FONT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_FONT_DIR.glob("roboto-slab-*.woff2"):
        old.unlink()

    faces: list[str] = []
    preloads: list[str] = []
    for item in plan(used, args.strict_core):
        source_size = item["source"].stat().st_size
        print(f"{item['file']} ({source_size} B, {len(item['core'] | item['extended'] | item['unused'])} codepoints)")
        for part in ("core", "extended"):
            codepoints = item[part]
            if not codepoints:
                continue
            label = f"{item['slug']}-{part}"
            # Characters in the file but deliberately left out of its unicode-range.
            hidden = item["hidden"] if part == "extended" else set()
            data = make_subset(item["source"], codepoints | hidden, hinting)
            font = verify(data, codepoints | hidden, hinting, label)
            digest = hashlib.sha256(data).hexdigest()[:10]
            filename = f"{label}.{digest}.woff2"
            (OUT_FONT_DIR / filename).write_bytes(data)
            url = f"{PUBLIC_URL}/{filename}"
            if part == "core":
                preloads.append(url)
            src = ",\n".join([*(f'    local("{name}")' for name in item["local"]), f'    url("{url}") format("woff2")'])
            faces.append(
                "@font-face {\n"
                '  font-family: "Roboto Slab";\n'
                "  font-style: normal;\n"
                f"  font-weight: {item['weight']};\n"
                "  font-display: swap;\n"
                f"  src:\n{src};\n"
                f"  unicode-range: {unicode_range(codepoints)};\n"
                "}\n"
            )
            glyphs = font["maxp"].numGlyphs
            print(f"  {part:9} {len(data):6} B  {glyphs:3} glyphs  {len(codepoints):3} codepoints  {filename}")
        if item["unused"]:
            dropped = " ".join(describe(c) for c in sorted(item["unused"]))
            print(f"  dropped (unused, outside Latin-1/Ext-A): {dropped}")

    header = (
        "/* Generated by scripts/subset-fonts.py — don't edit by hand, rerun the script.\n"
        " * Core faces are preloaded (see src/data/fontPreloads.generated.ts); extended\n"
        " * faces only download when a page uses one of their characters. */\n"
    )
    OUT_CSS.write_text(header + "\n".join(faces))
    OUT_PRELOADS.write_text(
        "// Generated by scripts/subset-fonts.py — don't edit by hand, rerun the script.\n"
        "// The core Roboto Slab subsets, preloaded on every page that uses the Layout.\n"
        "export const fontPreloads: readonly string[] = [\n" + "".join(f'  "{url}",\n' for url in preloads) + "];\n"
    )
    # Match what the pre-commit hook would produce.
    oxfmt = ROOT / "node_modules/.bin/oxfmt"
    if oxfmt.exists():
        subprocess.run([oxfmt, OUT_CSS, OUT_PRELOADS], check=True, capture_output=True)
    else:
        print("  (node_modules/.bin/oxfmt missing, generated files left unformatted)")
    print(f"Wrote {OUT_CSS.relative_to(ROOT)} and {OUT_PRELOADS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
