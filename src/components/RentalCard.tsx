import React from 'react';
import { Rental, Category, Unit } from '../types';
import { useRentalTimer } from '../hooks/useRentalTimer';
import { CategoryIcon } from './CategoryIcon';
import { Phone, AlertTriangle, Clock, PlusCircle } from 'lucide-react';
import { dataService } from '../services/dataService';

interface Props {
  rental: Rental;
  category?: Category;
  unit?: Unit;
  onFinishClick: (rental: Rental) => void;
}

export const RentalCard: React.FC<Props> = ({
  rental,
  category,
  unit,
  onFinishClick,
}) => {
  const {
    trafficLight,
    isExpired,
    formattedTime,
    delayMinutes,
    delayBlocks10m,
    progressPercent,
    suggestedPenalty,
  } = useRentalTimer(rental, category);

  const handleQuickExtend = (e: React.MouseEvent) => {
    e.stopPropagation();
    dataService.extendRental(rental.id, 15);
  };

  // Dynamic visual styles according to traffic light state with Eco Aventura palette
  let cardStyles = '';
  let badgeStyles = '';
  let timeStyles = '';
  let progressColor = '';
  let statusText = '';

  if (trafficLight === 'GREEN') {
    cardStyles = 'border-[#1a422f] bg-[#081d15] shadow-xl shadow-[#02110c]/80';
    badgeStyles = 'bg-[#1a422f] text-[#f3ebd6] border border-[#2ea06e]/50';
    timeStyles = 'text-[#f3ebd6]';
    progressColor = 'bg-[#2ea06e]';
    statusText = 'EN TIEMPO';
  } else if (trafficLight === 'YELLOW') {
    cardStyles = 'border-amber-500/80 bg-[#1f1a0e] shadow-xl ring-1 ring-amber-500/50';
    badgeStyles = 'bg-amber-500/25 text-amber-200 border border-amber-500/50 animate-pulse';
    timeStyles = 'text-amber-300 font-extrabold';
    progressColor = 'bg-amber-400';
    statusText = 'POR VENCER';
  } else {
    // RED: Intermittent alert
    cardStyles = 'border-rose-600 bg-rose-950/30 shadow-2xl ring-2 ring-rose-500 animate-pulse-fast';
    badgeStyles = 'bg-rose-600 text-white font-bold border border-rose-400';
    timeStyles = 'text-rose-400 font-black animate-pulse';
    progressColor = 'bg-rose-500';
    statusText = 'TIEMPO CUMPLIDO';
  }

  const categoryName = category?.name || 'Unidad';
  const unitCode = unit?.codeNumber || 'U-00';

  return (
    <div
      className={`relative rounded-3xl border p-4 transition-all duration-300 flex flex-col justify-between ${cardStyles}`}
    >
      {/* Top Banner: Unit code, Category, Traffic Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-[#02110c] text-[#f3ebd6] font-mono font-black text-sm tracking-wide border border-[#1a422f]">
              {unitCode}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#d5cbbb] font-medium">
              <span className="text-[#2ea06e]">
                <CategoryIcon name={category?.icon || 'Bike'} className="w-4 h-4" />
              </span>
              <span className="truncate max-w-[120px]">{categoryName}</span>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider ${badgeStyles}`}>
            {statusText}
          </span>
        </div>

        {/* Center Countdown Display */}
        <div className="my-2.5 bg-[#02110c]/80 rounded-2xl p-3.5 border border-[#1a422f]/70 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[11px] uppercase font-semibold text-[#d5cbbb]/70 block tracking-wider">
              {isExpired ? 'Demora transcurrida' : 'Tiempo Restante'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`font-mono text-3xl tracking-tight ${timeStyles}`}>
                {formattedTime}
              </span>
              {isExpired && (
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                  min mora
                </span>
              )}
            </div>
          </div>

          {/* Quick +15m button */}
          <button
            onClick={handleQuickExtend}
            title="Extender 15 minutos"
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-[#1a422f] border border-[#2ea06e]/40 hover:bg-[#265e43] active:scale-95 transition-all text-[#f3ebd6]"
          >
            <PlusCircle className="w-4 h-4 text-[#f3ebd6] mb-0.5" />
            <span className="text-[10px] font-bold text-[#f3ebd6]">+15 min</span>
          </button>
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-[#02110c] rounded-full h-1.5 overflow-hidden mb-3 border border-[#1a422f]/40">
          <div
            className={`h-full transition-all duration-1000 ${progressColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Surcharge Notice if Red / Overdue */}
        {isExpired && (
          <div className="mb-3 p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Demora: <strong>{delayMinutes} min</strong>{' '}
                <span className="text-[10px] opacity-80">
                  ({delayBlocks10m} {delayBlocks10m === 1 ? 'bloque' : 'bloques'} de 10m)
                </span>
              </span>
            </div>
            <div className="font-bold text-rose-200">
              Recargo: <span className="text-white font-extrabold">+${suggestedPenalty.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Customer & Physical Guarantee Locker */}
        <div className="space-y-1.5 mb-3 text-xs">
          <div className="flex items-center justify-between text-[#d5cbbb]">
            <span className="font-bold text-[#f3ebd6] truncate max-w-[160px]">
              {rental.customerName}
            </span>
            {rental.customerPhone && (
              <a
                href={`tel:${rental.customerPhone}`}
                className="flex items-center gap-1 text-[#d5cbbb] hover:text-[#f3ebd6] active:text-[#f3ebd6] transition-colors py-0.5 px-2 rounded-lg bg-[#02110c] border border-[#1a422f]/60"
              >
                <Phone className="w-3 h-3 text-[#2ea06e]" />
                <span className="text-[11px] font-mono">{rental.customerPhone}</span>
              </a>
            )}
          </div>

          {/* Retention Guarantee Locker */}
          <div className="flex items-center justify-between bg-[#0d281e]/70 px-3 py-1.5 rounded-xl border border-[#1a422f] text-[11px]">
            <span className="text-[#d5cbbb]/80 font-medium">Garantía / Doc:</span>
            <span className="font-extrabold text-[#f3ebd6] flex items-center gap-1.5">
              <span>🗄️ {rental.docLocker}</span>
              <span className="text-[#1a422f]">|</span>
              <span className="text-[#d5cbbb]">{rental.docType}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Card Bottom: Big Finalize Rental CTA */}
      <div className="pt-2 border-t border-[#1a422f]/60">
        <button
          onClick={() => onFinishClick(rental)}
          className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
            isExpired
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 animate-bounce'
              : 'bg-[#1a422f] hover:bg-[#265e43] text-[#f3ebd6] border border-[#f3ebd6]/25 shadow-lg shadow-[#02110c]/80'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Finalizar Alquiler</span>
        </button>
      </div>
    </div>
  );
};
