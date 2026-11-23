#!/usr/bin/env python3
"""Build the Clapham logo variants from source/.

Reads source/main.svg (THE CORNER + original Clapham) and source/alternates/clapham_NN.svg,
then writes:
  clapham.json            all variants, used by index.html
  logos/TCC_logo_NN.svg   one standalone lockup per variant, for the website embed

Each alternate is slimmed (runs of tiny path segments, invisible below ~0.25 units, are merged
into one straight edge) and scaled to the original Clapham's width, left-aligned to it and
centred on its vertical middle.

Needs: pip install svgpathtools. Optional: Node (npx svgo) for a further ~30% size cut.
"""
import json, pathlib, re, shutil, subprocess
from svgpathtools import parse_path, Line

R = pathlib.Path(__file__).parent
SRC, LOGOS = R / 'source', R / 'logos'
EPS = 0.25                                   # segments shorter than this get merged
BX, BW, CY = 256.2, 375.2, 93.5 + 142.9 / 2  # original Clapham: left edge, width, vertical centre
VIEW_W, MIN_H = 676.15, 236.4

def fmt(z): return f'{z.real:.2f},{z.imag:.2f}'

def simplify(d):
    out = []
    for sp in parse_path(d).continuous_subpaths():
        segs, run = [], None
        for s in sp:
            if s.length() < EPS:
                run = (run[0] if run else s.start, s.end)
            else:
                if run: segs.append(Line(*run)); run = None
                segs.append(s)
        if run: segs.append(Line(*run))
        if not segs: continue
        d2 = 'M' + fmt(segs[0].start)
        for s in segs:
            k = type(s).__name__
            if k == 'CubicBezier': d2 += 'C' + ' '.join(fmt(p) for p in (s.control1, s.control2, s.end))
            elif k == 'QuadraticBezier': d2 += 'Q' + fmt(s.control) + ' ' + fmt(s.end)
            else: d2 += 'L' + fmt(s.end)
        out.append(d2 + 'Z')
    return ''.join(out)

def svgo(folder):
    if shutil.which('npx'):
        subprocess.run(['npx', '--yes', 'svgo@3', '-q', '--precision', '2', '-f', str(folder)], check=False)

main = (SRC / 'main.svg').read_text()
corner = re.search(r'<g id="The_Corner">(.*?)</g>', main, re.S).group(1)

tmp = R / '.tmp'; tmp.mkdir(exist_ok=True)
for f in sorted((SRC / 'alternates').glob('clapham_*.svg')):
    s = re.sub(r' d="([^"]*)"', lambda m: ' d="' + min(simplify(m.group(1)), m.group(1), key=len) + '"', f.read_text())
    (tmp / f.name).write_text(s)
svgo(tmp)
variants, bottoms = [], []
for f in sorted(tmp.glob('clapham_*.svg')):
    n = int(re.search(r'\d+', f.stem).group())
    s = f.read_text()
    vx, vy, vw, vh = map(float, re.search(r'viewBox="([^"]*)"', s).group(1).split())
    inner = re.sub(r'\sid="[^"]*"', '', re.search(r'<svg[^>]*>(.*)</svg>', s, re.S).group(1))
    k = BW / vw; tx = BX - vx * k; ty = CY - vh * k / 2 - vy * k
    bottoms.append(CY + vh * k / 2)
    variants.append({'n': n, 't': f'translate({tx:.2f} {ty:.2f}) scale({k:.4f})', 'g': inner})
shutil.rmtree(tmp)

view = f'0 0 {VIEW_W} {max(MIN_H, max(bottoms) + 2):.2f}'
(R / 'clapham.json').write_text(json.dumps({'corner': corner, 'viewBox': view, 'variants': variants}, separators=(',', ':')))

LOGOS.mkdir(exist_ok=True)
for old in LOGOS.glob('*.svg'): old.unlink()
for v in variants:
    p = LOGOS / f"TCC_logo_{v['n']:02d}.svg"
    p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}"><g>{corner}</g><g transform="{v["t"]}">{v["g"]}</g></svg>')
svgo(LOGOS)
print(f'built {len(variants)} variants')
