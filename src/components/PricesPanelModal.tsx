import React, { useEffect, useId, useState } from 'react';
import { Category, TicketPrices } from '../types';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
import { uiFeedback } from '../services/uiFeedback';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { DollarSign, X, Check, Ticket, Bike } from 'lucide-react';

interface PricesPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  ticketPrices: TicketPrices;
}

interface CategoryRateDraft {
  cash30m: number;
  cash60m: number;
  dig30m: number;
  dig60m: number;
  penalty10m: number;
}

export const PricesPanelModal: React.FC<PricesPanelModalProps> = ({
  isOpen,
  onClose,
  categories,
  ticketPrices,
}) => {
  const titleId = useId();
  const dialogRef = useDialogA11y(isOpen, onClose);

  const [ticketsDraft, setTicketsDraft] = useState<TicketPrices>(ticketPrices);
  const [ratesDraft, setRatesDraft] = useState<Record<string, CategoryRateDraft>>({});

  useEffect(() => {
    if (!isOpen) return;
    setTicketsDraft(ticketPrices);
    const nextRates: Record<string, CategoryRateDraft> = {};
    categories.forEach((c) => {
      nextRates[c.id] = {
        cash30m: c.cashRate30m ?? c.defaultRate30m,
        cash60m: c.cashRate60m ?? c.defaultRate60m,
        dig30m: c.digitalRate30m ?? c.defaultRate30m,
        dig60m: c.digitalRate60m ?? c.defaultRate60m,
        penalty10m:
          c.penaltyRate10Min ||
          (c.penaltyRatePerMin ? c.penaltyRatePerMin * 10 : Math.round(c.defaultRate30m / 3)),
      };
    });
    setRatesDraft(nextRates);
  }, [isOpen, categories, ticketPrices]);

  if (!isOpen) return null;

  const adjustTicketPrice = (key: keyof TicketPrices, delta: number) => {
    setTicketsDraft((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateTicketPrices(ticketsDraft);

    Object.entries(ratesDraft).forEach(([catId, vals]) => {
      dataService.updateCategory(catId, {
        defaultRate30m: vals.cash30m,
        defaultRate60m: vals.cash60m,
        cashRate30m: vals.cash30m,
        cashRate60m: vals.cash60m,
        digitalRate30m: vals.dig30m,
        digitalRate60m: vals.dig60m,
        penaltyRate10Min: vals.penalty10m,
        penaltyRatePerMin: Math.round(vals.penalty10m / 10),
      });
    });

    soundService.playSuccess();
    uiFeedback.toast('Precios de todos los productos actualizados.', 'success');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-white border border-black/[0.08] shadow-2xl text-eco-dark focus:outline-none"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 border-b border-black/[0.06] bg-eco-cream/95 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-eco-dark text-eco-gold flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-extrabold text-eco-dark leading-none">
                Panel de Precios
              </h2>
              <p className="text-[11px] text-eco-creamMuted mt-1">
                Editá rápido tickets de parque y tarifas de toda la flota
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar panel de precios"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white hover:bg-eco-surface border border-black/[0.08] text-eco-dark flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveAll} className="p-5 space-y-5">
          {/* SECTION 1: BUNGEE & PALESTRA TICKETS */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <Ticket className="w-4 h-4 text-eco-dark" />
              <h3 className="text-xs font-black uppercase tracking-wider text-eco-dark">
                Tickets de Parque (Impactan en Caja)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { key: 'bungee', label: 'Bungee' },
                { key: 'palestra', label: 'Palestra' },
              ] as const).map(({ key, label }) => (
                <div
                  key={key}
                  className="p-3.5 rounded-2xl bg-eco-surface border border-black/[0.06] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-eco-dark">{label}</span>
                    <span className="text-[11px] font-mono font-bold text-[#166534]">
                      ${ticketsDraft[key].toLocaleString()} c/u
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustTicketPrice(key, -500)}
                      className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-white hover:bg-[#EAE4D3] border border-black/[0.08] text-xs font-black text-eco-dark active:scale-95"
                    >
                      -500
                    </button>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      aria-label={`Precio ticket ${label}`}
                      value={ticketsDraft[key]}
                      onChange={(e) =>
                        setTicketsDraft((prev) => ({
                          ...prev,
                          [key]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="flex-1 min-w-0 min-h-[44px] rounded-xl bg-white border border-black/[0.08] px-3 text-center font-mono text-sm font-black text-eco-dark focus:outline-none focus:border-eco-dark"
                    />
                    <button
                      type="button"
                      onClick={() => adjustTicketPrice(key, 500)}
                      className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-eco-gold hover:bg-[#f0c62d] border border-black/[0.08] text-xs font-black text-eco-dark active:scale-95"
                    >
                      +500
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: FLEET CATEGORIES */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Bike className="w-4 h-4 text-eco-dark" />
              <h3 className="text-xs font-black uppercase tracking-wider text-eco-dark">
                Rodados y Náuticos
              </h3>
            </div>

            {categories.map((cat) => {
              const draft = ratesDraft[cat.id];
              if (!draft) return null;

              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-2xl bg-eco-surface border border-black/[0.06] space-y-2.5"
                >
                  <div className="font-bold text-xs text-eco-dark">{cat.name}</div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-[#166534] block mb-1">
                        Efectivo 30 min ($)
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={draft.cash30m}
                        onChange={(e) =>
                          setRatesDraft((prev) => ({
                            ...prev,
                            [cat.id]: { ...draft, cash30m: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-2 text-xs text-eco-dark font-bold font-mono focus:outline-none focus:border-eco-dark"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#166534] block mb-1">
                        Efectivo 60 min ($)
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={draft.cash60m}
                        onChange={(e) =>
                          setRatesDraft((prev) => ({
                            ...prev,
                            [cat.id]: { ...draft, cash60m: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-2 text-xs text-eco-dark font-bold font-mono focus:outline-none focus:border-eco-dark"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-[#92400E] block mb-1">
                        Digital / Transf. 30 min ($)
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={draft.dig30m}
                        onChange={(e) =>
                          setRatesDraft((prev) => ({
                            ...prev,
                            [cat.id]: { ...draft, dig30m: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-2 text-xs text-eco-dark font-bold font-mono focus:outline-none focus:border-eco-dark"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#92400E] block mb-1">
                        Digital / Transf. 60 min ($)
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={draft.dig60m}
                        onChange={(e) =>
                          setRatesDraft((prev) => ({
                            ...prev,
                            [cat.id]: { ...draft, dig60m: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-2 text-xs text-eco-dark font-bold font-mono focus:outline-none focus:border-eco-dark"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#991B1B] block mb-1">
                      Recargo Mora c/10 min ($)
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={draft.penalty10m}
                      onChange={(e) =>
                        setRatesDraft((prev) => ({
                          ...prev,
                          [cat.id]: { ...draft, penalty10m: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-2 text-xs text-eco-dark font-bold font-mono focus:outline-none focus:border-eco-dark"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] py-3.5 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Check className="w-4 h-4 text-eco-gold" />
            <span>Guardar Todos los Precios</span>
          </button>
        </form>
      </div>
    </div>
  );
};
