import React, { useState, useId, useMemo, useEffect } from 'react';
import { Unit, DocType, PaymentMethod } from '../types';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
import { CategoryIcon } from './CategoryIcon';
import {
  X,
  Camera,
  Play,
  User,
  Phone,
  Banknote,
  Smartphone,
  CreditCard,
  ShieldCheck,
  Check,
  Trash2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NewRentalModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const durationInputId = useId();
  const cameraInputId = useId();
  const customPriceInputId = useId();
  const customerNameId = useId();
  const customerPhoneId = useId();
  const docLockerId = useId();

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
  const [durationMode, setDurationMode] = useState<'30' | '60' | 'custom'>('30');
  const [customMinutes, setCustomMinutes] = useState<number>(45);

  const durationMinutes = durationMode === '30' ? 30 : durationMode === '60' ? 60 : customMinutes;

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
  }, [selectedCategoryId, durationMode]);

  // Customer info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Warranty & Document retention
  const [docType, setDocType] = useState<DocType>('DNI');
  const [docLocker, setDocLocker] = useState<string>('Casillero 01');
  const [docPhotoUrl, setDocPhotoUrl] = useState<string>('');

  // Handle Photo Capture
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setDocPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (!docLocker.trim()) {
      alert('Indica el casillero o ubicación de la garantía retenida');
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
      docType,
      docLocker: docLocker.trim(),
      docPhotoUrl: docPhotoUrl || undefined,
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
    setDocPhotoUrl('');
    setCustomPrice(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#02110c]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#081d15] border border-[#1a422f] shadow-2xl flex flex-col text-[#f3ebd6]">
        {/* Header */}
        <div className="sticky top-0 bg-[#081d15]/95 backdrop-blur-md px-5 py-4 border-b border-[#1a422f] flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1a422f] text-[#f3ebd6] flex items-center justify-center font-black">
              🌿
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#f3ebd6] leading-none">Nuevo Alquiler</h2>
              <p className="text-xs text-[#d5cbbb] mt-0.5">Asignación express Eco Aventura</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#d5cbbb] hover:text-[#f3ebd6] hover:bg-[#1a422f] active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStartRental} className="p-5 space-y-4">
          {/* STEP 1: CATEGORY SELECTOR */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/80 block mb-2">
              1. Seleccionar Categoría
            </label>
            <div className="grid grid-cols-2 gap-2">
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
                        ? 'opacity-35 cursor-not-allowed bg-[#02110c] border-[#1a422f]/40'
                        : isSelected
                        ? 'bg-[#1a422f] border-[#f3ebd6] shadow-xl shadow-[#02110c]/80 ring-1 ring-[#f3ebd6]'
                        : 'bg-[#02110c]/70 border-[#1a422f] hover:bg-[#02110c]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#081d15] border border-[#1a422f]"
                        style={{ color: '#f3ebd6' }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4 text-[#2ea06e]" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hasStock
                            ? 'bg-[#02110c] text-[#f3ebd6] border border-[#2ea06e]/50'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-600/40'
                        }`}
                      >
                        {hasStock ? `${stock} disp.` : 'Sin Stock'}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="text-xs font-extrabold text-[#f3ebd6] truncate">{cat.name}</div>
                      <div className="text-[10px] text-[#d5cbbb] flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[#2ea06e] font-bold">Ef: ${(cat.cashRate30m ?? cat.defaultRate30m).toLocaleString()}</span>
                        <span className="text-cyan-400 font-bold">Dig: ${(cat.digitalRate30m ?? cat.defaultRate30m).toLocaleString()}</span>
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
              <label className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/80">
                2. Unidad Disponible ({availableUnitsForSelected.length})
              </label>
              <span className="text-[11px] text-[#f3ebd6] font-semibold">
                Toca para seleccionar
              </span>
            </div>

            {availableUnitsForSelected.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#02110c] border border-[#1a422f] text-center text-xs text-[#d5cbbb]/60">
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
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        isUnitSelected
                          ? 'bg-[#f3ebd6] text-[#02110c] shadow-lg shadow-[#000000]/40 scale-105'
                          : 'bg-[#02110c] text-[#f3ebd6] border border-[#1a422f] hover:border-[#f3ebd6]/60'
                      }`}
                    >
                      {isUnitSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
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

          {/* STEP 3: PREDEFINED DURATION BUTTONS */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/80 block mb-2">
              3. Duración del Alquiler
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDurationMode('30');
                  setCustomPrice(null);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  durationMode === '30'
                    ? 'bg-[#1a422f] border-[#f3ebd6] text-[#f3ebd6] ring-1 ring-[#f3ebd6]'
                    : 'bg-[#02110c] border-[#1a422f] text-[#d5cbbb] hover:text-[#f3ebd6]'
                }`}
              >
                30 minutos
              </button>

              <button
                type="button"
                onClick={() => {
                  setDurationMode('60');
                  setCustomPrice(null);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  durationMode === '60'
                    ? 'bg-[#1a422f] border-[#f3ebd6] text-[#f3ebd6] ring-1 ring-[#f3ebd6]'
                    : 'bg-[#02110c] border-[#1a422f] text-[#d5cbbb] hover:text-[#f3ebd6]'
                }`}
              >
                1 hora
              </button>

              <button
                type="button"
                onClick={() => setDurationMode('custom')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  durationMode === 'custom'
                    ? 'bg-[#1a422f] border-[#f3ebd6] text-[#f3ebd6] ring-1 ring-[#f3ebd6]'
                    : 'bg-[#02110c] border-[#1a422f] text-[#d5cbbb] hover:text-[#f3ebd6]'
                }`}
              >
                Personalizado
              </button>
            </div>

            {durationMode === 'custom' && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#02110c] border border-[#1a422f] flex items-center justify-between gap-3">
                <label htmlFor={durationInputId} className="text-xs text-[#d5cbbb]">Minutos totales:</label>
                <div className="flex items-center gap-2">
                  <input
                    id={durationInputId}
                    type="number"
                    min="10"
                    max="300"
                    step="5"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(5, Number(e.target.value) || 30))}
                    className="w-20 bg-[#081d15] border border-[#1a422f] rounded-lg px-2 py-1 text-center font-bold text-[#f3ebd6] text-sm"
                  />
                  <span className="text-xs text-[#d5cbbb]">min</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: GUARANTEE & IDENTITY DOCUMENT REGISTRATION */}
          <div className="rounded-2xl bg-[#0d281e] border border-[#1a422f] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#f3ebd6] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2ea06e]" />
                <span>4. Retención de Garantía / Documento</span>
              </span>
              <span className="text-[10px] text-[#2ea06e] font-bold">Requerido</span>
            </div>

            {/* Doc Type pills */}
            <div className="flex flex-wrap gap-1.5">
              {(['DNI', 'Licencia', 'Pasaporte', 'Cédula', 'Otro'] as DocType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDocType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    docType === type
                      ? 'bg-[#f3ebd6] text-[#02110c] shadow'
                      : 'bg-[#02110c] text-[#d5cbbb] border border-[#1a422f] hover:border-[#f3ebd6]/40'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Physical Locker & Photo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label htmlFor={docLockerId} className="text-[11px] text-[#d5cbbb] block mb-1">
                  Casillero / Gaveta física:
                </label>
                <input
                  id={docLockerId}
                  type="text"
                  required
                  placeholder="Ej: Casillero 04, Sobre 2"
                  value={docLocker}
                  onChange={(e) => setDocLocker(e.target.value)}
                  className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs font-bold text-[#f3ebd6] placeholder-[#d5cbbb]/40 focus:outline-none focus:border-[#f3ebd6]"
                />
                <div className="flex gap-1 mt-1.5 overflow-x-auto pb-1">
                  {['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06', 'C-07', 'C-08'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setDocLocker(`Casillero ${code.replace('C-', '')}`)}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-[#02110c] text-[#d5cbbb] border border-[#1a422f] hover:bg-[#1a422f] shrink-0"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Camera photo capture */}
              <div>
                <label className="text-[11px] text-[#d5cbbb] block mb-1">
                  Foto rápida de garantía (opcional):
                </label>
                {docPhotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#1a422f]">
                    <img src={docPhotoUrl} alt="Foto Doc" className="w-full h-16 object-cover" />
                    <button
                      type="button"
                      onClick={() => setDocPhotoUrl('')}
                      className="absolute top-1 right-1 p-1 rounded-full bg-[#02110c] text-rose-400 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor={cameraInputId} className="w-full h-16 rounded-xl border border-dashed border-[#1a422f] bg-[#02110c]/70 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[#02110c] text-[#d5cbbb]">
                    <Camera className="w-4 h-4 text-[#f3ebd6]" />
                    <span className="text-[10px] font-semibold text-[#f3ebd6]">Tocar para tomar foto</span>
                    <input
                      id={cameraInputId}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* STEP 5: CUSTOMER INFORMATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor={customerNameId} className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/80 block mb-1">
                5. Nombre del Cliente *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#d5cbbb]/50 absolute left-3 top-3" />
                <input
                  id={customerNameId}
                  type="text"
                  required
                  placeholder="Ej: Marcelo Fernández"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#f3ebd6] placeholder-[#d5cbbb]/40 focus:outline-none focus:border-[#f3ebd6]"
                />
              </div>
            </div>

            <div>
              <label htmlFor={customerPhoneId} className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/80 block mb-1">
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#d5cbbb]/50 absolute left-3 top-3" />
                <input
                  id={customerPhoneId}
                  type="tel"
                  placeholder="Ej: 11 5566-7788"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#f3ebd6] placeholder-[#d5cbbb]/40 focus:outline-none focus:border-[#f3ebd6]"
                />
              </div>
            </div>
          </div>

          {/* STEP 6: PAYMENT METHOD & TOTAL AMOUNT */}
          <div className="rounded-2xl bg-[#02110c]/80 border border-[#1a422f] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/80 block">
                  6. Método de Cobro y Tarifa
                </span>
                <span className="text-[10px] font-semibold text-[#2ea06e] flex items-center gap-1 mt-0.5">
                  {paymentMethod === 'efectivo' ? '💵 Tarifa Efectivo aplicada' : '📲 Tarifa Transferencia / Tarjeta aplicada'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#d5cbbb]">Monto:</span>
                <span className="text-xs text-[#2ea06e] font-bold">$</span>
                <label htmlFor={customPriceInputId} className="sr-only">Monto a cobrar</label>
                <input
                  id={customPriceInputId}
                  type="number"
                  step="100"
                  value={finalPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
                  className="w-24 bg-[#081d15] border border-[#1a422f] rounded-lg px-2 py-0.5 text-right font-black text-[#f3ebd6] text-sm focus:outline-none focus:border-[#f3ebd6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPaymentMethod('efectivo')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'efectivo'
                    ? 'bg-[#1a422f] border-[#f3ebd6] text-[#f3ebd6] ring-1 ring-[#f3ebd6]'
                    : 'bg-[#081d15] border-[#1a422f] text-[#d5cbbb] hover:text-[#f3ebd6]'
                }`}
              >
                <Banknote className="w-4 h-4 text-[#2ea06e]" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPaymentMethod('transferencia')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'transferencia'
                    ? 'bg-[#1a422f] border-[#f3ebd6] text-[#f3ebd6] ring-1 ring-[#f3ebd6]'
                    : 'bg-[#081d15] border-[#1a422f] text-[#d5cbbb] hover:text-[#f3ebd6]'
                }`}
              >
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Transfer.</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPaymentMethod('tarjeta')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-[#1a422f] border-[#f3ebd6] text-[#f3ebd6] ring-1 ring-[#f3ebd6]'
                    : 'bg-[#081d15] border-[#1a422f] text-[#d5cbbb] hover:text-[#f3ebd6]'
                }`}
              >
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span>Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Bottom Sticky Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={availableUnitsForSelected.length === 0}
              className={`w-full py-4 px-5 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98 ${
                availableUnitsForSelected.length === 0
                  ? 'bg-[#081d15] text-[#d5cbbb]/40 border border-[#1a422f] cursor-not-allowed'
                  : 'bg-[#f3ebd6] hover:bg-white text-[#02110c] shadow-[#000000]/50'
              }`}
            >
              <Play className="w-5 h-5 fill-current stroke-none text-[#02110c]" />
              <span>INICIAR ALQUILER ({durationMinutes} MIN)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
