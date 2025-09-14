# Copilot Instructions for AI Agents

## Project Overview

This is an Astro-based static site project using TypeScript, JSX/TSX, and Tailwind CSS. The codebase is modular, with a preference for focused components and clear separation of concerns. Utility functions should use native JS/TS or es-toolkit, not Lodash.

## Key Architectural Patterns

- **Components:**
  - TSX components are preferred over `.astro` components (see `src/components/`).
  - Use arrow functions and named exports in all modules.
  - Use `clsx` for managing classnames in React/JSX/TSX components.
- **Styling:**
  - Tailwind CSS is the primary styling approach (see `src/styles/global.css`).
- **Templates & Pages:**
  - Use JSX for Astro templates that are server-rendered or statically generated.
  - See `src/pages/index.astro` for page structure.
- **Client-Side Interactivity:**
  - Use HTMX for client-side interactions where possible.

## Developer Workflows

- **Build:**
  - Use standard Astro build commands (`npm run build`).
- **Development:**
  - Use `npm run dev` for local development.
- **Type Checking:**
  - TypeScript is enforced; add inline types unless the type is very large.
- **Classname Management:**
  - Always use `clsx` for conditional/merged classnames.

## Conventions & Recommendations

- Prefer native JS/TS utilities or es-toolkit for utility functions.
- Never use Lodash.
- Prefer focused modules over large, multi-responsibility files.
- Use named exports, not default exports.
- Arrow functions everywhere.
- Inline types unless very large.

## Integration Points

- **Astro:** Project structure and build.
- **Tailwind CSS:** Styling.
- **HTMX:** Client-side interactivity.
- **es-toolkit:** Utility functions (when native JS/TS is not sufficient).
- **clsx:** Classname management.

## Key Files & Directories

- `src/components/` — Main TSX and Astro components.
- `src/pages/` — Page templates.
- `src/styles/global.css` — Global styles (Tailwind).
- `astro.config.mjs` — Astro configuration.
- `AGENTS.md` — Additional agent instructions.

---

For further conventions, see `AGENTS.md`. If any section is unclear or incomplete, please provide feedback to improve these instructions.
