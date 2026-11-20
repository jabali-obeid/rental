import React, { useId } from 'react';
import { CashShiftSummary } from '../../types';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { Receipt, Copy, Check, Share2, Lock, ArrowRight, History } from 'lucide-react';

interface ShiftClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  closeStep: 'summary' | 'confirm';
  onChangeStep: (step: 'summary' | 'confirm') => void;
  summary: CashShiftSummary;
  operatorName: string;
  onChangeOperatorName: (name: string) => void;
  closingNotes: string;
  onChangeClosingNotes: (notes: string) => void;
  isProcessing: boolean;
  onConfirmClose: () => void;
  copied: boolean;
  onCopyReport: (text: string) => void;
  onShareWhatsApp: (text: string) => void;
  reportText: string;
}

export const ShiftClosingModal: React.FC<ShiftClosingModalProps> = ({
  isOpen,
  onClose,
  closeStep,
  onChangeStep,
  summary,
  operatorName,
  onChangeOperatorName,
  closingNotes,
  onChangeClosingNotes,
  isProcessing,
  onConfirmClose,
  copied,
  onCopyReport,
  onShareWhatsApp,
  reportText,
}) => {
  const titleId = useId();
  const dialogRef = useDialogA11y(isOpen, onClose);

  if (!isOpen) return null;

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
        className="w-full max-w-md rounded-[28px] bg-white border border-black/[0.08] shadow-2xl p-5 space-y-4 text-eco-dark focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-eco-dark" />
            <h3 id={titleId} className="text-base font-extrabold text-eco-dark">
              {closeStep === 'summary' ? 'Arqueo de Caja Eco Aventura' : 'Confirmar Cierre de Turno'}
            </h3>
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

        {closeStep === 'summary' ? (
          <>
            <div className="rounded-2xl bg-eco-surface p-4 border border-black/[0.06] space-y-2.5 font-mono text-xs">
              <div className="flex justify-between text-eco-creamDark pb-1.5 border-b border-black/[0.06] font-sans">
                <span className="font-bold text-eco-dark">Alquileres Totales:</span>
                <span className="text-[#166534] font-black">{summary.countAlquileres} servicios</span>
              </div>

              <div className="space-y-1 pb-2 border-b border-black/[0.06] font-sans">
                {summary.rentalsByCategory.map((item) => (
                  <div
                    key={item.categoryId}
                    className="flex items-center justify-between text-[11px] text-eco-creamDark"
                  >
                    <span className="truncate pr-2">• Alquileres de {item.categoryName}:</span>
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

              <div className="flex justify-between text-[#166534]">
                <span>Efectivo Físico en Caja:</span>
                <span className="font-bold">${summary.totalEfectivo.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-eco-dark">
                <span>Transferencias Bancarias/MP:</span>
                <span className="font-bold">${summary.totalTransferencia.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-eco-dark">
                <span>Tarjetas / POS:</span>
                <span className="font-bold">${summary.totalTarjeta.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#991B1B] pt-1 border-t border-black/[0.06]">
                <span>Total Egresos / Gastos:</span>
                <span className="font-bold">-${summary.totalEgresos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-eco-dark text-sm font-black pt-2 border-t-2 border-black/[0.08] font-sans">
                <span>BALANCE NETO TOTAL:</span>
                <span className="text-eco-dark">${summary.balanceNeto.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onCopyReport(reportText)}
                className="py-2.5 px-3 rounded-full bg-eco-surface hover:bg-[#EAE4D3] text-eco-dark text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-black/[0.06]"
              >
                {copied ? <Check className="w-4 h-4 text-eco-leaf" /> : <Copy className="w-4 h-4 text-eco-dark" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={() => onShareWhatsApp(reportText)}
                className="py-2.5 px-3 rounded-full bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#166534] border border-[#86EFAC] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onChangeStep('confirm')}
              className="w-full py-3.5 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <Lock className="w-4 h-4 text-eco-gold" />
              <span>CERRAR CAJA Y ARCHIVAR DÍA</span>
              <ArrowRight className="w-4 h-4 text-eco-gold" />
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-eco-dark">
                <History className="w-4 h-4" />
                <span>¿Cerrar el turno y reiniciar caja a $0?</span>
              </div>
              <p className="text-[11px] text-[#92400E] leading-relaxed">
                Se guardará este informe y todos sus movimientos en el <strong>Historial de Cierres</strong>. Las actividades del día se archivarán y la caja iniciará limpia en $0 para el siguiente operador o turno.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-eco-creamDark mb-1">
                  Nombre del Operador que cierra
                </label>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={(e) => onChangeOperatorName(e.target.value)}
                  className="w-full bg-eco-surface border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-eco-dark focus:outline-none focus:border-eco-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-eco-creamDark mb-1">
                  Observaciones / Notas del turno (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Turno completo sin diferencias en efectivo"
                  value={closingNotes}
                  onChange={(e) => onChangeClosingNotes(e.target.value)}
                  className="w-full bg-eco-surface border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-eco-dark focus:outline-none focus:border-eco-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => onChangeStep('summary')}
                className="py-3 rounded-full bg-eco-surface hover:bg-[#EAE4D3] text-eco-creamDark text-xs font-bold border border-black/[0.06]"
              >
                Volver atrás
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={onConfirmClose}
                className="py-3 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-eco-gold" />
                <span>{isProcessing ? 'Guardando...' : 'Confirmar Cierre'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
