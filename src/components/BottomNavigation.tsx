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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-black/[0.08] pb-safe shadow-[0_-4px_20px_rgb(0,0,0,0.05)]">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-2 items-center gap-1">
        {/* Tab 1: Alquileres en curso */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#1C1C1C] text-white font-extrabold shadow-sm'
              : 'text-[#71706B] hover:text-[#1C1C1C]'
          }`}
        >
          <div className="relative">
            <Clock className="w-5 h-5 mb-0.5" />
            {activeRentalsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#F7D147] text-[#1C1C1C] border border-black/10">
                {activeRentalsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Alquileres</span>
        </button>

        {/* Tab 2: Flota / Stock */}
        <button
          onClick={() => onChangeTab('inventory')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            activeTab === 'inventory'
              ? 'bg-[#1C1C1C] text-white font-extrabold shadow-sm'
              : 'text-[#71706B] hover:text-[#1C1C1C]'
          }`}
        >
          <Bike className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Flota</span>
        </button>

        {/* Tab 3: Caja */}
        <button
          onClick={() => onChangeTab('cash')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            activeTab === 'cash'
              ? 'bg-[#1C1C1C] text-white font-extrabold shadow-sm'
              : 'text-[#71706B] hover:text-[#1C1C1C]'
          }`}
        >
          <Banknote className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Caja</span>
        </button>

        {/* Tab 4: Métricas */}
        <button
          onClick={() => onChangeTab('stats')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            activeTab === 'stats'
              ? 'bg-[#1C1C1C] text-white font-extrabold shadow-sm'
              : 'text-[#71706B] hover:text-[#1C1C1C]'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Métricas</span>
        </button>
      </div>
    </nav>
  );
};
