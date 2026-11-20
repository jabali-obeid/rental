import React from 'react';
import { DailyClosing } from '../../types';
import { dataService } from '../../services/dataService';
import { History, Clock, UserCheck, Eye, Copy, Share2, Trash2 } from 'lucide-react';

interface ClosingsHistoryTabProps {
  closings: DailyClosing[];
  onSelectClosing: (closing: DailyClosing) => void;
  onCopyReport: (text: string) => void;
  onShareWhatsApp: (text: string) => void;
  onDeleteClosing: (closingId: string, label: string) => void;
  generateReport: (closing: DailyClosing) => string;
}

export const ClosingsHistoryTab: React.FC<ClosingsHistoryTabProps> = ({
  closings,
  onSelectClosing,
  onCopyReport,
  onShareWhatsApp,
  onDeleteClosing,
  generateReport,
}) => {
  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-eco-creamMuted flex items-center gap-2">
          <History className="w-4 h-4 text-eco-dark" />
          <span>Cierres de Caja Guardados ({closings.length})</span>
        </h3>
        <span className="text-[11px] text-eco-creamMuted">Persistidos en la nube Supabase</span>
      </div>

      {closings.length === 0 ? (
        <div className="p-10 text-center rounded-[28px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-eco-surface border border-black/[0.06] flex items-center justify-center mx-auto text-eco-dark">
            <History className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-eco-dark">Sin cierres registrados aún</h4>
          <p className="text-xs text-eco-creamMuted max-w-sm mx-auto">
            Al finalizar la jornada o turno, presiona <strong>&quot;Arqueo y Cerrar Caja&quot;</strong>. Todos los movimientos, cobros y ventas se archivarán de forma permanente aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {closings.map((c) => {
            const dateObj = new Date(c.closedAt);
            const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const closingBreakdown = dataService.getRentalBreakdownByCategory(
              c.movementsSnapshot || [],
              c.rentalsSnapshot || []
            );

            return (
              <div
                key={c.id}
                className="p-5 rounded-[28px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3"
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-black/[0.06]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-eco-gold text-eco-dark">
                        Cierre de Caja
                      </span>
                      <span className="text-xs text-eco-creamMuted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeString} hs
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-eco-dark mt-1 capitalize">
                      {c.dateLabel}
                    </h4>
                    <div className="text-[11px] text-eco-creamMuted flex items-center gap-1.5 mt-0.5">
                      <UserCheck className="w-3 h-3 text-eco-leaf" />
                      <span>Cerrado por: <strong className="text-eco-dark">{c.closedBy}</strong></span>
                      <span>•</span>
                      <span>{c.totalRentals} alquileres completados</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-eco-creamMuted block">Balance Neto</span>
                    <div className="text-lg font-black text-[#166534] font-mono">
                      ${c.balanceNeto.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* RENTAL BREAKDOWN BY CATEGORY */}
                <div className="p-3 rounded-2xl bg-eco-surface border border-black/[0.05] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-eco-creamMuted block tracking-wider">
                    Detalle de Alquileres por Vehículo ({c.totalRentals})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {closingBreakdown.map((item) => (
                      <div
                        key={item.categoryId}
                        className="flex items-center justify-between text-[11px] py-0.5 border-b border-black/[0.04] last:border-b-0"
                      >
                        <span className="text-eco-creamDark truncate pr-2">
                          Alquileres de {item.categoryName}:
                        </span>
                        <span
                          className={`font-mono font-extrabold shrink-0 ${
                            item.count > 0 ? 'text-eco-dark' : 'text-eco-creamMuted/50'
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* METHOD BREAKDOWN PILLS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-2xl bg-eco-surface border border-black/[0.05]">
                    <span className="text-[10px] text-[#166534] block uppercase font-sans font-bold">Efectivo</span>
                    <span className="font-bold text-eco-dark">${c.totalEfectivo.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-eco-surface border border-black/[0.05]">
                    <span className="text-[10px] text-eco-creamDark block uppercase font-sans font-bold">Transferencias</span>
                    <span className="font-bold text-eco-dark">${c.totalTransferencia.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-eco-surface border border-black/[0.05]">
                    <span className="text-[10px] text-eco-creamDark block uppercase font-sans font-bold">Tarjetas</span>
                    <span className="font-bold text-eco-dark">${c.totalTarjeta.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#FEE2E2]/60 border border-[#FCA5A5]">
                    <span className="text-[10px] text-[#991B1B] block uppercase font-sans font-bold">Gastos</span>
                    <span className="font-bold text-[#991B1B]">-${c.totalEgresos.toLocaleString()}</span>
                  </div>
                </div>

                {c.notes && (
                  <div className="p-2.5 rounded-2xl bg-eco-surface border border-black/[0.05] text-xs text-eco-creamDark italic">
                    &quot;{c.notes}&quot;
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectClosing(c)}
                    className="px-3.5 py-2 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-eco-gold" />
                    <span>Ver {c.movementsSnapshot?.length || 0} Movimientos</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onCopyReport(generateReport(c))}
                      className="p-2 rounded-full bg-eco-surface hover:bg-[#EAE4D3] text-eco-dark border border-black/[0.06] transition-all"
                      title="Copiar resumen"
                      aria-label="Copiar resumen"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onShareWhatsApp(generateReport(c))}
                      className="px-3.5 py-1.5 rounded-full bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#166534] border border-[#86EFAC] font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteClosing(c.id, c.dateLabel)}
                      className="p-2 rounded-full bg-eco-surface hover:bg-[#FEE2E2] text-eco-creamMuted hover:text-[#991B1B] border border-black/[0.06] transition-all"
                      title="Eliminar este cierre de caja"
                      aria-label={`Eliminar cierre de caja ${c.dateLabel}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
