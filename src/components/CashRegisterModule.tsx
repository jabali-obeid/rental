import React, { useState, useId } from 'react';
import { CashMovement, PaymentMethod, DailyClosing } from '../types';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
import {
  Banknote,
  Smartphone,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Receipt,
  PlusCircle,
  Copy,
  Check,
  Share2,
  History,
  Lock,
  Calendar,
  UserCheck,
  Clock,
  ArrowRight,
  Eye,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';

interface Props {
  movements: CashMovement[];
}

export const CashRegisterModule: React.FC<Props> = ({ movements }) => {
  const expenseAmountId = useId();
  const expenseDescId = useId();

  // Sub-tabs: Today's active cash vs historical closings
  const [subTab, setSubTab] = useState<'today' | 'history'>('today');

  const [filterType, setFilterType] = useState<'all' | 'ingresos' | 'egresos'>('all');
  const [isShiftClosingOpen, setIsShiftClosingOpen] = useState<boolean>(false);
  const [closeStep, setCloseStep] = useState<'summary' | 'confirm'>('summary');
  const [operatorName, setOperatorName] = useState<string>('Operador Eco Aventura');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [isProcessingClose, setIsProcessingClose] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Historical closing detail modal
  const [selectedClosing, setSelectedClosing] = useState<DailyClosing | null>(null);

  // New Expense form
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('Combustible');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<PaymentMethod>('efectivo');

  const summary = dataService.getCashShiftSummary();
  const closings = dataService.getDailyClosings();

  const handleRegisterExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Ingresa un monto válido para el egreso');
      return;
    }
    if (!expenseDesc.trim()) {
      alert('Ingresa una descripción para el egreso');
      return;
    }

    dataService.addCashMovement({
      type: 'egreso_gasto',
      category: expenseCategory,
      amount: amountNum,
      paymentMethod: expensePaymentMethod,
      description: expenseDesc.trim(),
      registeredBy: 'Operador',
    });

    soundService.playSuccess();
    setExpenseDesc('');
    setExpenseAmount('');
  };

  const handleDeleteMovement = async (mv: CashMovement) => {
    const isIngreso = mv.type.startsWith('ingreso');
    const signo = isIngreso ? '+' : '-';
    const confirmMsg = `¿Deseas eliminar este movimiento de caja?\n\n"${mv.description}" (${signo}$${mv.amount.toLocaleString()})\n\nPor favor, ingresa el motivo de la anulación (o presiona Aceptar para continuar):`;
    const reason = window.prompt(confirmMsg, 'Error de registro');
    if (reason === null) return; // Usuario canceló

    try {
      await dataService.deleteCashMovement(mv.id);
      soundService.playSuccess();
    } catch (err) {
      console.error(err);
      alert('Error al intentar eliminar el movimiento');
    }
  };

  const handleCyclePaymentMethod = async (mv: CashMovement) => {
    const methods: PaymentMethod[] = ['efectivo', 'transferencia', 'tarjeta'];
    const currentIdx = methods.indexOf(mv.paymentMethod);
    const nextMethod = methods[(currentIdx + 1) % methods.length];

    try {
      await dataService.updateCashMovementPaymentMethod(mv.id, nextMethod);
      soundService.playSuccess();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el método de pago');
    }
  };


  const handleDeleteClosing = async (closingId: string, label: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el cierre de caja "${label}"?`)) {
      return;
    }
    try {
      await dataService.deleteDailyClosing(closingId);
      soundService.playSuccess();
      if (selectedClosing?.id === closingId) {
        setSelectedClosing(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el cierre');
    }
  };

  const handleDeleteArchivedMovement = async (mv: CashMovement, index: number) => {
    if (!selectedClosing) return;
    const isIngreso = mv.type.startsWith('ingreso');
    const signo = isIngreso ? '+' : '-';
    const confirmMsg = `¿Deseas eliminar este movimiento archivado del cierre?\n\n"${mv.description}" (${signo}$${mv.amount.toLocaleString()})\n\nSe recalcularán los totales archivados de este cierre.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const movementIdOrIndex = mv.id || String(index);
      const updated = await dataService.deleteMovementFromClosing(selectedClosing.id, movementIdOrIndex);
      if (updated) {
        setSelectedClosing(updated);
      }
      soundService.playSuccess();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el movimiento archivado');
    }
  };

  const handleConfirmCloseCash = async () => {
    setIsProcessingClose(true);
    try {
      const closed = await dataService.closeDailyCash(operatorName.trim(), closingNotes.trim());
      soundService.playCashRegister();
      setIsShiftClosingOpen(false);
      setCloseStep('summary');
      setClosingNotes('');
      // Switch to history tab to show the recorded closing
      setSubTab('history');
      setSelectedClosing(closed);
    } catch (e) {
      alert('Error al cerrar la caja');
      console.error(e);
    } finally {
      setIsProcessingClose(false);
    }
  };

  const filteredMovements = movements.filter((m) => {
    if (filterType === 'ingresos') {
      return m.type.startsWith('ingreso');
    }
    if (filterType === 'egresos') {
      return m.type.startsWith('egreso');
    }
    return true;
  });

  const generateWhatsAppReport = () => {
    const today = new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const categoryLines = summary.rentalsByCategory
      .map((item) => `   • Alquileres de ${item.categoryName}: *${item.count}*`)
      .join('\n');

    return (
      `*🌿 ECO AVENTURA - CIERRE DE CAJA / ARQUEO DIARIO*\n` +
      `📅 Fecha: ${today}\n` +
      `---------------------------------\n` +
      `🛵 Alquileres Realizados: *${summary.countAlquileres}*\n` +
      (categoryLines ? `${categoryLines}\n---------------------------------\n` : '') +
      `💵 *Efectivo en Caja:* $${summary.totalEfectivo.toLocaleString()}\n` +
      `📲 *Transferencias:* $${summary.totalTransferencia.toLocaleString()}\n` +
      `💳 *Tarjetas:* $${summary.totalTarjeta.toLocaleString()}\n` +
      `---------------------------------\n` +
      `📈 *Total Ingresos:* $${summary.totalIngresos.toLocaleString()}\n` +
      `📉 *Total Egresos/Gastos:* $${summary.totalEgresos.toLocaleString()}\n` +
      `💰 *BALANCE NETO:* $${summary.balanceNeto.toLocaleString()}\n` +
      `---------------------------------\n` +
      `_Reporte generado automáticamente desde Eco Aventura PWA_`
    );
  };

  const generateHistoricWhatsAppReport = (item: DailyClosing) => {
    const historicBreakdown = dataService.getRentalBreakdownByCategory(
      item.movementsSnapshot || [],
      item.rentalsSnapshot || []
    );
    const categoryLines = historicBreakdown
      .map((b) => `   • Alquileres de ${b.categoryName}: *${b.count}*`)
      .join('\n');

    return (
      `*🌿 ECO AVENTURA - REPORTE DE CIERRE HISTÓRICO*\n` +
      `📅 Fecha: ${item.dateLabel}\n` +
      `👤 Operador: ${item.closedBy}\n` +
      `---------------------------------\n` +
      `🛵 Alquileres Totales: *${item.totalRentals}*\n` +
      (categoryLines ? `${categoryLines}\n---------------------------------\n` : '') +
      `💵 Efectivo: $${item.totalEfectivo.toLocaleString()}\n` +
      `📲 Transferencias: $${item.totalTransferencia.toLocaleString()}\n` +
      `💳 Tarjetas: $${item.totalTarjeta.toLocaleString()}\n` +
      `---------------------------------\n` +
      `📈 Ingresos: $${item.totalIngresos.toLocaleString()}\n` +
      `📉 Gastos: $${item.totalEgresos.toLocaleString()}\n` +
      `💰 *BALANCE NETO:* $${item.balanceNeto.toLocaleString()}\n` +
      (item.notes ? `📝 Notas: ${item.notes}\n` : '') +
      `---------------------------------\n` +
      `_Eco Aventura - Sistema en la Nube_`
    );
  };

  const handleCopyReport = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = (text: string) => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-24 text-[#1C1C1C]">
      {/* MODULE HEADER & SUB-TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-[24px] bg-white/95 border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSubTab('today')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              subTab === 'today'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'text-[#52514E] hover:text-[#1C1C1C] hover:bg-[#F6F3EA]'
            }`}
          >
            <Banknote className={`w-4 h-4 ${subTab === 'today' ? 'text-[#F7D147]' : 'text-[#1C1C1C]'}`} />
            <span>Caja del Día Actual</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              subTab === 'today' ? 'bg-[#F7D147] text-[#1C1C1C]' : 'bg-[#F6F3EA] text-[#1C1C1C]'
            }`}>
              ${summary.balanceNeto.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              subTab === 'history'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'text-[#52514E] hover:text-[#1C1C1C] hover:bg-[#F6F3EA]'
            }`}
          >
            <History className={`w-4 h-4 ${subTab === 'history' ? 'text-[#F7D147]' : 'text-[#52514E]'}`} />
            <span>Historial de Cierres</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              subTab === 'history' ? 'bg-[#F7D147] text-[#1C1C1C]' : 'bg-[#F6F3EA] text-[#52514E]'
            }`}>
              {closings.length}
            </span>
          </button>
        </div>

        {subTab === 'today' && (
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={() => {
                setCloseStep('summary');
                setIsShiftClosingOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#F7D147] hover:bg-[#f0c62d] text-[#1C1C1C] font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Arqueo y Cerrar Caja</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: TODAY'S ACTIVE CASH REGISTER */}
      {subTab === 'today' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* BALANCES CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Efectivo en mano */}
            <div className="p-4 rounded-[24px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#71706B] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">Efectivo</span>
                <Banknote className="w-4 h-4 text-[#16A34A]" />
              </div>
              <div className="text-xl font-black text-[#1C1C1C] tracking-tight">
                ${summary.totalEfectivo.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#71706B] mt-1">Caja física disponible</div>
            </div>

            {/* Transferencias */}
            <div className="p-4 rounded-[24px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#71706B] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C]">Transfer.</span>
                <Smartphone className="w-4 h-4 text-[#1C1C1C]" />
              </div>
              <div className="text-xl font-black text-[#1C1C1C] tracking-tight">
                ${summary.totalTransferencia.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#71706B] mt-1">Bancos / MP</div>
            </div>

            {/* Tarjetas */}
            <div className="p-4 rounded-[24px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#71706B] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C]">Tarjetas</span>
                <CreditCard className="w-4 h-4 text-[#1C1C1C]" />
              </div>
              <div className="text-xl font-black text-[#1C1C1C] tracking-tight">
                ${summary.totalTarjeta.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#71706B] mt-1">POS / Terminal</div>
            </div>

            {/* Egresos */}
            <div className="p-4 rounded-[24px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#71706B] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#991B1B]">Gastos</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-black text-[#991B1B] tracking-tight">
                -${summary.totalEgresos.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#71706B] mt-1">Egresos registrados</div>
            </div>
          </div>

          {/* BALANCE NETO HERO BAR (Staffwyn Dark Charcoal Feature Card) */}
          <div className="p-5 rounded-[28px] bg-[#1C1C1C] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div>
              <span className="text-xs uppercase font-bold text-[#F7D147] block tracking-wider">
                Balance Neto en Turno Activo
              </span>
              <div className="text-3xl font-black text-white mt-0.5">
                ${summary.balanceNeto.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCloseStep('summary');
                  setIsShiftClosingOpen(true);
                }}
                className="px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-white font-bold text-xs hover:bg-white/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4 text-[#F7D147]" />
                <span>Ver Arqueo</span>
              </button>

              <button
                onClick={() => {
                  setCloseStep('confirm');
                  setIsShiftClosingOpen(true);
                }}
                className="px-4 py-2.5 rounded-full bg-[#F7D147] hover:bg-[#f0c62d] text-[#1C1C1C] font-black text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Turno</span>
              </button>
            </div>
          </div>

          {/* QUICK EXPENSE FORM */}
          <div className="rounded-[28px] bg-white border border-black/[0.05] p-4 sm:p-5 space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#991B1B] flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" />
                <span>Registrar Egreso / Gasto Menor</span>
              </h3>
              <span className="text-[10px] text-[#71706B]">Resta de la caja diaria</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['Combustible', 'Repuestos', 'Insumos', 'Viáticos', 'Otro'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setExpenseCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    expenseCategory === cat
                      ? 'bg-[#1C1C1C] text-white'
                      : 'bg-[#F6F3EA] text-[#52514E] border border-black/[0.05] hover:text-[#1C1C1C]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <form onSubmit={handleRegisterExpense} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor={expenseDescId} className="sr-only">Descripción del gasto</label>
                  <input
                    id={expenseDescId}
                    type="text"
                    required
                    placeholder="Descripción (ej: 5L Nafta súper kartings)"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="w-full bg-[#F6F3EA] border border-black/[0.08] rounded-full px-4 py-2.5 text-xs text-[#1C1C1C] placeholder-[#71706B] focus:outline-none focus:border-[#1C1C1C]"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#71706B]">$</span>
                    <label htmlFor={expenseAmountId} className="sr-only">Monto del gasto</label>
                    <input
                      id={expenseAmountId}
                      type="number"
                      step="50"
                      min="1"
                      required
                      placeholder="Monto"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full bg-[#F6F3EA] border border-black/[0.08] rounded-full pl-7 pr-3 py-2.5 text-xs font-bold text-[#1C1C1C] placeholder-[#71706B] focus:outline-none focus:border-[#1C1C1C]"
                    />
                  </div>

                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value as PaymentMethod)}
                    className="bg-[#F6F3EA] border border-black/[0.08] rounded-full px-3 py-2.5 text-xs font-semibold text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] border border-[#FCA5A5] font-extrabold text-xs tracking-wider shadow-sm active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>REGISTRAR GASTO EN CAJA</span>
              </button>
            </form>
          </div>

          {/* MOVEMENTS HISTORY LIST OF CURRENT DAY (Staffwyn Salary Table Style) */}
          <div className="bg-white/95 rounded-[28px] border border-black/[0.05] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1C1C1C]">
                Movimientos del Turno ({movements.length})
              </h3>

              <div className="flex items-center gap-1 bg-[#F6F3EA] p-1 rounded-full">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    filterType === 'all' ? 'bg-[#1C1C1C] text-white' : 'text-[#71706B]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('ingresos')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    filterType === 'ingresos' ? 'bg-[#DCFCE7] text-[#166534]' : 'text-[#71706B]'
                  }`}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setFilterType('egresos')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    filterType === 'egresos' ? 'bg-[#FEE2E2] text-[#991B1B]' : 'text-[#71706B]'
                  }`}
                >
                  Egresos
                </button>
              </div>
            </div>

            {movements.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#F6F3EA] border border-black/[0.04] space-y-2">
                <Receipt className="w-8 h-8 text-[#71706B] mx-auto" />
                <p className="text-xs font-semibold text-[#1C1C1C]">Caja limpia a $0. No hay movimientos activos en este turno.</p>
                <p className="text-[11px] text-[#71706B]">Los alquileres y egresos que registres hoy aparecerán aquí.</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06]">
                {filteredMovements.map((mv) => {
                  const isIngreso = mv.type.startsWith('ingreso');
                  const timeStr = new Date(mv.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={mv.id}
                      className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-black shrink-0 ${
                            isIngreso
                              ? 'bg-[#F7D147] text-[#1C1C1C]'
                              : 'bg-[#FEE2E2] text-[#991B1B]'
                          }`}
                        >
                          {isIngreso ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-[#1C1C1C] leading-tight">
                            {mv.description}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#71706B]">
                            <span>{timeStr}</span>
                            <span>•</span>
                            <span className="capitalize">{mv.category}</span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleCyclePaymentMethod(mv)}
                              title="Haz clic para cambiar método de pago (Efectivo / Transferencia / Tarjeta)"
                              className="uppercase text-[#1C1C1C] font-bold px-2 py-0.5 rounded-full bg-[#F6F3EA] hover:bg-[#F7D147] border border-black/[0.08] transition-colors"
                            >
                              {mv.paymentMethod} ⇄
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold font-mono ${
                            isIngreso
                              ? 'bg-[#DCFCE7] text-[#166534]'
                              : 'bg-[#FEE2E2] text-[#991B1B]'
                          }`}
                        >
                          {isIngreso ? '+' : '-'}${mv.amount.toLocaleString()}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteMovement(mv)}
                          className="p-1.5 rounded-full text-[#71706B] hover:text-[#991B1B] hover:bg-[#FEE2E2] transition-colors"
                          title="Eliminar movimiento"
                          aria-label={`Eliminar movimiento ${mv.description}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: HISTORIAL DE CIERRES DE CAJA Y VENTAS */}
      {subTab === 'history' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71706B] flex items-center gap-2">
              <History className="w-4 h-4 text-[#1C1C1C]" />
              <span>Cierres de Caja Guardados ({closings.length})</span>
            </h3>
            <span className="text-[11px] text-[#71706B]">Persistidos en la nube Supabase</span>
          </div>

          {closings.length === 0 ? (
            <div className="p-10 text-center rounded-[28px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] flex items-center justify-center mx-auto text-[#1C1C1C]">
                <History className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#1C1C1C]">Sin cierres registrados aún</h4>
              <p className="text-xs text-[#71706B] max-w-sm mx-auto">
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
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F7D147] text-[#1C1C1C]">
                            Cierre de Caja
                          </span>
                          <span className="text-xs text-[#71706B] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeString} hs
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-[#1C1C1C] mt-1 capitalize">
                          {c.dateLabel}
                        </h4>
                        <div className="text-[11px] text-[#71706B] flex items-center gap-1.5 mt-0.5">
                          <UserCheck className="w-3 h-3 text-[#16A34A]" />
                          <span>Cerrado por: <strong className="text-[#1C1C1C]">{c.closedBy}</strong></span>
                          <span>•</span>
                          <span>{c.totalRentals} alquileres completados</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#71706B] block">Balance Neto</span>
                        <div className="text-lg font-black text-[#166534] font-mono">
                          ${c.balanceNeto.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* RENTAL BREAKDOWN BY CATEGORY */}
                    <div className="p-3 rounded-2xl bg-[#F6F3EA] border border-black/[0.05] space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#71706B] block tracking-wider">
                        Detalle de Alquileres por Vehículo ({c.totalRentals})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {closingBreakdown.map((item) => (
                          <div
                            key={item.categoryId}
                            className="flex items-center justify-between text-[11px] py-0.5 border-b border-black/[0.04] last:border-b-0"
                          >
                            <span className="text-[#52514E] truncate pr-2">
                              Alquileres de {item.categoryName}:
                            </span>
                            <span
                              className={`font-mono font-extrabold shrink-0 ${
                                item.count > 0 ? 'text-[#1C1C1C]' : 'text-[#71706B]/50'
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
                      <div className="p-2.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.05]">
                        <span className="text-[10px] text-[#166534] block uppercase font-sans font-bold">Efectivo</span>
                        <span className="font-bold text-[#1C1C1C]">${c.totalEfectivo.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.05]">
                        <span className="text-[10px] text-[#52514E] block uppercase font-sans font-bold">Transferencias</span>
                        <span className="font-bold text-[#1C1C1C]">${c.totalTransferencia.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.05]">
                        <span className="text-[10px] text-[#52514E] block uppercase font-sans font-bold">Tarjetas</span>
                        <span className="font-bold text-[#1C1C1C]">${c.totalTarjeta.toLocaleString()}</span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#FEE2E2]/60 border border-[#FCA5A5]">
                        <span className="text-[10px] text-[#991B1B] block uppercase font-sans font-bold">Gastos</span>
                        <span className="font-bold text-[#991B1B]">-${c.totalEgresos.toLocaleString()}</span>
                      </div>
                    </div>

                    {c.notes && (
                      <div className="p-2.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.05] text-xs text-[#52514E] italic">
                        &quot;{c.notes}&quot;
                      </div>
                    )}

                    {/* ACTIONS */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setSelectedClosing(c)}
                        className="px-3.5 py-2 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#F7D147]" />
                        <span>Ver {c.movementsSnapshot?.length || 0} Movimientos</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyReport(generateHistoricWhatsAppReport(c))}
                          className="p-2 rounded-full bg-[#F6F3EA] hover:bg-[#EAE4D3] text-[#1C1C1C] border border-black/[0.06] transition-all"
                          title="Copiar resumen"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(generateHistoricWhatsAppReport(c))}
                          className="px-3.5 py-1.5 rounded-full bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#166534] border border-[#86EFAC] font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClosing(c.id, c.dateLabel)}
                          className="p-2 rounded-full bg-[#F6F3EA] hover:bg-[#FEE2E2] text-[#71706B] hover:text-[#991B1B] border border-black/[0.06] transition-all"
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
      )}

      {/* MODAL: ARQUEO Y CIERRE DE CAJA (Active shift) */}
      {isShiftClosingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[28px] bg-white border border-black/[0.08] shadow-2xl p-5 space-y-4 text-[#1C1C1C]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#1C1C1C]" />
                <h3 className="text-base font-extrabold text-[#1C1C1C]">
                  {closeStep === 'summary' ? 'Arqueo de Caja Eco Aventura' : 'Confirmar Cierre de Turno'}
                </h3>
              </div>
              <button
                onClick={() => setIsShiftClosingOpen(false)}
                className="text-[#71706B] hover:text-[#1C1C1C]"
              >
                ✕
              </button>
            </div>

            {closeStep === 'summary' ? (
              <>
                <div className="rounded-2xl bg-[#F6F3EA] p-4 border border-black/[0.06] space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between text-[#52514E] pb-1.5 border-b border-black/[0.06] font-sans">
                    <span className="font-bold text-[#1C1C1C]">Alquileres Totales:</span>
                    <span className="text-[#166534] font-black">{summary.countAlquileres} servicios</span>
                  </div>

                  {/* Discriminated Rentals by Category */}
                  <div className="space-y-1 pb-2 border-b border-black/[0.06] font-sans">
                    {summary.rentalsByCategory.map((item) => (
                      <div
                        key={item.categoryId}
                        className="flex items-center justify-between text-[11px] text-[#52514E]"
                      >
                        <span className="truncate pr-2">• Alquileres de {item.categoryName}:</span>
                        <span
                          className={`font-mono font-extrabold shrink-0 ${
                            item.count > 0 ? 'text-[#1C1C1C]' : 'text-[#71706B]/40'
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
                  <div className="flex justify-between text-[#1C1C1C]">
                    <span>Transferencias Bancarias/MP:</span>
                    <span className="font-bold">${summary.totalTransferencia.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#1C1C1C]">
                    <span>Tarjetas / POS:</span>
                    <span className="font-bold">${summary.totalTarjeta.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#991B1B] pt-1 border-t border-black/[0.06]">
                    <span>Total Egresos / Gastos:</span>
                    <span className="font-bold">-${summary.totalEgresos.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#1C1C1C] text-sm font-black pt-2 border-t-2 border-black/[0.08] font-sans">
                    <span>BALANCE NETO TOTAL:</span>
                    <span className="text-[#1C1C1C]">${summary.balanceNeto.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCopyReport(generateWhatsAppReport())}
                    className="py-2.5 px-3 rounded-full bg-[#F6F3EA] hover:bg-[#EAE4D3] text-[#1C1C1C] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-black/[0.06]"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4 text-[#1C1C1C]" />}
                    <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(generateWhatsAppReport())}
                    className="py-2.5 px-3 rounded-full bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#166534] border border-[#86EFAC] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                {/* Big Action: Proceed to Close Cash */}
                <button
                  onClick={() => setCloseStep('confirm')}
                  className="w-full py-3.5 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                >
                  <Lock className="w-4 h-4 text-[#F7D147]" />
                  <span>CERRAR CAJA Y ARCHIVAR DÍA</span>
                  <ArrowRight className="w-4 h-4 text-[#F7D147]" />
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[#1C1C1C]">
                    <History className="w-4 h-4" />
                    <span>¿Cerrar el turno y reiniciar caja a $0?</span>
                  </div>
                  <p className="text-[11px] text-[#92400E] leading-relaxed">
                    Se guardará este informe y todos sus movimientos en el <strong>Historial de Cierres</strong>. Las actividades del día se archivarán y la caja iniciará limpia en $0 para el siguiente operador o turno.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#52514E] mb-1">
                      Nombre del Operador que cierra
                    </label>
                    <input
                      type="text"
                      required
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full bg-[#F6F3EA] border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#52514E] mb-1">
                      Observaciones / Notas del turno (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej: Turno completo sin diferencias en efectivo"
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      className="w-full bg-[#F6F3EA] border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCloseStep('summary')}
                    className="py-3 rounded-full bg-[#F6F3EA] hover:bg-[#EAE4D3] text-[#52514E] text-xs font-bold border border-black/[0.06]"
                  >
                    Volver atrás
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingClose}
                    onClick={handleConfirmCloseCash}
                    className="py-3 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4 text-[#F7D147]" />
                    <span>{isProcessingClose ? 'Guardando...' : 'Confirmar Cierre'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLE DE CIERRE HISTÓRICO */}
      {selectedClosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[28px] bg-white border border-black/[0.08] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#1C1C1C]">
            {/* Header */}
            <div className="p-4 border-b border-black/[0.06] bg-[#FAF6E8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#1C1C1C]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#1C1C1C]">
                    Detalle de Cierre - {selectedClosing.dateLabel}
                  </h3>
                  <p className="text-[11px] text-[#71706B]">
                    Operador: {selectedClosing.closedBy} • Balance: ${selectedClosing.balanceNeto.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClosing(null)}
                className="text-[#71706B] hover:text-[#1C1C1C]"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Financial Snapshot */}
              <div className="p-3.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.05] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#166534] font-sans font-bold block">EFECTIVO</span>
                  <span className="text-[#1C1C1C] font-bold">${selectedClosing.totalEfectivo.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#52514E] font-sans font-bold block">TRANSFERENCIAS</span>
                  <span className="text-[#1C1C1C] font-bold">${selectedClosing.totalTransferencia.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#52514E] font-sans font-bold block">TARJETAS</span>
                  <span className="text-[#1C1C1C] font-bold">${selectedClosing.totalTarjeta.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#991B1B] font-sans font-bold block">GASTOS</span>
                  <span className="text-[#991B1B] font-bold">-${selectedClosing.totalEgresos.toLocaleString()}</span>
                </div>
              </div>

              {/* Rental Breakdown Snapshot */}
              <div className="p-3.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.05] space-y-2">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-1.5">
                  <span className="text-xs font-extrabold text-[#1C1C1C]">
                    Alquileres Discriminados por Vehículo
                  </span>
                  <span className="text-xs font-black text-[#166534]">
                    Total: {selectedClosing.totalRentals}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {dataService
                    .getRentalBreakdownByCategory(
                      selectedClosing.movementsSnapshot || [],
                      selectedClosing.rentalsSnapshot || []
                    )
                    .map((item) => (
                      <div
                        key={item.categoryId}
                        className="flex items-center justify-between text-[11px] py-0.5"
                      >
                        <span className="text-[#52514E] truncate pr-2">
                          Alquileres de {item.categoryName}:
                        </span>
                        <span
                          className={`font-mono font-extrabold shrink-0 ${
                            item.count > 0 ? 'text-[#1C1C1C]' : 'text-[#71706B]/40'
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Movements List in this shift */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#71706B]">
                  Movimientos Archivados ({selectedClosing.movementsSnapshot?.length || 0})
                </h4>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {selectedClosing.movementsSnapshot?.map((mv, idx) => {
                    const isIngreso = mv.type.startsWith('ingreso');
                    const timeStr = new Date(mv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={mv.id || idx}
                        className="p-2.5 rounded-xl bg-[#F6F3EA] border border-black/[0.05] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#1C1C1C]">{mv.description}</div>
                          <div className="text-[10px] text-[#71706B] flex items-center gap-1.5">
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
                            onClick={() => handleDeleteArchivedMovement(mv, idx)}
                            className="p-1 rounded-full text-[#71706B] hover:text-[#991B1B] hover:bg-[#FEE2E2] transition-colors"
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
            <div className="p-3.5 border-t border-black/[0.06] bg-[#FAF6E8] flex items-center justify-between">
              <button
                onClick={() => handleCopyReport(generateHistoricWhatsAppReport(selectedClosing))}
                className="px-4 py-2 rounded-full bg-white text-[#1C1C1C] border border-black/[0.08] text-xs font-bold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Reporte</span>
              </button>

              <button
                onClick={() => handleShareWhatsApp(generateHistoricWhatsAppReport(selectedClosing))}
                className="px-4 py-2 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white font-black text-xs flex items-center gap-1.5 shadow"
              >
                <Share2 className="w-3.5 h-3.5 text-[#F7D147]" />
                <span>Compartir por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
