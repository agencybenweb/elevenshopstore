import re
from collections import defaultdict

with open(r'c:\ElevenShopStore\src\lib\demo-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# match id, nom, image_url, category_id
pattern = re.compile(
    r"id:\s*'([^']+)',\s*\n\s*nom:\s*'([^']+)',.*?"
    r"image_url:\s*'([^']+)',.*?"
    r"category_id:\s*'([^']+)'",
    re.DOTALL
)

matches = pattern.findall(content)
print(f"Total products matched: {len(matches)}")

by_cat = defaultdict(list)
for pid, nom, img, cat in matches:
    by_cat[cat].append((pid, nom, img))

for cat, items in by_cat.items():
    pngs = [x for x in items if x[2].endswith('.png')]
    svgs = [x for x in items if x[2].endswith('.svg')]
    jpgs = [x for x in items if x[2].endswith('.jpg')]
    print(f"[{cat}] Total: {len(items)} (PNG: {len(pngs)}, SVG: {len(svgs)}, JPG: {len(jpgs)})")
    for p in items[:3]:
        print(f"   - {p[0]}: {p[1]} -> {p[2]}")
