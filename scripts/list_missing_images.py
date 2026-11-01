import re

with open(r'c:\ElevenShopStore\src\lib\demo-data.ts', 'r', encoding='utf-8') as f:
    txt = f.read()

products = re.findall(r"id:\s*'([^']+)',\s*\n\s*nom:\s*'([^']+)',.*?\n\s*image_url:\s*'([^']+)'", txt, re.DOTALL)
print(f"Total products in demo-data: {len(products)}")
svg_list = [p for p in products if p[2].endswith('.svg')]
print(f"SVG list length: {len(svg_list)}")

by_cat = {}
# Find categories
blocks = re.split(r'/\* ═+\s*\n\s*\d+\.\s*([^\n]+)\s*\n\s*═+ \*/', txt)
# Or let's group by prefix
from collections import defaultdict
grouped = defaultdict(list)
for pid, nom, img in svg_list:
    cat = pid.split('-')[0]
    grouped[cat].append((pid, nom))

for cat, items in grouped.items():
    print(f"\n--- [{cat}] ({len(items)} items) ---")
    for pid, nom in items:
        print(f"  '{pid}': '{nom}'")
