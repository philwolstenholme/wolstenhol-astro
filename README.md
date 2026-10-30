# WIP

## Fonts

Roboto Slab is subset by hand, not during the build. `scripts/subset-fonts.py`
turns the sources in `scripts/font-sources/` into a preloaded core file and an
on-demand extended file per weight (`public/fonts/`), plus
`src/styles/roboto-slab.generated.css` and `src/data/fontPreloads.generated.ts`.
Commit all of its output.

```sh
npm run build          # the script scans the built pages and content store
npm run fonts:subset   # needs uv (https://docs.astral.sh/uv/)
npm run fonts:check    # exits 1 if content now uses a character the subsets lack
```

Rerun it when the source fonts or weights change, when CSS starts using an
OpenType feature it drops (`frac`, `locl`), or when `fonts:check` fails. See the
script's docstring for how the split is chosen.
