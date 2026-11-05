-- ══════════════════════════════════════════════
-- MIGRATION SÉCURITÉ : Protection des données clients (RLS)
-- À exécuter dans le Supabase SQL Editor
-- ══════════════════════════════════════════════

-- 1. Révoquer la lecture publique ouverte sur toutes les commandes
DROP POLICY IF EXISTS "Allow public select own order by code" ON orders;
DROP POLICY IF EXISTS "Allow public read order_items" ON order_items;

-- 2. Empêcher toute lecture directe via la clé publique anonyme (anon key)
-- Note : L'API serveur Next.js utilise la SUPABASE_SERVICE_ROLE_KEY qui outrepasse le RLS.
-- Les clients continuent de suivre leur commande via la route sécurisée /api/orders/[code].
CREATE POLICY "Deny public select orders" ON orders FOR SELECT USING (false);
CREATE POLICY "Deny public select order_items" ON order_items FOR SELECT USING (false);

