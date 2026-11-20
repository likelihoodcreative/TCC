#!/usr/bin/env python3
"""Inline Calgary Script, images and shared JS into the three standalone HTML pages at the repo root."""
import base64, pathlib, re
R = pathlib.Path(__file__).parent
A = R / 'assets'
b64 = lambda p: base64.b64encode((A / p).read_bytes()).decode()
photo_js = (R / 'src/photo.js').read_text()
MAP = {
 'corner-poster-editor.html': {'CALGARY':'fonts/calgary-script.otf','PLAIN':'fonts/calgary-script-no-calt.otf','PHOTO':'images/corner-default-photo.jpg'},
 'dense-type-editor.html': {'PHOTO':'images/dense-default-photo.jpg'},
 'index.html': {'THC':'images/thumb-corner.jpg','THD':'images/thumb-dense.jpg'},
}
for name, m in MAP.items():
    s = (R / 'src' / name).read_text().replace('__PHOTOJS__', photo_js)
    for k, p in m.items(): s = s.replace(f'__{k}__', b64(p))
    left = re.findall(r'__[A-Z0-9]+__', s)
    assert not left, (name, left)
    (R / name).write_text(s); print('built', name)
