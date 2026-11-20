import React from 'react';
import { IconClock, IconFleet, IconCash, IconMetrics } from './EcoIcons';

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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-black/[0.08] pb-safe shadow-[0_-4px_20px_rgb(0,0,0,0.05)]">
      <div className="max-w-lg mx-auto grid grid-cols-4 h-16 px-2 items-center gap-1">
        {/* Tab 1: Alquileres en curso */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            activeTab === 'dashboard'
              ? 'bg-eco-dark text-white font-extrabold shadow-sm'
              : 'text-eco-creamMuted hover:text-eco-dark'
          }`}
        >
          <div className="relative">
            <IconClock className="w-5 h-5 mb-0.5" />
            {activeRentalsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-eco-gold text-eco-dark border border-black/10">
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
              ? 'bg-eco-dark text-white font-extrabold shadow-sm'
              : 'text-eco-creamMuted hover:text-eco-dark'
          }`}
        >
          <IconFleet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Flota</span>
        </button>

        {/* Tab 3: Caja */}
        <button
          onClick={() => onChangeTab('cash')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            activeTab === 'cash'
              ? 'bg-eco-dark text-white font-extrabold shadow-sm'
              : 'text-eco-creamMuted hover:text-eco-dark'
          }`}
        >
          <IconCash className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Caja</span>
        </button>

        {/* Tab 4: Métricas */}
        <button
          onClick={() => onChangeTab('stats')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
            activeTab === 'stats'
              ? 'bg-eco-dark text-white font-extrabold shadow-sm'
              : 'text-eco-creamMuted hover:text-eco-dark'
          }`}
        >
          <IconMetrics className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Métricas</span>
        </button>
      </div>
    </nav>
  );
};
