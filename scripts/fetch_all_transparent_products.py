import os
import re
import io
import json
import requests
from PIL import Image
from rembg import remove

PRODUCTS_DIR = r"c:\ElevenShopStore\public\products"
DEMO_DATA_PATH = r"c:\ElevenShopStore\src\lib\demo-data.ts"
PRODUCTS_JSON_PATH = r"c:\ElevenShopStore\.products.json"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

def clean_and_center_transparent(img, target_size=(800, 800)):
    """Trims empty transparent borders and centers the product on a transparent canvas."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Get bounding box of non-zero alpha
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    w, h = img.size
    # Desired max dimension inside target canvas (leaving ~5% padding)
    max_w = int(target_size[0] * 0.90)
    max_h = int(target_size[1] * 0.90)
    
    ratio = min(max_w / w, max_h / h)
    new_w = max(1, int(w * ratio))
    new_h = max(1, int(h * ratio))
    
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new('RGBA', target_size, (0, 0, 0, 0))
    offset_x = (target_size[0] - new_w) // 2
    offset_y = (target_size[1] - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)
    
    return canvas

def search_bing_images(query, max_urls=6):
    urls = []
    # Try with transparent filter first
    for q in [f"{query} png transparent packshot", f"{query} packshot blanc"]:
        try:
            r = requests.get(
                f"https://www.bing.com/images/search?q={requests.utils.quote(q)}",
                headers=HEADERS,
                timeout=7
            )
            if r.status_code == 200:
                found = re.findall(r'murl&quot;:&quot;(http[^&]+)&quot;', r.text)
                for u in found:
                    if u not in urls:
                        urls.append(u)
            if len(urls) >= max_urls:
                break
        except Exception as e:
            print(f"Bing search error: {e}")
    return urls[:max_urls]

def fetch_and_process_product(product_name, output_slug):
    out_filename = f"card-{output_slug}.png"
    out_path = os.path.join(PRODUCTS_DIR, out_filename)
    
    # If already exists and is non-empty RGBA PNG, skip
    if os.path.exists(out_path):
        try:
            with Image.open(out_path) as existing:
                if existing.mode == 'RGBA' and existing.size[0] >= 300:
                    print(f"[{product_name}] Already exists: {out_filename}")
                    return f"/products/{out_filename}"
        except Exception:
            pass

    print(f"[{product_name}] Searching images...")
    urls = search_bing_images(product_name)
    
    for url in urls:
        # Filter out bad domains if any
        if any(bad in url.lower() for bad in ['stock-vector', 'vecteezy', 'shutterstock', '123rf']):
            continue
            
        try:
            resp = requests.get(url, headers=HEADERS, timeout=6)
            if resp.status_code != 200:
                continue
                
            raw_img = Image.open(io.BytesIO(resp.content))
            # Verify reasonable resolution
            if raw_img.width < 120 or raw_img.height < 120:
                continue
                
            print(f"  Got {url[:70]}... format={raw_img.format}, size={raw_img.size}")
            
            # If already transparent PNG with good alpha
            if raw_img.mode == 'RGBA':
                alpha = raw_img.split()[-1]
                # Check if it has genuine transparency (not all 255)
                if min(alpha.getextrema()) < 10:
                    result = clean_and_center_transparent(raw_img)
                    result.save(out_path, format="PNG")
                    print(f"  Saved transparent PNG directly: {out_filename}")
                    return f"/products/{out_filename}"
            
            # Otherwise, use rembg to remove background
            print("  Removing background with rembg...")
            if raw_img.mode != 'RGB':
                raw_img = raw_img.convert('RGB')
                
            nobg = remove(raw_img)
            result = clean_and_center_transparent(nobg)
            result.save(out_path, format="PNG")
            print(f"  Saved transparent PNG via rembg: {out_filename}")
            return f"/products/{out_filename}"
            
        except Exception as e:
            # Try next URL
            continue
            
    print(f"  FAILED to find image for {product_name}")
    return None

if __name__ == '__main__':
    # Test on a small batch of featured products
    test_batch = [
        ("Lipton Ice Tea Tropical", "lipton-tropical"),
        ("Lipton Ice Tea Framboise", "lipton-framboise"),
        ("Fuze Tea Pêche", "fuze-tea-peche"),
        ("Cristaline 50cl", "cristaline-50cl"),
        ("Perrier Nature canette", "perrier-nature"),
        ("Orangina Rouge", "orangina-rouge"),
        ("Oasis Tropical canette", "oasis-tropical"),
        ("Tropico Original canette", "tropico-original"),
        ("Sprite canette", "sprite-canette")
    ]
    for name, slug in test_batch:
        fetch_and_process_product(name, slug)
