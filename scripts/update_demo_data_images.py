# encoding: utf-8
"""
update_demo_data_images.py
Parcourt tous les card-*.png dans /public/products/ et met à jour demo-data.ts
pour pointer vers ces nouveaux PNGs au lieu des SVGs génériques.

Mapping slug → product: on cherche la ligne `slug: '<slug_ts>'` dans demo-data.ts
et on met à jour le champ image_url sur les quelques lignes suivantes.
"""
import os
import re

PRODUCTS_DIR = r"c:\ElevenShopStore\public\products"
DEMO_DATA = r"c:\ElevenShopStore\src\lib\demo-data.ts"

# Map: output_slug (from card-<slug>.png) → TypeScript product slug
# The TS slug is in the `slug:` field of each product entry.
# If the slug in the filename matches the TS slug directly, no mapping needed.
# Add entries here if the filename slug differs from the TS slug.
SLUG_MAP = {
    # filename-slug: ts-slug
    "nestea-limon":          "nestea-limon",
    "nestea-maracuya":       "nestea-maracuya",
    "nestea-frutos-rojos":   "nestea-frutos-rojos",
    "oasis-ice-tea-peche":   "oasis-ice-tea-peche",
    "oasis-ice-tea-citron-fraise": "oasis-ice-tea-citron-fraise",
    "coca-vanilla":          "coca-cola-vanilla",
    "coca-caramel":          "coca-cola-caramel",
    "orangina-zero":         "orangina-zero-bleue",
    "oasis-pomme-cassis":    "oasis-pomme-cassis-framboise",
    "drpepper-original":     "dr-pepper-original",
    "drpepper-cherry":       "dr-pepper-cherry",
    "drpepper-vanilla-float": "dr-pepper-vanilla-float",
    "drpepper-blackberry":   "dr-pepper-blackberry",
    "fanta-pomme-verte":     "fanta-pomme-verte",
    "fanta-citron":          "fanta-citron",
    "fanta-berry":           "fanta-berry-bleu",
    "fanta-raisin":          "fanta-raisin-violet",
    "fanta-peche":           "fanta-peche",
    "fanta-halloween":       "fanta-halloween-mystery",
    "sprite-litchi":         "sprite-import-asiatique-litchi",
    "fanta-asie-peche":      "fanta-import-asiatique-peche-blanche",
    "schweppes-lemon":       "schweppes-lemon",
    "schweppes-tonic":       "schweppes-indian-tonic",
    "schweppes-pomme":       "schweppes-pomme",
    "schweppes-agrumes":     "schweppes-agrumes",
    "slim-pomme":            "slim-pomme",
    "slim-orange":           "slim-orange",
    "slim-citron":           "slim-citron",
    "selecto":               "selecto-original",
    "hamoud":                "hamoud-la-blanche",
    # snacks
    "doritos-dippas":        "doritos-dippas",
    "risi-fromage":          "risi-match-ball-fromage",
    "risi-barbacoa":         "risi-match-ball-barbacoa",
    "risi-ketchup":          "risi-match-ball-ketchup",
    "takis-teriyaki":        "takis-teriyaki",
    "takis-dracula":         "takis-dracula-limited-edition",
    "frit-ravich-apetinas":  "frit-ravich-apetinas",
    "frit-ravich-pipas":     "frit-ravich-pipas-saladas",
    "tokapi-cacahuetes":     "tokapi-cacahuetes-dorees",
    # sweets
    "lu-petit-ecolier":      "lu-petit-ecolier-chocolat-lait",
    "lu-granola":            "lu-granola-chocolat-lait",
    "lu-prince":             "lu-prince-gout-chocolat",
    "lu-pepito":             "lu-pepito-croc-sable",
    "mikado":                "glico-mikado-chocolat-lait",
    "savane-pocket":         "brossard-savane-pocket-chocolat",
    "st-michel-galette":     "st-michel-galette-chocolat-caramel",
    "bonne-maman-quatre-quarts": "bonne-maman-quatre-quarts",
    "bonne-maman-madeleine": "bonne-maman-madeleine-pur-beurre",
    "bonne-maman-madeleine-choco": "bonne-maman-madeleine-chocolat",
    "harrys-choco-mousse":   "harrys-choco-mousse-x8",
    "palmiers-choco":        "palmiers-nappes-chocolat",
    "baiocchi":              "mulino-bianco-baiocchi",
    "milka-choco-cake":      "milka-choco-cake",
    "milka-peanut-caramel":  "milka-peanut-caramel",
    "mms-minis":             "mms-minis",
    "mms-cookie-dough":      "mms-cookie-dough",
    "mms-crispy":            "mms-crispy",
    "kinder-cookies":        "kinder-crunchy-cookies",
    "kinder-tronky":         "kinder-tronky",
    "kinder-cards":          "kinder-cards",
    "kinder-happy-hippo":    "kinder-happy-hippo",
    "kinder-kinderini":      "kinder-kinderini",
    "kinder-bueno-mini":     "kinder-bueno-mini",
    "kinder-tris":           "kinder-tris",
    "kinder-schokobons-crispy": "kinder-schoko-bons-crispy",
    "nutella-cookies":       "nutella-cookies",
    "carte-noire":           "moulins-cafe-carte-noire",
    "lor-cafe":              "moulins-cafe-lor",
    "carrefour-cafe":        "carrefour-extra-cafe",
    "nocilla-duo":           "nocilla-duo",
    "nocilla-original":      "nocilla-original",
    # frais
    "daunat-viennois-thon":  "daunat-mega-viennois-thon-oeuf",
    "daunat-xxl-thon":       "daunat-xxl-thon-oeuf-crudites",
    "daunat-xxl-poulet":     "daunat-xxl-poulet-roti-mayo",
    "sodebo-cremie-mozza":   "sodebo-cremie-emmental-mozza",
    "sodebo-cremie-thon":    "sodebo-cremie-thon-emmental",
    "sodebo-pastabox-chevre": "sodebo-pastabox-chevre-tomate",
    "sodebo-pastabox-saumon": "sodebo-pastabox-saumon-citron",
    "caprisun-dragon":       "capri-sun-mystic-dragon",
    "caprisun-multivitamin": "capri-sun-multivitamin",
    "caprisun-multifruits":  "capri-sun-multifruits",
    "caprisun-mango-passion": "capri-sun-mango-passion",
    "candyup-banane":        "candyup-banane",
    "candyup-fraise":        "candyup-fraise",
    "candyup-chocolat":      "candyup-chocolat",
    "candyup-chococo":       "candyup-choco-coco",
    # asian
    "buldak-cheese":         "samyang-buldak-cheese-jaune",
    "buldak-2x-spicy":       "samyang-buldak-2x-spicy-rouge",
    "buldak-jjajang":        "samyang-buldak-jjajang-vert",
    "yumyum-beef":           "yumyum-beef-boeuf",
    "yumyum-chicken":        "yumyum-chicken-poulet",
    "yumyum-shrimp":         "yumyum-shrimp-crevette",
    "yumyum-cheese":         "yumyum-cheese-fromage",
    "hongdae-topokki":       "hongdae-original-topokki",
    "ghost-pepper-cup":      "ghost-pepper-spicy-black-noodles",
    "taokaenoi-algues":      "tao-kae-noi-algues-croustillantes",
    "baishanzu-shiitake":    "baishanzu-crispy-shiitake-bites",
}


def update_demo_data():
    with open(DEMO_DATA, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all card-*.png files that now exist
    new_pngs = []
    for fn in os.listdir(PRODUCTS_DIR):
        if fn.startswith('card-') and fn.endswith('.png'):
            slug = fn[5:-4]  # strip 'card-' and '.png'
            new_pngs.append(slug)
    
    updated = 0
    lines = content.split('\n')
    
    for file_slug in new_pngs:
        ts_slug = SLUG_MAP.get(file_slug, file_slug)
        png_path = f"/products/card-{file_slug}.png"
        
        # Find the line with `slug: '<ts_slug>'`
        slug_pattern = f"slug: '{ts_slug}'"
        found_idx = None
        for i, line in enumerate(lines):
            if slug_pattern in line:
                found_idx = i
                break
        
        if found_idx is None:
            # Try fuzzy: look for slug containing key parts
            print(f"  [NOTFOUND] ts_slug='{ts_slug}' for file_slug='{file_slug}'")
            continue
        
        # Now search for image_url within next 10 lines
        for j in range(found_idx + 1, min(found_idx + 12, len(lines))):
            if "image_url:" in lines[j]:
                old_val = lines[j]
                # Replace the image_url value
                new_line = re.sub(
                    r"image_url: '[^']*'",
                    f"image_url: '{png_path}'",
                    lines[j]
                )
                if new_line != old_val:
                    lines[j] = new_line
                    print(f"  [UPDATED] {file_slug}: {old_val.strip()[:60]} -> {new_line.strip()[:60]}")
                    updated += 1
                else:
                    print(f"  [SAME] {file_slug}: already {old_val.strip()[:60]}")
                break
        else:
            print(f"  [NO_IMG_URL] Could not find image_url for slug='{ts_slug}'")
    
    if updated > 0:
        with open(DEMO_DATA, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        print(f"\n[DONE] Updated {updated} products in demo-data.ts")
    else:
        print(f"\n[DONE] No updates needed")


if __name__ == '__main__':
    print("Scanning PNGs and updating demo-data.ts...\n")
    update_demo_data()
