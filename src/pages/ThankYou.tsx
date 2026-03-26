import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight, Package, Truck, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatPrice } from '../utils';

const ThankYou: React.FC = () => {
  const location = useLocation();
  const orderData = location.state as { orderId: string; total: number } | null;

  useEffect(() => {
    if (orderData) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [orderData]);

  if (!orderData) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center space-y-8 mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-[#C9A227]/10 rounded-full"
          >
            <CheckCircle size={48} className="text-[#C9A227]" />
          </motion.div>
          
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-serif text-[#C9A227]"
            >
              Merci pour votre confiance
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 uppercase tracking-[0.2em] text-sm"
            >
              Votre commande a été reçue et est en cours de traitement.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1a1a1a] border border-[#C9A227]/20 p-8 rounded-lg inline-block"
          >
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Numéro de commande</p>
            <h2 className="text-3xl font-mono text-white tracking-tighter">{orderData.orderId}</h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111] border border-white/5 p-8 rounded-lg space-y-6"
          >
            <h3 className="text-xs uppercase tracking-[0.3em] font-bold border-b border-white/5 pb-4">Résumé</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total payé</span>
                <span className="text-white font-bold">{formatPrice(orderData.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Méthode</span>
                <span className="text-white">Paiement à la livraison</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Délai estimé</span>
                <span className="text-white">2-4 jours ouvrables</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#111] border border-white/5 p-8 rounded-lg space-y-6"
          >
            <h3 className="text-xs uppercase tracking-[0.3em] font-bold border-b border-white/5 pb-4">Prochaines étapes</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center shrink-0">
                  <Package size={16} className="text-[#C9A227]" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">Nous préparons soigneusement vos bijoux dans leur écrin de luxe.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center shrink-0">
                  <Truck size={16} className="text-[#C9A227]" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">Vous recevrez un appel de confirmation de notre service client.</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="text-center">
          <Link 
            to="/boutique"
            className="inline-flex items-center gap-3 bg-[#C9A227] text-black px-10 py-4 font-bold uppercase tracking-widest text-xs hover:bg-[#b08e22] transition-all group"
          >
            Continuer les achats
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
