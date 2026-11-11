import React, { useState, useEffect } from 'react';
import { Rental, Category, Unit, PaymentMethod } from '../types';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
import { calculateRentalPenalty } from '../hooks/useRentalTimer';
import confetti from 'canvas-confetti';
import {
  X,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

interface Props {
  rental: Rental | null;
  category?: Category;
  unit?: Unit;
  isOpen: boolean;
  onClose: () => void;
}

export const FinishRentalModal: React.FC<Props> = ({
  rental,
  category,
  unit,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !rental) return null;

  const now = Date.now();
  const expectedEnd = new Date(rental.expectedEndTime).getTime();
  const diffMs = expectedEnd - now;
  const isOverdue = diffMs < 0;
  const overdueMinutes = isOverdue ? Math.floor(Math.abs(diffMs) / 60000) : 0;
  const { suggestedPenalty: defaultPenalty, penaltyLabel } = isOverdue
    ? calculateRentalPenalty(rental, overdueMinutes, category)
    : { suggestedPenalty: 0, penaltyLabel: '' };

  const [penaltyPrice, setPenaltyPrice] = useState<number>(defaultPenalty);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(rental.paymentMethod || 'efectivo');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setPenaltyPrice(defaultPenalty);
    setDiscount(0);
    setPaymentMethod(rental.paymentMethod || 'efectivo');
  }, [rental, defaultPenalty]);

  const finalTotal = Math.max(0, rental.basePrice + penaltyPrice - discount);

  const handleConfirmFinish = () => {
    setIsSubmitting(true);
    try {
      dataService.finishRental(rental.id, {
        penaltyPrice,
        discount,
        totalFinalPrice: finalTotal,
        paymentMethod,
      });

      soundService.playCashRegister();
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch {
        /* ignore */
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-white border border-black/[0.08] shadow-2xl flex flex-col text-[#1C1C1C]">
        {/* Modal Top Header */}
        <div className="sticky top-0 bg-[#FAF6E8]/95 backdrop-blur-md px-5 py-4 border-b border-black/[0.06] flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1C] text-white font-mono font-bold text-xs">
                {unit?.codeNumber || 'Unidad'}
              </span>
              <h2 className="text-base font-extrabold text-[#1C1C1C]">Finalizar Alquiler</h2>
            </div>
            <p className="text-xs text-[#71706B] mt-0.5">
              Cliente: <span className="text-[#1C1C1C] font-semibold">{rental.customerName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#71706B] hover:text-[#1C1C1C] hover:bg-white active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* CRITICAL ALERT BANNER: IDENTITY / GUARANTEE DOCUMENT RETURN */}
          <div className="relative overflow-hidden rounded-2xl bg-[#F7D147] border border-black/10 p-4 shadow-md">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#1C1C1C] text-[#F7D147] shrink-0 mt-0.5 font-black">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wide text-[#1C1C1C]">
                  RECORDAR DEVOLVER DOCUMENTO DE IDENTIDAD / GARANTÍA
                </h3>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="px-3 py-1 rounded-full bg-white text-[#1C1C1C] font-bold border border-black/10 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#1C1C1C]" />
                    <span>{rental.docType}</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#1C1C1C] text-white font-mono font-black flex items-center gap-1.5">
                    <span>🗄️ UBICACIÓN:</span>
                    <span className="text-[#F7D147] underline underline-offset-2">{rental.docLocker}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Document photo preview if available */}
            {rental.docPhotoUrl && (
              <div className="mt-3 pt-3 border-t border-black/10">
                <p className="text-[11px] font-semibold text-[#1C1C1C] mb-1">Foto de garantía registrada:</p>
                <img
                  src={rental.docPhotoUrl}
                  alt="Foto Documento de Garantía"
                  className="w-full max-h-36 object-cover rounded-xl border border-black/15 shadow"
                />
              </div>
            )}
          </div>

          {/* Time & Late Surcharge Notice */}
          {isOverdue && (
            <div
              className={`rounded-2xl border p-3.5 flex items-center justify-between ${
                defaultPenalty > 0
                  ? 'bg-[#FEE2E2] border-[#FCA5A5]'
                  : 'bg-[#FEF3C7] border-[#FDE68A]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className={`w-5 h-5 ${defaultPenalty > 0 ? 'text-rose-600' : 'text-amber-600'}`} />
                <div>
                  <div className={`text-xs font-bold ${defaultPenalty > 0 ? 'text-[#991B1B]' : 'text-[#92400E]'}`}>
                    Demora de {overdueMinutes} min ({penaltyLabel})
                  </div>
                  <div className="text-[11px] text-[#52514E]">
                    {defaultPenalty > 0
                      ? 'Redondeado a billetes argentinos en circulación'
                      : 'Dentro de los primeros 10 min de flexibilidad sin cargo'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#991B1B] block font-semibold">Mora sugerida</span>
                <span className="text-base font-extrabold text-[#1C1C1C]">
                  +${defaultPenalty.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Price Breakdown & Editable Adjustments */}
          <div className="rounded-2xl bg-[#F6F3EA] border border-black/[0.06] p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#71706B]">
              Liquidación del Servicio
            </h4>

            {/* Base Price */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#52514E]">Tarifa base pactada ({rental.durationMinutes} min):</span>
              <span className="font-semibold text-[#1C1C1C]">${rental.basePrice.toLocaleString()}</span>
            </div>

            {/* Penalty adjustment */}
            <div className="flex items-center justify-between gap-3 text-sm">
              <label htmlFor="penalty-input" className="text-[#991B1B] font-medium flex items-center gap-1">
                <span>Recargo por mora / retraso:</span>
              </label>
              <div className="flex items-center gap-1.5 w-32">
                <span className="text-[#991B1B] font-bold">$</span>
                <input
                  id="penalty-input"
                  type="number"
                  min="0"
                  step="100"
                  value={penaltyPrice}
                  onChange={(e) => setPenaltyPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-1 text-right text-[#1C1C1C] font-bold focus:outline-none focus:border-rose-500 text-sm"
                />
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between gap-3 text-sm">
              <label htmlFor="discount-input" className="text-[#52514E]">Descuento o bonificación:</label>
              <div className="flex items-center gap-1.5 w-32">
                <span className="text-[#52514E] font-bold">-$</span>
                <input
                  id="discount-input"
                  type="number"
                  min="0"
                  step="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-1 text-right text-[#166534] font-bold focus:outline-none focus:border-[#1C1C1C] text-sm"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-black/[0.06] flex items-baseline justify-between">
              <span className="text-sm font-bold text-[#1C1C1C] uppercase tracking-wider">
                Total a Cobrar:
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-[#166534] font-bold">$</span>
                <span className="text-2xl font-black text-[#1C1C1C] tracking-tight">
                  {finalTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Smooth Sliding Payment Method Selector (Only when there is a surcharge / mora) */}
          <div
            className={`transition-all duration-500 ease-out overflow-hidden ${
              penaltyPrice > 0
                ? 'max-h-72 opacity-100 translate-y-0 pt-1 pointer-events-auto'
                : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'
            }`}
          >
            <div className="p-3.5 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#92400E] flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-[#92400E]" />
                  <span>Método de Pago para la Mora (${penaltyPrice.toLocaleString()})</span>
                </label>
                <span className="text-[10px] text-[#92400E] font-mono font-bold animate-pulse">A Cobrar</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === 'efectivo'
                      ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white'
                      : 'bg-white border-black/[0.06] text-[#52514E] hover:text-[#1C1C1C]'
                  }`}
                >
                  <Banknote className={`w-5 h-5 mb-1 ${paymentMethod === 'efectivo' ? 'text-[#F7D147]' : 'text-[#16A34A]'}`} />
                  <span>Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === 'transferencia'
                      ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white'
                      : 'bg-white border-black/[0.06] text-[#52514E] hover:text-[#1C1C1C]'
                  }`}
                >
                  <Smartphone className={`w-5 h-5 mb-1 ${paymentMethod === 'transferencia' ? 'text-[#F7D147]' : 'text-[#1C1C1C]'}`} />
                  <span>Transferencia</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === 'tarjeta'
                      ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white'
                      : 'bg-white border-black/[0.06] text-[#52514E] hover:text-[#1C1C1C]'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mb-1 ${paymentMethod === 'tarjeta' ? 'text-[#F7D147]' : 'text-[#1C1C1C]'}`} />
                  <span>Tarjeta</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Fixed Confirmation */}
        <div className="p-4 bg-[#FAF6E8] border-t border-black/[0.06] sticky bottom-0">
          <button
            onClick={handleConfirmFinish}
            disabled={isSubmitting}
            className="w-full py-4 px-5 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white font-black text-sm sm:text-base shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5] text-[#F7D147]" />
            <span>
              {penaltyPrice > 0
                ? `COBRAR MORA ($${penaltyPrice.toLocaleString()}) Y LIBERAR`
                : 'CONFIRMAR DEVOLUCIÓN Y LIBERAR UNIDAD'}
            </span>
            <Sparkles className="w-4 h-4 text-[#F7D147]" />
          </button>
        </div>
      </div>
    </div>
  );
};
