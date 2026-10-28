# ⚡ ELEVEN SHOP — Épicerie de Nuit Roanne (42300)

Site e-commerce **mobile-first** pour « Eleven Shop », épicerie de nuit ouverte 24h/24 à Roanne (42300).
Livraison à domicile rapide, paiement à la livraison (espèces / carte bancaire), transmission instantanée des commandes sur Telegram au patron et aux livreurs, et panel d’administration en temps réel.

---

## 🚀 Fonctionnalités Clés

- **Hero immersif signature (style Apple)** : Carrousel 100svh plein écran avec canettes flottantes, mot géant ton-sur-ton, éléments flottants (glaçons, bulles, gouttes) et parallaxe à la souris / au scroll.
- **Catalogue fluide** : Recherche instantanée, filtres par pastilles de catégories (Énergisantes, Sodas, Snacks, Chocolats, Épicerie, Glaces, Boissons 18+), cartes arrondies flottantes, gestion des ruptures de stock.
- **Panier tiroir (Drawer) & Page de Commande** : Calcul en direct des totaux, jauge de progression vers la livraison offerte (dès 30 €), avertissement minimum de commande (15 €), validation du téléphone français et des codes postaux (42300, 42120, etc.).
- **Validation légale 18+** : Case obligatoire certifiant la majorité si un produit soumis à restriction d'âge (bières, boissons alcoolisées) est dans le panier.
- **Route de commande sécurisée (`POST /api/orders`)** : Validation Zod, recalcul systématique des prix côté serveur (ne fait jamais confiance au client), honeypot anti-bot, rate limiting par IP, vérification des stocks.
- **Transmission Telegram automatique** : Dès validation, la commande est transmise avec le détail, total, lien d’appel direct, lien Google Maps de l'adresse et boutons interactifs *"🛵 Je prends"* et *"✅ Livrée"*.
- **Panel Admin en direct (`/admin`)** : Suivi des commandes en direct avec carillon sonore (Web Audio API), changement de statut en 1 clic, bascule rapide des produits disponibles/épuisés, gestion des paramètres (ouverture, frais, minimum, zone).
- **Design System centralisé (`src/config/tokens.ts`)** : Toutes les couleurs, polices, rayons et ombres sont isolés en un seul endroit pour brancher la charte graphique du client en quelques secondes.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 16](https://nextjs.org) (App Router, React 19, TypeScript)
- **Styling** : Tailwind CSS v4 + Variables CSS centralisées
- **Animations** : GSAP + ScrollTrigger + Lenis smooth scroll
- **Backend & Base de données** : Supabase (PostgreSQL, Realtime, RLS, Auth)
- **Notifications** : Telegram Bot API (messages formatés HTML + inline keyboards)
- **Validation** : Zod
- **Hébergement cible** : Vercel

---

## 📋 Configuration Pas à Pas

### Étape 1 : Configurer Supabase (Gratuit)

1. Rendez-vous sur [supabase.com](https://supabase.com) et créez un compte gratuit.
2. Créez un nouveau projet (ex : `eleven-shop-roanne`).
3. Dans le menu de gauche, ouvrez l'onglet **SQL Editor**.
4. Copiez et exécutez le script contenu dans [`supabase/schema.sql`](./supabase/schema.sql) pour créer les tables (`categories`, `products`, `orders`, `order_items`, `settings`, `drivers`), les index et les politiques de sécurité (RLS).
5. Copiez et exécutez le script contenu dans [`supabase/seed.sql`](./supabase/seed.sql) pour injecter les catégories et le catalogue de démonstration.
6. Dans **Project Settings** > **API**, copiez :
   - `Project URL`
   - `anon public` key
   - `service_role` secret key (nécessaire pour l'insertion des commandes sécurisée côté serveur)

---

### Étape 2 : Créer le Bot Telegram via @BotFather

1. Ouvrez Telegram et cherchez le bot officiel **[@BotFather](https://t.me/BotFather)**.
2. Envoyez la commande `/newbot`.
3. Donnez un nom à votre bot (ex : `Eleven Shop Roanne`), puis un identifiant se terminant par `bot` (ex : `ElevenShopRoanne_bot`).
4. BotFather vous fournit votre **Token d'API HTTP** (ex : `7123456789:AAH...`). Conservez-le pour `TELEGRAM_BOT_TOKEN`.
5. Créez un groupe Telegram réunissant le patron et les livreurs (ex : `Eleven Shop — Commandes & Livraisons`).
6. Ajoutez votre bot dans ce groupe en tant qu'administrateur.
7. Pour récupérer l'identifiant du groupe (`TELEGRAM_CHAT_ID`) :
   - Envoyez un message dans le groupe (ex : `test`).
   - Ouvrez dans votre navigateur : `https://api.telegram.org/bot<VOTRE_TOKEN>/getUpdates`
   - Repérez la ligne `"chat":{"id":-100XXXXXXXXXX,...}`. L'identifiant commence généralement par `-100` ou `-`.

---

### Étape 3 : Configurer le Webhook Telegram (pour les boutons "Je prends")

Pour que Telegram transmette les clics des livreurs sur les boutons interactifs (*"Je prends"*, *"Livrée"*) à votre application :

Ouvrez votre navigateur ou utilisez un terminal pour appeler l'API Telegram :
```bash
curl -X POST "https://api.telegram.org/bot<VOTRE_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://votre-domaine.vercel.app/api/telegram/webhook",
    "secret_token": "votre_secret_aleatoire_tres_long"
  }'
```

---

### Étape 4 : Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet (en vous inspirant de [`.env.example`](./.env.example)) :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_WEBHOOK_SECRET=votre_secret_aleatoire_tres_long

# URL du site
NEXT_PUBLIC_SITE_URL=https://elevenshop.fr
```

> **Note :** Sans variables d'environnement configurées, l'application fonctionne immédiatement en **mode démo local** grâce à des données en mémoire, permettant de tester le catalogue, le panier, la commande et l'administration !

---

### Étape 5 : Déploiement sur Vercel

1. Poussez votre code sur un dépôt GitHub (ou GitLab / Bitbucket).
2. Rendez-vous sur [vercel.com](https://vercel.com) et cliquez sur **Add New Project**.
3. Importez votre dépôt `ElevenShopStore`.
4. Renseignez les variables d'environnement définies à l'Étape 4.
5. Cliquez sur **Deploy**. Votre site est en ligne en moins de 2 minutes !

---

## 🔑 Accès au Panel Admin

- **URL** : `/admin`
- **Identifiants Démo** :
  - E-mail : `admin@elevenshop.fr`
  - Mot de passe : `eleven42300`
  - Ou bouton direct : **⚡ Connexion Rapide Démo**

---

## 🎨 Personnalisation de la Charte Graphique

Lorsque la charte graphique définitive (couleurs, typographies, logos) sera fournie par le client, **un seul fichier est à modifier** :

👉 [`src/config/tokens.ts`](./src/config/tokens.ts)

- `tokens.colors.primary` : Couleur d'accentuation principale (vert lime vif `#C8FF00`)
- `tokens.colors.background` : Fond principal sombre (`#0A0A0A`)
- `tokens.fonts.display` : Police des titres majuscules
- `tokens.fonts.body` : Police de lecture

Tous les composants du site, boutons, cartes et formulaires s'adapteront automatiquement.
