import json
import re

updates = {
    'soda-lipton-peche': '/products/card-lipton-peche.png',
    'soda-fanta-fraise': '/products/card-fanta-fraise.png',
    'soda-fuze-tea-peche': '/products/card-fuze-tea-peche.png',
    'soda-coca-zero': '/products/card-coca-zero.png',
    'soda-cristaline': '/products/card-cristaline-50cl.png',
    'soda-perrier': '/products/card-perrier-nature.png',
    'soda-orangina-rouge': '/products/card-orangina-rouge.png',
    'soda-oasis-tropical': '/products/card-oasis-tropical.png',
    'soda-lipton-tropical': '/products/card-lipton-tropical.png',
    'soda-lipton-framboise': '/products/card-lipton-framboise.png',
    'snack-pringles-original': '/products/card-pringles-original.png'
}

# Update demo-data.ts
with open(r'c:\ElevenShopStore\src\lib\demo-data.ts', 'r', encoding='utf-8') as f:
    ts = f.read()

count = 0
for pid, img in updates.items():
    pattern = re.compile(rf"(id:\s*'{pid}',.*?\n\s*image_url:\s*)'[^']+'", re.DOTALL)
    if pattern.search(ts):
        ts = pattern.sub(rf"\g<1>'{img}'", ts, count=1)
        count += 1
    else:
        print(f"Warning: {pid} not found in demo-data.ts")

with open(r'c:\ElevenShopStore\src\lib\demo-data.ts', 'w', encoding='utf-8') as f:
    f.write(ts)
print(f"Updated {count} products in demo-data.ts")

# Update .products.json
with open(r'c:\ElevenShopStore\.products.json', 'r', encoding='utf-8') as f:
    prods = json.load(f)

json_count = 0
for p in prods:
    if p['id'] in updates:
        p['image_url'] = updates[p['id']]
        json_count += 1

with open(r'c:\ElevenShopStore\.products.json', 'w', encoding='utf-8') as f:
    json.dump(prods, f, indent=2, ensure_ascii=False)
print(f"Updated {json_count} products in .products.json")
