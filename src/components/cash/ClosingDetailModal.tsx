import React, { useId } from 'react';
import { CashMovement, DailyClosing } from '../../types';
import { dataService } from '../../services/dataService';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { FileSpreadsheet, Trash2, Copy, Share2 } from 'lucide-react';

interface ClosingDetailModalProps {
  closing: DailyClosing | null;
  onClose: () => void;
  onDeleteArchivedMovement: (mv: CashMovement, index: number) => void;
  onCopyReport: (text: string) => void;
  onShareWhatsApp: (text: string) => void;
  generateReport: (closing: DailyClosing) => string;
}

export const ClosingDetailModal: React.FC<ClosingDetailModalProps> = ({
  closing,
  onClose,
  onDeleteArchivedMovement,
  onCopyReport,
  onShareWhatsApp,
  generateReport,
}) => {
  const titleId = useId();
  const dialogRef = useDialogA11y(Boolean(closing), onClose);

  if (!closing) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-[28px] bg-white border border-black/[0.08] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-eco-dark focus:outline-none"
      >
        {/* Header */}
        <div className="p-4 border-b border-black/[0.06] bg-eco-cream flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-eco-dark" />
            <div>
              <h3 id={titleId} className="text-sm font-extrabold text-eco-dark">
                Detalle de Cierre - {closing.dateLabel}
              </h3>
              <p className="text-[11px] text-eco-creamMuted">
                Operador: {closing.closedBy} • Balance: ${closing.balanceNeto.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="text-eco-creamMuted hover:text-eco-dark p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-2xl bg-eco-surface border border-black/[0.05] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#166534] font-sans font-bold block">EFECTIVO</span>
              <span className="text-eco-dark font-bold">${closing.totalEfectivo.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-eco-creamDark font-sans font-bold block">TRANSFERENCIAS</span>
              <span className="text-eco-dark font-bold">${closing.totalTransferencia.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-eco-creamDark font-sans font-bold block">TARJETAS</span>
              <span className="text-eco-dark font-bold">${closing.totalTarjeta.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#991B1B] font-sans font-bold block">GASTOS</span>
              <span className="text-[#991B1B] font-bold">-${closing.totalEgresos.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-eco-surface border border-black/[0.05] space-y-2">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-1.5">
              <span className="text-xs font-extrabold text-eco-dark">
                Alquileres Discriminados por Vehículo
              </span>
              <span className="text-xs font-black text-[#166534]">
                Total: {closing.totalRentals}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {dataService
                .getRentalBreakdownByCategory(
                  closing.movementsSnapshot || [],
                  closing.rentalsSnapshot || []
                )
                .map((item) => (
                  <div
                    key={item.categoryId}
                    className="flex items-center justify-between text-[11px] py-0.5"
                  >
                    <span className="text-eco-creamDark truncate pr-2">
                      Alquileres de {item.categoryName}:
                    </span>
                    <span
                      className={`font-mono font-extrabold shrink-0 ${
                        item.count > 0 ? 'text-eco-dark' : 'text-eco-creamMuted/40'
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-eco-creamMuted">
              Movimientos Archivados ({closing.movementsSnapshot?.length || 0})
            </h4>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {closing.movementsSnapshot?.map((mv, idx) => {
                const isIngreso = mv.type.startsWith('ingreso');
                const timeStr = new Date(mv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={mv.id || idx}
                    className="p-2.5 rounded-xl bg-eco-surface border border-black/[0.05] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-eco-dark">{mv.description}</div>
                      <div className="text-[10px] text-eco-creamMuted flex items-center gap-1.5">
                        <span>{timeStr}</span>
                        <span>•</span>
                        <span className="uppercase">{mv.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`font-mono font-bold ${isIngreso ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
                        {isIngreso ? '+' : '-'}${mv.amount.toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteArchivedMovement(mv, idx)}
                        className="p-1 rounded-full text-eco-creamMuted hover:text-[#991B1B] hover:bg-[#FEE2E2] transition-colors"
                        title="Eliminar movimiento del cierre archivado"
                        aria-label={`Eliminar ${mv.description}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-black/[0.06] bg-eco-cream flex items-center justify-between">
          <button
            type="button"
            onClick={() => onCopyReport(generateReport(closing))}
            className="px-4 py-2 rounded-full bg-white text-eco-dark border border-black/[0.08] text-xs font-bold flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Reporte</span>
          </button>

          <button
            type="button"
            onClick={() => onShareWhatsApp(generateReport(closing))}
            className="px-4 py-2 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white font-black text-xs flex items-center gap-1.5 shadow"
          >
            <Share2 className="w-3.5 h-3.5 text-eco-gold" />
            <span>Compartir por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
