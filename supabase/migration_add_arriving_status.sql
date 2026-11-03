-- ====================================================================
-- MIGRATION : Support du statut 'arriving' pour les commandes
-- À exécuter dans le Supabase SQL Editor si votre base utilise le schéma existant
-- ====================================================================

-- 1. Supprime l'ancienne contrainte de statut
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Ajoute la nouvelle contrainte incluant 'arriving'
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('new', 'taken', 'delivering', 'arriving', 'delivered', 'cancelled'));
