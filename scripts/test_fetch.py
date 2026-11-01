import os
import urllib.request
import urllib.parse
import json
from PIL import Image
from rembg import remove

def fetch_and_remove_bg(search_term, output_filename):
    print(f"Searching OFF for: {search_term}...")
    encoded = urllib.parse.quote(search_term)
    url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={encoded}&search_simple=1&action=process&json=1&page_size=5"
    req = urllib.request.Request(url, headers={'User-Agent': 'ElevenShop/1.0'})
    
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        products = data.get('products', [])
        
    img_url = None
    for p in products:
        # Prefer front image
        url_candidate = p.get('image_front_url') or p.get('image_url')
        if url_candidate:
            img_url = url_candidate
            print(f"Found product: {p.get('product_name')} -> {img_url}")
            break
            
    if not img_url:
        print("No image found on OFF!")
        return False
        
    temp_path = "temp_input.jpg"
    out_path = os.path.join(r"c:\ElevenShopStore\public\products", output_filename)
    
    # Download
    urllib.request.urlretrieve(img_url, temp_path)
    print(f"Downloaded to {temp_path}, removing background with rembg...")
    
    with Image.open(temp_path) as img:
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        res = remove(img)
        res.save(out_path, format="PNG")
        
    print(f"Saved transparent PNG: {out_path} ({res.size})")
    if os.path.exists(temp_path):
        os.remove(temp_path)
    return True

if __name__ == '__main__':
    fetch_and_remove_bg("Lipton Ice Tea Peche canette", "card-lipton-peche.png")
    fetch_and_remove_bg("Fanta Fraise canette", "card-fanta-fraise.png")
