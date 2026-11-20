# TCC brand tools

Instagram poster editors for The Corner Clapham. Each page runs entirely in the browser and exports a 1080 × 1350 PNG.

- `index.html`: menu page linking to both editors
- `corner-poster-editor.html`: What's On poster (script title, photo frame, side notes, address, THE CORNER, CLAPHAM, film look, grain, blurred border)
- `dense-type-editor.html`: Dense Type (full-width header lines, repeated word in columns, framed photo, gradients, black / blue map)

Open `index.html` locally, or serve the folder from any static host. The three root pages are self-contained (fonts and images inlined), so they only need to sit in the same folder.

## Editing

Source lives in `src/`; fonts, images and the Lightroom preset live in `assets/`. After changing anything in `src/` or `assets/`, rebuild the root pages:

```
python3 build.py
```

`src/photo.js` (film look, exposure, black & white, gradient map, grain) is inlined into the Dense Type editor at build time. The What's On editor carries its own copy inline.

## Fonts

- **Alternate Gothic ATF** and the menu page's Calgary Script load from the Adobe Fonts kit (`use.typekit.net/jnz7net.css`). Add every domain the pages are served from (for example the GitHub Pages domain) to the kit's web project in Adobe Fonts, or the canvas falls back to a system font.
- **Calgary Script** is also embedded in the What's On editor, in two versions (with and without contextual alternates), because canvas can't switch OpenType features and the "Swash endings" control depends on it. Check the licence covers embedding.

## Crawlers

Every page carries `noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai` robots meta tags, and `robots.txt` disallows all crawlers, with named AI crawlers listed explicitly. These are requests that well-behaved bots honour, not access control, and `robots.txt` only counts at the root of a domain.
