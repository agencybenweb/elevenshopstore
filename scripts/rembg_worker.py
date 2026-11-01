"""Helper script called by mass_product_images.py to run rembg in a subprocess.
Usage: python rembg_worker.py <input_path> <output_path>
"""
import sys
from PIL import Image
from rembg import remove

if __name__ == '__main__':
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    with Image.open(input_path) as img:
        if img.mode != 'RGB':
            img = img.convert('RGB')
        result = remove(img)
    result.save(output_path, format='PNG')
    print("OK")
