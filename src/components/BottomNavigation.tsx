import React from 'react';
import { Clock, Bike, Banknote, BarChart3 } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'inventory' | 'cash' | 'stats';

interface Props {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  activeRentalsCount: number;
}

export const BottomNavigation: React.FC<Props> = ({
  activeTab,
  onChangeTab,
  activeRentalsCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#02110c]/95 backdrop-blur-lg border-t border-[#1a422f] pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16">
        {/* Tab 1: Alquileres en curso */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`relative flex flex-col items-center justify-center transition-all ${
            activeTab === 'dashboard'
              ? 'text-[#f3ebd6] font-extrabold scale-105'
              : 'text-[#d5cbbb]/60 hover:text-[#f3ebd6]'
          }`}
        >
          <div className="relative">
            <Clock className="w-5 h-5 mb-0.5" />
            {activeRentalsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                {activeRentalsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Alquileres</span>
        </button>

        {/* Tab 2: Flota / Stock */}
        <button
          onClick={() => onChangeTab('inventory')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'inventory'
              ? 'text-[#f3ebd6] font-extrabold scale-105'
              : 'text-[#d5cbbb]/60 hover:text-[#f3ebd6]'
          }`}
        >
          <Bike className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Flota</span>
        </button>

        {/* Tab 3: Caja */}
        <button
          onClick={() => onChangeTab('cash')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'cash'
              ? 'text-[#f3ebd6] font-extrabold scale-105'
              : 'text-[#d5cbbb]/60 hover:text-[#f3ebd6]'
          }`}
        >
          <Banknote className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Caja</span>
        </button>

        {/* Tab 4: Métricas */}
        <button
          onClick={() => onChangeTab('stats')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'stats'
              ? 'text-[#f3ebd6] font-extrabold scale-105'
              : 'text-[#d5cbbb]/60 hover:text-[#f3ebd6]'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Métricas</span>
        </button>
      </div>
    </nav>
  );
};
