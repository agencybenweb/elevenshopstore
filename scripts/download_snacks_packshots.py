import os
import urllib.request
from PIL import Image
from rembg import remove

OUTPUT_DIR = r"c:\ElevenShopStore\public\products"

SNACK_ITEMS = [
    {
        "id": "snack-pringles-bbq",
        "file": "card-pringles-bbq.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dwae193eb2/5053990155354_H1N1_6224460_S10.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "snack-pringles-sour-cream",
        "file": "card-pringles-sour-cream.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dweddbe376/5053990155385_A1N1_5245292_S13.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "snack-pringles-paprika",
        "file": "card-pringles-paprika.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dw371bf365/5053990162703_H1N1_6024393_S10.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "snack-doritos-nacho",
        "file": "card-doritos-nacho.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dwfca5b1f3/3168930173250_H1N1_6564620_S10.png?sw=800&sh=800&sm=fit"
    },
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
    {
        "id": "snack-frit-ravich-pipas",
        "file": "card-frit-ravich-pipas.png",
        "url": "https://www.fritravich.com/wp-content/uploads/2017/06/512323-396x618.jpg"
    },
    {
        "id": "snack-tokapi-cacahuetes",
        "file": "card-tokapi-cacahuetes.png",
        "url": "https://media.e.leclerc/3564700010136?wid=800&hei=800"
    }
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for item in SNACK_ITEMS:
    out_path = os.path.join(OUTPUT_DIR, item['file'])
    print(f"Downloading {item['id']} -> {item['file']}...")
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
                print(f"  [OK] Already transparent -> {item['file']}")
            else:
                print(f"  [REMBG] Removing background for {item['file']}...")
                clipped = remove(img)
                clipped.save(out_path, format='PNG')
                print(f"  [OK] Saved clipped -> {item['file']}")
                
        if os.path.exists(temp_path):
            os.remove(temp_path)
    except Exception as e:
        print(f"  [ERROR] {item['id']}: {e}")

print("Batch snacks processing finished.")
