# Todo

## Global

- Nav that appears on scroll (use scroll linked animation? Check for Safari support)
- [x] Container/Breakout components
  - [ ] Yes but make max widths correct, should match old site
  - [ ] Yes but find out how to add top/bottom padding to compensate for angle
- [ ] Typography components/classes
  - [ ] Fluid font sizes using that Tailwind plugin
- [ ] Section intro component
- [ ] Lede component
- [ ] Horizontal scroller component
- [ ] Footer
- [ ] Big non homepage heading
- [x] Highlighted text component
- [ ] `content-visibility` bits
- [ ] Bring background images locally or use correct Cloudinary proxy URL
- [ ] Icon system for social media links, section headers etc
  - [ ] <https://github.com/natemoo-re/astro-icon>
- [ ] List truncator for reading list (use HTMLX for partials?)
- [ ] Custom fonts
- [ ] Font subsetting
- [ ] Favicons
- [ ] Workbox/PWA?
  - [ ] Refresh for update if new version of site is available
- [ ] OpenGraph images
- [ ] Github actions for deployment

## Collections (e.g. reading list, stars, maps)

- [x] Basic pagination proof of concept
- [ ] Look at using <https://docs.astro.build/en/guides/routing/#pagination> for pagination
- [ ] Skip links
- [ ] Show a mix of fresh content but with older stuff randomly mixed in, no duplication allowed
- [x] HTMLX partials pagination
- [x] use <https://developers.netlify.com/guides/how-to-do-advanced-caching-and-isr-with-astro> for homepage ISR to allow the no-JS pagination (the query string based one) to work as-is but still have a fast site
- [x] Preload, CDN cache, or statically render the first 3 partials so the pagination feels instant

## Server/CDN

- [ ] `ETag` for SSR pages? Or can we only do that for static assets?

## Homepage

- [x] Diagonal section divider (clip path?)
- [x] Reading list item component
- [x] Speaking component
- [ ] Music player component
- [ ] Instagram card
- [ ] Bluesky post
- [ ] Mastodon post
- [ ] Twitter post
- [x] Place post

##  Portfolio

- [ ] Portfolio item screenshot
- [ ] Typography setup
- [ ] Alternating grid

##  Github stars

- [ ] Starred repo component

## Contact

- [ ] Input
- [ ] Textarea
- [ ] Button
- [ ] Form validation
