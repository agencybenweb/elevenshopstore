import re
import json

with open(r'c:\ElevenShopStore\src\lib\demo-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Match each object in DEMO_PRODUCTS
# We can find blocks with id: '...'
pattern = re.compile(r"\{\s*id:\s*'([^']+)',\s*nom:\s*'([^']+)',\s*slug:\s*'([^']+)',\s*description:\s*'([^']*)',\s*price_cents:\s*(\d+),\s*image_url:\s*'([^']+)',\s*category_id:\s*'([^']+)'", re.MULTILINE)

matches = pattern.findall(content)
print(f"Total parsed: {len(matches)}")

svg_products = []
png_products = []

for m in matches:
    pid, nom, slug, desc, price, img, cat = m
    if img.endswith('.svg'):
        svg_products.append({
            'id': pid,
            'nom': nom,
            'category_id': cat,
            'image_url': img
        })
    else:
        png_products.append({
            'id': pid,
            'nom': nom,
            'category_id': cat,
            'image_url': img
        })

print(f"Already PNG: {len(png_products)}")
print(f"Still SVG/placeholder: {len(svg_products)}")

with open(r'c:\ElevenShopStore\scripts\pending_products.json', 'w', encoding='utf-8') as out:
    json.dump({'already_png': png_products, 'still_svg': svg_products}, out, indent=2, ensure_ascii=False)

print("Saved pending_products.json")
