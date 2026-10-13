import React, { useState, useId, useMemo } from 'react';
import { Rental, Category, Unit, DocType, PaymentMethod } from '../types';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
import { printThermalTicket } from '../services/printerService';
import { BookmarkPlus, Printer, Clock, Banknote, Smartphone, CreditCard, X, Check, AlertCircle } from 'lucide-react';

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
  const customerNameId = useId();
  const customerPhoneId = useId();
  const lockerId = useId();

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [docType, setDocType] = useState<DocType>('DNI');
  const [docLocker, setDocLocker] = useState<string>('Casillero 01');
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
      alert('Ingresa el nombre del cliente para la reserva');
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
      docType,
      docLocker: docLocker.trim(),
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
        docLocker: docLocker.trim(),
        docType,
        totalPrice: suggestedPrice,
        paymentMethod,
        ticketId: reservation.id,
        createdAt: reservation.createdAt,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02110c]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#081d15] border border-[#1a422f] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1a422f] bg-[#02110c]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#f3ebd6]">
                Reservar {unit?.codeNumber || 'Unidad'}
              </h3>
              <p className="text-xs text-[#d5cbbb]/70">
                Turno siguiente al regresar de pista ({expectedReturnTime} hs aprox.)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#02110c] border border-[#1a422f] text-[#d5cbbb] hover:text-white flex items-center justify-center active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Active Status Info Alert */}
          <div className="p-3 rounded-2xl bg-[#02110c] border border-[#1a422f] flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-[#d5cbbb]/60 uppercase font-bold block">En uso actual por:</span>
              <span className="font-extrabold text-[#f3ebd6]">{rental.customerName}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-amber-300 uppercase font-bold block">Regresa aprox:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{expectedReturnTime} hs</span>
            </div>
          </div>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={customerNameId} className="block text-xs font-bold text-[#d5cbbb] mb-1">
                Cliente que reserva *
              </label>
              <input
                id={customerNameId}
                type="text"
                required
                placeholder="Nombre y Apellido"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] focus:outline-none focus:border-[#2ea06e]"
              />
            </div>

            <div>
              <label htmlFor={customerPhoneId} className="block text-xs font-bold text-[#d5cbbb] mb-1">
                WhatsApp de contacto (Opcional)
              </label>
              <input
                id={customerPhoneId}
                type="tel"
                placeholder="Ej: 341 555-1234"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] focus:outline-none focus:border-[#2ea06e]"
              />
            </div>
          </div>

          {/* Guarantee Locker & Document */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={lockerId} className="block text-xs font-bold text-[#d5cbbb] mb-1">
                Casillero de Garantía
              </label>
              <select
                id={lockerId}
                value={docLocker}
                onChange={(e) => setDocLocker(e.target.value)}
                className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] focus:outline-none focus:border-[#2ea06e]"
              >
                {Array.from({ length: 24 }, (_, i) => `Casillero ${String(i + 1).padStart(2, '0')}`).map((loc) => (
                  <option key={loc} value={loc} className="bg-[#081d15] text-[#f3ebd6]">
                    🗄️ {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#d5cbbb] mb-1">Tipo de Documento</label>
              <div className="flex gap-1">
                {(['DNI', 'Licencia', 'Llaves', 'Otro'] as DocType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocType(t)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                      docType === t
                        ? 'bg-[#1a422f] text-[#f3ebd6] border-[#2ea06e]'
                        : 'bg-[#02110c] text-[#d5cbbb]/60 border-[#1a422f]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-bold text-[#d5cbbb] mb-1">Duración Reservada</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDurationMinutes(30)}
                className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  durationMinutes === 30
                    ? 'bg-[#1a422f] text-[#f3ebd6] border-[#2ea06e]'
                    : 'bg-[#02110c] text-[#d5cbbb]/60 border-[#1a422f]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>30 Minutos</span>
              </button>
              <button
                type="button"
                onClick={() => setDurationMinutes(60)}
                className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  durationMinutes === 60
                    ? 'bg-[#1a422f] text-[#f3ebd6] border-[#2ea06e]'
                    : 'bg-[#02110c] text-[#d5cbbb]/60 border-[#1a422f]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>1 Hora (60m)</span>
              </button>
            </div>
          </div>

          {/* Payment Method (Pago Anticipado) */}
          <div>
            <label className="block text-xs font-bold text-[#d5cbbb] mb-1">Cobro Anticipado en Caja *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'efectivo'
                    ? 'bg-[#1a422f] text-[#f3ebd6] border-[#2ea06e] shadow'
                    : 'bg-[#02110c] text-[#d5cbbb]/60 border-[#1a422f]'
                }`}
              >
                <Banknote className="w-4 h-4 text-[#2ea06e]" />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'transferencia'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400 shadow'
                    : 'bg-[#02110c] text-[#d5cbbb]/60 border-[#1a422f]'
                }`}
              >
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Transfer.</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('tarjeta')}
                className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-purple-950/80 text-purple-300 border-purple-400 shadow'
                    : 'bg-[#02110c] text-[#d5cbbb]/60 border-[#1a422f]'
                }`}
              >
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span>Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Ticket Comandera Checkbox */}
          <div className="p-3 rounded-2xl bg-[#02110c] border border-[#1a422f] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#2ea06e]" />
              <div>
                <span className="font-bold text-[#f3ebd6] block">Imprimir Ticket Comandera</span>
                <span className="text-[10px] text-[#d5cbbb]/60">Disparar ticket 58mm para entregar al cliente</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoPrint(!autoPrint)}
              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                autoPrint ? 'bg-[#2ea06e] border-[#2ea06e] text-[#02110c]' : 'bg-[#081d15] border-[#1a422f]'
              }`}
            >
              {autoPrint && <Check className="w-4 h-4 stroke-[3]" />}
            </button>
          </div>

          {/* Footer Submit CTA */}
          <div className="pt-2 border-t border-[#1a422f] flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-[#d5cbbb]/60 uppercase font-bold block">A cobrar ahora:</span>
              <div className="text-xl font-black text-[#2ea06e] font-mono">
                ${suggestedPrice.toLocaleString()}
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>COBRAR Y RESERVAR</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
