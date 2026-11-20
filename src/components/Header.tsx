import React, { useState } from 'react';
import { Volume2, VolumeX, Plus, Settings, Compass, Clock, Bike, Banknote, BarChart3, Send, DollarSign } from 'lucide-react';
import { soundService } from '../services/sound';
import { dataService } from '../services/dataService';
import { ActiveTab } from './BottomNavigation';

interface Props {
  activeCount: number;
  onOpenNewRental: () => void;
  onOpenSettings: () => void;
  onOpenRafting: () => void;
  onOpenPrices: () => void;
  activeTab?: ActiveTab;
  onChangeTab?: (tab: ActiveTab) => void;
}

export const Header: React.FC<Props> = ({
  activeCount,
  onOpenNewRental,
  onOpenSettings,
  onOpenRafting,
  onOpenPrices,
  activeTab = 'dashboard',
  onChangeTab,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const isCloud = dataService.isCloudConnected();

  const handleToggleSound = () => {
    const next = soundService.toggleSound();
    setSoundEnabled(next);
  };

  return (
    <header className="sticky top-0 z-30 bg-eco-cream/90 backdrop-blur-md border-b border-black/[0.05] pt-safe px-3 sm:px-6 py-2 sm:py-3.5 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 w-full min-w-0">
        {/* Brand Pill & Status */}
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <div className="flex items-center gap-2 bg-white/95 border border-black/[0.06] rounded-full pl-1.5 sm:pl-2 pr-2.5 sm:pr-3.5 py-1 sm:py-1.5 shadow-[0_2px_10px_rgb(0,0,0,0.03)] min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-eco-dark flex items-center justify-center text-eco-gold shrink-0">
              <Compass className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-eco-dark leading-none truncate">
                  Eco Aventura
                </h1>
                <button
                  onClick={onOpenSettings}
                  title={isCloud ? "Enlace en la nube activo (Multi-dispositivo en tiempo real)" : "Modo Local (Haz clic para configurar Supabase y sincronizar otros dispositivos)"}
                  className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all shrink-0 ${
                    isCloud
                      ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                      : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isCloud ? 'bg-eco-leaf animate-pulse' : 'bg-[#D97706]'}`}></span>
                  <span className="hidden xs:inline">{isCloud ? 'Nube' : 'Local'}</span>
                </button>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-eco-leaf animate-pulse shrink-0"></span>
                <span className="text-[10px] font-medium text-eco-creamMuted truncate">
                  {activeCount} {activeCount === 1 ? 'activo' : 'activos'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notebook / Desktop Navigation Pill Tabs (Staffwyn Center Pill Bar) */}
        {onChangeTab && (
          <nav className="hidden md:flex items-center gap-1 bg-white/95 p-1.5 rounded-full border border-black/[0.06] shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <button
              onClick={() => onChangeTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-eco-dark text-white shadow-sm'
                  : 'text-eco-creamDark hover:text-eco-dark hover:bg-eco-surface'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Alquileres</span>
              {activeCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'dashboard' ? 'bg-eco-gold text-eco-dark' : 'bg-eco-dark text-white'
                }`}>
                  {activeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-eco-dark text-white shadow-sm'
                  : 'text-eco-creamDark hover:text-eco-dark hover:bg-eco-surface'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Flota</span>
            </button>

            <button
              onClick={() => onChangeTab('cash')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'cash'
                  ? 'bg-eco-dark text-white shadow-sm'
                  : 'text-eco-creamDark hover:text-eco-dark hover:bg-eco-surface'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Caja</span>
            </button>

            <button
              onClick={() => onChangeTab('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'bg-eco-dark text-white shadow-sm'
                  : 'text-eco-creamDark hover:text-eco-dark hover:bg-eco-surface'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Métricas</span>
            </button>
          </nav>
        )}

        {/* Action Controls (Staffwyn Right Circular Buttons + Pill Actions) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Rafting Info WhatsApp Button */}
          <button
            type="button"
            onClick={onOpenRafting}
            title="Enviar Pack de Info Rafting (Pomelos Tour) por WhatsApp"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 min-h-[44px] rounded-full bg-eco-gold hover:bg-[#f0c62d] border border-black/[0.08] text-eco-dark font-extrabold text-[11px] sm:text-xs shadow-sm active:scale-95 transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">Info </span><span>Rafting</span>
          </button>

          {/* Prices Panel Button */}
          <button
            type="button"
            onClick={onOpenPrices}
            aria-label="Panel de precios"
            title="Cambiar precios de todos los productos"
            className="w-11 h-11 sm:w-auto sm:px-3.5 rounded-full border border-black/[0.08] bg-white text-eco-dark hover:bg-eco-surface flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 active:scale-95"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-extrabold">Precios</span>
          </button>

          {/* Sound Toggle (Circular White Button) */}
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label="Alternar alertas sonoras"
            className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all shadow-sm shrink-0 ${
              soundEnabled
                ? 'bg-white border-black/[0.08] text-eco-dark hover:bg-eco-surface'
                : 'bg-white/60 border-black/[0.05] text-eco-creamMuted/50'
            }`}
            title={soundEnabled ? 'Alertas sonoras activas' : 'Alertas silenciadas'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings Modal Button (Circular White Button) */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Configuración y base de datos"
            className="w-11 h-11 rounded-full border border-black/[0.08] bg-white text-eco-dark hover:bg-eco-surface flex items-center justify-center transition-all shadow-sm shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Quick New Rental Button (Solid Charcoal Pill) */}
          <button
            type="button"
            onClick={onOpenNewRental}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 min-h-[44px] rounded-full bg-eco-dark text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all hover:bg-eco-forestLight shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3] text-eco-gold" />
            <span>Alquilar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
