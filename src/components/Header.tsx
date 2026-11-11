import React, { useState } from 'react';
import { Volume2, VolumeX, Plus, Settings, Compass, Clock, Bike, Banknote, BarChart3, Send } from 'lucide-react';
import { soundService } from '../services/sound';
import { dataService } from '../services/dataService';
import { ActiveTab } from './BottomNavigation';

interface Props {
  activeCount: number;
  onOpenNewRental: () => void;
  onOpenSettings: () => void;
  onOpenRafting: () => void;
  activeTab?: ActiveTab;
  onChangeTab?: (tab: ActiveTab) => void;
}

export const Header: React.FC<Props> = ({
  activeCount,
  onOpenNewRental,
  onOpenSettings,
  onOpenRafting,
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
    <header className="sticky top-0 z-30 bg-[#FAF6E8]/85 backdrop-blur-md border-b border-black/[0.05] pt-safe px-3 sm:px-6 py-2.5 sm:py-3.5 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 w-full min-w-0">
        {/* Brand Pill & Status (Staffwyn Left Pill Style) */}
        <div className="flex items-center gap-2 min-w-0 shrink">
          <div className="flex items-center gap-2.5 bg-white/95 border border-black/[0.06] rounded-full pl-2 pr-3.5 py-1.5 shadow-[0_2px_10px_rgb(0,0,0,0.03)]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center text-[#F7D147] shrink-0">
              <Compass className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-[#1C1C1C] leading-none truncate">
                  Eco Aventura
                </h1>
                <button
                  onClick={onOpenSettings}
                  title={isCloud ? "Enlace en la nube activo (Multi-dispositivo en tiempo real)" : "Modo Local (Haz clic para configurar Supabase y sincronizar otros dispositivos)"}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all shrink-0 ${
                    isCloud
                      ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                      : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isCloud ? 'bg-[#16A34A] animate-pulse' : 'bg-[#D97706]'}`}></span>
                  <span>{isCloud ? 'Nube' : 'Local'}</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse shrink-0"></span>
                <span className="text-[10px] font-medium text-[#71706B] truncate">
                  {activeCount} {activeCount === 1 ? 'alquiler activo' : 'alquileres activos'}
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
                  ? 'bg-[#1C1C1C] text-white shadow-sm'
                  : 'text-[#52514E] hover:text-[#1C1C1C] hover:bg-[#F6F3EA]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Alquileres</span>
              {activeCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'dashboard' ? 'bg-[#F7D147] text-[#1C1C1C]' : 'bg-[#1C1C1C] text-white'
                }`}>
                  {activeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-[#1C1C1C] text-white shadow-sm'
                  : 'text-[#52514E] hover:text-[#1C1C1C] hover:bg-[#F6F3EA]'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Flota</span>
            </button>

            <button
              onClick={() => onChangeTab('cash')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'cash'
                  ? 'bg-[#1C1C1C] text-white shadow-sm'
                  : 'text-[#52514E] hover:text-[#1C1C1C] hover:bg-[#F6F3EA]'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Caja</span>
            </button>

            <button
              onClick={() => onChangeTab('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'bg-[#1C1C1C] text-white shadow-sm'
                  : 'text-[#52514E] hover:text-[#1C1C1C] hover:bg-[#F6F3EA]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Métricas</span>
            </button>
          </nav>
        )}

        {/* Action Controls (Staffwyn Right Circular Buttons + Pill Actions) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Rafting Info WhatsApp Button */}
          <button
            onClick={onOpenRafting}
            title="Enviar Pack de Info Rafting (Pomelos Tour) por WhatsApp"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full bg-[#F7D147] hover:bg-[#f0c62d] border border-black/[0.08] text-[#1C1C1C] font-extrabold text-xs shadow-sm active:scale-95 transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Info Rafting</span>
          </button>

          {/* Sound Toggle (Circular White Button) */}
          <button
            onClick={handleToggleSound}
            aria-label="Alternar alertas sonoras"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${
              soundEnabled
                ? 'bg-white border-black/[0.08] text-[#1C1C1C] hover:bg-[#F6F3EA]'
                : 'bg-white/60 border-black/[0.05] text-[#71706B]/50'
            }`}
            title={soundEnabled ? 'Alertas sonoras activas' : 'Alertas silenciadas'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings Modal Button (Circular White Button) */}
          <button
            onClick={onOpenSettings}
            aria-label="Configuración y base de datos"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-black/[0.08] bg-white text-[#1C1C1C] hover:bg-[#F6F3EA] flex items-center justify-center transition-all shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Quick New Rental Button (Solid Charcoal Pill) */}
          <button
            onClick={onOpenNewRental}
            className="flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-[#1C1C1C] text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all hover:bg-[#333333] shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3] text-[#F7D147]" />
            <span>Alquilar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
