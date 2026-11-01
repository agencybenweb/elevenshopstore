from duckduckgo_search import DDGS
import requests
from PIL import Image
from rembg import remove
import io

def get_product_transparent(query, out_filename):
    print(f"Searching images for: {query}")
    with DDGS() as ddgs:
        results = list(ddgs.images(query + " packshot", max_results=3))
        
    if not results:
        print("No results found!")
        return False
        
    for r in results:
        img_url = r.get('image')
        print(f"Trying image: {img_url}")
        try:
            resp = requests.get(img_url, timeout=5, headers={'User-Agent': 'Mozilla/5.0'})
            if resp.status_code == 200:
                raw_img = Image.open(io.BytesIO(resp.content))
                if raw_img.mode != 'RGB':
                    raw_img = raw_img.convert('RGB')
                print("Removing background with rembg...")
                nobg = remove(raw_img)
                out_path = f"c:\\ElevenShopStore\\public\\products\\{out_filename}"
                nobg.save(out_path, format="PNG")
                print(f"Successfully saved {out_path} ({nobg.size})!")
                return True
        except Exception as e:
            print(f"Error fetching/processing {img_url}: {e}")
            
    return False

if __name__ == '__main__':
    get_product_transparent("Lipton Ice Tea Peche 33cl", "card-lipton-peche.png")
