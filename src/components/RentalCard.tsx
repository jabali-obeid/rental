import React from 'react';
import { Rental, Category, Unit } from '../types';
import { useRentalTimer } from '../hooks/useRentalTimer';
import { CategoryIcon } from './CategoryIcon';
import { Phone, AlertTriangle, Clock, PlusCircle, BookmarkPlus, Printer, Play, XCircle } from 'lucide-react';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
import { printThermalTicket } from '../services/printerService';
import { uiFeedback } from '../services/uiFeedback';

interface Props {
  rental: Rental;
  category?: Category;
  unit?: Unit;
  onFinishClick: (rental: Rental) => void;
  onReserveClick?: (rental: Rental) => void;
}

export const RentalCard: React.FC<Props> = React.memo(({
  rental,
  category,
  unit,
  onFinishClick,
  onReserveClick,
}) => {
  const pendingReservation = unit ? dataService.getPendingReservationForUnit(unit.id) : undefined;
  const {
    trafficLight,
    isWaitingStart,
    isExpired,
    formattedTime,
    delayMinutes,
    progressPercent,
    suggestedPenalty,
    penaltyLabel,
  } = useRentalTimer(rental, category);

  const handleLaunchTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    dataService.launchRentalTimer(rental.id);
    soundService.playSuccess();
  };

  const handleQuickExtend = (e: React.MouseEvent) => {
    e.stopPropagation();
    dataService.extendRental(rental.id, 15);
  };

  // Dynamic visual styles according to traffic light state with Staffwyn palette
  let cardStyles = '';
  let badgeStyles = '';
  let timeBoxStyles = '';
  let timeStyles = '';
  let progressColor = '';
  let statusText = '';

  if (trafficLight === 'WAITING') {
    cardStyles = 'border-[#F7D147] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.05)] ring-1 ring-[#F7D147]/60';
    badgeStyles = 'bg-[#F7D147] text-[#1C1C1C] font-extrabold';
    timeBoxStyles = 'bg-[#F9E27D]/55 border-[#F7D147] text-[#1C1C1C]';
    timeStyles = 'text-[#1C1C1C] font-black';
    progressColor = 'bg-[#F7D147]';
    statusText = 'LISTO PARA INICIAR';
  } else if (trafficLight === 'GREEN') {
    cardStyles = 'border-black/[0.06] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
    badgeStyles = 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]';
    timeBoxStyles = 'bg-[#1C1C1C] border-[#1C1C1C] text-white';
    timeStyles = 'text-white font-bold';
    progressColor = 'bg-[#1C1C1C]';
    statusText = 'EN TIEMPO';
  } else if (trafficLight === 'YELLOW') {
    cardStyles = 'border-[#F7D147] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.05)] ring-1 ring-[#F7D147]';
    badgeStyles = 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]';
    timeBoxStyles = 'bg-[#F9E27D] border-[#F7D147] text-[#1C1C1C]';
    timeStyles = 'text-[#1C1C1C] font-extrabold';
    progressColor = 'bg-[#F59E0B]';
    statusText = 'POR VENCER';
  } else {
    // RED: Overdue alert (clean high-contrast border without competing animations)
    cardStyles = 'border-rose-500 bg-white shadow-xl ring-2 ring-rose-500/80';
    badgeStyles = 'bg-[#FEE2E2] text-[#991B1B] font-extrabold border border-[#FCA5A5]';
    timeBoxStyles = 'bg-[#1C1C1C] border-rose-500 text-white';
    timeStyles = 'text-rose-400 font-black';
    progressColor = 'bg-rose-600';
    statusText = 'TIEMPO CUMPLIDO';
  }

  const isBungee = rental.categoryId === 'c-bungee';
  const isPalestra = rental.categoryId === 'c-palestra';
  const categoryName = category?.name || (isBungee ? 'Bungee' : isPalestra ? 'Palestra' : 'Unidad');
  const categoryIcon = category?.icon || (isBungee ? 'Zap' : isPalestra ? 'Users' : 'Bike');
  const unitCode = unit?.codeNumber || (isBungee ? 'BUN' : isPalestra ? 'PAL' : 'U-00');

  return (
    <div
      className={`relative rounded-[24px] sm:rounded-[28px] border p-3.5 sm:p-5 transition-all duration-300 flex flex-col justify-between ${cardStyles}`}
    >
      {/* Top Banner: Unit code, Category, Traffic Status */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-2.5 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="px-2.5 sm:px-3 py-1 rounded-full bg-[#1C1C1C] text-white font-mono font-black text-xs tracking-wide shrink-0">
              {unitCode}
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-[#52514E] font-semibold min-w-0">
              <span className="text-[#1C1C1C] shrink-0">
                <CategoryIcon name={categoryIcon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className="truncate max-w-[100px] sm:max-w-[140px]">{categoryName}</span>
            </div>
          </div>

          <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide shrink-0 ${badgeStyles}`}>
            {statusText}
          </span>
        </div>

        {/* Center Countdown Display (Staffwyn Schedule / Dark Accent Card Style) */}
        <div className={`my-2 sm:my-2.5 rounded-2xl p-2.5 sm:p-3.5 border flex items-center justify-between shadow-sm ${timeBoxStyles}`}>
          <div className="min-w-0">
            <span className={`text-[9px] sm:text-[10px] uppercase font-semibold block tracking-wider truncate ${trafficLight === 'GREEN' || trafficLight === 'RED' ? 'text-white/65' : 'text-[#1C1C1C]/70'
              }`}>
              {isWaitingStart
                ? 'Tiempo Contratado'
                : isExpired
                  ? 'Demora transcurrida'
                  : 'Tiempo Restante'}
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className={`font-mono text-2xl sm:text-3xl tracking-tight ${timeStyles}`}>
                {formattedTime}
              </span>
              {isWaitingStart && (
                <span className="text-[10px] sm:text-[11px] font-extrabold text-[#1C1C1C] uppercase tracking-wide">
                  pausa
                </span>
              )}
              {isExpired && (
                <span className="text-[11px] sm:text-xs font-bold text-rose-400 uppercase tracking-wide">
                  mora
                </span>
              )}
            </div>
          </div>

          {/* Quick +15m button or Quick Start button */}
          {isWaitingStart ? (
            <button
              type="button"
              onClick={handleLaunchTimer}
              title="Iniciar cuenta regresiva ahora"
              className="flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 min-h-[44px] rounded-full bg-[#1C1C1C] hover:bg-[#333333] active:scale-95 transition-all text-white font-black text-xs shadow-md shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#F7D147]" />
              <span>INICIAR</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleQuickExtend}
              title="Extender 15 minutos"
              className={`flex flex-col items-center justify-center px-2.5 sm:px-3 min-w-[44px] min-h-[44px] rounded-xl border active:scale-95 transition-all shrink-0 ${trafficLight === 'GREEN' || trafficLight === 'RED'
                ? 'bg-white/10 border-white/15 hover:bg-white/20 text-white'
                : 'bg-[#1C1C1C] border-[#1C1C1C] text-white'
                }`}
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F7D147] mb-0.5" />
              <span className="text-[9px] sm:text-[10px] font-bold">+15 min</span>
            </button>
          )}
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-[#F6F3EA] rounded-full h-2 overflow-hidden mb-3 border border-black/[0.05]">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${progressColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Surcharge Notice if Red / Overdue */}
        {isExpired && (
          <div
            className={`mb-3 p-2.5 rounded-2xl border flex items-center justify-between text-xs ${suggestedPenalty > 0
              ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
              : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
              }`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <AlertTriangle
                className={`w-4 h-4 shrink-0 ${suggestedPenalty > 0 ? 'text-rose-600' : 'text-amber-600'
                  }`}
              />
              <span>
                Demora: <strong>{delayMinutes} min</strong>{' '}
                <span className="text-[10px] opacity-80">({penaltyLabel})</span>
              </span>
            </div>
            <div className="font-bold">
              {suggestedPenalty > 0 ? (
                <>
                  Recargo: <span className="text-[#991B1B] font-extrabold">+${suggestedPenalty.toLocaleString()}</span>
                </>
              ) : (
                <span className="text-[#166534] font-extrabold">Sin cargo ($0)</span>
              )}
            </div>
          </div>
        )}

        {/* Customer & Physical Guarantee Locker */}
        <div className="space-y-2 mb-3 text-xs">
          <div className="flex items-center justify-between text-[#52514E]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-full bg-[#F7D147] text-[#1C1C1C] font-black text-[10px] flex items-center justify-center shrink-0">
                {rental.customerName.slice(0, 2).toUpperCase()}
              </span>
              <span className="font-bold text-[#1C1C1C] truncate max-w-[150px]">
                {rental.customerName}
              </span>
            </div>
            {rental.customerPhone && (
              <a
                href={`tel:${rental.customerPhone}`}
                className="flex items-center gap-1 text-[#52514E] hover:text-[#1C1C1C] transition-colors py-1 px-2.5 rounded-full bg-[#F6F3EA] border border-black/[0.06]"
              >
                <Phone className="w-3 h-3 text-[#1C1C1C]" />
                <span className="text-[11px] font-mono font-semibold">{rental.customerPhone}</span>
              </a>
            )}
          </div>

          {/* Simplified Guarantee: only what they left */}
          <div className="flex items-center justify-between bg-[#F6F3EA] px-3.5 py-2 rounded-2xl border border-black/[0.05] text-[11px]">
            <span className="text-[#71706B] font-medium">Dejó en garantía:</span>
            <span className="font-extrabold text-[#1C1C1C] truncate max-w-[180px]">
              {rental.docLocker || 'Sin especificar'}
            </span>
          </div>

          {/* Pending Next Reservation Banner */}
          {pendingReservation && (
            <div className="p-2.5 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#92400E] block">Siguiente turno reservado:</span>
                <span className="font-extrabold text-[#1C1C1C]">{pendingReservation.customerName} ({pendingReservation.durationMinutes}m)</span>
              </div>
              <button
                type="button"
                aria-label="Reimprimir ticket de reserva"
                onClick={() => {
                  printThermalTicket({
                    type: 'RESERVA',
                    unitCode: unit?.codeNumber || 'U-00',
                    unitName: unit?.name || 'Vehículo',
                    categoryName: category?.name || 'Rodado',
                    customerName: pendingReservation.customerName,
                    customerPhone: pendingReservation.customerPhone,
                    durationMinutes: pendingReservation.durationMinutes,
                    expectedTime: new Date(rental.expectedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    docLocker: pendingReservation.docLocker,
                    docType: pendingReservation.docType,
                    totalPrice: pendingReservation.totalPrice,
                    paymentMethod: pendingReservation.paymentMethod,
                    ticketId: pendingReservation.id,
                    createdAt: pendingReservation.createdAt,
                  });
                }}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-white hover:bg-[#1C1C1C] hover:text-white border border-black/10 text-[#1C1C1C] active:scale-95 transition-all shrink-0"
                title="Reimprimir ticket de reserva"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Bottom Actions: Iniciar (if waiting) or Finalizar Alquiler & Reservar */}
      {isWaitingStart ? (
        <div className="pt-2.5 border-t border-black/[0.06] flex items-center gap-2">
          <button
            type="button"
            onClick={handleLaunchTimer}
            className="flex-1 min-h-[44px] py-3 px-4 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white font-black text-xs sm:text-sm tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current text-[#F7D147]" />
            <span>INICIAR TIEMPO ({rental.durationMinutes} MIN)</span>
          </button>

          <button
            type="button"
            aria-label="Cancelar salida y liberar unidad"
            onClick={async () => {
              const confirmed = await uiFeedback.confirm({
                title: 'Cancelar salida pendiente',
                message: `¿Cancelar este alquiler pendiente de ${rental.customerName} y liberar la unidad ${unitCode}?`,
                confirmLabel: 'Sí, cancelar',
                destructive: true,
              });
              if (confirmed) {
                dataService.cancelRental(rental.id);
                uiFeedback.toast(`Unidad ${unitCode} liberada.`, 'info');
              }
            }}
            title="Cancelar salida y liberar unidad"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[#F6F3EA] hover:bg-[#FEE2E2] text-[#71706B] hover:text-[#991B1B] border border-black/[0.06] transition-all active:scale-95 shrink-0"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="pt-2.5 border-t border-black/[0.06] grid grid-cols-2 gap-2">
          {/* Reservar Button (if not already reserved) */}
          {!pendingReservation ? (
            <button
              type="button"
              onClick={() => onReserveClick && onReserveClick(rental)}
              className="min-h-[44px] py-3 px-3 rounded-full bg-[#F7D147] hover:bg-[#f0c62d] text-[#1C1C1C] font-extrabold text-xs tracking-wide transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <BookmarkPlus className="w-4 h-4 text-[#1C1C1C]" />
              <span>Reservar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const confirmed = await uiFeedback.confirm({
                  title: 'Despachar reserva',
                  message: `¿Deseas despachar inmediatamente la reserva de ${pendingReservation.customerName}?`,
                  confirmLabel: 'Despachar',
                });
                if (confirmed) {
                  dataService.dispatchReservation(pendingReservation.id);
                  uiFeedback.toast(`Reserva de ${pendingReservation.customerName} despachada.`, 'success');
                }
              }}
              className="min-h-[44px] py-3 px-3 rounded-full bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#166534] border border-[#86EFAC] font-extrabold text-xs tracking-wide transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4" />
              <span>Despachar</span>
            </button>
          )}

          {/* Finalize Rental Button */}
          <button
            type="button"
            onClick={() => onFinishClick(rental)}
            className={`min-h-[44px] py-3 px-3 rounded-full font-extrabold text-xs tracking-wide transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5 ${isExpired
              ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-300'
              : 'bg-[#1C1C1C] hover:bg-[#333333] text-white'
              }`}
          >
            <Clock className="w-4 h-4 text-[#F7D147]" />
            <span>Finalizar</span>
          </button>
        </div>
      )}
    </div>
  );
});
