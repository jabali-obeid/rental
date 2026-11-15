import React, { useState, useId, useMemo, useEffect } from 'react';
import { Unit, PaymentMethod } from '../types';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
import { CategoryIcon } from './CategoryIcon';
import { CircularTimePicker } from './CircularTimePicker';
import {
  X,
  Play,
  User,
  Phone,
  Banknote,
  Smartphone,
  CreditCard,
  ShieldCheck,
  Check
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NewRentalModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const customPriceInputId = useId();
  const customerNameId = useId();
  const customerPhoneId = useId();
  const guaranteeItemId = useId();

  const categories = dataService.getCategories();
  const units = dataService.getUnits();

  // Selected Category
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');

  // Calculate stock per category
  const categoryStock = useMemo(() => {
    const stockMap: Record<string, Unit[]> = {};
    categories.forEach((cat) => {
      stockMap[cat.id] = units.filter((u) => u.categoryId === cat.id && u.status === 'disponible');
    });
    return stockMap;
  }, [categories, units]);

  // Selected Unit
  const availableUnitsForSelected = categoryStock[selectedCategoryId] || [];
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  const activeUnitId = selectedUnitId && availableUnitsForSelected.some(u => u.id === selectedUnitId)
    ? selectedUnitId
    : (availableUnitsForSelected[0]?.id || '');

  // Duration
  const [durationMinutes, setDurationMinutes] = useState<number>(30);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');

  // Price Calculation according to paymentMethod (Cash vs Digital rates)
  const suggestedPrice = useMemo(() => {
    if (!activeCategory) return 3500;
    const isCash = paymentMethod === 'efectivo';
    const rate30 = isCash
      ? (activeCategory.cashRate30m ?? activeCategory.defaultRate30m)
      : (activeCategory.digitalRate30m ?? activeCategory.defaultRate30m);
    const rate60 = isCash
      ? (activeCategory.cashRate60m ?? activeCategory.defaultRate60m)
      : (activeCategory.digitalRate60m ?? activeCategory.defaultRate60m);

    if (durationMinutes === 30) return rate30;
    if (durationMinutes === 60) return rate60;
    return Math.round((rate30 / 30) * durationMinutes);
  }, [activeCategory, durationMinutes, paymentMethod]);

  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const finalPrice = customPrice !== null ? customPrice : suggestedPrice;

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    // Reset custom price so price switches automatically to that method's rate
    setCustomPrice(null);
  };

  // Reset custom price when duration or category changes
  useEffect(() => {
    setCustomPrice(null);
  }, [selectedCategoryId, durationMinutes]);

  // Customer & Guarantee info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [guaranteeItem, setGuaranteeItem] = useState<string>('');

  const handleStartRental = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnitId) {
      alert('Por favor selecciona una unidad disponible');
      return;
    }
    if (!customerName.trim()) {
      alert('Ingresa el nombre del cliente');
      return;
    }
    if (!guaranteeItem.trim()) {
      alert('Indica qué dejó en garantía');
      return;
    }

    const now = new Date();
    const expectedEnd = new Date(now.getTime() + durationMinutes * 60 * 1000);

    dataService.startRental({
      unitId: activeUnitId,
      categoryId: selectedCategoryId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      startTime: now.toISOString(),
      durationMinutes,
      expectedEndTime: expectedEnd.toISOString(),
      docType: 'Otro',
      docLocker: guaranteeItem.trim(),
      basePrice: finalPrice,
      penaltyPrice: 0,
      discount: 0,
      totalPrice: finalPrice,
      paymentMethod,
    });

    soundService.playSuccess();
    onClose();

    setCustomerName('');
    setCustomerPhone('');
    setGuaranteeItem('');
    setCustomPrice(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-white border border-black/[0.08] shadow-2xl flex flex-col text-[#1C1C1C]">
        {/* Header */}
        <div className="sticky top-0 bg-[#FAF6E8]/95 backdrop-blur-md px-5 py-4 border-b border-black/[0.06] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1C1C1C] text-[#F7D147] flex items-center justify-center font-black">
              🌿
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1C1C1C] leading-none">Nuevo Alquiler</h2>
              <p className="text-xs text-[#71706B] mt-0.5">Asignación express Eco Aventura</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#71706B] hover:text-[#1C1C1C] hover:bg-white active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStartRental} className="p-5 space-y-4">
          {/* STEP 1: CATEGORY SELECTOR */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#71706B] block mb-2">
              1. Seleccionar Categoría
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const stock = categoryStock[cat.id]?.length || 0;
                const isSelected = selectedCategoryId === cat.id;
                const hasStock = stock > 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={!hasStock}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setSelectedUnitId('');
                      setCustomPrice(null);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      !hasStock
                        ? 'opacity-40 cursor-not-allowed bg-[#F6F3EA] border-black/[0.05]'
                        : isSelected
                        ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white shadow-lg ring-2 ring-[#F7D147]'
                        : 'bg-[#F6F3EA] border-black/[0.06] hover:bg-[#EAE4D3] text-[#1C1C1C]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-[#F7D147] text-[#1C1C1C]' : 'bg-white border border-black/[0.06] text-[#1C1C1C]'
                        }`}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          hasStock
                            ? isSelected
                              ? 'bg-[#F7D147] text-[#1C1C1C]'
                              : 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
                            : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                        }`}
                      >
                        {hasStock ? `${stock} disp.` : 'Sin Stock'}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className={`text-xs font-extrabold truncate ${isSelected ? 'text-white' : 'text-[#1C1C1C]'}`}>{cat.name}</div>
                      <div className={`text-[10px] flex items-center justify-between gap-1 mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#52514E]'}`}>
                        <span className="font-bold">Ef: ${(cat.cashRate30m ?? cat.defaultRate30m).toLocaleString()}</span>
                        <span className="font-bold">Dig: ${(cat.digitalRate30m ?? cat.defaultRate30m).toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: AVAILABLE UNIT CHIPS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#71706B]">
                2. Unidad Disponible ({availableUnitsForSelected.length})
              </label>
              <span className="text-[11px] text-[#52514E] font-semibold">
                Toca para seleccionar
              </span>
            </div>

            {availableUnitsForSelected.length === 0 ? (
              <div className="p-3 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] text-center text-xs text-[#71706B]">
                No hay unidades disponibles en esta categoría.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableUnitsForSelected.map((u) => {
                  const isUnitSelected = activeUnitId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUnitId(u.id)}
                      className={`px-3.5 py-2 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        isUnitSelected
                          ? 'bg-[#1C1C1C] text-white shadow-md scale-105'
                          : 'bg-[#F6F3EA] text-[#1C1C1C] border border-black/[0.06] hover:bg-[#EAE4D3]'
                      }`}
                    >
                      {isUnitSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#F7D147]" />}
                      <span>{u.codeNumber}</span>
                      <span className="text-[10px] opacity-75 font-sans font-normal truncate max-w-[80px]">
                        ({u.name.split(' ')[0]})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 3: CIRCULAR TIME PICKER WITH 15/30/60 SHORTCUTS */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#71706B] block mb-2">
              3. Duración del Alquiler
            </label>
            <CircularTimePicker
              value={durationMinutes}
              onChange={(minutes) => {
                setDurationMinutes(minutes);
                setCustomPrice(null);
              }}
            />
          </div>

          {/* STEP 4: SIMPLE GUARANTEE (NAME & WHAT THEY LEFT) */}
          <div className="rounded-2xl bg-[#F6F3EA] border border-black/[0.06] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <span>4. Garantía y Cliente</span>
              </span>
              <span className="text-[10px] bg-[#DCFCE7] text-[#166534] px-2 py-0.5 rounded-full font-bold">Requerido</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor={customerNameId} className="text-[11px] font-semibold text-[#52514E] block mb-1">
                  Nombre *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#71706B] absolute left-3 top-2.5" />
                  <input
                    id={customerNameId}
                    type="text"
                    required
                    placeholder="Ej: Marcelo Fernández"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-black/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-[#1C1C1C] placeholder-[#71706B] focus:outline-none focus:border-[#1C1C1C]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={guaranteeItemId} className="text-[11px] font-semibold text-[#52514E] block mb-1">
                  ¿Qué dejó? *
                </label>
                <input
                  id={guaranteeItemId}
                  type="text"
                  required
                  placeholder="Ej: DNI, Llaves, Celular..."
                  value={guaranteeItem}
                  onChange={(e) => setGuaranteeItem(e.target.value)}
                  className="w-full bg-white border border-black/[0.08] rounded-xl px-3 py-2 text-xs font-bold text-[#1C1C1C] placeholder-[#71706B] focus:outline-none focus:border-[#1C1C1C]"
                />
              </div>
            </div>

            <div>
              <label htmlFor={customerPhoneId} className="text-[11px] font-semibold text-[#52514E] block mb-1">
                Teléfono de Contacto (Opcional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#71706B] absolute left-3 top-2.5" />
                <input
                  id={customerPhoneId}
                  type="tel"
                  placeholder="Ej: 11 5566-7788"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-black/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1C1C1C] placeholder-[#71706B] focus:outline-none focus:border-[#1C1C1C]"
                />
              </div>
            </div>
          </div>

          {/* STEP 6: PAYMENT METHOD & TOTAL AMOUNT */}
          <div className="rounded-2xl bg-[#F6F3EA] border border-black/[0.06] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#71706B] block">
                  6. Método de Cobro y Tarifa
                </span>
                <span className="text-[10px] font-bold text-[#166534] flex items-center gap-1 mt-0.5">
                  {paymentMethod === 'efectivo' ? '💵 Tarifa Efectivo aplicada' : '📲 Tarifa Transferencia / Tarjeta aplicada'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#52514E]">Monto:</span>
                <span className="text-xs text-[#1C1C1C] font-bold">$</span>
                <label htmlFor={customPriceInputId} className="sr-only">Monto a cobrar</label>
                <input
                  id={customPriceInputId}
                  type="number"
                  step="100"
                  value={finalPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
                  className="w-24 bg-white border border-black/[0.08] rounded-xl px-2.5 py-1 text-right font-black text-[#1C1C1C] text-sm focus:outline-none focus:border-[#1C1C1C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPaymentMethod('efectivo')}
                className={`py-2.5 px-2 rounded-full text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'efectivo'
                    ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white shadow-sm'
                    : 'bg-white border-black/[0.06] text-[#52514E] hover:text-[#1C1C1C]'
                }`}
              >
                <Banknote className={`w-4 h-4 ${paymentMethod === 'efectivo' ? 'text-[#F7D147]' : 'text-[#16A34A]'}`} />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPaymentMethod('transferencia')}
                className={`py-2.5 px-2 rounded-full text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'transferencia'
                    ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white shadow-sm'
                    : 'bg-white border-black/[0.06] text-[#52514E] hover:text-[#1C1C1C]'
                }`}
              >
                <Smartphone className={`w-4 h-4 ${paymentMethod === 'transferencia' ? 'text-[#F7D147]' : 'text-[#1C1C1C]'}`} />
                <span>Transfer.</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPaymentMethod('tarjeta')}
                className={`py-2.5 px-2 rounded-full text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white shadow-sm'
                    : 'bg-white border-black/[0.06] text-[#52514E] hover:text-[#1C1C1C]'
                }`}
              >
                <CreditCard className={`w-4 h-4 ${paymentMethod === 'tarjeta' ? 'text-[#F7D147]' : 'text-[#1C1C1C]'}`} />
                <span>Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Bottom Sticky Action */}
          <div className="pt-2 space-y-1.5">
            <button
              type="submit"
              disabled={availableUnitsForSelected.length === 0}
              className={`w-full py-4 px-5 rounded-full font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 ${
                availableUnitsForSelected.length === 0
                  ? 'bg-[#F6F3EA] text-[#71706B] border border-black/[0.06] cursor-not-allowed'
                  : 'bg-[#1C1C1C] hover:bg-[#333333] text-white'
              }`}
            >
              <Check className="w-5 h-5 stroke-[3] text-[#F7D147]" />
              <span>COBRAR Y DEJAR LISTO PARA INICIAR ({durationMinutes} MIN)</span>
            </button>
            <p className="text-[11px] text-center text-[#71706B]">
              El reloj quedará pausado en {durationMinutes}:00 hasta que el encargado presione &quot;INICIAR&quot; al entregar la unidad.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
