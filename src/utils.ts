/// <reference types="vite/client" />
export const API_URL = import.meta.env.VITE_API_URL || '';

export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0 MAD';
  return `${Math.round(numPrice).toLocaleString('fr-MA')} MAD`;
};
