# Todos for Claude

Tick items off as you complete them. When you are finishd, review your work critically and then submit a Github PR for the changes.

If you create a new page then update the global site navigation to include a link to it.

- [x] Create a shared header that all the pages will use. Copy the 11ty header, it should link to each of the homepage sections using anchor links but also link to the standalone pages.
- [x] Copy as much of the 11ty footer as possible, ignoring the links to the 'no-JS' and 'no-CSS' versions of the site. The footer should be a shared component that can be used on all pages, including the work and github stars pages.
- [x] Copy the tweets component but make it show Bluesky posts to start with. Copy the existing approach as much as possible. My Bluesky username is @wolstenhol.me. Copy the approach from `src/data/bluesky.js` on the 11ty site.
- [x] Copy the contact form page from the 11ty repo. I have already enabled Netlify form detection. Use Alpine for any JS validation. Use HTMX for any interaction with the sever side.
- [x] Copy the 11ty site's approach to using `content-visibility` to improve rendering performance.
- [x] Look for ways to improve the loading and rendering performance of the site. Pick three of the highest impact changes and implement them.
- [x] Look for chances to simplify or shorten the codebase by using es-toolkit helpers. Look for sorting and filtering code and focus on these places first.
- [x] Look through the whole codebase for duplication, over-complicated code, or redundant comments and remove them.
- [x] Look for chances to use more modern CSS features. To get ideas, check 'CSS wrapped' blog posts like <https://developer.chrome.com/blog/css-wrapped-2025> and <https://developer.chrome.com/blog/css-wrapped-2024> and <https://developer.chrome.com/blog/css-wrapped-2023>
- [x] Add a bit of randomised grunge to the work card screenshots, like the maps images have. Keep it subtle.
- [x] Copy the 'scrolling title' feature from the 11ty site when a Spotify track is playing. See https://github.com/philwolstenholme/wolstenhol-11ty/blob/main/src/assets/scripts/utils/scrolling-title.js and https://github.com/philwolstenholme/wolstenhol-11ty/blob/main/src/assets/scripts/alpine/PwMusic/PwMusic.js#L54
- [x] Write a README summarising the approach taken to implement the site, including any performance improvements made, and any other interesting things about the site.
