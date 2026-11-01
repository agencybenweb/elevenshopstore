import os
import urllib.request
from PIL import Image
from rembg import remove

OUTPUT_DIR = r"c:\ElevenShopStore\public\products"

ENERGY_ITEMS = [
    {
        "id": "energy-redbull-yellow",
        "file": "card-redbull-yellow.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dw8fd77cff/9002490228071_A_234539002490228071_S01.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "energy-redbull-red",
        "file": "card-redbull-red.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dw7b6b5e1b/9002490246594_A1N1_7674396_S13.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "energy-redbull-white",
        "file": "card-redbull-white.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dw60156e61/9002490246624_A1N1_6195693_S13.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "energy-redbull-winter",
        "file": "card-redbull-winter.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dw93476356/9002490278281_A_234539002490278281_S01.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "energy-redbull-ice",
        "file": "card-redbull-ice.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dw7a6e7b17/9002490274641_A1N1_1896517_S13.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "energy-redbull-sea-blue",
        "file": "card-redbull-sea-blue.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dw89739a25/9002490263195_A1N1_2796374_S13.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "energy-redbull-apricot",
        "file": "card-redbull-apricot.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dwd958865b/9002490255916_A1N1_6254554_S13.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "energy-crazy-tiger",
        "file": "card-crazy-tiger.png",
        "url": "https://static.coursesu.com/dw/image/v2/BBQX_PRD/on/demandware.static/-/Sites-digitalu-master-catalog/default/dwde788996/3760205598654_A1N1_5146033_S13.png?sw=800&sh=800&sm=fit"
    },
    {
        "id": "energy-ciao",
        "file": "card-ciao.png",
        "url": "https://media.carrefour.fr/media/referential/media/e83531fceb9f44f380b7166b88f40dae/p_540x540/03770037280108_A1N1_s01.png"
    }
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for item in ENERGY_ITEMS:
    out_path = os.path.join(OUTPUT_DIR, item['file'])
    print(f"Downloading {item['id']} -> {item['file']}...")
    try:
        req = urllib.request.Request(item['url'], headers=headers)
        temp_path = out_path + ".tmp"
        with urllib.request.urlopen(req, timeout=15) as resp, open(temp_path, 'wb') as f:
            f.write(resp.read())
        
        with Image.open(temp_path) as img:
            # Check if image has transparency
            is_transparent = False
            if img.mode in ('RGBA', 'LA'):
                alpha = img.getchannel('A')
                if alpha.getextrema()[0] < 10:  # has transparent pixels
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

print("Batch energy drinks processing finished.")
