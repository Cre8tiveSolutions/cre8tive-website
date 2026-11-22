# Cre8tive Solutions — website

A plain static website: no build step. GitHub Pages serves `index.html` as it is.

## Files
- `index.html` — the whole page (text, layout, styles)
- `assets/site.js` — the animations and interactive parts
- `assets/gsap.min.js`, `assets/ScrollTrigger.min.js` — the GSAP animation library
- `favicon.svg` — browser tab icon
- `og-image.png` — preview picture shown when the link is shared
- `.nojekyll` — tells GitHub Pages to serve the files as they are

## Still to fill in (search index.html for these)
- `S$[PRICE]` — your prices (4 places)
- `[hello@yourdomain.com]` — your email address
- "We run businesses too. Our own logistics companies run on what we build…" — keep or edit
- Buttons "Start a project" / "Book a call" currently jump to the bottom of the page (`#contact`).
  To send people to a booking page or WhatsApp, replace `href="#contact"` with your link,
  e.g. `href="https://wa.me/65XXXXXXXX"` or `href="mailto:you@domain.com"`.
