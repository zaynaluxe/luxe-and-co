import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Truck, CreditCard, CheckCircle, ChevronRight, MapPin, Phone, User, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '../utils';

const Checkout: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    adresse: '',
    ville: 'Casablanca',
    methode_paiement: 'cod'
  });

  const shippingFee = 0;
  const total = subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'info') {
      setStep('payment');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        const orderNumber = `LC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        setLoading(false);
        clearCart();
        toast.success('Commande confirmée avec succès !');
        navigate('/merci', { state: { orderId: orderNumber, total: total } });
      }, 1500);
    } catch (err) {
      console.error('Error creating order:', err);
      toast.error('Une erreur est survenue lors de la commande.');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white space-y-6">
        <ShoppingBag size={48} className="text-gray-800" />
        <h2 className="text-3xl font-serif uppercase tracking-widest">Votre panier est vide</h2>
        <Link to="/boutique" className="text-[#C9A227] border border-[#C9A227] px-8 py-3 uppercase tracking-widest text-xs">Retour à la boutique</Link>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] min-h-screen pt-32 pb-24 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div 
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-12"
              >
                <div className="flex items-center gap-4 text-xs uppercase tracking-widest font-bold">
                  <span className={step === 'info' ? 'text-[#C9A227]' : 'text-gray-500'}>01 Informations</span>
                  <ChevronRight size={14} className="text-gray-800" />
                  <span className={step === 'payment' ? 'text-[#C9A227]' : 'text-gray-500'}>02 Paiement</span>
                </div>

                  <form onSubmit={handleSubmit} className="space-y-10">
                    {step === 'info' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="col-span-1">
                          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-3">Prénom</label>
                          <div className="relative">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
                            <input 
                              type="text" 
                              required
                              value={formData.prenom}
                              onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                              className="w-full bg-black border border-white/10 p-4 pl-12 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <div className="col-span-1">
                          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-3">Nom</label>
                          <input 
                            type="text" 
                            required
                            value={formData.nom}
                            onChange={(e) => setFormData({...formData, nom: e.target.value})}
                            className="w-full bg-black border border-white/10 p-4 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none transition-colors"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-3">Téléphone (+212)</label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
                            <input 
                              type="tel" 
                              required
                              placeholder="06 12 34 56 78"
                              value={formData.telephone}
                              onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                              className="w-full bg-black border border-white/10 p-4 pl-12 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-3">Ville</label>
                          <select 
                            value={formData.ville}
                            onChange={(e) => setFormData({...formData, ville: e.target.value})}
                            className="w-full bg-black border border-white/10 p-4 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none transition-colors"
                          >
                            <option value="Casablanca">Casablanca (Gratuit)</option>
                            <option value="Rabat">Rabat (Gratuit)</option>
                            <option value="Marrakech">Marrakech (Gratuit)</option>
                            <option value="Tanger">Tanger (Gratuit)</option>
                            <option value="Agadir">Agadir (Gratuit)</option>
                            <option value="Fès">Fès (Gratuit)</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-3">Adresse complète</label>
                          <div className="relative">
                            <MapPin size={16} className="absolute left-4 top-4 text-gray-700" />
                            <textarea 
                              required
                              rows={3}
                              value={formData.adresse}
                              onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                              className="w-full bg-black border border-white/10 p-4 pl-12 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none transition-colors resize-none"
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div 
                          onClick={() => setFormData({...formData, methode_paiement: 'cod'})}
                          className={`p-6 border cursor-pointer transition-all flex items-center justify-between ${
                            formData.methode_paiement === 'cod' ? 'border-[#C9A227] bg-[#C9A227]/5' : 'border-white/10 bg-black hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Truck size={24} className={formData.methode_paiement === 'cod' ? 'text-[#C9A227]' : 'text-gray-500'} />
                            <div>
                              <p className="text-sm font-bold uppercase tracking-widest">Paiement à la livraison</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Payez en espèces lors de la réception</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.methode_paiement === 'cod' ? 'border-[#C9A227]' : 'border-gray-800'}`}>
                            {formData.methode_paiement === 'cod' && <div className="w-2.5 h-2.5 bg-[#C9A227] rounded-full"></div>}
                          </div>
                        </div>

                        <div 
                          onClick={() => setFormData({...formData, methode_paiement: 'paypal'})}
                          className={`p-6 border cursor-pointer transition-all flex items-center justify-between ${
                            formData.methode_paiement === 'paypal' ? 'border-[#C9A227] bg-[#C9A227]/5' : 'border-white/10 bg-black hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <CreditCard size={24} className={formData.methode_paiement === 'paypal' ? 'text-[#C9A227]' : 'text-gray-500'} />
                            <div>
                              <p className="text-sm font-bold uppercase tracking-widest">PayPal / Carte Bancaire</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Paiement sécurisé en ligne</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.methode_paiement === 'paypal' ? 'border-[#C9A227]' : 'border-gray-800'}`}>
                            {formData.methode_paiement === 'paypal' && <div className="w-2.5 h-2.5 bg-[#C9A227] rounded-full"></div>}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-8">
                      {step === 'payment' && (
                        <button 
                          type="button"
                          onClick={() => setStep('info')}
                          className="flex-1 border border-white/10 py-5 uppercase tracking-widest font-bold text-xs hover:bg-white/5 transition-colors"
                        >
                          Retour
                        </button>
                      )}
                      <button 
                        type="submit"
                        disabled={loading}
                        className="flex-[2] bg-[#C9A227] text-black py-5 uppercase tracking-widest font-bold text-xs hover:bg-[#b08e22] transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Traitement...' : step === 'info' ? 'Continuer vers le paiement' : 'Confirmer la commande'}
                      </button>
                    </div>
                  </form>
                </motion.div>
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] p-8 border border-white/5 sticky top-32">
              <h3 className="text-lg font-serif uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Récapitulatif</h3>
              
              <div className="space-y-6 mb-8 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.variante_id} className="flex gap-4">
                    <div className="w-16 h-16 bg-black border border-white/5 flex-shrink-0">
                      <img src={item.image || null} alt={item.nom} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest truncate">{item.nom}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Qté: {item.quantite} | {item.couleur}</p>
                      <p className="text-xs font-mono text-[#C9A227] mt-1">{formatPrice(item.prix * item.quantite)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-white/5 pt-6">
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500">
                  <span>Livraison ({formData.ville})</span>
                  <span>Gratuit</span>
                </div>
                <div className="flex justify-between text-sm uppercase tracking-widest font-bold pt-4 border-t border-white/5">
                  <span className="text-[#C9A227]">Total</span>
                  <span className="text-[#C9A227]">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 text-gray-600">
                  <ShieldCheck size={16} />
                  <p className="text-[8px] uppercase tracking-[0.2em]">Paiement 100% sécurisé</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
