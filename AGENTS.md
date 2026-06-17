# Instructions

I am rebuilding my Eleventy personal site in Astro. You can find the Eleventy
site at `~/Sites/wolstenhol-11ty`. Refer back to it to see what techniques and
code can be copied. Copy as much code as you can from the 11ty site but do it in
an 'Astro' way. Use content collections and Astro's env var management. Adjust
the Tailwind styling from Tailwind 3 to Tailwind 4.

## Do

- Recommend es-toolkit for utility functions
- Recommend native JavaScript/TypeScript functionality instead of es-toolkit where the native option is short and easy to understand and read
- Use Tailwind recommendations
- Use HTMX recommendations for client-side interaction
- Use JSX for Astro templates that will be server rendered or statically generated
- Use Astro recommendations
- Add inline types unless the type is very large
- Prefer focused modules over large ones with multiple responsibilities
- Always use the `clsx` to manage classnames, e.g. to merge classnames or conditionally apply them.
- Prefer creating TSX components to Astro components.
- Prefer arrow functions everywhere where possible.
- Prefer named exports, not default exports.
- Use Astro conventions, like Content Collections for fetching data.
- When editing a .astro file keep all logic in the frontmatter script tag, and do not remove the `---` characters.
- Delete any Playwright screenshots after using them to check your work. Do not commit them.
- Prefer using braces for all if statements, even if they are one line.

## Don't

- Never recommend Lodash for utility functions
