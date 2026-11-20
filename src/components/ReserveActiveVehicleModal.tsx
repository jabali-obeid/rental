import React, { useState, useId, useMemo } from 'react';
import { Rental, Category, Unit, PaymentMethod } from '../types';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
import { printThermalTicket } from '../services/printerService';
import { CircularTimePicker } from './CircularTimePicker';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { uiFeedback } from '../services/uiFeedback';
import { BookmarkPlus, Printer, Banknote, Smartphone, CreditCard, X, Check, AlertCircle } from 'lucide-react';

interface Props {
  rental: Rental;
  category?: Category;
  unit?: Unit;
  onClose: () => void;
}

export const ReserveActiveVehicleModal: React.FC<Props> = ({
  rental,
  category,
  unit,
  onClose,
}) => {
  const titleId = useId();
  const customerNameId = useId();
  const customerPhoneId = useId();
  const lockerId = useId();

  const dialogRef = useDialogA11y(true, onClose);

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [guaranteeItem, setGuaranteeItem] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [autoPrint, setAutoPrint] = useState<boolean>(true);

  // Rate calculation
  const suggestedPrice = useMemo(() => {
    if (!category) return 18000;
    const isCash = paymentMethod === 'efectivo';
    const rate30 = isCash
      ? (category.cashRate30m ?? category.defaultRate30m)
      : (category.digitalRate30m ?? category.defaultRate30m);
    const rate60 = isCash
      ? (category.cashRate60m ?? category.defaultRate60m)
      : (category.digitalRate60m ?? category.defaultRate60m);

    if (durationMinutes === 30) return rate30;
    if (durationMinutes === 60) return rate60;
    return Math.round((rate30 / 30) * durationMinutes);
  }, [category, durationMinutes, paymentMethod]);

  const expectedReturnTime = useMemo(() => {
    return new Date(rental.expectedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [rental.expectedEndTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      uiFeedback.toast('Ingresa el nombre del cliente para la reserva.', 'error');
      return;
    }

    const reservation = dataService.createReservation({
      unitId: rental.unitId,
      categoryId: rental.categoryId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      durationMinutes,
      basePrice: suggestedPrice,
      totalPrice: suggestedPrice,
      paymentMethod,
      docType: 'Otro',
      docLocker: guaranteeItem.trim(),
    });

    soundService.playCashRegister();

    // Enviar automáticamente a la comandera
    if (autoPrint) {
      printThermalTicket({
        type: 'RESERVA',
        unitCode: unit?.codeNumber || 'U-00',
        unitName: unit?.name || 'Vehículo',
        categoryName: category?.name || 'Rodado',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        durationMinutes,
        expectedTime: expectedReturnTime,
        docLocker: guaranteeItem.trim(),
        docType: 'Otro',
        totalPrice: suggestedPrice,
        paymentMethod,
        ticketId: reservation.id,
        createdAt: reservation.createdAt,
      });
    }

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-[28px] bg-white border border-black/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-eco-dark focus:outline-none"
      >

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] bg-eco-cream flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-eco-gold flex items-center justify-center text-eco-dark">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 id={titleId} className="text-base font-black text-eco-dark">
                Reservar {unit?.codeNumber || 'Unidad'}
              </h3>
              <p className="text-xs text-eco-creamMuted">
                Turno siguiente al regresar de pista ({expectedReturnTime} hs aprox.)
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-black/[0.08] text-eco-creamMuted hover:text-eco-dark flex items-center justify-center active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">

          {/* Active Status Info Alert */}
          <div className="p-3.5 rounded-2xl bg-eco-surface border border-black/[0.06] flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-eco-creamMuted uppercase font-bold block">En uso actual por:</span>
              <span className="font-extrabold text-eco-dark">{rental.customerName}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#92400E] uppercase font-bold block">Regresa aprox:</span>
              <span className="font-mono font-bold text-eco-dark text-sm">{expectedReturnTime} hs</span>
            </div>
          </div>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={customerNameId} className="block text-xs font-bold text-eco-creamDark mb-1">
                Cliente que reserva *
              </label>
              <input
                id={customerNameId}
                type="text"
                required
                placeholder="Nombre y Apellido"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-eco-surface border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-eco-dark focus:outline-none focus:border-eco-dark"
              />
            </div>

            <div>
              <label htmlFor={customerPhoneId} className="block text-xs font-bold text-eco-creamDark mb-1">
                WhatsApp de contacto (Opcional)
              </label>
              <input
                id={customerPhoneId}
                type="tel"
                placeholder="Ej: 341 555-1234"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-eco-surface border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-eco-dark focus:outline-none focus:border-eco-dark"
              />
            </div>
          </div>

          {/* Simplified Guarantee: what they leave */}
          <div>
            <label htmlFor={lockerId} className="block text-xs font-bold text-eco-creamDark mb-1">
              ¿Qué deja en garantía? *
            </label>
            <input
              id={lockerId}
              type="text"
              required
              placeholder="Ej: DNI, Llaves, Celular..."
              value={guaranteeItem}
              onChange={(e) => setGuaranteeItem(e.target.value)}
              className="w-full bg-eco-surface border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-eco-dark focus:outline-none focus:border-eco-dark"
            />
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-bold text-eco-creamDark mb-1.5">Duración Reservada</label>
            <CircularTimePicker
              value={durationMinutes}
              onChange={setDurationMinutes}
            />
          </div>

          {/* Payment Method (Pago Anticipado) */}
          <div>
            <label className="block text-xs font-bold text-eco-creamDark mb-1">Cobro Anticipado en Caja *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`py-2.5 rounded-full font-bold border flex items-center justify-center gap-1.5 transition-all ${paymentMethod === 'efectivo'
                  ? 'bg-eco-dark text-white border-eco-dark shadow-sm'
                  : 'bg-eco-surface text-eco-creamDark border-black/[0.06]'
                  }`}
              >
                <Banknote className={`w-4 h-4 ${paymentMethod === 'efectivo' ? 'text-eco-gold' : 'text-eco-leaf'}`} />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`py-2.5 rounded-full font-bold border flex items-center justify-center gap-1.5 transition-all ${paymentMethod === 'transferencia'
                  ? 'bg-eco-dark text-white border-eco-dark shadow-sm'
                  : 'bg-eco-surface text-eco-creamDark border-black/[0.06]'
                  }`}
              >
                <Smartphone className={`w-4 h-4 ${paymentMethod === 'transferencia' ? 'text-eco-gold' : 'text-eco-dark'}`} />
                <span>Transfer.</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('tarjeta')}
                className={`py-2.5 rounded-full font-bold border flex items-center justify-center gap-1.5 transition-all ${paymentMethod === 'tarjeta'
                  ? 'bg-eco-dark text-white border-eco-dark shadow-sm'
                  : 'bg-eco-surface text-eco-creamDark border-black/[0.06]'
                  }`}
              >
                <CreditCard className={`w-4 h-4 ${paymentMethod === 'tarjeta' ? 'text-eco-gold' : 'text-eco-dark'}`} />
                <span>Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Ticket Comandera Checkbox */}
          <div className="p-3.5 rounded-2xl bg-eco-surface border border-black/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-eco-dark" />
              <div>
                <span className="font-bold text-eco-dark block">Imprimir Ticket Comandera</span>
                <span className="text-[10px] text-eco-creamMuted">Disparar ticket 58mm para entregar al cliente</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoPrint(!autoPrint)}
              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${autoPrint ? 'bg-eco-gold border-black/15 text-eco-dark' : 'bg-white border-black/15'
                }`}
            >
              {autoPrint && <Check className="w-4 h-4 stroke-[3]" />}
            </button>
          </div>

          {/* Footer Submit CTA */}
          <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-eco-creamMuted uppercase font-bold block">A cobrar ahora:</span>
              <div className="text-xl font-black text-eco-dark font-mono">
                ${suggestedPrice.toLocaleString()}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white font-black text-xs tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <BookmarkPlus className="w-4 h-4 text-eco-gold" />
              <span>COBRAR Y RESERVAR</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
