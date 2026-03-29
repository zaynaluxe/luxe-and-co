import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Heart, Share2, Star, ChevronRight, ChevronLeft, ShieldCheck, Truck, RotateCcw, User, Phone, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice, API_URL } from '../utils';
import { toast } from 'sonner';

interface Variante {
  id: number;
  couleur: string;
  prix_supp: number;
  stock: number;
  image_url: string;
}

interface Product {
  id: number;
  nom: string;
  description: string;
  prix_base: number;
  slug: string;
  image_url: string;
  categorie: string;
  variantes: Variante[];
  images_urls?: string[];
  sections?: any[];
  texte_alignement?: 'left' | 'center' | 'right';
}

const SimilarProducts: React.FC<{ productId: number }> = ({ productId }) => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch(API_URL + `/api/products/${productId}/similar`)
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching similar products:', err));
  }, [productId]);

  if (products.length === 0) return null;

  return (
    <section className="py-24 border-t border-white/5">
      <h2 className="text-2xl font-serif tracking-widest uppercase mb-12">Produits Similaires</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((p) => (
          <Link key={p.id} to={`/produit/${p.slug}`} className="group space-y-4">
            <div className="aspect-[4/5] bg-black border border-white/5 overflow-hidden">
              <img src={p.image_url || null} alt={p.nom} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-[#C9A227] uppercase tracking-widest">{p.categorie}</p>
              <h3 className="text-sm font-serif uppercase tracking-widest">{p.nom}</h3>
              <p className="text-sm font-mono text-gray-400">{formatPrice(p.prix)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const QuickOrderForm: React.FC<{ 
  product: Product, 
  selectedVariante: Variante | null,
  quantity: number,
  setQuantity: (q: number) => void
}> = ({ product, selectedVariante, quantity, setQuantity }) => {
  const [formData, setFormData] = useState({
    nom_complet: '',
    telephone: '',
    ville: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom_complet || !formData.telephone || !formData.ville) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(API_URL + '/api/orders/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            produit_id: product.id,
            variante_id: selectedVariante?.id || 0,
            quantite: quantity
          }],
          nom_complet: formData.nom_complet,
          telephone: formData.telephone,
          ville: formData.ville,
          quantite: quantity
        })
      });

      if (response.ok) {
        // Facebook Pixel Purchase Event
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'Purchase', {
            content_name: product.nom,
            content_category: product.categorie,
            content_ids: [product.id.toString()],
            content_type: 'product',
            value: (product.prix_base + (selectedVariante?.prix_supp || 0)) * quantity,
            currency: 'MAD',
            num_items: quantity,
            variant: selectedVariante?.couleur || 'Standard'
          });
        }

        toast.success('Commande envoyée avec succès ! Notre équipe vous contactera sous peu.');
        setFormData({ nom_complet: '', telephone: '', ville: '' });
        setQuantity(1);
      } else {
        toast.error('Erreur lors de l\'envoi de la commande');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-[#1a1a1a] border border-[#C9A227]/20 rounded-lg space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-serif text-[#C9A227] uppercase tracking-widest">Commande Rapide</h3>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Commandez sans inscription en 30 secondes</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2">
            <User size={10} /> Nom Complet
          </label>
          <input 
            type="text" 
            required
            value={formData.nom_complet}
            onChange={e => setFormData({...formData, nom_complet: e.target.value})}
            className="w-full bg-black border border-white/10 p-3 text-sm focus:border-[#C9A227] outline-none transition-colors"
            placeholder="Ex: Ahmed Alami"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Phone size={10} /> Téléphone
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+212</span>
              <input 
                type="tel" 
                required
                value={formData.telephone}
                onChange={e => setFormData({...formData, telephone: e.target.value})}
                className="w-full bg-black border border-white/10 p-3 pl-14 text-sm focus:border-[#C9A227] outline-none transition-colors"
                placeholder="6XXXXXXXX"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <MapPin size={10} /> Ville
            </label>
            <input 
              type="text" 
              required
              value={formData.ville}
              onChange={e => setFormData({...formData, ville: e.target.value})}
              className="w-full bg-black border border-white/10 p-3 text-sm focus:border-[#C9A227] outline-none transition-colors"
              placeholder="Ex: Casablanca"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-6 border-y border-white/5">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">Quantité</span>
            <div className="flex items-center gap-8">
              <button 
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-[#C9A227] transition-colors rounded-md text-white"
              >
                -
              </button>
              <span className="text-xl font-mono w-6 text-center text-white">{quantity}</span>
              <button 
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-white/10 flex items-center justify-center hover:border-[#C9A227] transition-colors rounded-md text-white"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Total à payer:</span>
            <span className="text-2xl font-mono text-[#C9A227] font-bold">
              {formatPrice((parseFloat(String(product.prix_base)) + (selectedVariante ? parseFloat(String(selectedVariante.prix_supp)) : 0)) * quantity)}
            </span>
          </div>
        </div>
        <button 
          disabled={submitting}
          type="submit"
          className="w-full bg-[#C9A227] text-black py-4 uppercase tracking-[0.3em] font-bold text-sm hover:bg-[#b08e22] transition-colors disabled:opacity-50"
        >
          {submitting ? 'Envoi en cours...' : 'COMMANDER MAINTENANT'}
        </button>
      </form>
    </div>
  );
};

const ReviewsSection: React.FC<{ productId: number }> = ({ productId }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + `/api/products/${productId}/reviews`)
      .then(res => res.json())
      .then(data => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching reviews:', err);
        setLoading(false);
      });
  }, [productId]);

  if (loading || reviews.length === 0) return null;

  return (
    <section className="py-24 border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
        <div>
          <p className="text-[#C9A227] uppercase tracking-widest text-xs mb-2">Témoignages</p>
          <h2 className="text-4xl font-serif tracking-widest uppercase">Avis Clients</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviews.map((review, i) => (
          <div key={i} className="bg-[#1a1a1a] p-8 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-widest">{review.prenom} {review.nom?.charAt(0)}.</p>
              <div className="flex text-[#C9A227]">
                {Array(5).fill(0).map((_, j) => (
                  <Star key={j} size={10} fill={j < review.note ? 'currentColor' : 'none'} />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">{review.commentaire}</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">
              {new Date(review.date_avis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariante, setSelectedVariante] = useState<Variante | null>(null);
  const [mainImage, setMainImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    setLoading(true);
    fetch(API_URL + `/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        const productData = {
          ...data,
          variantes: Array.isArray(data.variantes) ? data.variantes : []
        };
        setProduct(productData);
        if (productData.variantes.length > 0) {
          setSelectedVariante(productData.variantes[0]);
          setMainImage(productData.variantes[0].image_url || productData.image_url);
        } else {
          setMainImage(productData.image_url);
        }
        setLoading(false);

        // Facebook Pixel ViewContent Event
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'ViewContent', {
            content_name: productData.nom,
            content_category: productData.categorie,
            content_ids: [productData.id.toString()],
            content_type: 'product',
            value: productData.prix_base,
            currency: 'MAD'
          });
        }
      })
      .catch(err => {
        console.error('Error fetching product:', err);
        setLoading(false);
      });
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Facebook Pixel AddToCart Event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        content_name: product.nom,
        content_category: product.categorie,
        content_ids: [product.id.toString()],
        content_type: 'product',
        value: (product.prix_base + (selectedVariante?.prix_supp || 0)) * quantity,
        currency: 'MAD'
      });
    }

    addToCart({
      id: product.id,
      variante_id: selectedVariante?.id || 0,
      nom: product.nom,
      prix: (product.prix_base + (selectedVariante?.prix_supp || 0)),
      quantite: quantity,
      image: mainImage,
      couleur: selectedVariante?.couleur || 'Standard'
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white space-y-6">
      <h2 className="text-3xl font-serif uppercase tracking-widest">Produit introuvable</h2>
      <Link to="/boutique" className="text-[#C9A227] border border-[#C9A227] px-8 py-3 uppercase tracking-widest text-xs">Retour à la boutique</Link>
    </div>
  );

  const basePrice = typeof product.prix_base === 'string' ? parseFloat(product.prix_base) : (product.prix_base || 0);
  const variantPrice = selectedVariante ? (typeof selectedVariante.prix_supp === 'string' ? parseFloat(selectedVariante.prix_supp) : (selectedVariante.prix_supp || 0)) : 0;
  const currentPrice = basePrice + variantPrice;

  return (
    <div className="bg-[#050505] min-h-screen pt-32 pb-24 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 mb-12">
          <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight size={10} />
          <Link to="/boutique" className="hover:text-white transition-colors">Boutique</Link>
          <ChevronRight size={10} />
          <Link to={`/boutique?cat=${product.categorie}`} className="hover:text-white transition-colors">{product.categorie}</Link>
          <ChevronRight size={10} />
          <span className="text-[#C9A227]">{product.nom}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Gallery */}
          <div className="space-y-6">
            <div className="relative aspect-[4/5] bg-black border border-white/5 overflow-hidden group">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={mainImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={mainImage || null} 
                  alt={product.nom} 
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {/* Images secondaires */}
              {product.images_urls && product.images_urls.length > 0 && product.images_urls.map((url, i) => (
                <button 
                  key={`img-${i}`}
                  onClick={() => setMainImage(url)}
                  className={`flex-shrink-0 w-20 h-24 bg-black border transition-all overflow-hidden rounded ${
                    mainImage === url ? 'border-[#C9A227] ring-1 ring-[#C9A227]' : 'border-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url || null} alt={`${product.nom} ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {/* Variantes */}
              {product.variantes.map((v) => (
                <button 
                  key={v.id}
                  onClick={() => { setSelectedVariante(v); setMainImage(v.image_url); }}
                  className={`flex-shrink-0 w-20 h-24 bg-black border transition-all overflow-hidden rounded ${
                    mainImage === v.image_url ? 'border-[#C9A227] ring-1 ring-[#C9A227]' : 'border-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={v.image_url || null} alt={v.couleur} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-10">
            <div>
              <p className="text-[#C9A227] uppercase tracking-[0.3em] text-xs font-bold mb-4">{product.categorie}</p>
              <h1 className={`text-2xl md:text-[2rem] font-serif tracking-widest uppercase mb-6 leading-tight line-clamp-2 max-w-2xl ${
                product.texte_alignement === 'center' ? 'text-center mx-auto' : 
                product.texte_alignement === 'right' ? 'text-right ml-auto' : 'text-left mr-auto'
              }`}>{product.nom}</h1>
              <div className="flex items-center gap-6">
                <p className="text-3xl font-mono text-[#C9A227]">{formatPrice(currentPrice)}</p>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} fill="currentColor" />
                  <Star size={14} />
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest ml-2">(12 avis)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className={`text-xs uppercase tracking-widest text-gray-400 leading-relaxed whitespace-pre-wrap ${
                product.texte_alignement === 'center' ? 'text-center' : 
                product.texte_alignement === 'right' ? 'text-right' : 'text-left'
              }`}>
                {product.description}
              </p>
            </div>

            {/* Variantes */}
            {product.variantes.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Couleur: <span className="text-white font-bold ml-2">{selectedVariante?.couleur}</span></p>
                <div className="flex gap-4">
                  {product.variantes.map((v) => (
                    <button 
                      key={v.id}
                      onClick={() => { setSelectedVariante(v); setMainImage(v.image_url); }}
                      className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedVariante?.id === v.id ? 'border-[#C9A227]' : 'border-transparent'
                      }`}
                    >
                      <div 
                        className="w-7 h-7 rounded-full border border-white/20" 
                        style={{ backgroundColor: v.couleur.toLowerCase().includes('gold') ? '#C9A227' : v.couleur.toLowerCase().includes('argent') ? '#C0C0C0' : '#E5E4E2' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              {/* Quick Order Form */}
              <QuickOrderForm 
                product={product} 
                selectedVariante={selectedVariante} 
                quantity={quantity}
                setQuantity={setQuantity}
              />

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart}
                className="w-full border border-[#C9A227] text-[#C9A227] h-14 uppercase tracking-[0.3em] font-bold text-sm hover:bg-[#C9A227] hover:text-black transition-all flex items-center justify-center gap-3"
              >
                <ShoppingBag size={18} />
                Ajouter au panier
              </button>

              {/* Wishlist & Share */}
              <div className="flex gap-4">
                <button className="flex-1 border border-white/10 h-12 uppercase tracking-widest text-[10px] font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                  <Heart size={14} /> Liste d'envies
                </button>
                <button className="flex-1 border border-white/10 h-12 uppercase tracking-widest text-[10px] font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                  <Share2 size={14} /> Partager
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-10">
              <div className="text-center space-y-2">
                <ShieldCheck size={20} className="mx-auto text-[#C9A227]" />
                <p className="text-[8px] uppercase tracking-widest text-gray-500">Acier 316L Garanti</p>
              </div>
              <div className="text-center space-y-2">
                <Truck size={20} className="mx-auto text-[#C9A227]" />
                <p className="text-[8px] uppercase tracking-widest text-gray-500">Livraison 24/48h</p>
              </div>
              <div className="text-center space-y-2">
                <RotateCcw size={20} className="mx-auto text-[#C9A227]" />
                <p className="text-[8px] uppercase tracking-widest text-gray-500">Retour Gratuit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Sections */}
        <div className="mt-32 space-y-32">
          {product.sections && product.sections.map((section, idx) => {
            switch (section.type) {
              case 'IMAGE_TEXT':
                return (
                  <section key={idx} className={`flex flex-col ${section.content.layout === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} gap-16 items-center`}>
                    <div className="flex-1 w-full">
                      <div className="aspect-[4/3] bg-black border border-white/5 overflow-hidden">
                        <img src={section.content.image || null} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className={`flex-1 space-y-6 ${
                      section.content.alignement === 'center' ? 'text-center' : 
                      section.content.alignement === 'right' ? 'text-right' : 'text-left'
                    }`}>
                      <div 
                        className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: section.content.text }}
                      />
                    </div>
                  </section>
                );
              case 'TEXT_ONLY':
                return (
                  <section key={idx} className={`max-w-3xl mx-auto space-y-8 ${
                    section.content.alignement === 'center' ? 'text-center' : 
                    section.content.alignement === 'right' ? 'text-right' : 'text-left'
                  }`}>
                    <div 
                      className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: section.content.text }}
                    />
                  </section>
                );
              case 'BANNER':
                return (
                  <section key={idx} className={`bg-[#C9A227] py-16 px-8 -mx-4 sm:-mx-6 lg:-mx-8 ${
                    section.content.alignement === 'center' ? 'text-center' : 
                    section.content.alignement === 'right' ? 'text-right' : 'text-left'
                  }`}>
                    <h2 className="text-black text-2xl md:text-4xl font-serif uppercase tracking-[0.2em] max-w-4xl mx-auto">
                      {section.content.text}
                    </h2>
                  </section>
                );
              case 'REVIEWS':
                return <ReviewsSection key={idx} productId={product.id} />;
              default:
                return null;
            }
          })}
        </div>

        {/* Default Reviews Section (if no dynamic reviews section) */}
        {!product.sections?.some(s => s.type === 'REVIEWS') && (
          <ReviewsSection productId={product.id} />
        )}

        {/* Similar Products */}
        <SimilarProducts productId={product.id} />
      </div>
    </div>
  );
};

export default ProductDetail;
