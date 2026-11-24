# TCC brand tools

Instagram poster editors for The Corner Clapham. Each page runs entirely in the browser and exports a 1080 × 1350 PNG.

- `index.html`: menu page linking to both editors
- `corner-poster-editor.html`: What's On poster (script title, photo frame, side notes, address, THE CORNER, CLAPHAM, film look, grain, blurred border)
- `dense-type-editor.html`: Dense Type (full-width header lines, repeated word in columns, framed photo, gradients, black / blue map)
- `logo-shuffle/`: the logo with one of 35 alternate Clapham scripts, picked at random, in two styles: Script (filled) and Line (stroked path) (see below)

## Logo shuffle

- `logo-shuffle/index.html`: shuffle tool. Script / Line switch, background colours (including white), Space or Enter re-rolls, arrow keys step through, `#v12` links to script variant 12 and `#l12` to line variant 12, Copy SVG copies the current lockup. Loads `clapham.json` and `clapham-line.json`, so serve the folder rather than opening the file directly.
- `logo-shuffle/logos/TCC_logo_01.svg` to `_35.svg`: standalone script lockups, 18 to 21 KB each. `TCC_logo_line_01.svg` to `_35.svg`: line lockups, about 10 KB each.
- `logo-shuffle/embed-snippet.html`: paste-in `<img>` + script for a website. Set `data-base` to wherever `logos/` is hosted. `data-style="line"` switches to the line lockups. `data-trigger` takes `load` (default), `hover`, `click` and `view`, space-separated; `tccShuffle()` re-rolls from your own code.
- `logo-shuffle/source/`: the artwork. `main.svg` is THE CORNER with the original Clapham (used for position only, not in the shuffle); `alternates/clapham_NN.svg` are the 35 exports. `line/main.svg` is the line lockup with its original path (position only); `line/alternates/line_NN.svg` are the 35 stroked paths (exported as Asset 3 to 37, renumbered 01 to 35). Line paths are used at their exported size, so the 5px stroke matches, left-aligned and top-aligned to the original path.

After changing anything in `logo-shuffle/source/`, rebuild with `python3 logo-shuffle/build.py` (needs `pip install svgpathtools`; uses `npx svgo` when Node is available). The build merges runs of sub-0.25-unit path segments in the shadow shapes, which cuts file size by about two thirds with no visible change, then scales each alternate to the original's width, left-aligned and vertically centred on it.

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
