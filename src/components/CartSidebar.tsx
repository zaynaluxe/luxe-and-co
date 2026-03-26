import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          
          {/* Sidebar */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#1a1a1a] z-[110] shadow-2xl flex flex-col border-l border-[#C9A227]/10"
          >
            <div className="p-6 border-b border-[#C9A227]/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-[#C9A227]" />
                <h2 className="text-xl font-serif text-[#C9A227] tracking-widest uppercase">PANIER</h2>
                <span className="text-xs text-gray-500 font-mono">({cart.length})</span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <ShoppingBag size={48} className="text-gray-800" />
                  <p className="text-gray-500 uppercase tracking-widest text-sm">Votre panier est vide</p>
                  <Link 
                    to="/boutique" 
                    onClick={onClose}
                    className="text-[#C9A227] border border-[#C9A227] px-6 py-2 uppercase tracking-widest text-xs hover:bg-[#C9A227] hover:text-black transition-all"
                  >
                    Découvrir la collection
                  </Link>
                </div>
              ) : (
                cart.map((item) => (
                  <motion.div 
                    key={item.variante_id} 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 group"
                  >
                    <div className="w-24 h-24 bg-black border border-white/5 overflow-hidden flex-shrink-0">
                      <img src={item.image || null} alt={item.nom} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-medium uppercase tracking-wider">{item.nom}</h3>
                          <button 
                            onClick={() => removeFromCart(item.variante_id)}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Couleur: {item.couleur}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex items-center border border-white/10 rounded overflow-hidden">
                          <button 
                            onClick={() => updateQuantity(item.variante_id, item.quantite - 1)}
                            className="px-2 py-1 hover:bg-white/5 text-gray-400"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 py-1 text-xs font-mono">{item.quantite}</span>
                          <button 
                            onClick={() => updateQuantity(item.variante_id, item.quantite + 1)}
                            className="px-2 py-1 hover:bg-white/5 text-gray-400"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="text-sm font-mono font-bold text-[#C9A227]">{formatPrice(item.prix * item.quantite)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-black/40 border-t border-[#C9A227]/10 space-y-4">
                <div className="flex justify-between text-xs uppercase tracking-[0.2em]">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs uppercase tracking-[0.2em]">
                  <span className="text-gray-500">Livraison</span>
                  <span className="text-[#C9A227]">Gratuite</span>
                </div>
                <div className="pt-4">
                  <Link 
                    to="/commande" 
                    onClick={onClose}
                    className="block w-full bg-[#C9A227] text-black text-center py-4 uppercase tracking-[0.3em] font-bold hover:bg-[#b08e22] transition-colors"
                  >
                    Commander
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
