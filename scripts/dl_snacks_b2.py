import os
import urllib.request
from PIL import Image
from rembg import remove

OUTPUT_DIR = r"c:\ElevenShopStore\public\products"

ITEMS = [
    {
        "id": "snack-takis-dracula",
        "file": "card-takis-dracula.png",
        "url": "https://americanuncleshop.fr/cdn/shop/files/Takis-Dracula-limited-Edition-100g.jpg?v=1788941597&width=900"
    },
    {
        "id": "snack-takis-teriyaki",
        "file": "card-takis-teriyaki.png",
        "url": "https://media.carrefour.fr/media/referential/media/3915132979f144699a12120bc7f18881/p_540x540/08412600071502_A1N1_s01.png"
    },
    {
        "id": "snack-risi-fromage",
        "file": "card-risi-fromage.png",
        "url": "https://www.tubeuse-cigarette-electrique.fr/wp-content/uploads/2023/11/match-ball-cheese-min.png"
    },
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for item in ITEMS:
    out_path = os.path.join(OUTPUT_DIR, item['file'])
    print(f"Downloading {item['id']}...")
    try:
        req = urllib.request.Request(item['url'], headers=headers)
        temp_path = out_path + ".tmp"
        with urllib.request.urlopen(req, timeout=15) as resp, open(temp_path, 'wb') as f:
            f.write(resp.read())
        
        with Image.open(temp_path) as img:
            is_transparent = False
            if img.mode in ('RGBA', 'LA'):
                alpha = img.getchannel('A')
                if alpha.getextrema()[0] < 10:
                    is_transparent = True
            
            if is_transparent:
                img.save(out_path, format='PNG')
                print(f"  [OK] Already transparent")
            else:
                print(f"  [REMBG] Processing...")
                clipped = remove(img)
                clipped.save(out_path, format='PNG')
                print(f"  [OK] Done")
                
        if os.path.exists(temp_path):
            os.remove(temp_path)
    except Exception as e:
        print(f"  [ERROR] {item['id']}: {e}")

print("Done batch 2.")
