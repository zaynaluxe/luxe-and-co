import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, RotateCcw, ArrowRight } from 'lucide-react';
import { formatPrice, API_URL } from '../utils';

interface Product {
  id: number;
  nom: string;
  prix: number;
  slug: string;
  image_url: string;
  categorie: string;
}

const Home: React.FC = () => {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + '/api/products?limit=4')
      .then(res => res.json())
      .then(data => {
        setNewArrivals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-[#050505] text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 8, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200" 
            alt="Jewelry Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/65"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[#C9A227] uppercase tracking-[0.5em] text-xs sm:text-sm mb-6 font-medium"
          >
            Collection Printemps 2026
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="text-[2.5rem] sm:text-7xl md:text-8xl font-serif text-white tracking-widest uppercase mb-8 leading-tight"
          >
            Élégance <br /> <span className="text-[#C9A227]">Inaltérable</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-gray-400 text-sm sm:text-base uppercase tracking-widest mb-12 max-w-2xl mx-auto leading-relaxed px-4"
          >
            Découvrez nos bijoux en acier inoxydable 316L. <br /> Conçus pour durer, pensés pour briller.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="px-4"
          >
            <Link 
              to="/boutique" 
              className="inline-block w-full sm:w-auto bg-[#C9A227] text-black px-12 py-5 uppercase tracking-[0.3em] font-bold text-sm hover:bg-[#b08e22] transition-all transform hover:scale-105 text-center"
            >
              Découvrir la collection
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#C9A227]/50"
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#C9A227] to-transparent"></div>
        </motion.div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-4 md:space-y-0">
          <div>
            <p className="text-[#C9A227] uppercase tracking-widest text-xs mb-2">Nouveautés</p>
            <h2 className="text-4xl font-serif tracking-widest uppercase">Dernières Créations</h2>
          </div>
          <Link to="/boutique" className="text-xs uppercase tracking-widest text-gray-500 hover:text-[#C9A227] transition-colors flex items-center gap-2 group">
            Voir tout le catalogue <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            // Skeleton / Placeholder
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-white/5 mb-4"></div>
                <div className="h-4 bg-white/5 w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-white/5 w-1/2 mx-auto"></div>
              </div>
            ))
          ) : (
            newArrivals.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <Link to={`/produit/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-black border border-white/5">
                  <img 
                    src={product.image_url || null} 
                    alt={product.nom} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                  <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-black/60 backdrop-blur-sm">
                    <button className="w-full bg-white text-black py-2 uppercase tracking-widest text-[10px] font-bold">
                      Aperçu rapide
                    </button>
                  </div>
                </Link>
                <div className="mt-6 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{product.categorie}</p>
                  <h3 className="text-sm uppercase tracking-widest font-medium mb-2 group-hover:text-[#C9A227] transition-colors">{product.nom}</h3>
                  <p className="text-sm font-mono text-[#C9A227]">{formatPrice(product.prix)}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      <section className="py-24 bg-[#1a1a1a] border-y border-[#C9A227]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-8 lg:gap-16">
            {[
              { 
                icon: ShieldCheck, 
                title: 'Acier 316L Premium', 
                desc: 'Nos bijoux sont hypoallergéniques, ne noircissent pas et résistent à l\'eau.' 
              },
              { 
                icon: Truck, 
                title: 'Livraison Partout au Maroc', 
                desc: 'Recevez vos bijoux en 24h à 48h. Livraison gratuite dès 500 MAD d\'achat.' 
              },
              { 
                icon: RotateCcw, 
                title: 'Retour 30 Jours', 
                desc: 'Pas satisfait ? Vous avez 30 jours pour changer d\'avis et nous retourner l\'article.' 
              },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-2 md:space-y-4">
                <div className="w-8 h-8 md:w-16 md:h-16 bg-black border border-[#C9A227]/20 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-6 group hover:border-[#C9A227] transition-colors">
                  <item.icon className="text-[#C9A227] w-4 h-4 md:w-6 md:h-6" />
                </div>
                <h3 className="text-[0.65rem] md:text-lg font-serif uppercase tracking-widest leading-tight">{item.title}</h3>
                <p className="text-gray-500 text-[0.65rem] md:text-sm leading-relaxed max-w-xs mx-auto uppercase tracking-wider">
                  {item.desc.replace('500 MAD', formatPrice(500))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-3xl font-serif uppercase tracking-widest">Rejoignez le Cercle LUXE & CO</h2>
          <p className="text-gray-500 uppercase tracking-widest text-xs leading-relaxed">
            Inscrivez-vous pour recevoir nos offres exclusives et être informé des nouvelles collections en avant-première.
          </p>
          <form className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder="VOTRE ADRESSE EMAIL" 
              className="flex-1 bg-black border border-white/10 p-4 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none transition-colors"
            />
            <button className="bg-[#C9A227] text-black px-8 py-4 uppercase tracking-widest font-bold text-xs hover:bg-[#b08e22] transition-colors">
              S'inscrire
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
