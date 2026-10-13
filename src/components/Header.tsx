import React, { useState } from 'react';
import { Volume2, VolumeX, Plus, Settings, Compass, Clock, Bike, Banknote, BarChart3, Wifi, Database } from 'lucide-react';
import { soundService } from '../services/sound';
import { dataService } from '../services/dataService';
import { ActiveTab } from './BottomNavigation';

interface Props {
  activeCount: number;
  onOpenNewRental: () => void;
  onOpenSettings: () => void;
  activeTab?: ActiveTab;
  onChangeTab?: (tab: ActiveTab) => void;
}

export const Header: React.FC<Props> = ({
  activeCount,
  onOpenNewRental,
  onOpenSettings,
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
    <header className="sticky top-0 z-30 bg-[#02110c]/95 backdrop-blur-md border-b border-[#1a422f]/80 pt-safe px-3 sm:px-4 py-2.5 sm:py-3 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 w-full min-w-0">
        {/* Brand & Status */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#1a422f] to-[#2ea06e] border border-[#f3ebd6]/20 flex items-center justify-center shadow-lg shadow-[#02110c]/50 text-[#f3ebd6] shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-lg font-extrabold tracking-tight text-[#f3ebd6] leading-none truncate">
                Eco Aventura
              </h1>
              <span className="hidden xs:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-[#1a422f] text-[#f3ebd6] border border-[#f3ebd6]/30 shrink-0">
                PWA
              </span>
              <button
                onClick={onOpenSettings}
                title={isCloud ? "Enlace en la nube activo (Multi-dispositivo en tiempo real)" : "Modo Local (Haz clic para configurar Supabase y sincronizar otros dispositivos)"}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border transition-all shrink-0 ${
                  isCloud
                    ? 'bg-emerald-950/80 text-[#2ea06e] border-[#2ea06e]/40'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isCloud ? 'bg-[#2ea06e] animate-pulse' : 'bg-amber-400'}`}></span>
                <span>{isCloud ? 'Nube' : 'Local'}</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#2ea06e] animate-pulse shrink-0"></span>
              <span className="text-[10px] sm:text-xs font-medium text-[#d5cbbb] truncate">
                {activeCount} {activeCount === 1 ? 'alquiler' : 'alquileres'}
              </span>
            </div>
          </div>
        </div>

        {/* Notebook / Desktop Navigation Tabs (Hidden on small mobile screens) */}
        {onChangeTab && (
          <nav className="hidden md:flex items-center gap-1 bg-[#081d15] p-1 rounded-2xl border border-[#1a422f] shadow-inner">
            <button
              onClick={() => onChangeTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#1a422f] text-[#f3ebd6] shadow'
                  : 'text-[#d5cbbb]/70 hover:text-[#f3ebd6]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Alquileres</span>
              {activeCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                  {activeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-[#1a422f] text-[#f3ebd6] shadow'
                  : 'text-[#d5cbbb]/70 hover:text-[#f3ebd6]'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Flota</span>
            </button>

            <button
              onClick={() => onChangeTab('cash')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cash'
                  ? 'bg-[#1a422f] text-[#f3ebd6] shadow'
                  : 'text-[#d5cbbb]/70 hover:text-[#f3ebd6]'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Caja</span>
            </button>

            <button
              onClick={() => onChangeTab('stats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'stats'
                  ? 'bg-[#1a422f] text-[#f3ebd6] shadow'
                  : 'text-[#d5cbbb]/70 hover:text-[#f3ebd6]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Métricas</span>
            </button>
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label="Alternar alertas sonoras"
            className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-[#1a422f]/80 border-[#2ea06e]/50 text-[#f3ebd6] hover:bg-[#1a422f]'
                : 'bg-[#081d15] border-[#1a422f]/40 text-[#d5cbbb]/40'
            }`}
            title={soundEnabled ? 'Alertas sonoras activas' : 'Alertas silenciadas'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Configuración y base de datos"
            className="p-2 sm:p-2.5 rounded-xl border border-[#1a422f] bg-[#081d15] text-[#d5cbbb] hover:text-[#f3ebd6] hover:bg-[#1a422f] transition-all"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Quick New Rental Button */}
          <button
            onClick={onOpenNewRental}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#f3ebd6] text-[#02110c] font-black text-xs sm:text-sm shadow-lg shadow-[#000000]/40 active:scale-95 transition-all hover:bg-white hover:brightness-105 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            <span>Alquilar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
