import os
import urllib.request
from PIL import Image
from rembg import remove

OUTPUT_DIR = r"c:\ElevenShopStore\public\products"

ITEMS = [
    {
        "id": "snack-frit-ravich-pipas",
        "file": "card-frit-ravich-pipas.png",
        "url": "https://www.fritravich.com/wp-content/uploads/2017/06/512323-396x618.jpg"
    },
    {
        "id": "snack-frit-ravich-apetinas",
        "file": "card-frit-ravich-apetinas.png",
        "url": "https://www.fritravich.com/wp-content/uploads/2017/06/510222-1-396x618.jpg"
    },
    {
        "id": "snack-tokapi-cacahuetes",
        "file": "card-tokapi-cacahuetes.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dw2f35c45a/3564700010136_A1N1_7237834_S13.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "snack-risi-barbacoa",
        "file": "card-risi-barbacoa.png",
        "url": "https://www.tubeuse-cigarette-electrique.fr/wp-content/uploads/2023/11/match-ball-cheese-min.png"
    },
    {
        "id": "snack-risi-ketchup",
        "file": "card-risi-ketchup.png",
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

print("Done batch 3.")
