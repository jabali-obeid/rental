import React from 'react';
import { Car, Ship, Zap, Users, Bike, HelpCircle } from 'lucide-react';

interface Props {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<Props> = ({ name, className = 'w-5 h-5' }) => {
  switch (name.toLowerCase()) {
    case 'car':
    case 'kartings':
    case 'karting':
      return <Car className={className} />;
    case 'ship':
    case 'kayaks':
    case 'kayak':
    case 'nautica':
      return <Ship className={className} />;
    case 'zap':
    case 'monopatines':
    case 'monopatin':
      return <Zap className={className} />;
    case 'users':
    case 'carritos':
    case 'carrito':
      return <Users className={className} />;
    case 'bike':
    case 'bicicletas':
    case 'bici':
      return <Bike className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};
