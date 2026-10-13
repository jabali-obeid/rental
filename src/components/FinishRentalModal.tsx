import React, { useState, useEffect } from 'react';
import { Rental, Category, Unit, PaymentMethod } from '../types';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
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
  const overdueMinutes = isOverdue ? Math.ceil(Math.abs(diffMs) / 60000) : 0;
  const delayBlocks10m = isOverdue ? Math.max(1, Math.ceil(Math.max(1, overdueMinutes) / 10)) : 0;
  const ratePer10m = category?.penaltyRate10Min || (category?.defaultRate30m ? Math.round(category.defaultRate30m / 3) : 6000);
  const defaultPenalty = isOverdue ? delayBlocks10m * ratePer10m : 0;

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#02110c]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#081d15] border border-[#1a422f] shadow-2xl flex flex-col text-[#f3ebd6]">
        {/* Modal Top Header */}
        <div className="sticky top-0 bg-[#081d15]/95 backdrop-blur-md px-5 py-4 border-b border-[#1a422f] flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-[#02110c] text-[#f3ebd6] font-mono font-bold text-xs border border-[#1a422f]">
                {unit?.codeNumber || 'Unidad'}
              </span>
              <h2 className="text-base font-extrabold text-[#f3ebd6]">Finalizar Alquiler</h2>
            </div>
            <p className="text-xs text-[#d5cbbb] mt-0.5">
              Cliente: <span className="text-[#f3ebd6] font-semibold">{rental.customerName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#d5cbbb] hover:text-[#f3ebd6] hover:bg-[#1a422f] active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* CRITICAL ALERT BANNER: IDENTITY / GUARANTEE DOCUMENT RETURN */}
          <div className="relative overflow-hidden rounded-2xl bg-[#1a422f] border-2 border-[#f3ebd6] p-4 shadow-xl shadow-[#02110c]/80 animate-pulse-fast">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#f3ebd6] text-[#02110c] shrink-0 mt-0.5 font-black">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wide text-[#f3ebd6]">
                  RECORDAR DEVOLVER DOCUMENTO DE IDENTIDAD / GARANTÍA
                </h3>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-[#02110c] text-[#f3ebd6] font-bold border border-[#f3ebd6]/40 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#2ea06e]" />
                    <span>{rental.docType}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#02110c] text-[#f3ebd6] font-mono font-black border border-[#f3ebd6]/60 flex items-center gap-1.5">
                    <span>🗄️ UBICACIÓN:</span>
                    <span className="text-[#f3ebd6] underline underline-offset-2">{rental.docLocker}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Document photo preview if available */}
            {rental.docPhotoUrl && (
              <div className="mt-3 pt-3 border-t border-[#f3ebd6]/20">
                <p className="text-[11px] font-semibold text-[#f3ebd6] mb-1">Foto de garantía registrada:</p>
                <img
                  src={rental.docPhotoUrl}
                  alt="Foto Documento de Garantía"
                  className="w-full max-h-36 object-cover rounded-xl border border-[#f3ebd6]/30 shadow"
                />
              </div>
            )}
          </div>

          {/* Time & Late Surcharge Notice */}
          {isOverdue && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-rose-400" />
                <div>
                  <div className="text-xs font-bold text-rose-300">
                    Demora de {overdueMinutes} min ({delayBlocks10m} {delayBlocks10m === 1 ? 'bloque' : 'bloques'} de 10 min)
                  </div>
                  <div className="text-[11px] text-[#d5cbbb]">
                    Tarifa por cada 10 min: ${ratePer10m.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-rose-400 block font-semibold">Mora sugerida</span>
                <span className="text-base font-extrabold text-white">
                  +${defaultPenalty.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Price Breakdown & Editable Adjustments */}
          <div className="rounded-2xl bg-[#02110c]/80 border border-[#1a422f] p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/70">
              Liquidación del Servicio
            </h4>

            {/* Base Price */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#d5cbbb]">Tarifa base pactada ({rental.durationMinutes} min):</span>
              <span className="font-semibold text-[#f3ebd6]">${rental.basePrice.toLocaleString()}</span>
            </div>

            {/* Penalty adjustment */}
            <div className="flex items-center justify-between gap-3 text-sm">
              <label htmlFor="penalty-input" className="text-rose-400 font-medium flex items-center gap-1">
                <span>Recargo por mora / retraso:</span>
              </label>
              <div className="flex items-center gap-1.5 w-32">
                <span className="text-rose-400 font-bold">$</span>
                <input
                  id="penalty-input"
                  type="number"
                  min="0"
                  step="100"
                  value={penaltyPrice}
                  onChange={(e) => setPenaltyPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-[#081d15] border border-[#1a422f] rounded-lg px-2 py-1 text-right text-white font-bold focus:outline-none focus:border-rose-500 text-sm"
                />
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between gap-3 text-sm">
              <label htmlFor="discount-input" className="text-[#d5cbbb]">Descuento o bonificación:</label>
              <div className="flex items-center gap-1.5 w-32">
                <span className="text-[#d5cbbb] font-bold">-$</span>
                <input
                  id="discount-input"
                  type="number"
                  min="0"
                  step="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-[#081d15] border border-[#1a422f] rounded-lg px-2 py-1 text-right text-[#2ea06e] font-bold focus:outline-none focus:border-[#2ea06e] text-sm"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#1a422f] flex items-baseline justify-between">
              <span className="text-sm font-bold text-[#f3ebd6] uppercase tracking-wider">
                Total a Cobrar:
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-[#2ea06e] font-bold">$</span>
                <span className="text-2xl font-black text-[#f3ebd6] tracking-tight">
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
            <div className="p-3.5 rounded-2xl bg-[#02110c] border border-amber-500/40 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  <span>Método de Pago para la Mora (${penaltyPrice.toLocaleString()})</span>
                </label>
                <span className="text-[10px] text-amber-400/80 font-mono font-bold animate-pulse">A Cobrar</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === 'efectivo'
                      ? 'bg-[#1a422f] border-[#f3ebd6] text-[#f3ebd6] ring-1 ring-[#f3ebd6]'
                      : 'bg-[#081d15] border-[#1a422f] text-[#d5cbbb] hover:text-[#f3ebd6]'
                  }`}
                >
                  <Banknote className="w-5 h-5 mb-1 text-[#2ea06e]" />
                  <span>Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === 'transferencia'
                      ? 'bg-[#1a422f] border-[#f3ebd6] text-[#f3ebd6] ring-1 ring-[#f3ebd6]'
                      : 'bg-[#081d15] border-[#1a422f] text-[#d5cbbb] hover:text-[#f3ebd6]'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mb-1 text-cyan-400" />
                  <span>Transferencia</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === 'tarjeta'
                      ? 'bg-[#1a422f] border-[#f3ebd6] text-[#f3ebd6] ring-1 ring-[#f3ebd6]'
                      : 'bg-[#081d15] border-[#1a422f] text-[#d5cbbb] hover:text-[#f3ebd6]'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1 text-purple-400" />
                  <span>Tarjeta</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Fixed Confirmation */}
        <div className="p-4 bg-[#081d15] border-t border-[#1a422f] sticky bottom-0">
          <button
            onClick={handleConfirmFinish}
            disabled={isSubmitting}
            className="w-full py-4 px-5 rounded-2xl bg-[#f3ebd6] hover:bg-white text-[#02110c] font-black text-sm sm:text-base shadow-xl shadow-[#000000]/50 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>
              {penaltyPrice > 0
                ? `COBRAR MORA ($${penaltyPrice.toLocaleString()}) Y LIBERAR`
                : 'CONFIRMAR DEVOLUCIÓN Y LIBERAR UNIDAD'}
            </span>
            <Sparkles className="w-4 h-4 text-[#02110c]" />
          </button>
        </div>
      </div>
    </div>
  );
};
