"""
mass_product_images.py
Télécharge et détoure TOUS les produits restants (encore sur SVG).
Stratégie :
  1. URL directe connue (si disponible)
  2. Open Food Facts API (recherche par nom)
  3. rembg via subprocess avec timeout de 60s max par image
Résultats sauvegardés dans public/products/card-<slug>.png
"""

import os, io, sys, re, time, subprocess, tempfile, requests
from PIL import Image

PRODUCTS_DIR = r"c:\ElevenShopStore\public\products"
REMBG_WORKER = r"c:\ElevenShopStore\scripts\rembg_worker.py"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}
REMBG_TIMEOUT = 60  # seconds per image

# ─────────────────────────────────────────────────────────────────────────────
# Product list: (display_name, output_slug, [optional direct url])
# ─────────────────────────────────────────────────────────────────────────────
PRODUCTS = [
    # ── SODAS ────────────────────────────────────────────────────────────────
    ("Nestea Limon canette", "nestea-limon", "https://media.carrefour.fr/media/referential/media/d7a3c06dfdd7454faf3459985d90e8b3/p_540x540/03228882009965_A1N1_s01.jpg"),
    ("Nestea Maracuya canette", "nestea-maracuya", None),
    ("Nestea Frutos Rojos canette", "nestea-frutos-rojos", None),
    ("Oasis Ice Tea Pêche canette", "oasis-ice-tea-peche", "https://media.carrefour.fr/media/referential/media/e4c17b1d88a740a1bc5b5e7d4d3e3e8b/p_540x540/03124480024506_A1N1_s01.jpg"),
    ("Oasis Ice Tea Citron Fraise canette", "oasis-ice-tea-citron-fraise", None),
    ("Coca-Cola Vanille canette", "coca-vanilla", "https://media.carrefour.fr/media/referential/media/a7c4d0c1b26f449ebc7f5d8e1e8e6c9a/p_540x540/05449000206015_A1N1_s01.jpg"),
    ("Coca-Cola Caramel canette", "coca-caramel", None),
    ("Orangina Zero canette bleue", "orangina-zero", "https://media.carrefour.fr/media/referential/media/0bce9f8da7844c47a90e1bcb15b0e5e1/p_540x540/03124480057701_A1N1_s01.jpg"),
    ("Oasis Pomme Cassis Framboise canette", "oasis-pomme-cassis", None),
    ("Dr Pepper Original canette", "drpepper-original", "https://media.carrefour.fr/media/referential/media/5c8e8e6c9a1b449ebc7f5d8e1e8e6c9a/p_540x540/05050164117041_A1N1_s01.jpg"),
    ("Dr Pepper Cherry canette", "drpepper-cherry", None),
    ("Dr Pepper Vanilla Float canette", "drpepper-vanilla-float", None),
    ("Dr Pepper Blackberry canette", "drpepper-blackberry", None),
    ("Fanta Pomme Verte canette", "fanta-pomme-verte", None),
    ("Fanta Citron canette", "fanta-citron", "https://media.carrefour.fr/media/referential/media/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6/p_540x540/05449000206008_A1N1_s01.jpg"),
    ("Fanta Berry bleu canette", "fanta-berry", None),
    ("Fanta Raisin violet canette", "fanta-raisin", None),
    ("Fanta Pêche canette", "fanta-peche", None),
    ("Fanta Halloween Mystery canette", "fanta-halloween", None),
    ("Sprite Litchi canette import asiatique", "sprite-litchi", None),
    ("Fanta Pêche Blanche import asiatique canette", "fanta-asie-peche", None),
    ("Schweppes Lemon canette", "schweppes-lemon", "https://media.carrefour.fr/media/referential/media/5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c/p_540x540/05449000131898_A1N1_s01.jpg"),
    ("Schweppes Indian Tonic canette", "schweppes-tonic", None),
    ("Schweppes Pomme canette", "schweppes-pomme", None),
    ("Schweppes Agrumes canette", "schweppes-agrumes", None),
    ("Slim Pomme canette", "slim-pomme", None),
    ("Slim Orange canette", "slim-orange", None),
    ("Slim Citron canette", "slim-citron", None),
    ("Selecto soda algérien canette", "selecto", None),
    ("Hamoud La Blanche limonade algérienne canette", "hamoud", None),

    # ── SNACKS ───────────────────────────────────────────────────────────────
    ("Doritos Dippas nachos", "doritos-dippas", "https://media.carrefour.fr/media/referential/media/5053990137350_A1N1_s01.jpg"),
    ("Risi Match Ball Fromage chips", "risi-fromage", "https://www.tubeuse-cigarette-electrique.fr/wp-content/uploads/2023/11/match-ball-cheese-min.png"),
    ("Risi Match Ball Barbacoa chips", "risi-barbacoa", None),
    ("Risi Match Ball Ketchup chips", "risi-ketchup", None),
    ("Takis Teriyaki chips piment", "takis-teriyaki", "https://media.carrefour.fr/media/referential/media/08412600071502_A1N1_s01.jpg"),
    ("Takis Dracula Limited Edition chips", "takis-dracula", "https://americanuncleshop.fr/cdn/shop/files/Takis-Dracula-limited-Edition-100g.jpg?v=1788941597&width=900"),
    ("Frit Ravich Apetinas mélange ibérique", "frit-ravich-apetinas", None),
    ("Frit Ravich Pipas Saladas graines tournesol", "frit-ravich-pipas", None),
    ("Tokapi Cacahuètes Dorées au four", "tokapi-cacahuetes", None),

    # ── SUCRERIES / BISCUITS ─────────────────────────────────────────────────
    ("LU Petit Ecolier chocolat lait biscuit", "lu-petit-ecolier", None),
    ("LU Granola chocolat lait biscuit", "lu-granola", None),
    ("LU Prince chocolat biscuit", "lu-prince", None),
    ("LU Pepito croc sable biscuit chocolat", "lu-pepito", None),
    ("Mikado Glico biscuit chocolat lait", "mikado", None),
    ("Brossard Savane Pocket chocolat gateau", "savane-pocket", None),
    ("St Michel galette chocolat caramel biscuit", "st-michel-galette", None),
    ("Bonne Maman quatre-quarts beurre gateau", "bonne-maman-quatre-quarts", None),
    ("Bonne Maman madeleine pur beurre", "bonne-maman-madeleine", None),
    ("Bonne Maman madeleine chocolat napee", "bonne-maman-madeleine-choco", None),
    ("Harrys Choco Mousse brioches chocolat x8", "harrys-choco-mousse", None),
    ("Palmiers nappes chocolat biscuit feuillete", "palmiers-choco", None),
    ("Mulino Bianco Baiocchi biscuit noisette", "baiocchi", None),
    ("Milka Choco Cake gateau chocolat moelleux", "milka-choco-cake", None),
    ("Milka Peanut Caramel barre chocolat", "milka-peanut-caramel", None),
    ("MMs Minis tube chocolat lait", "mms-minis", None),
    ("MMs Cookie Dough pate cookie chocolat", "mms-cookie-dough", None),
    ("MMs Crispy riz croquant chocolat sachet", "mms-crispy", None),
    ("Kinder Crunchy Cookies biscuit chocolat", "kinder-cookies", None),
    ("Kinder Tronky gauffre chocolat noisette", "kinder-tronky", None),
    ("Kinder Cards gauffre bicolore cacao", "kinder-cards", None),
    ("Kinder Happy Hippo hippopotame gauffre", "kinder-happy-hippo", None),
    ("Kinder Kinderini biscuits amusants", "kinder-kinderini", None),
    ("Kinder Bueno Mini bouchees noisette", "kinder-bueno-mini", None),
    ("Kinder TRIS assortiment snack", "kinder-tris", None),
    ("Kinder Schoko-Bons Crispy bonbons noisette", "kinder-schokobons-crispy", None),
    ("Nutella Biscuits cookies chocolat coeur fondant", "nutella-cookies", None),
    ("Carte Noire Moulins de cafe capsule", "carte-noire", None),
    ("LOr Moulins de cafe", "lor-cafe", None),
    ("Carrefour cafe soluble instantane", "carrefour-cafe", None),
    ("Nocilla Duo pate tartiner deux couleurs noisette chocolat blanc", "nocilla-duo", None),
    ("Nocilla Original pate tartiner noisette cacao", "nocilla-original", None),

    # ── FRAIS ────────────────────────────────────────────────────────────────
    ("Daunat Mega Pain Viennois thon oeuf sandwich", "daunat-viennois-thon", None),
    ("Daunat XXL baguette thon oeuf crudites sandwich", "daunat-xxl-thon", None),
    ("Daunat XXL poulet roti mayonnaise sandwich baguette", "daunat-xxl-poulet", None),
    ("Sodebo Cremie pates emmental mozzarella plat", "sodebo-cremie-mozza", None),
    ("Sodebo Cremie pates thon emmental plat", "sodebo-cremie-thon", None),
    ("Sodebo PastaBox chevre sauce tomate penne", "sodebo-pastabox-chevre", None),
    ("Sodebo PastaBox saumon citron tagliatelles", "sodebo-pastabox-saumon", None),
    ("Capri-Sun Mystic Dragon poche jus", "caprisun-dragon", None),
    ("Capri-Sun Multivitamin poche jus vitamines", "caprisun-multivitamin", None),
    ("Capri-Sun Multifruits poche jus", "caprisun-multifruits", None),
    ("Capri-Sun Mango Passion poche jus mangue", "caprisun-mango-passion", None),
    ("CandyUp banane brique lait lactee", "candyup-banane", None),
    ("CandyUp fraise brique lait lactee", "candyup-fraise", None),
    ("CandyUp chocolat brique lait lactee", "candyup-chocolat", None),
    ("CandyUp choco coco brique lait noix de coco", "candyup-chococo", None),

    # ── ASIATIQUE ────────────────────────────────────────────────────────────
    ("Samyang Buldak Cheese Hot Chicken Ramen jaune nouilles", "buldak-cheese", None),
    ("Samyang Buldak 2x Spicy Hot Chicken Ramen rouge nouilles", "buldak-2x-spicy", None),
    ("Samyang Buldak Jjajang Hot Chicken Ramen vert nouilles", "buldak-jjajang", None),
    ("YumYum Beef boeuf nouilles instantanees thai", "yumyum-beef", None),
    ("YumYum Chicken poulet nouilles instantanees thai", "yumyum-chicken", None),
    ("YumYum Shrimp crevette nouilles instantanees thai", "yumyum-shrimp", None),
    ("YumYum Cheese fromage nouilles instantanees thai", "yumyum-cheese", None),
    ("Hongdae Topokki gateau riz coreen sauce epice", "hongdae-topokki", None),
    ("Ghost Pepper Spicy Black Noodles Cup nouilles piment", "ghost-pepper-cup", None),
    ("Tao Kae Noi Big Roll algues nori croustillantes", "taokaenoi-algues", None),
    ("BaiShanZu champignons shiitake croustillants asiatique", "baishanzu-shiitake", None),
]


def search_bing_images(query, max_urls=8):
    """Search Bing Images, return list of image URLs."""
    urls = []
    for q in [f"{query} transparent png packshot", f"{query} packshot product"]:
        try:
            r = requests.get(
                "https://www.bing.com/images/search",
                params={'q': q, 'mmasync': '1'},
                headers=HEADERS,
                timeout=10
            )
            if r.status_code == 200:
                found = re.findall(r'murl&quot;:&quot;(http[^&]+)&quot;', r.text)
                bad = ('shutterstock', 'alamy', '123rf', 'dreamstime', 'gettyimages', 'vecteezy', 'freepik')
                for u in found:
                    if not any(b in u.lower() for b in bad) and u not in urls:
                        urls.append(u)
            if len(urls) >= max_urls:
                break
        except Exception as e:
            print(f"    Bing error: {e}")
    return urls[:max_urls]


def clean_and_center(img, target=(800, 800)):
    """Crop transparent border, resize to fit target, center on transparent canvas."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    w, h = img.size
    max_w, max_h = int(target[0] * 0.90), int(target[1] * 0.90)
    ratio = min(max_w / w, max_h / h, 1.0)  # never upscale too much
    # allow upscaling for small images
    ratio = min(max_w / w, max_h / h)
    nw, nh = max(1, int(w * ratio)), max(1, int(h * ratio))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', target, (0, 0, 0, 0))
    ox, oy = (target[0] - nw) // 2, (target[1] - nh) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def rembg_subprocess(input_path, output_path, timeout=REMBG_TIMEOUT):
    """Run rembg in a subprocess with timeout. Returns True on success."""
    try:
        result = subprocess.run(
            [sys.executable, REMBG_WORKER, input_path, output_path],
            timeout=timeout,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return True
        print(f"    rembg worker error: {result.stderr[:200]}")
        return False
    except subprocess.TimeoutExpired:
        print(f"    rembg timed out after {timeout}s")
        return False
    except Exception as e:
        print(f"    rembg subprocess error: {e}")
        return False


def download_image(url):
    """Download image, return PIL Image or None."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=12, stream=True)
        if resp.status_code != 200:
            return None
        content = resp.content
        img = Image.open(io.BytesIO(content))
        if img.width < 80 or img.height < 80:
            return None
        return img
    except Exception:
        return None


def process_product(name, slug, direct_url=None):
    out_path = os.path.join(PRODUCTS_DIR, f"card-{slug}.png")

    # Skip if already done and valid
    if os.path.exists(out_path):
        try:
            with Image.open(out_path) as ex:
                if ex.mode == 'RGBA' and ex.size[0] >= 200:
                    print(f"[SKIP] {name}")
                    return True
        except Exception:
            pass

    print(f"\n[>] {name} ({slug})")
    urls_to_try = []
    if direct_url:
        urls_to_try.append(('direct', direct_url))

    # Search Bing Images
    bing_urls = search_bing_images(name)
    for u in bing_urls:
        urls_to_try.append(('bing', u))
    if bing_urls:
        print(f"    Bing: {len(bing_urls)} URLs found")

    if not urls_to_try:
        print(f"    [FAIL] No URLs found")
        return False

    for source, url in urls_to_try:
        print(f"    Trying {source}: {url[:70]}...")
        img = download_image(url)
        if img is None:
            print(f"    Download failed")
            continue

        print(f"    Downloaded: {img.size}, mode={img.mode}")

        # Check if already transparent
        if img.mode in ('RGBA', 'LA'):
            alpha = img.split()[-1]
            min_alpha = alpha.getextrema()[0]
            if min_alpha < 5:  # has real transparency
                result = clean_and_center(img)
                result.save(out_path, format='PNG')
                print(f"    [OK-TRANSPARENT] Saved directly")
                return True

        # Use rembg via subprocess with timeout
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp_in = tmp.name
        try:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.save(tmp_in, format='JPEG', quality=92)

            tmp_out = tmp_in.replace('.jpg', '_out.png')
            print(f"    Running rembg (max {REMBG_TIMEOUT}s)...")
            ok = rembg_subprocess(tmp_in, tmp_out)
            if ok and os.path.exists(tmp_out):
                with Image.open(tmp_out) as nobg:
                    result = clean_and_center(nobg)
                result.save(out_path, format='PNG')
                print(f"    [OK-REMBG] Saved")
                return True
        finally:
            for p in [tmp_in, tmp_out if 'tmp_out' in dir() else None]:
                if p and os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass

    print(f"    [FAIL] All URLs exhausted")
    return False


if __name__ == '__main__':
    os.makedirs(PRODUCTS_DIR, exist_ok=True)

    done, failed, skipped = [], [], []

    print(f"Processing {len(PRODUCTS)} products...\n")
    for i, item in enumerate(PRODUCTS, 1):
        name, slug = item[0], item[1]
        direct_url = item[2] if len(item) > 2 else None

        print(f"[{i}/{len(PRODUCTS)}]", end='')
        try:
            success = process_product(name, slug, direct_url)
            if success:
                out = os.path.join(PRODUCTS_DIR, f"card-{slug}.png")
                if os.path.exists(out):
                    done.append(slug)
                else:
                    skipped.append(slug)
            else:
                failed.append(slug)
        except Exception as e:
            print(f"    ERROR: {e}")
            failed.append(slug)

    print("\n\n" + "="*60)
    print(f"DONE:    {len(done)}")
    print(f"FAILED:  {len(failed)}")
    print(f"SKIPPED: {len(skipped)}")
    if failed:
        print(f"\nFailed slugs: {', '.join(failed)}")
