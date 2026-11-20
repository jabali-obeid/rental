import React, { useId, useRef, useState } from 'react';
import { Ticket, X, ChevronLeft } from 'lucide-react';
import { DailyTicketCounters } from '../types';
import { dataService } from '../services/dataService';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { TicketCounterCard } from './TicketCounterCard';

interface TicketsDrawerProps {
  counters: DailyTicketCounters;
}

export const TicketsDrawer: React.FC<TicketsDrawerProps> = ({ counters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const dialogRef = useDialogA11y(isOpen, () => setIsOpen(false));
  const swipeStartXRef = useRef<number | null>(null);

  const totalToday = counters.bungee + counters.palestra;

  const handleEdgePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    swipeStartXRef.current = e.clientX;
  };

  const handleEdgePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (swipeStartXRef.current === null) return;
    const deltaX = e.clientX - swipeStartXRef.current;
    // Swiping right-to-left opens the drawer
    if (deltaX < -24) {
      swipeStartXRef.current = null;
      setIsOpen(true);
    }
  };

  const handleDrawerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    swipeStartXRef.current = e.clientX;
  };

  const handleDrawerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swipeStartXRef.current === null) return;
    const deltaX = e.clientX - swipeStartXRef.current;
    // Swiping left-to-right closes the drawer
    if (deltaX > 48) {
      swipeStartXRef.current = null;
      setIsOpen(false);
    }
  };

  const handlePointerReset = () => {
    swipeStartXRef.current = null;
  };

  return (
    <>
      {/* Right-Edge Pull Tab (Tap or Swipe Right-to-Left to open) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          onPointerDown={handleEdgePointerDown}
          onPointerMove={handleEdgePointerMove}
          onPointerUp={handlePointerReset}
          onPointerCancel={handlePointerReset}
          aria-label="Abrir contador de tickets Bungee y Palestra"
          style={{ touchAction: 'pan-y' }}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 py-3 pl-2.5 pr-2 rounded-l-2xl bg-eco-dark text-white border border-r-0 border-black/15 shadow-[-6px_4px_20px_rgb(0,0,0,0.16)] hover:bg-eco-forestLight active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-eco-gold" />
          <Ticket className="w-4 h-4 text-eco-gold" />
          <span className="text-[10px] font-black tracking-wider uppercase [writing-mode:vertical-rl] rotate-180">
            Tickets
          </span>
          {totalToday > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-eco-gold text-eco-dark text-[10px] font-black tabular-nums leading-none">
              {totalToday}
            </span>
          )}
        </button>
      )}

      {/* Backdrop */}
      <div
        aria-hidden={!isOpen}
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Right-to-Left Slide-Over Drawer */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        onPointerDown={handleDrawerPointerDown}
        onPointerMove={handleDrawerPointerMove}
        onPointerUp={handlePointerReset}
        onPointerCancel={handlePointerReset}
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-eco-cream border-l border-black/[0.08] shadow-2xl flex flex-col text-eco-dark transform transition-transform duration-300 ease-out focus:outline-none ${
          isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-black/[0.06] bg-white/90 backdrop-blur-md flex items-center justify-between gap-3 pt-safe">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-eco-dark text-eco-gold flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id={titleId} className="text-base font-black tracking-tight text-eco-dark truncate">
                  Tickets del Día
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-eco-gold text-eco-dark text-[11px] font-black tabular-nums">
                  {totalToday}
                </span>
              </div>
              <p className="text-[11px] text-eco-creamMuted truncate">
                Se reinician al cerrar la caja
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar panel de tickets"
            onClick={() => setIsOpen(false)}
            className="w-11 h-11 rounded-full bg-eco-surface hover:bg-[#EAE4D3] border border-black/[0.08] text-eco-dark flex items-center justify-center active:scale-95 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe">
          <TicketCounterCard
            title="Bungee"
            subtitle="Saltos registrados en el turno"
            count={counters.bungee}
            onIncrement={() => dataService.adjustTicketCounter('bungee', 1)}
            onDecrement={() => dataService.adjustTicketCounter('bungee', -1)}
          />

          <TicketCounterCard
            title="Palestra"
            subtitle="Subidas registradas en el turno"
            count={counters.palestra}
            onIncrement={() => dataService.adjustTicketCounter('palestra', 1)}
            onDecrement={() => dataService.adjustTicketCounter('palestra', -1)}
          />
        </div>
      </div>
    </>
  );
};
