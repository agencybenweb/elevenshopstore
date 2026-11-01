import re
from collections import Counter

with open(r'c:\ElevenShopStore\src\lib\demo-data.ts', 'r', encoding='utf-8') as f:
    txt = f.read()

matches = re.findall(r"image_url:\s*'([^']+)'", txt)
counts = Counter([m.split('.')[-1] for m in matches])
print('Extensions in demo-data.ts:', counts)

pngs = [m for m in matches if m.endswith('.png')]
print(f'Total PNGs: {len(pngs)}')
for p in set(pngs):
    print('  ', p)
