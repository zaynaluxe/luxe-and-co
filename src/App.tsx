import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

import { API_URL } from './utils';
import { CartProvider } from './context/CartContext';

// Components
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';

// Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Account from './pages/Account';
import ThankYou from './pages/ThankYou';

// Admin Pages (Imported from Admin.tsx)
import { 
  AdminLogin, AdminLayout, AdminDashboard, 
  AdminProducts, AdminOrders, AdminPromos, AdminPixels
} from './pages/Admin';

import { Toaster } from 'sonner';

// --- Admin Route Wrapper ---
const AdminRoute: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('admin_token'));
  const [view, setView] = useState('admin_dashboard');

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderView = () => {
    switch (view) {
      case 'admin_dashboard': return <AdminDashboard />;
      case 'admin_products': return <AdminProducts />;
      case 'admin_orders': return <AdminOrders />;
      case 'admin_promos': return <AdminPromos />;
      case 'admin_pixels': return <AdminPixels />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout currentView={view} setView={setView}>
      {renderView()}
    </AdminLayout>
  );
};

// --- App Content (to use location) ---
const AppContent: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Secret admin shortcut
  useEffect(() => {
    let buffer = '';
    let lastTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA' || 
        (activeElement as HTMLElement)?.isContentEditable
      ) {
        buffer = '';
        return;
      }

      const now = Date.now();
      // Reset buffer if more than 2 seconds between keys
      if (now - lastTime > 2000) {
        buffer = '';
      }

      buffer += e.key.toLowerCase();
      lastTime = now;

      if (buffer.endsWith('admin')) {
        navigate('/admin');
        buffer = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Load Pixels
  useEffect(() => {
    const loadPixels = async () => {
      try {
        const response = await fetch(API_URL + '/api/pixels');
        if (response.ok) {
          const pixels = await response.json();
          pixels.forEach((pixel: any) => {
            if (pixel.type === 'facebook') {
              // Facebook Pixel
              const script = document.createElement('script');
              script.innerHTML = `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixel.pixel_id}');
                fbq('track', 'PageView');
              `;
              document.head.appendChild(script);

              const noscript = document.createElement('noscript');
              noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixel.pixel_id}&ev=PageView&noscript=1" />`;
              document.head.appendChild(noscript);
            } else if (pixel.type === 'tiktok') {
              // TikTok Pixel
              const script = document.createElement('script');
              script.innerHTML = `
                !function (w, d, t) {
                  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","detach","on_ready","delete"],ttq.setAndLog=function(t,e){return function(){var n=Math.random().toString(36).substring(7);if(w.TiktokAnalyticsObject&&w[t]&&w[t].setAndLog){return w[t].setAndLog(t,e)}else{console.log("TikTok Pixel not loaded yet")}}};for(var i=0;i<ttq.methods.length;i++)ttq[i]=ttq.setAndLog(ttq.methods[i],ttq);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq[e][n]=ttq.setAndLog(ttq.methods[n],e);return e};ttq.load=function(e,n){var t="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=t,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                  ttq.load('${pixel.pixel_id}');
                  ttq.page();
                }(window, document, 'ttq');
              `;
              document.head.appendChild(script);
            }
          });
        }
      } catch (err) {
        console.error('Error loading pixels:', err);
      }
    };
    loadPixels();
  }, []);

  const isStoreRoute = !location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#050505] font-sans selection:bg-[#C9A227] selection:text-black">
      <Toaster position="top-center" expand={false} richColors />
      
      {isStoreRoute && (
        <>
          <Navbar onOpenCart={() => setIsCartOpen(true)} />
          <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
      )}
      
      <Routes>
        {/* Storefront Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/boutique" element={<Catalog />} />
        <Route path="/produit/:slug" element={<ProductDetail />} />
        <Route path="/commande" element={<Checkout />} />
        <Route path="/mon-compte" element={<Account />} />
        <Route path="/merci" element={<ThankYou />} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminRoute />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* WhatsApp Floating Button */}
      {isStoreRoute && (
        <a 
          href="https://wa.me/+212600000000" 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 z-40 group"
        >
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-black text-[10px] uppercase tracking-widest font-bold py-2 px-4 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Besoin d'aide ?
          </div>
          <div className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
        </a>
      )}

      {/* Footer */}
      {isStoreRoute && (
        <footer className="bg-[#1a1a1a] border-t border-[#C9A227]/10 py-20 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <h3 className="text-xl font-serif text-[#C9A227] tracking-widest uppercase">LUXE & CO</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                Bijoux et accessoires en acier inoxydable 316L. Élégance inaltérable pour la femme moderne.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] font-bold mb-6">Service Client</h4>
              <ul className="space-y-4 text-[10px] uppercase tracking-widest text-gray-500">
                <li><Link to="#" className="hover:text-[#C9A227] transition-colors">Livraison & Retours</Link></li>
                <li><Link to="#" className="hover:text-[#C9A227] transition-colors">Guide des tailles</Link></li>
                <li><Link to="#" className="hover:text-[#C9A227] transition-colors">FAQ</Link></li>
                <li><Link to="#" className="hover:text-[#C9A227] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] font-bold mb-6">Légal</h4>
              <ul className="space-y-4 text-[10px] uppercase tracking-widest text-gray-500">
                <li><Link to="#" className="hover:text-[#C9A227] transition-colors">Mentions Légales</Link></li>
                <li><Link to="#" className="hover:text-[#C9A227] transition-colors">CGV</Link></li>
                <li><Link to="#" className="hover:text-[#C9A227] transition-colors">Confidentialité</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.3em] font-bold mb-6">Suivez-nous</h4>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 bg-black border border-white/10 flex items-center justify-center text-gray-500 hover:text-[#C9A227] hover:border-[#C9A227] transition-all">IG</a>
                <a href="#" className="w-8 h-8 bg-black border border-white/10 flex items-center justify-center text-gray-500 hover:text-[#C9A227] hover:border-[#C9A227] transition-all">FB</a>
                <a href="#" className="w-8 h-8 bg-black border border-white/10 flex items-center justify-center text-gray-500 hover:text-[#C9A227] hover:border-[#C9A227] transition-all">TK</a>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center">
            <p className="text-[8px] text-gray-600 uppercase tracking-[0.5em]">© 2026 LUXE & CO. Tous droits réservés. Créé avec passion au Maroc.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
};

export default App;
