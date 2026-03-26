-- Schéma SQL pour LUXE & CO (PostgreSQL)
-- Développeur: Senior Full-Stack
-- Date: 23 Mars 2026

-- Extension pour les UUID (si besoin)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des catégories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE categories IS 'Catégories de bijoux (ex: Colliers, Bagues, Bracelets)';

-- 2. Table des produits
CREATE TABLE produits (
    id SERIAL PRIMARY KEY,
    categorie_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    nom VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    prix_base DECIMAL(10, 2) NOT NULL, -- Prix par défaut
    image_principale_url TEXT,
    images_urls JSONB DEFAULT '[]',
    est_en_vedette BOOLEAN DEFAULT FALSE,
    est_actif BOOLEAN DEFAULT TRUE,
    texte_alignement VARCHAR(10) DEFAULT 'left',
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_mise_a_jour TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_produits_categorie ON produits(categorie_id);
CREATE INDEX idx_produits_slug ON produits(slug);

-- 3. Table des variantes de produits (Couleur, Taille, Matériau)
CREATE TABLE variantes_produits (
    id SERIAL PRIMARY KEY,
    produit_id INTEGER REFERENCES produits(id) ON DELETE CASCADE,
    nom_variante VARCHAR(50) NOT NULL, -- ex: 'Couleur', 'Taille'
    valeur_variante VARCHAR(100) NOT NULL, -- ex: 'Or', 'Argent', 'Rose Gold'
    prix_supplementaire DECIMAL(10, 2) DEFAULT 0.00,
    stock INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    image_variante_url TEXT
);
CREATE INDEX idx_variantes_produit ON variantes_produits(produit_id);

-- 4. Table des clients
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    telephone VARCHAR(20),
    adresse_defaut TEXT,
    ville_defaut VARCHAR(100),
    date_inscription TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_clients_email ON clients(email);

-- 5. Table des zones de livraison (Maroc)
CREATE TABLE zones_livraison (
    id SERIAL PRIMARY KEY,
    nom_zone VARCHAR(100) NOT NULL, -- ex: 'Casablanca', 'Hors Casablanca'
    frais_livraison DECIMAL(10, 2) NOT NULL,
    delai_estime VARCHAR(100) -- ex: '24-48h'
);

-- 6. Table des codes promo
CREATE TABLE codes_promo (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type_remise VARCHAR(20) CHECK (type_remise IN ('pourcentage', 'fixe')),
    valeur_remise DECIMAL(10, 2) NOT NULL,
    date_expiration TIMESTAMP WITH TIME ZONE,
    usage_max INTEGER DEFAULT 100,
    usage_actuel INTEGER DEFAULT 0,
    est_actif BOOLEAN DEFAULT TRUE
);

-- 7. Table des commandes
CREATE TABLE commandes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    zone_livraison_id INTEGER REFERENCES zones_livraison(id),
    code_promo_id INTEGER REFERENCES codes_promo(id),
    numero_commande VARCHAR(20) UNIQUE NOT NULL, -- ex: LC-2026-0001
    date_commande TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'payee', 'expediee', 'livree', 'annulee')),
    total_ht DECIMAL(10, 2) NOT NULL,
    total_ttc DECIMAL(10, 2) NOT NULL,
    frais_livraison DECIMAL(10, 2) NOT NULL,
    remise_appliquee DECIMAL(10, 2) DEFAULT 0.00,
    adresse_livraison TEXT NOT NULL,
    ville_livraison VARCHAR(100) NOT NULL,
    telephone_contact VARCHAR(20) NOT NULL,
    notes TEXT
);
CREATE INDEX idx_commandes_client ON commandes(client_id);
CREATE INDEX idx_commandes_numero ON commandes(numero_commande);

-- 8. Table des lignes de commande
CREATE TABLE lignes_commande (
    id SERIAL PRIMARY KEY,
    commande_id INTEGER REFERENCES commandes(id) ON DELETE CASCADE,
    variante_id INTEGER REFERENCES variantes_produits(id),
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire DECIMAL(10, 2) NOT NULL
);

-- 9. Table des avis clients
CREATE TABLE avis (
    id SERIAL PRIMARY KEY,
    produit_id INTEGER REFERENCES produits(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    note INTEGER CHECK (note >= 1 AND note <= 5),
    commentaire TEXT,
    est_approuve BOOLEAN DEFAULT FALSE,
    date_avis TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_avis_produit ON avis(produit_id);

-- Triggers pour mettre à jour date_mise_a_jour
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_mise_a_jour = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_produits_modtime
    BEFORE UPDATE ON produits
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
