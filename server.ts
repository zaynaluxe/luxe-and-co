import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import https from "https";

const { Pool } = pg;

dotenv.config();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
  });

  // Database connection (Neon)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  // --- INITIALISATION BASE DE DONNÉES ---
  const initDb = async () => {
    try {
      if (!process.env.DATABASE_URL) return;
      
      const checkTable = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'produits'
        );
      `);

      if (!checkTable.rows[0].exists) {
        console.log("Initialisation de la base de données...");
        const schemaPath = path.join(__dirname, "schema.sql");
        const schema = fs.readFileSync(schemaPath, "utf8");
        await pool.query(schema);
        console.log("Base de données initialisée avec succès.");
      } else {
        await pool.query(`
          ALTER TABLE produits ADD COLUMN IF NOT EXISTS images_urls JSONB DEFAULT '[]';
        `);
        await pool.query(`
          ALTER TABLE produits ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]';
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS pixels (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            pixel_id VARCHAR(100) NOT NULL,
            est_actif BOOLEAN DEFAULT TRUE,
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        const adminEmail = "admin@luxeandco.com";
        const adminPass = await bcrypt.hash("admin123", 10);
        await pool.query(`
          INSERT INTO clients (nom, prenom, email, mot_de_passe, telephone) 
          VALUES ('Admin', 'Luxe', $1, $2, '0600000000')
          ON CONFLICT (email) DO NOTHING;
        `, [adminEmail, adminPass]);

        const checkCats = await pool.query("SELECT COUNT(*) FROM categories");
        if (parseInt(checkCats.rows[0].count) === 0) {
          console.log("Seeding categories...");
          const categories = ["Nouveautés", "Bijoux", "Montres", "Hijabs", "Accessoires"];
          for (const cat of categories) {
            const slug = cat.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            await pool.query("INSERT INTO categories (nom, slug) VALUES ($1, $2)", [cat, slug]);
          }
        }
      }
    } catch (err) {
      console.error("Erreur lors de l'initialisation de la DB:", err);
    }
  };

  await initDb();

  // --- MIDDLEWARE AUTH ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Accès non autorisé. Token manquant." });

    jwt.verify(token, process.env.JWT_SECRET || "fallback_secret", (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Token invalide ou expiré." });
      req.user = user;
      next();
    });
  };

  // --- ROUTES AUTHENTIFICATION ---
  app.post("/api/auth/register", async (req, res) => {
    const { nom, prenom, email, mot_de_passe, telephone } = req.body;
    try {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
      if (!nom || !prenom || !email || !mot_de_passe) {
        return res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires." });
      }

      const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
      const result = await pool.query(
        "INSERT INTO clients (nom, prenom, email, mot_de_passe, telephone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email",
        [nom, prenom, email, hashedPassword, telephone]
      );

      res.status(201).json({ message: "Inscription réussie", user: result.rows[0] });
    } catch (err: any) {
      if (err.code === "23505") return res.status(400).json({ error: "Cet email est déjà utilisé." });
      console.error(err);
      res.status(500).json({ error: "Erreur lors de l'inscription." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, mot_de_passe } = req.body;
    try {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
      const result = await pool.query("SELECT * FROM clients WHERE email = $1", [email]);
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(mot_de_passe, user.mot_de_passe))) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect." });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "24h" });
      res.json({ token, user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la connexion." });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
      const result = await pool.query("SELECT id, nom, prenom, email, telephone, adresse_defaut, ville_defaut FROM clients WHERE id = $1", [req.user.id]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la récupération du profil." });
    }
  });

  // --- ROUTES PRODUITS ---
  app.get("/api/categories", async (req, res) => {
    try {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
      const result = await pool.query("SELECT * FROM categories ORDER BY nom ASC");
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la récupération des catégories." });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
      const limit = parseInt(req.query.limit as string) || 100;
      const result = await pool.query(`
        SELECT 
          p.id, 
          p.nom, 
          p.prix_base as prix, 
          p.slug, 
          p.image_principale_url as image_url, 
          c.nom as categorie 
        FROM produits p 
        LEFT JOIN categories c ON p.categorie_id = c.id 
        WHERE p.est_actif = true 
        ORDER BY p.date_creation DESC
        LIMIT $1
      `, [limit]);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la récupération des produits." });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const productResult = await pool.query(`
        SELECT 
          p.id, 
          p.nom, 
          p.description, 
          p.prix_base, 
          p.slug, 
          p.image_principale_url as image_url, 
          p.images_urls,
          p.sections,
          p.texte_alignement,
          c.nom as categorie 
        FROM produits p 
        LEFT JOIN categories c ON p.categorie_id = c.id 
        WHERE p.slug = $1
      `, [req.params.slug]);
      
      if (productResult.rows.length === 0) return res.status(404).json({ error: "Produit non trouvé." });
      
      const product = productResult.rows[0];
      const variantsResult = await pool.query(`
        SELECT 
          id, 
          valeur_variante as couleur, 
          prix_supplementaire as prix_supp, 
          stock, 
          image_variante_url as image_url 
        FROM variantes_produits 
        WHERE produit_id = $1
      `, [product.id]);
      
      res.json({ ...product, variantes: variantsResult.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la récupération du produit." });
    }
  });

  app.get("/api/products/:id/similar", async (req, res) => {
    try {
      const productRes = await pool.query("SELECT categorie_id FROM produits WHERE id = $1", [req.params.id]);
      if (productRes.rows.length === 0) return res.status(404).json({ error: "Produit non trouvé." });
      
      const catId = productRes.rows[0].categorie_id;
      const result = await pool.query(`
        SELECT 
          p.id, 
          p.nom, 
          p.prix_base as prix, 
          p.slug, 
          p.image_principale_url as image_url, 
          c.nom as categorie 
        FROM produits p 
        LEFT JOIN categories c ON p.categorie_id = c.id 
        WHERE p.categorie_id = $1 AND p.id != $2 AND p.est_actif = true 
        ORDER BY p.date_creation DESC
        LIMIT 4
      `, [catId, req.params.id]);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la récupération des produits similaires." });
    }
  });

  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT a.*, c.nom, c.prenom 
        FROM avis a 
        JOIN clients c ON a.client_id = c.id 
        WHERE a.produit_id = $1 AND a.est_approuve = true 
        ORDER BY a.date_avis DESC
      `, [req.params.id]);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la récupération des avis." });
    }
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    const { nom, slug, description, prix_base, categorie_id, images_base64, images_urls: existing_urls, sections, texte_alignement } = req.body;
    try {
      let images_urls: string[] = Array.isArray(existing_urls) ? existing_urls : [];
      if (images_base64 && Array.isArray(images_base64)) {
        for (const base64 of images_base64) {
          const uploadRes = await cloudinary.uploader.upload(base64, { folder: "luxe_and_co/products" });
          images_urls.push(uploadRes.secure_url);
        }
      }

      const image_principale_url = images_urls.length > 0 ? images_urls[0] : "";

      const result = await pool.query(
        "INSERT INTO produits (nom, slug, description, prix_base, categorie_id, image_principale_url, images_urls, sections, texte_alignement) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
        [nom, slug, description, prix_base, categorie_id, image_principale_url, JSON.stringify(images_urls), JSON.stringify(sections || []), texte_alignement || 'left']
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la création du produit." });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req, res) => {
    const { nom, description, prix_base, est_actif, est_en_vedette, images_urls, sections, texte_alignement } = req.body;
    try {
      const image_principale_url = images_urls && images_urls.length > 0 ? images_urls[0] : "";
      
      const result = await pool.query(
        "UPDATE produits SET nom = $1, description = $2, prix_base = $3, est_actif = $4, est_en_vedette = $5, image_principale_url = $6, images_urls = $7, sections = $8, texte_alignement = $9 WHERE id = $10 RETURNING *",
        [nom, description, prix_base, est_actif, est_en_vedette, image_principale_url, JSON.stringify(images_urls || []), JSON.stringify(sections || []), texte_alignement || 'left', req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la mise à jour du produit." });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const productResult = await pool.query(
        "SELECT image_principale_url, images_urls FROM produits WHERE id = $1",
        [id]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({ error: "Produit non trouvé." });
      }

      const product = productResult.rows[0];
      const allUrls = [
        product.image_principale_url,
        ...(Array.isArray(product.images_urls) ? product.images_urls : [])
      ].filter(Boolean);

      for (const url of allUrls) {
        try {
          const parts = url.split('/');
          const uploadIndex = parts.findIndex(p => p === 'upload');
          if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
            const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
            const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (cloudinaryErr) {
          console.error("Erreur Cloudinary lors de la suppression de l'image:", cloudinaryErr);
        }
      }

      await pool.query("DELETE FROM produits WHERE id = $1", [id]);
      res.json({ message: "Produit et images supprimés avec succès." });
    } catch (err) {
      console.error("Erreur lors de la suppression complète du produit:", err);
      res.status(500).json({ error: "Erreur lors de la suppression du produit." });
    }
  });

  app.post("/api/upload", authenticateToken, async (req, res) => {
    const { image_base64 } = req.body;
    try {
      if (!image_base64) return res.status(400).json({ error: "Image manquante." });
      const uploadRes = await cloudinary.uploader.upload(image_base64, { folder: "luxe_and_co/products" });
      res.json({ url: uploadRes.secure_url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de l'upload de l'image." });
    }
  });

  // --- ROUTES COMMANDES ---
  app.post("/api/orders", authenticateToken, async (req: any, res) => {
    const { items, zone_livraison_id, code_promo_id, adresse_livraison, ville_livraison, telephone_contact } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let total_ht = 0;
      for (const item of items) {
        let prix = 0;
        if (item.variante_id && item.variante_id !== 0) {
          const varRes = await client.query(`
            SELECT vp.prix_supplementaire, p.prix_base 
            FROM variantes_produits vp 
            JOIN produits p ON vp.produit_id = p.id 
            WHERE vp.id = $1
          `, [item.variante_id]);
          if (varRes.rows.length > 0) {
            prix = parseFloat(varRes.rows[0].prix_base) + parseFloat(varRes.rows[0].prix_supplementaire);
          }
        } else {
          const prodRes = await client.query("SELECT prix_base FROM produits WHERE id = $1", [item.produit_id]);
          if (prodRes.rows.length > 0) {
            prix = parseFloat(prodRes.rows[0].prix_base);
          }
        }
        total_ht += prix * item.quantite;
      }

      const frais_livraison = 0;
      const total_ttc = total_ht;
      const numero_commande = `LC-${Date.now().toString().slice(-6)}`;

      const orderRes = await client.query(
        `INSERT INTO commandes (client_id, zone_livraison_id, code_promo_id, numero_commande, total_ht, total_ttc, frais_livraison, adresse_livraison, ville_livraison, telephone_contact) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [req.user.id, zone_livraison_id, code_promo_id, numero_commande, total_ht, total_ttc, frais_livraison, adresse_livraison, ville_livraison, telephone_contact]
      );

      const orderId = orderRes.rows[0].id;
      for (const item of items) {
        let prix_unitaire = 0;
        let v_id = item.variante_id && item.variante_id !== 0 ? item.variante_id : null;

        if (v_id) {
          const varRes = await client.query(`
            SELECT vp.prix_supplementaire, p.prix_base 
            FROM variantes_produits vp 
            JOIN produits p ON vp.produit_id = p.id 
            WHERE vp.id = $1
          `, [v_id]);
          if (varRes.rows.length > 0) {
            prix_unitaire = parseFloat(varRes.rows[0].prix_base) + parseFloat(varRes.rows[0].prix_supplementaire);
          }
        } else {
          const prodRes = await client.query("SELECT prix_base FROM produits WHERE id = $1", [item.produit_id]);
          if (prodRes.rows.length > 0) {
            prix_unitaire = parseFloat(prodRes.rows[0].prix_base);
          }
        }

        await client.query(
          "INSERT INTO lignes_commande (commande_id, produit_id, variante_id, quantite, prix_unitaire) VALUES ($1, $2, $3, $4, $5)",
          [orderId, item.produit_id, v_id, item.quantite, prix_unitaire]
        );
      }

      await client.query("COMMIT");
      res.status(201).json({ message: "Commande créée avec succès", numero_commande });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la création de la commande." });
    } finally {
      client.release();
    }
  });

  app.post("/api/orders/quick", async (req: any, res) => {
    const { items, nom_complet, telephone, ville, quantite } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let total_ht = 0;
      let first_product_name = "Produit";
      for (const item of items) {
        let prix = 0;
        if (item.variante_id && item.variante_id !== 0) {
          const varRes = await client.query(`
            SELECT vp.prix_supplementaire, p.prix_base, p.nom 
            FROM variantes_produits vp 
            JOIN produits p ON vp.produit_id = p.id 
            WHERE vp.id = $1
          `, [item.variante_id]);
          if (varRes.rows.length > 0) {
            prix = parseFloat(varRes.rows[0].prix_base) + parseFloat(varRes.rows[0].prix_supplementaire);
            if (first_product_name === "Produit") first_product_name = varRes.rows[0].nom;
          }
        } else {
          const prodRes = await client.query("SELECT prix_base, nom FROM produits WHERE id = $1", [item.produit_id]);
          if (prodRes.rows.length > 0) {
            prix = parseFloat(prodRes.rows[0].prix_base);
            if (first_product_name === "Produit") first_product_name = prodRes.rows[0].nom;
          }
        }
        total_ht += prix * item.quantite;
      }

      const frais_livraison = 0;
      const total_ttc = total_ht;
      const numero_commande = `QR-${Date.now().toString().slice(-6)}`;

      const orderRes = await client.query(
        `INSERT INTO commandes (client_id, numero_commande, total_ht, total_ttc, frais_livraison, adresse_livraison, ville_livraison, telephone_contact) 
         VALUES (NULL, $1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [numero_commande, total_ht, total_ttc, frais_livraison, nom_complet, ville, telephone]
      );

      const orderId = orderRes.rows[0].id;
      for (const item of items) {
        let prix_unitaire = 0;
        let v_id = item.variante_id && item.variante_id !== 0 ? item.variante_id : null;

        if (v_id) {
          const varRes = await client.query(`
            SELECT vp.prix_supplementaire, p.prix_base 
            FROM variantes_produits vp 
            JOIN produits p ON vp.produit_id = p.id 
            WHERE vp.id = $1
          `, [v_id]);
          if (varRes.rows.length > 0) {
            prix_unitaire = parseFloat(varRes.rows[0].prix_base) + parseFloat(varRes.rows[0].prix_supplementaire);
          }
        } else {
          const prodRes = await client.query("SELECT prix_base FROM produits WHERE id = $1", [item.produit_id]);
          if (prodRes.rows.length > 0) {
            prix_unitaire = parseFloat(prodRes.rows[0].prix_base);
          }
        }

        await client.query(
          "INSERT INTO lignes_commande (commande_id, produit_id, variante_id, quantite, prix_unitaire) VALUES ($1, $2, $3, $4, $5)",
          [orderId, item.produit_id, v_id, item.quantite, prix_unitaire]
        );
      }

      await client.query("COMMIT");
      res.status(201).json({ message: "Commande rapide créée avec succès", numero_commande });

      // WhatsApp Notification (CallMeBot) - Background
      const whatsappPhone = process.env.WHATSAPP_PHONE;
      const whatsappApiKey = process.env.WHATSAPP_APIKEY;
      
      if (whatsappPhone && whatsappApiKey) {
        const message = `🛍️ Nouvelle commande LUXE & CO ! Numéro: ${numero_commande} Client: ${nom_complet} Téléphone: ${telephone} Ville: ${ville} Produit: ${first_product_name} Quantité: ${quantite} Total: ${total_ttc} MAD`;
        const encodedMessage = encodeURIComponent(message);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${whatsappPhone.trim()}&text=${encodedMessage}&apikey=${whatsappApiKey.trim()}`;
        
        https.get(url, (res) => {
          // Background request
        }).on('error', (err) => {
          console.error("Erreur notification WhatsApp:", err);
        });
      }
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la création de la commande rapide." });
    } finally {
      client.release();
    }
  });

  app.get("/api/orders/my-orders", authenticateToken, async (req: any, res) => {
    try {
      const result = await pool.query("SELECT * FROM commandes WHERE client_id = $1 ORDER BY date_commande DESC", [req.user.id]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération de vos commandes." });
    }
  });

  // --- ROUTES ADMIN STATS ---
  app.get("/api/admin/stats", authenticateToken, async (req: any, res) => {
    try {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
      
      const caJour = await pool.query("SELECT SUM(total_ttc) FROM commandes WHERE DATE(date_commande) = CURRENT_DATE AND statut != 'annulee'");
      const caMois = await pool.query("SELECT SUM(total_ttc) FROM commandes WHERE EXTRACT(MONTH FROM date_commande) = EXTRACT(MONTH FROM CURRENT_DATE) AND statut != 'annulee'");
      const attente = await pool.query("SELECT COUNT(*) FROM commandes WHERE statut = 'en_attente'");
      const livrees = await pool.query("SELECT COUNT(*) FROM commandes WHERE statut = 'livree'");
      const topProduits = await pool.query(`
        SELECT 
          p.nom, 
          SUM(lc.quantite) as ventes, 
          SUM(lc.quantite * lc.prix_unitaire) as revenus 
        FROM lignes_commande lc 
        JOIN variantes_produits vp ON lc.variante_id = vp.id 
        JOIN produits p ON vp.produit_id = p.id 
        GROUP BY p.nom 
        ORDER BY ventes DESC 
        LIMIT 5
      `);
      const repartition = await pool.query("SELECT statut, COUNT(*) as count FROM commandes GROUP BY statut");

      res.json({
        ca_jour: parseFloat(caJour.rows[0].sum || 0),
        ca_mois: parseFloat(caMois.rows[0].sum || 0),
        commandes_attente: parseInt(attente.rows[0].count || 0),
        livraisons_reussies: parseInt(livrees.rows[0].count || 0),
        top_produits: topProduits.rows.map((r: any) => ({
          name: r.nom,
          sales: parseInt(r.ventes),
          revenue: parseFloat(r.revenus)
        })),
        repartition_statut: repartition.rows.map((r: any) => ({
          statut: r.statut,
          count: parseInt(r.count)
        }))
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques." });
    }
  });

  app.get("/api/admin/orders", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          c.*, 
          CASE 
            WHEN c.client_id IS NOT NULL THEN cl.prenom || ' ' || cl.nom 
            ELSE c.adresse_livraison 
          END as client_display_name,
          COALESCE(c.telephone_contact, cl.telephone) as client_display_phone
        FROM commandes c 
        LEFT JOIN clients cl ON c.client_id = cl.id 
        ORDER BY c.date_commande DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des commandes." });
    }
  });

  app.patch("/api/admin/orders/:id/status", authenticateToken, async (req, res) => {
    const { statut } = req.body;
    try {
      const result = await pool.query("UPDATE commandes SET statut = $1 WHERE id = $2 RETURNING *", [statut, req.params.id]);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la mise à jour du statut." });
    }
  });

  app.get("/api/admin/orders/:id", authenticateToken, async (req, res) => {
    try {
      const orderRes = await pool.query(`
        SELECT 
          c.*, 
          CASE 
            WHEN c.client_id IS NOT NULL THEN cl.prenom || ' ' || cl.nom 
            ELSE c.adresse_livraison 
          END as client_display_name,
          COALESCE(c.telephone_contact, cl.telephone) as client_display_phone,
          cl.email as client_email
        FROM commandes c 
        LEFT JOIN clients cl ON c.client_id = cl.id 
        WHERE c.id = $1
      `, [req.params.id]);

      if (orderRes.rows.length === 0) return res.status(404).json({ error: "Commande non trouvée." });

      const itemsRes = await pool.query(`
        SELECT lc.*, p.nom as produit_nom, vp.valeur_variante as couleur
        FROM lignes_commande lc
        LEFT JOIN variantes_produits vp ON lc.variante_id = vp.id
        LEFT JOIN produits p ON lc.produit_id = p.id
        WHERE lc.commande_id = $1
      `, [req.params.id]);

      res.json({ ...orderRes.rows[0], items: itemsRes.rows });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des détails de la commande." });
    }
  });

  // --- ROUTES PIXELS (sans doublons) ---
  app.get("/api/pixels", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM pixels WHERE est_actif = true");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des pixels." });
    }
  });

  app.post("/api/admin/pixels", authenticateToken, async (req, res) => {
    const { type, pixel_id } = req.body;
    try {
      await pool.query("UPDATE pixels SET est_actif = false WHERE type = $1", [type]);
      const result = await pool.query(
        "INSERT INTO pixels (type, pixel_id, est_actif) VALUES ($1, $2, true) RETURNING *",
        [type, pixel_id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la sauvegarde du pixel." });
    }
  });

  app.delete("/api/admin/pixels/:id", authenticateToken, async (req, res) => {
    try {
      await pool.query("DELETE FROM pixels WHERE id = $1", [req.params.id]);
      res.json({ message: "Pixel supprimé avec succès." });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la suppression du pixel." });
    }
  });

  // --- ROUTES ADMIN CLIENTS ---
  app.get("/api/admin/clients", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query("SELECT id, nom, prenom, email, telephone, ville_defaut as ville, date_inscription FROM clients ORDER BY date_inscription DESC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des clients." });
    }
  });

  app.get("/api/admin/products", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT p.*, c.nom as categorie_nom 
        FROM produits p 
        LEFT JOIN categories c ON p.categorie_id = c.id 
        ORDER BY p.date_creation DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des produits." });
    }
  });

  // --- ROUTES PROMOTIONS ---
  app.get("/api/promotions", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM codes_promo ORDER BY date_expiration DESC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des promotions." });
    }
  });

  app.post("/api/promotions", authenticateToken, async (req, res) => {
    const { code, type_remise, valeur_remise, date_expiration, usage_max } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO codes_promo (code, type_remise, valeur_remise, date_expiration, usage_max) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [code, type_remise, valeur_remise, date_expiration, usage_max]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la création du code promo." });
    }
  });

  app.put("/api/promotions/:id", authenticateToken, async (req, res) => {
    const { code, type_remise, valeur_remise, date_expiration, usage_max, est_actif } = req.body;
    try {
      const result = await pool.query(
        "UPDATE codes_promo SET code = $1, type_remise = $2, valeur_remise = $3, date_expiration = $4, usage_max = $5, est_actif = $6 WHERE id = $7 RETURNING *",
        [code, type_remise, valeur_remise, date_expiration, usage_max, est_actif, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la mise à jour du code promo." });
    }
  });

  app.patch("/api/promotions/:id/toggle", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query("UPDATE codes_promo SET est_actif = NOT est_actif WHERE id = $1 RETURNING *", [req.params.id]);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors du changement d'état du code promo." });
    }
  });

  app.delete("/api/promotions/:id", authenticateToken, async (req, res) => {
    try {
      await pool.query("DELETE FROM codes_promo WHERE id = $1", [req.params.id]);
      res.json({ message: "Code promo supprimé avec succès." });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la suppression du code promo." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Migration
  try {
    await pool.query(`
      ALTER TABLE lignes_commande ADD COLUMN IF NOT EXISTS produit_id INTEGER REFERENCES produits(id);
    `);
    console.log("Migration: produit_id ajouté à lignes_commande (si absent)");
  } catch (err) {
    console.error("Erreur lors de la migration:", err);
  }

  // ✅ KEEP-ALIVE — ping /api/products pour garder les produits et la DB actifs
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(() => {
    https.get(`${SELF_URL}/api/products?limit=10`, (res) => {
      console.log(`✅ Keep-alive products ping: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error(`❌ Keep-alive error: ${err.message}`);
    });
  }, 10 * 60 * 1000); // toutes les 10 minutes

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});