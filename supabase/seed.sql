-- ══════════════════════════════════════════════
--  ELEVEN SHOP — Supabase Seed Data
-- ══════════════════════════════════════════════

-- Seed Settings
insert into settings (id, min_order_cents, delivery_fee_cents, free_delivery_above_cents, allowed_postal_codes, is_open, open_message)
values (
  'store-settings',
  1500,
  300,
  3000,
  array['42300', '42120', '42370', '42153'],
  true,
  'Ouvert 24h/24 & 7j/7 — Livraison rapide sur Roanne et agglomération'
)
on conflict (id) do nothing;

-- Seed Categories
insert into categories (id, name, slug, icon, sort_order) values
('cat-energy', 'Énergisantes', 'energisantes', '⚡', 1),
('cat-sodas', 'Sodas & Boissons', 'sodas-boissons', '🥤', 2),
('cat-snacks', 'Snacks & Apéro', 'snacks-apero', '🍿', 3),
('cat-confiseries', 'Chocolats & Bonbons', 'chocolats-bonbons', '🍫', 4),
('cat-epicerie', 'Épicerie & Chaud', 'epicerie-chaud', '🍜', 5),
('cat-glaces', 'Glaces & Desserts', 'glaces-desserts', '❄️', 6),
('cat-apero-18', 'Boissons 18+', 'boissons-18', '🔞', 7)
on conflict (id) do nothing;

-- Seed Products
insert into products (id, nom, slug, description, price_cents, image_url, category_id, is_available, stock, sort_order, is_featured, is_age_restricted, hero_bg_color, hero_big_word) values
('prod-monster-green', 'Monster Energy Original 500ml', 'monster-energy-500ml', 'La canette mythique au goût inimitable. Boost taurine et caféine pour tenir toute la nuit.', 250, '/products/can-energy.svg', 'cat-energy', true, 24, 1, true, false, '#0D381E', 'ENERGY'),
('prod-redbull-250', 'Red Bull Energy Drink 250ml', 'redbull-energy-250ml', 'Donne des aiiiles. Formule vivifiante appréciée des noctambules et sportifs.', 300, '/products/can-redbull.svg', 'cat-energy', true, 18, 2, true, false, '#0A2540', 'WINGS'),
('prod-monster-mango', 'Monster Mango Loco 500ml', 'monster-mango-loco-500ml', 'Un cocktail paradisiaque et exotique avec une dose puissante d’énergie.', 280, '/products/can-energy.svg', 'cat-energy', true, 12, 3, false, false, null, null),

('prod-coca-original', 'Coca-Cola Original 33cl', 'coca-cola-original-33cl', 'La recette classique bien fraîche pour accompagner vos nuits.', 150, '/products/can-cola.svg', 'cat-sodas', true, 40, 1, true, false, '#3B090C', 'REFRESH'),
('prod-sprite-33', 'Sprite Citron-Citron Vert 33cl', 'sprite-33cl', 'Pétillant et ultra rafraîchissant avec son arôme citron vert acidulé.', 150, '/products/can-citrus.svg', 'cat-sodas', true, 25, 2, true, false, '#004D25', 'CITRUS'),
('prod-ice-tea-peche', 'Fuze Tea Pêche Intense 33cl', 'fuze-tea-peche-33cl', 'Thé glacé saveur pêche noire savoureuse, doux et désaltérant.', 180, '/products/can-ice-tea.svg', 'cat-sodas', true, 20, 3, false, false, null, null),
('prod-oasis-tropical', 'Oasis Tropical 33cl', 'oasis-tropical-33cl', 'Boisson rafraîchissante aux fruits et à l’eau de source.', 170, '/products/can-citrus.svg', 'cat-sodas', false, 0, 4, false, false, null, null),

('prod-lays-nature', 'Chips Lay''s Nature Cuites au Chaudron 130g', 'chips-lays-nature-130g', 'Chips dorées ultra croustillantes, saupoudrées d’une pincée de sel de mer.', 220, '/products/snack-chips.svg', 'cat-snacks', true, 15, 1, true, false, null, null),
('prod-doritos-cheese', 'Doritos Nacho Cheese 170g', 'doritos-nacho-cheese-170g', 'Tortillas de maïs triangulaires au goût intense de fromage fondu.', 260, '/products/snack-doritos.svg', 'cat-snacks', true, 16, 2, false, false, null, null),
('prod-pringles-sourcream', 'Pringles Sour Cream & Onion 175g', 'pringles-sour-cream-175g', 'Le tube légendaire : crème acidulée et oignon avec un croustillant unique.', 320, '/products/snack-chips.svg', 'cat-snacks', true, 10, 3, false, false, null, null),

('prod-kinder-bueno', 'Kinder Bueno (Lot de 2 barres)', 'kinder-bueno-2-barres', 'Gaufrette croustillante enrobée de chocolat au lait et cœur crème de noisette.', 180, '/products/candy-chocolate.svg', 'cat-confiseries', true, 30, 1, true, false, null, null),
('prod-haribo-dragibus', 'Haribo Dragibus Soft 200g', 'haribo-dragibus-200g', 'Les célèbres billes tendres et fruitées aux multiples saveurs surprises.', 240, '/products/candy-haribo.svg', 'cat-confiseries', true, 22, 2, false, false, null, null),
('prod-mms-peanut', 'M&M''s Cacahuète Format Partage 220g', 'mms-peanut-220g', 'Cacahuètes croustillantes enrobées de chocolat au lait sous une coque colorée.', 350, '/products/candy-haribo.svg', 'cat-confiseries', true, 14, 3, false, false, null, null),

('prod-shin-ramen', 'Nongshim Shin Ramyun Cup 68g', 'shin-ramyun-cup', 'Le fameux ramen coréen épicé avec nouilles fermes et bouillon riche.', 290, '/products/grocery-noodles.svg', 'cat-epicerie', true, 20, 1, false, false, null, null),
('prod-pain-de-mie', 'Pain de Mie Extra Moelleux 500g', 'pain-de-mie-500g', 'Tranches moelleuses idéales pour vos toasts et sandwichs nocturnes.', 190, '/products/grocery-noodles.svg', 'cat-epicerie', true, 8, 2, false, false, null, null),

('prod-ben-cookie-dough', 'Ben & Jerry''s Cookie Dough 465ml', 'ben-jerrys-cookie-dough-465ml', 'Crème glacée vanille avec de généreux morceaux de pâte à cookie aux pépites de chocolat.', 690, '/products/icecream-tub.svg', 'cat-glaces', true, 9, 1, true, false, null, null),
('prod-haagen-macadamia', 'Häagen-Dazs Macadamia Nut Brittle 460ml', 'haagen-dazs-macadamia-460ml', 'Crème glacée onctueuse à la vanille garnie d’éclats croustillants de noix de macadamia caramélisées.', 690, '/products/icecream-tub.svg', 'cat-glaces', true, 6, 2, false, false, null, null),

('prod-desperados-33', 'Desperados Bière Tequila 33cl', 'desperados-33cl', 'Bière aromatisée tequila (5,9% vol). Vente interdite aux mineurs.', 290, '/products/drink-beer.svg', 'cat-apero-18', true, 18, 1, false, true, null, null),
('prod-heineken-33', 'Heineken Blonde 33cl', 'heineken-33cl', 'Bière blonde fraîche et équilibrée (5% vol). Vente interdite aux mineurs.', 220, '/products/drink-beer.svg', 'cat-apero-18', true, 24, 2, false, true, null, null)
on conflict (id) do nothing;
