import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, User, Menu, X, Search } from 'lucide-react';
import { API_URL } from '../utils';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onOpenCart: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<{nom: string, slug: string}[]>([]);
  const { cart } = useCart();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const categoryOrder = ["Nouveautés", "Bijoux", "Montres", "Hijabs", "Accessoires"];

  React.useEffect(() => {
    fetch(API_URL + '/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filteredAndSorted = data
            .filter(cat => categoryOrder.includes(cat.nom))
            .sort((a, b) => categoryOrder.indexOf(a.nom) - categoryOrder.indexOf(b.nom));
          setCategories(filteredAndSorted);
        }
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  if (isAdmin) return null;

  const navLinks = categories.map(cat => ({
    name: cat.nom,
    path: cat.nom === 'Nouveautés' ? '/boutique?sort=newest' : `/boutique?cat=${cat.nom}`
  }));

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-[#C9A227]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 relative">
          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button onClick={() => setIsMenuOpen(true)} className="text-white hover:text-[#C9A227] transition-colors">
              <Menu size={24} />
            </button>
          </div>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex flex-col items-center absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 whitespace-nowrap">
            <span className="text-[1.1rem] md:text-2xl font-serif text-[#C9A227] tracking-[0.3em] uppercase whitespace-nowrap">LUXE & CO</span>
            <span className="text-[8px] text-gray-500 uppercase tracking-[0.5em] -mt-1 whitespace-nowrap">Élégance Inaltérable</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className="text-xs uppercase tracking-widest text-gray-300 hover:text-[#C9A227] transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-6">
            <button className="text-white hover:text-[#C9A227] transition-colors hidden sm:block">
              <Search size={20} />
            </button>
            <Link to="/mon-compte" className="text-white hover:text-[#C9A227] transition-colors">
              <User size={20} />
            </Link>
            <button onClick={onOpenCart} className="text-white hover:text-[#C9A227] transition-colors relative">
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#C9A227] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 w-[100vw] h-[100vh] bg-[#1a1a1a] z-[9999] overflow-y-auto flex flex-col"
          >
            {/* Close Button Header */}
            <div className="flex justify-between items-center p-8">
              <span className="text-xl font-serif text-[#C9A227] tracking-widest uppercase">MENU</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-white hover:text-[#C9A227] transition-colors">
                <X size={32} />
              </button>
            </div>

            {/* Centered Links */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-12 pb-20">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link 
                    to={link.path} 
                    onClick={() => setIsMenuOpen(false)}
                    className="text-2xl sm:text-4xl uppercase tracking-[0.4em] text-white hover:text-[#C9A227] transition-colors font-serif text-center block"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
