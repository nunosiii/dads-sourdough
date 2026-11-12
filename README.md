# Dad's Famous Sourdough Loaf

A small static website for Dad's sourdough recipe. It has four tabs: Recipe (scaling for 1, 2 or 4 loaves with a tap-to-check method), Checks and Photos (readiness checks and a photo guide), Schedule (plans the bake day from a start or end time you pick, adjusts for kitchen temperature, and flags hands-on steps between 8pm and 6am), and Troubleshooting (19 fixes with King Arthur Baking sources). Plain HTML, CSS and vanilla JavaScript. No framework, no build step, nothing to install to run it.

## Files

```
index.html            page shell, header, tabs, sections
css/styles.css        all styling (light and dark, print, reduced motion)
js/content.js         ALL recipe content as data: edit this file
js/app.js             behavior: tabs, scaling, checkoff, schedule, lightbox
photos/               stage photos (see photos/README.txt for names)
icons/                home screen icons (180, 192, 512 px)
favicon.svg           browser tab icon
manifest.webmanifest  lets people add the site to their home screen
tests/smoke.js        Playwright smoke test (node tests/smoke.js)
.nojekyll             tells GitHub Pages to serve files as they are
```

## Edit the recipe

Open `js/content.js`. Quantities per loaf, method steps, the formula table, readiness checks, photo captions, schedule timings and the troubleshooting list are all there. Change the text, save, and reload the page. The method text is built by the `stepsFor` function so amounts scale with the loaf count. Keep quotes balanced: if a sentence needs an apostrophe, use the curly one (’) or escape it.

## Add a photo and redeploy

1. Pick the slot name from `photos/README.txt` (for example `starter-peak`). Shrink the picture to about 1600 px wide and save it as a JPG, on a Mac:
   `sips -Z 1600 -s format jpeg -s formatOptions 70 IMG_1234.HEIC --out photos/starter-peak.jpg`
2. Optional: also make a smaller WebP named the same way (`photos/starter-peak.webp`). The site uses it when present and falls back to the JPG.
3. Commit and push:
   `git add photos && git commit -m "Add starter-peak photo" && git push`
4. Wait a minute for GitHub Pages to rebuild, then reload the site. Slots with no photo show "Photo coming soon".

## Deploy on GitHub Pages

1. Create a public repository, for example `nunosiii/dads-sourdough`.
2. Put the contents of this folder at the root of the repo, then `git push` to the `main` branch.
3. In the repo go to Settings > Pages, set Source to "Deploy from a branch", choose branch `main` and folder `/ (root)`, and save.
4. After a minute the site is live at `https://nunosiii.github.io/dads-sourdough/`.
5. Link previews: `index.html` points `og:image` and `twitter:image` at the relative path `photos/finished.jpg`. Messages and social apps need an absolute URL, so after deploy change both to `https://nunosiii.github.io/dads-sourdough/photos/finished.jpg` (and add a `finished.jpg` photo).

## Preview locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. To run the smoke test: `npm install` then `npm test` (or `node tests/smoke.js` if Playwright is installed globally).

## Notes

- Loaf count always starts at 2 and is not saved. Checked steps are saved in the browser under `sd-steps` and the schedule inputs (including kitchen temp) under `sd-sched`.
- Schedule terms (anchor, stage, hands-on step, night window) are defined in `GLOSSARY.md`. The temperature rule and the night window hours are in the `schedule` block of `js/content.js`.
- Design: "Glass Ticket" (frosted glass over a deep teal and navy backdrop, amber accent). Dark only, so the page ignores the system light/dark setting. Colors, glass and spring easing are tokens at the top of `css/styles.css`.
