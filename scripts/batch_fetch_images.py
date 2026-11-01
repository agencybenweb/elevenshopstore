"""
Script de remplacement des SVG manquants par de vrais packshots transparents.
Stratégie : Bing image search + rembg pour supprimer le fond.
"""
import os, re, io, sys, json
import requests
from PIL import Image
from rembg import remove

PRODUCTS_DIR = r"c:\ElevenShopStore\public\products"
DEMO_DATA_PATH = r"c:\ElevenShopStore\src\lib\demo-data.ts"
PRODUCTS_JSON_PATH = r"c:\ElevenShopStore\.products.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

# Known direct URLs for specific products (higher quality control)
DIRECT_URLS = {
    "lipton-tropical": "https://assets.unileversolutions.com/v1/103308408.png",  # Lipton Tropical bottle
    "lipton-framboise": "https://assets.unileversolutions.com/v1/103308408.png",  # Lipton framboise (use peach can as placeholder, same brand)
    "perrier-nature": "https://www.perrier.com/sites/g/files/xknfdk331/files/074780000703_FR (2).png",
}

# Bing search queries for products still missing
PRODUCTS_TO_FETCH = [
    # (slug, search_query, output_filename)
    ("fanta-fraise",     "fanta strawberry can 12oz single packshot white",         "card-fanta-fraise.png"),
    ("sprite-canette",   "sprite lemon can 330ml france packshot white",             "card-sprite-canette.png"),
    ("lipton-tropical",  "lipton ice tea tropical can 330ml white packshot",         "card-lipton-tropical.png"),
    ("lipton-framboise", "lipton ice tea framboise raspberry can 330ml white",       "card-lipton-framboise.png"),
    ("perrier-nature",   "perrier source naturelle gazeuse bouteille verte packshot", "card-perrier-nature.png"),
]

def clean_and_center(img, target_size=(1024, 1024)):
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    w, h = img.size
    max_w = int(target_size[0] * 0.85)
    max_h = int(target_size[1] * 0.85)
    ratio = min(max_w / w, max_h / h)
    new_w = max(1, int(w * ratio))
    new_h = max(1, int(h * ratio))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', target_size, (0, 0, 0, 0))
    offset_x = (target_size[0] - new_w) // 2
    offset_y = (target_size[1] - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)
    return canvas

def search_bing(query, n=8):
    try:
        r = requests.get(
            'https://www.bing.com/images/search?q=' + requests.utils.quote(query),
            headers=HEADERS, timeout=8
        )
        return re.findall(r'murl&quot;:&quot;(http[^&]+\.(?:jpg|png|webp))&quot;', r.text)[:n]
    except Exception as e:
        print(f"  Bing search error: {e}")
        return []

def process_url(url, out_path):
    """Download URL, remove bg if needed, center, and save."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        if resp.status_code != 200:
            return False
        raw_img = Image.open(io.BytesIO(resp.content))
        if raw_img.width < 120 or raw_img.height < 120:
            return False
        print(f"  Got {url[:70]}... {raw_img.size}, {raw_img.mode}")
        # If already has alpha/transparency
        if raw_img.mode == 'RGBA':
            alpha = raw_img.split()[-1]
            extrema = alpha.getextrema()
            if extrema[0] < 10:  # genuine transparency
                result = clean_and_center(raw_img)
                result.save(out_path, format="PNG")
                print(f"  Saved transparent PNG directly")
                return True
        # Remove background with rembg
        print("  Removing background with rembg...")
        rgb = raw_img.convert('RGB')
        nobg = remove(rgb)
        result = clean_and_center(nobg)
        result.save(out_path, format="PNG")
        print(f"  Saved rembg-processed PNG")
        return True
    except Exception as e:
        print(f"  Error: {e}")
        return False

def update_demo_data(pid, img_url):
    with open(DEMO_DATA_PATH, 'r', encoding='utf-8') as f:
        ts = f.read()
    pattern = re.compile(
        r"(id:\s*'" + re.escape(pid) + r"',.*?\n\s*image_url:\s*)'[^']+'",
        re.DOTALL
    )
    if pattern.search(ts):
        ts = pattern.sub(r"\g<1>'" + img_url + "'", ts, count=1)
        with open(DEMO_DATA_PATH, 'w', encoding='utf-8') as f:
            f.write(ts)
        return True
    return False

def update_products_json(pid, img_url):
    with open(PRODUCTS_JSON_PATH, 'r', encoding='utf-8') as f:
        prods = json.load(f)
    found = False
    for p in prods:
        if p.get('id') == pid:
            p['image_url'] = img_url
            found = True
    if found:
        with open(PRODUCTS_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(prods, f, indent=2, ensure_ascii=False)
    return found

# Map slug to demo-data IDs
SLUG_TO_ID = {
    "fanta-fraise":    "soda-fanta-fraise",
    "sprite-canette":  "soda-sprite",
    "lipton-tropical": "soda-lipton-tropical",
    "lipton-framboise": "soda-lipton-framboise",
    "perrier-nature":  "soda-perrier",
}

if __name__ == "__main__":
    succeeded = []
    failed = []
    
    for slug, query, filename in PRODUCTS_TO_FETCH:
        out_path = os.path.join(PRODUCTS_DIR, filename)
        print(f"\n=== Processing: {slug} ===")
        
        # Try direct URL first
        direct_url = DIRECT_URLS.get(slug)
        ok = False
        if direct_url:
            print(f"  Trying direct URL: {direct_url[:70]}")
            ok = process_url(direct_url, out_path)
        
        # Fallback: Bing search
        if not ok:
            urls = search_bing(query)
            for url in urls:
                if any(bad in url.lower() for bad in ['shutterstock', 'alamy', 'gettyimages', '123rf', 'vecteezy']):
                    continue
                ok = process_url(url, out_path)
                if ok:
                    break
        
        if ok:
            img_url = f"/products/{filename}"
            pid = SLUG_TO_ID.get(slug, "")
            if pid:
                ts_ok = update_demo_data(pid, img_url)
                json_ok = update_products_json(pid, img_url)
                print(f"  Updated demo-data.ts: {ts_ok}, .products.json: {json_ok}")
            succeeded.append(slug)
        else:
            print(f"  FAILED to find image for {slug}")
            failed.append(slug)
    
    print(f"\n=== DONE: {len(succeeded)} succeeded, {len(failed)} failed ===")
    if failed:
        print("Failed:", failed)
    if succeeded:
        print("Succeeded:", succeeded)
