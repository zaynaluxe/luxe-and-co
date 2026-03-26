import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CartItem {
  id: number;
  variante_id: number;
  nom: string;
  prix: number;
  quantite: number;
  image: string;
  couleur: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (varianteId: number) => void;
  updateQuantity: (varianteId: number, qty: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('luxe_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.variante_id === item.variante_id);
      if (existing) {
        return prev.map(i => i.variante_id === item.variante_id ? { ...i, quantite: i.quantite + item.quantite } : i);
      }
      return [...prev, item];
    });
    toast.success(`${item.nom} ajouté au panier`);
  };

  const removeFromCart = (varianteId: number) => {
    setCart(prev => prev.filter(i => i.variante_id !== varianteId));
  };

  const updateQuantity = (varianteId: number, qty: number) => {
    setCart(prev => prev.map(i => i.variante_id === varianteId ? { ...i, quantite: Math.max(1, qty) } : i));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + (item.prix * item.quantite), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
