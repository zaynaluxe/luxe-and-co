import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Search, ChevronDown, Grid, List } from 'lucide-react';
import { formatPrice, API_URL } from '../utils';

interface Product {
  id: number;
  nom: string;
  prix: number;
  slug: string;
  image_url: string;
  categorie: string;
}

const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  const currentCategory = searchParams.get('cat');

  useEffect(() => {
    setLoading(true);
    
    // Fetch products and categories in parallel
    Promise.all([
      fetch(API_URL + '/api/products').then(res => res.json()),
      fetch(API_URL + '/api/categories').then(res => res.json())
    ])
      .then(([productsData, categoriesData]) => {
        setProducts(Array.isArray(productsData) ? productsData : []);
        if (Array.isArray(categoriesData)) {
          const categoryOrder = ["Nouveautés", "Bijoux", "Montres", "Hijabs", "Accessoires"];
          const sorted = categoriesData
            .filter((c: any) => categoryOrder.includes(c.nom))
            .sort((a: any, b: any) => categoryOrder.indexOf(a.nom) - categoryOrder.indexOf(b.nom))
            .map((c: any) => c.nom);
          setCategories(sorted);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (currentCategory) {
      result = result.filter(p => p.categorie === currentCategory);
    }

    if (searchQuery) {
      result = result.filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.prix - b.prix);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.prix - a.prix);
    }

    return result;
  }, [products, currentCategory, searchQuery, sortBy]);

  const toggleCategory = (cat: string) => {
    if (currentCategory === cat) {
      searchParams.delete('cat');
    } else {
      searchParams.set('cat', cat);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="bg-[#050505] min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-white">
      {/* Header */}
      <div className="mb-12 text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-serif tracking-widest uppercase">La Collection</h1>
        <p className="text-gray-500 uppercase tracking-widest text-xs max-w-xl mx-auto">
          Explorez notre sélection de bijoux en acier inoxydable, conçus pour sublimer chaque instant.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between border-y border-white/5 py-8">
        {/* Search */}
        <div className="relative w-full md:w-80 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#C9A227] transition-colors" />
          <input 
            type="text" 
            placeholder="RECHERCHER UN BIJOU..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-white/10 p-4 pl-12 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none transition-colors"
          />
        </div>

        {/* Categories (Desktop) */}
        <div className="hidden lg:flex items-center space-x-6">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
                currentCategory === cat ? 'text-[#C9A227] border-b border-[#C9A227] pb-1' : 'text-gray-500 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative flex items-center gap-4 w-full md:w-auto">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 whitespace-nowrap">Trier par:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black border border-white/10 p-4 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none transition-colors w-full md:w-48 appearance-none"
          >
            <option value="newest">Nouveautés</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Mobile Categories */}
      <div className="lg:hidden flex overflow-x-auto gap-4 pb-8 no-scrollbar">
        {categories.map((cat) => (
          <button 
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`flex-shrink-0 px-6 py-3 text-[10px] uppercase tracking-widest font-bold border transition-all ${
              currentCategory === cat ? 'bg-[#C9A227] text-black border-[#C9A227]' : 'bg-black text-gray-500 border-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-white/5 mb-4"></div>
              <div className="h-4 bg-white/5 w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-white/5 w-1/2 mx-auto"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-24 text-center space-y-6">
          <Search size={48} className="mx-auto text-gray-800" />
          <p className="text-gray-500 uppercase tracking-widest text-sm">Aucun bijou ne correspond à votre recherche.</p>
          <button 
            onClick={() => { setSearchQuery(''); setSearchParams({}); }}
            className="text-[#C9A227] border border-[#C9A227] px-8 py-3 uppercase tracking-widest text-xs hover:bg-[#C9A227] hover:text-black transition-all"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {filteredProducts.map((product, i) => (
            <motion.div 
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i % 4) * 0.1 }}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default Catalog;
