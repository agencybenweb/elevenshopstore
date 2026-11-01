import urllib.request
import json

url = 'https://world.openfoodfacts.org/api/v2/search?categories_tags_en=energy-drinks&page_size=5'
req = urllib.request.Request(url, headers={'User-Agent': 'ElevenShopApp/1.0 (contact@elevenshop.fr)'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print('API v2 status:', data.get('status'))
        print('Products count:', len(data.get('products', [])))
        for p in data.get('products', []):
            print(p.get('product_name'), '->', p.get('image_front_url'))
except Exception as e:
    print('Error:', e)
