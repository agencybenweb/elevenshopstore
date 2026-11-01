import os
import urllib.request
from PIL import Image
from rembg import remove

OUTPUT_DIR = r"c:\ElevenShopStore\public\products"

ITEMS = [
    {
        "id": "snack-doritos-sweet-chilli",
        "file": "card-doritos-sweet-chilli.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dwad97c546/3168930173199_H1N1_6564700_S10.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "snack-doritos-dippas",
        "file": "card-doritos-dippas.png",
        "url": "https://www.doritos.fr/prod/s3fs-public/2025-01/3168930173311_T1.png"
    },
    {
        "id": "snack-benenuts-twinuts",
        "file": "card-benenuts-twinuts.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dw0f369837/3168930006169_A1N1_7091311_S13.png?sw=800&sh=800&sm=fit"
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

print("Done batch 1.")
