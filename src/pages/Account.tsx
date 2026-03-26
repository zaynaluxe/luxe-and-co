import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { User, ShoppingBag, LogOut, ChevronRight, Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { formatPrice, API_URL } from '../utils';

interface Order {
  id: string;
  order_number: string;
  total_prix: number;
  statut: string;
  created_at: string;
}

const Account: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user_token'));
  const [view, setView] = useState<'login' | 'register' | 'profile'>('login');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setView('profile');
      fetchOrders();
    }
  }, [isLoggedIn]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL + '/api/orders/my-orders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('user_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_token', 'fake_user_jwt');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    setIsLoggedIn(false);
    setView('login');
  };

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    en_attente: { label: 'En attente', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
    confirmée: { label: 'Confirmée', color: 'text-blue-400 bg-blue-400/10', icon: CheckCircle },
    expédiée: { label: 'Expédiée', color: 'text-purple-400 bg-purple-400/10', icon: Truck },
    livrée: { label: 'Livrée', color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
  };

  return (
    <div className="bg-[#050505] min-h-screen pt-32 pb-24 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {!isLoggedIn ? (
            <motion.div 
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto bg-[#1a1a1a] p-10 border border-white/5"
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl font-serif text-[#C9A227] tracking-widest uppercase mb-2">
                  {view === 'login' ? 'Connexion' : 'Inscription'}
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Rejoignez le cercle LUXE & CO</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {view === 'register' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Prénom</label>
                      <input type="text" required className="w-full bg-black border border-white/10 p-4 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Nom</label>
                      <input type="text" required className="w-full bg-black border border-white/10 p-4 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Email</label>
                  <input type="email" required className="w-full bg-black border border-white/10 p-4 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Mot de passe</label>
                  <input type="password" required className="w-full bg-black border border-white/10 p-4 text-xs uppercase tracking-widest focus:border-[#C9A227] outline-none" />
                </div>
                
                <button className="w-full bg-[#C9A227] text-black py-4 uppercase tracking-widest font-bold text-xs hover:bg-[#b08e22] transition-colors">
                  {view === 'login' ? 'Se Connecter' : 'Créer un compte'}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <button 
                  onClick={() => setView(view === 'login' ? 'register' : 'login')}
                  className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-[#C9A227] transition-colors"
                >
                  {view === 'login' ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <p className="text-[#C9A227] uppercase tracking-widest text-xs mb-2">Mon Compte</p>
                  <h1 className="text-4xl font-serif tracking-widest uppercase">Bienvenue, Yassine</h1>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Profile Info */}
                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-[#1a1a1a] p-8 border border-white/5 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#C9A227] rounded-full flex items-center justify-center text-black font-bold text-xl">YE</div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-widest">Yassine El Amrani</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Membre depuis Mars 2026</p>
                      </div>
                    </div>
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-3 text-gray-400">
                        <User size={16} />
                        <p className="text-xs uppercase tracking-widest">yassine@example.com</p>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <ShoppingBag size={16} />
                        <p className="text-xs uppercase tracking-widest">{orders.length} Commandes passées</p>
                      </div>
                    </div>
                    <button className="w-full border border-white/10 py-3 uppercase tracking-widest text-[10px] font-bold hover:bg-white/5 transition-colors">
                      Modifier le profil
                    </button>
                  </div>
                </div>

                {/* Orders History */}
                <div className="lg:col-span-2 space-y-8">
                  <h2 className="text-2xl font-serif tracking-widest uppercase">Historique des Commandes</h2>
                  
                  {loading ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-24 bg-white/5 animate-pulse rounded"></div>
                      ))}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="bg-[#1a1a1a] p-12 border border-white/5 text-center space-y-4">
                      <Package size={48} className="mx-auto text-gray-800" />
                      <p className="text-gray-500 uppercase tracking-widest text-sm">Vous n'avez pas encore passé de commande.</p>
                      <Link to="/boutique" className="inline-block text-[#C9A227] border border-[#C9A227] px-8 py-3 uppercase tracking-widest text-xs">Faire mon premier achat</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const status = statusMap[order.statut] || { label: order.statut, color: 'text-gray-400 bg-gray-400/10', icon: Package };
                        return (
                          <div key={order.id} className="bg-[#1a1a1a] p-6 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-[#C9A227]/30 transition-colors">
                            <div className="flex items-center gap-6 w-full md:w-auto">
                              <div className="w-12 h-12 bg-black border border-white/5 flex items-center justify-center text-[#C9A227]">
                                <Package size={24} />
                              </div>
                              <div>
                                <p className="text-sm font-mono font-bold text-[#C9A227]">{order.order_number}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Passée le {new Date(order.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                              <div className="text-right">
                                <p className="text-sm font-mono font-bold">{formatPrice(order.total_prix)}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Total payé</p>
                              </div>
                              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.color}`}>
                                <status.icon size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{status.label}</span>
                              </div>
                              <button className="text-gray-500 hover:text-white transition-colors">
                                <ChevronRight size={20} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Account;
