# LUXE & CO - Bijouterie de Luxe en Acier Inoxydable 🇲🇦

LUXE & CO est une plateforme e-commerce haut de gamme dédiée à la vente de bijoux et accessoires en acier inoxydable 316L au Maroc. L'application offre une expérience utilisateur raffinée, un catalogue complet et un tableau de bord administratif puissant.

## 🚀 Technologies Utilisées

- **Frontend** : React 19, Vite, Tailwind CSS 4, Framer Motion, Lucide React, Sonner (Toasts).
- **Backend** : Node.js, Express.
- **Base de données** : PostgreSQL (via Neon.tech).
- **Gestion d'images** : Cloudinary.
- **Authentification** : JWT (JSON Web Tokens) & bcryptjs.
- **Déploiement** : Vercel (Frontend) & Render (Backend).

## 💎 Fonctionnalités Clés

### Boutique Client
- **Accueil Immersif** : Hero section élégante, nouveautés et réassurance.
- **Catalogue Dynamique** : Filtrage par catégorie, recherche en temps réel et tri par prix.
- **Fiche Produit Premium** : Galerie photo, sélecteur de variantes (Or, Argent, Rose Gold) et avis clients.
- **Panier Sidebar** : Gestion fluide des articles et calcul des frais de livraison (Maroc).
- **Checkout Optimisé** : Formulaire adapté au marché local et paiement à la livraison (COD).
- **Page de Remerciement** : Animation confetti et récapitulatif de commande.
- **Support WhatsApp** : Bouton flottant pour un contact direct.

### Dashboard Admin
- **Statistiques en Temps Réel** : Chiffre d'affaires, commandes par statut et top produits.
- **Gestion des Produits** : CRUD complet avec upload d'images vers Cloudinary.
- **Suivi des Commandes** : Liste détaillée et changement de statut interactif.
- **Gestion des Promotions** : Création de codes promo (remise % ou fixe) avec limites d'utilisation.

## 🛠️ Configuration & Installation

### 1. Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```env
# Base de données (Neon)
DATABASE_URL="postgres://user:password@host/dbname?sslmode=require"

# Authentification
JWT_SECRET="votre_secret_ultra_securise"

# Cloudinary (Images)
CLOUDINARY_CLOUD_NAME="votre_cloud_name"
CLOUDINARY_API_KEY="votre_api_key"
CLOUDINARY_API_SECRET="votre_api_secret"

# Gemini AI (Optionnel pour génération de contenu)
GEMINI_API_KEY="votre_cle_gemini"
```

### 2. Installation Locale

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 🚢 Guide de Déploiement Step-by-Step

### Étape 1 : Base de données (Neon.tech)
1. Créez un projet sur [Neon.tech](https://neon.tech).
2. Récupérez la `DATABASE_URL`.
3. Exécutez le schéma SQL fourni dans l'éditeur de requêtes de Neon pour créer les tables.

### Étape 2 : Backend (Render.com)
1. Créez un compte sur [Render](https://render.com).
2. Créez un nouveau "Web Service" et connectez votre dépôt GitHub.
3. Render détectera automatiquement le fichier `render.yaml` à la racine.
4. Dans le tableau de bord Render, configurez les variables d'environnement (DATABASE_URL, JWT_SECRET, etc.).
5. Déployez. Votre API sera accessible sur `https://luxe-co-api.onrender.com`.

### Étape 3 : Frontend (Vercel.com)
1. Importez votre projet sur [Vercel](https://vercel.com).
2. Configurez les variables d'environnement si nécessaire (notamment `VITE_API_URL` pointant vers votre API Render).
3. Déployez.

## 📁 Structure du Projet

- `/src/pages` : Pages de l'application (Home, Catalog, Admin, etc.).
- `/src/components` : Composants UI réutilisables.
- `/src/context` : Gestion de l'état global (Panier).
- `/server.ts` : Point d'entrée du serveur Express.

---
*Développé avec élégance pour LUXE & CO.*
