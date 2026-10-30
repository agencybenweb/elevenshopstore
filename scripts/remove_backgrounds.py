import os
from PIL import Image
from rembg import remove

PRODUCTS_DIR = r"c:\ElevenShopStore\public\products"

TARGETS = [
    "card-coca-original.jpg",
    "card-drpepper-coconut.jpg",
    "card-monster-mango.jpg",
    "card-monster-original.jpg",
    "card-monster-strawberry.jpg",
    "card-monster-white.jpg",
    "card-redbull-original.jpg",
    "card-redbull-ruby.jpg",
    "card-takis-blue.jpg",
    "kinder-bueno-icecream.jpg",
]

for filename in TARGETS:
    src_path = os.path.join(PRODUCTS_DIR, filename)
    if not os.path.exists(src_path):
        print(f"Skipping {filename}: not found")
        continue

    out_name = os.path.splitext(filename)[0] + ".png"
    out_path = os.path.join(PRODUCTS_DIR, out_name)

    print(f"Processing {filename} -> {out_name}...")
    try:
        with Image.open(src_path) as img:
            result = remove(img)
            result.save(out_path, format="PNG")
        print(f"Done: {out_name}")
    except Exception as e:
        print(f"Error on {filename}: {e}")

print("All background removals completed successfully.")
