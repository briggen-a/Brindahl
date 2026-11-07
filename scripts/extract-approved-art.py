"""Crop/mask the approved flattened master; no generated or painted pixels.

Usage: python scripts/extract-approved-art.py /path/to/APPROVED_MASTER.png
Requires Pillow. User approved manual cropping/masking and publication.
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

source = Path(sys.argv[1])
master = Image.open(source).convert('RGBA')
assert master.size == (1536, 1024), 'Expected the approved four-panel master'
root = Path(__file__).resolve().parents[1]
out = root / 'public/artwork'
out.mkdir(parents=True, exist_ok=True)

# Coordinates are in original master pixels. Portrait masks omit neighboring UI;
# they do not recover body/background pixels hidden by the source's biography.
specs = {
    'brindahl-hero': {'box': [14, 174, 506, 779]},
    'duke-portrait': {
        'box': [520, 110, 695, 670],
        'polygon': [[520, 250], [527, 232], [529, 181], [526, 157],
                    [538, 134], [551, 119], [578, 112], [609, 116],
                    [624, 129], [630, 144], [641, 151], [645, 166],
                    [654, 179], [650, 185], [660, 199], [659, 213],
                    [643, 232], [640, 253], [653, 239], [657, 272],
                    [678, 287], [688, 310], [695, 431], [634, 431],
                    [587, 462], [587, 646], [604, 665], [520, 670]],
    },
    'duchess-portrait': {
        'box': [910, 116, 1080, 670],
        'polygon': [[910, 252], [916, 228], [911, 207], [915, 184],
                    [914, 164], [923, 150], [919, 129], [934, 140],
                    [948, 126], [971, 119], [987, 123], [1007, 130],
                    [1017, 149], [1020, 162], [1035, 171], [1033, 180],
                    [1040, 186], [1034, 194], [1037, 201], [1025, 210],
                    [1005, 219], [1003, 240], [1022, 251], [1042, 270],
                    [1057, 294], [1067, 321], [1068, 375], [1068, 431],
                    [1000, 431], [942, 462], [942, 644], [960, 665],
                    [910, 670]],
    },
    'imperial-seal': {'box': [1300, 35, 1518, 350]},
    'house-seal': {'box': [686, 33, 762, 103]},
    'bishop-scene': {'box': [540, 795, 876, 940]},
    'avelis-scene': {'box': [927, 881, 1242, 943]},
}

for name, spec in specs.items():
    x, y, right, bottom = spec['box']
    artwork = master.crop((x, y, right, bottom))
    if 'polygon' in spec:
        # A hard manual mask preserves source RGB without AI edge reconstruction.
        mask = Image.new('L', artwork.size, 0)
        ImageDraw.Draw(mask).polygon([(px-x, py-y) for px, py in spec['polygon']], fill=255)
        artwork.putalpha(mask)
    extension = 'png' if 'polygon' in spec else 'webp'
    if extension == 'png':
        artwork.save(out / f'{name}.png', optimize=True)
    else:
        artwork.save(out / f'{name}.webp', lossless=True, exact=True, method=6)
    spec['width'], spec['height'] = artwork.size
    spec['file'] = f'{name}.{extension}'
    # Lossless export must preserve every visible source pixel exactly.
    decoded = Image.open(out / spec['file']).convert('RGBA')
    assert decoded.tobytes() == artwork.tobytes(), name

manifest = {
    'source': 'APPROVED_MASTER.png from the user-supplied handoff',
    'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'source_size': list(master.size),
    'method': 'Manual cropping and alpha masks only; PNG portraits and lossless WebP scenes. No generation, recoloring, retouching, or reconstructed pixels.',
    'limitations': [
        'Hero preserves the planet, full-body couple, seal, and baked-in character nameplates together.',
        'Portraits contain only visible source pixels; areas hidden by original UI remain transparent.',
        'Seals retain their original dark backgrounds; these are not vector or fully isolated logos.',
        'Native source resolution limits sharpness on high-density screens.',
    ],
    'assets': specs,
}
(out / 'provenance.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({name: {'size': [s['width'], s['height']], 'bytes': (out/s['file']).stat().st_size} for name, s in specs.items()}, indent=2))
