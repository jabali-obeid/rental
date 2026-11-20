import React, { useState, useId } from 'react';
import { CashMovement, PaymentMethod, DailyClosing } from '../types';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
import { uiFeedback } from '../services/uiFeedback';
import { ClosingsHistoryTab } from './cash/ClosingsHistoryTab';
import { ShiftClosingModal } from './cash/ShiftClosingModal';
import { ClosingDetailModal } from './cash/ClosingDetailModal';
import {
  Banknote,
  Smartphone,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Receipt,
  PlusCircle,
  History,
  Lock,
  Calendar,
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
      uiFeedback.toast('Ingresa un monto válido para el egreso.', 'error');
      return;
    }
    if (!expenseDesc.trim()) {
      uiFeedback.toast('Ingresa una descripción para el egreso.', 'error');
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
    uiFeedback.toast('Egreso registrado en caja.', 'success');
    setExpenseDesc('');
    setExpenseAmount('');
  };

  const handleDeleteMovement = async (mv: CashMovement) => {
    const isIngreso = mv.type.startsWith('ingreso');
    const signo = isIngreso ? '+' : '-';
    const reason = await uiFeedback.prompt({
      title: 'Anular movimiento de caja',
      message: `¿Deseas eliminar este movimiento?\n\n"${mv.description}" (${signo}$${mv.amount.toLocaleString()})\n\nIngresá el motivo de la anulación:`,
      defaultValue: 'Error de registro',
      confirmLabel: 'Anular movimiento',
    });
    if (reason === null) return;

    try {
      await dataService.deleteCashMovement(mv.id);
      soundService.playSuccess();
      uiFeedback.toast('Movimiento eliminado.', 'info');
    } catch (err) {
      console.error(err);
      uiFeedback.toast('Error al intentar eliminar el movimiento.', 'error');
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
      uiFeedback.toast('Error al actualizar el método de pago.', 'error');
    }
  };


  const handleDeleteClosing = async (closingId: string, label: string) => {
    const confirmed = await uiFeedback.confirm({
      title: 'Eliminar cierre de caja',
      message: `¿Estás seguro de que deseas eliminar permanentemente el cierre de caja "${label}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
    try {
      await dataService.deleteDailyClosing(closingId);
      soundService.playSuccess();
      uiFeedback.toast('Cierre de caja eliminado.', 'info');
      if (selectedClosing?.id === closingId) {
        setSelectedClosing(null);
      }
    } catch (err) {
      console.error(err);
      uiFeedback.toast('Error al eliminar el cierre.', 'error');
    }
  };

  const handleDeleteArchivedMovement = async (mv: CashMovement, index: number) => {
    if (!selectedClosing) return;
    const isIngreso = mv.type.startsWith('ingreso');
    const signo = isIngreso ? '+' : '-';
    const confirmed = await uiFeedback.confirm({
      title: 'Eliminar movimiento archivado',
      message: `¿Deseas eliminar este movimiento archivado del cierre?\n\n"${mv.description}" (${signo}$${mv.amount.toLocaleString()})\n\nSe recalcularán los totales archivados de este cierre.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      const movementIdOrIndex = mv.id || String(index);
      const updated = await dataService.deleteMovementFromClosing(selectedClosing.id, movementIdOrIndex);
      if (updated) {
        setSelectedClosing(updated);
      }
      soundService.playSuccess();
      uiFeedback.toast('Movimiento archivado eliminado.', 'info');
    } catch (err) {
      console.error(err);
      uiFeedback.toast('Error al eliminar el movimiento archivado.', 'error');
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
      uiFeedback.toast('Cierre de caja registrado.', 'success');
    } catch (e) {
      uiFeedback.toast('Error al cerrar la caja.', 'error');
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
    <div className="space-y-4 pb-24 text-eco-dark">
      {/* MODULE HEADER & SUB-TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-[24px] bg-white/95 border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSubTab('today')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              subTab === 'today'
                ? 'bg-eco-dark text-white shadow-sm'
                : 'text-eco-creamDark hover:text-eco-dark hover:bg-eco-surface'
            }`}
          >
            <Banknote className={`w-4 h-4 ${subTab === 'today' ? 'text-eco-gold' : 'text-eco-dark'}`} />
            <span>Caja del Día Actual</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              subTab === 'today' ? 'bg-eco-gold text-eco-dark' : 'bg-eco-surface text-eco-dark'
            }`}>
              ${summary.balanceNeto.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              subTab === 'history'
                ? 'bg-eco-dark text-white shadow-sm'
                : 'text-eco-creamDark hover:text-eco-dark hover:bg-eco-surface'
            }`}
          >
            <History className={`w-4 h-4 ${subTab === 'history' ? 'text-eco-gold' : 'text-eco-creamDark'}`} />
            <span>Historial de Cierres</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              subTab === 'history' ? 'bg-eco-gold text-eco-dark' : 'bg-eco-surface text-eco-creamDark'
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
              className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-eco-gold hover:bg-[#f0c62d] text-eco-dark font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
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
              <div className="flex items-center justify-between text-eco-creamMuted mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">Efectivo</span>
                <Banknote className="w-4 h-4 text-eco-leaf" />
              </div>
              <div className="text-xl font-black text-eco-dark tracking-tight">
                ${summary.totalEfectivo.toLocaleString()}
              </div>
              <div className="text-[10px] text-eco-creamMuted mt-1">Caja física disponible</div>
            </div>

            {/* Transferencias */}
            <div className="p-4 rounded-[24px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-eco-creamMuted mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-eco-dark">Transfer.</span>
                <Smartphone className="w-4 h-4 text-eco-dark" />
              </div>
              <div className="text-xl font-black text-eco-dark tracking-tight">
                ${summary.totalTransferencia.toLocaleString()}
              </div>
              <div className="text-[10px] text-eco-creamMuted mt-1">Bancos / MP</div>
            </div>

            {/* Tarjetas */}
            <div className="p-4 rounded-[24px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-eco-creamMuted mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-eco-dark">Tarjetas</span>
                <CreditCard className="w-4 h-4 text-eco-dark" />
              </div>
              <div className="text-xl font-black text-eco-dark tracking-tight">
                ${summary.totalTarjeta.toLocaleString()}
              </div>
              <div className="text-[10px] text-eco-creamMuted mt-1">POS / Terminal</div>
            </div>

            {/* Egresos */}
            <div className="p-4 rounded-[24px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-eco-creamMuted mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#991B1B]">Gastos</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-black text-[#991B1B] tracking-tight">
                -${summary.totalEgresos.toLocaleString()}
              </div>
              <div className="text-[10px] text-eco-creamMuted mt-1">Egresos registrados</div>
            </div>
          </div>

          {/* BALANCE NETO HERO BAR (Staffwyn Dark Charcoal Feature Card) */}
          <div className="p-5 rounded-[28px] bg-eco-dark text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div>
              <span className="text-xs uppercase font-bold text-eco-gold block tracking-wider">
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
                <Receipt className="w-4 h-4 text-eco-gold" />
                <span>Ver Arqueo</span>
              </button>

              <button
                onClick={() => {
                  setCloseStep('confirm');
                  setIsShiftClosingOpen(true);
                }}
                className="px-4 py-2.5 rounded-full bg-eco-gold hover:bg-[#f0c62d] text-eco-dark font-black text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow"
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
              <span className="text-[10px] text-eco-creamMuted">Resta de la caja diaria</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['Combustible', 'Repuestos', 'Insumos', 'Viáticos', 'Otro'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setExpenseCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    expenseCategory === cat
                      ? 'bg-eco-dark text-white'
                      : 'bg-eco-surface text-eco-creamDark border border-black/[0.05] hover:text-eco-dark'
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
                    className="w-full bg-eco-surface border border-black/[0.08] rounded-full px-4 py-2.5 text-xs text-eco-dark placeholder-eco-creamMuted focus:outline-none focus:border-eco-dark"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-eco-creamMuted">$</span>
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
                      className="w-full bg-eco-surface border border-black/[0.08] rounded-full pl-7 pr-3 py-2.5 text-xs font-bold text-eco-dark placeholder-eco-creamMuted focus:outline-none focus:border-eco-dark"
                    />
                  </div>

                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value as PaymentMethod)}
                    className="bg-eco-surface border border-black/[0.08] rounded-full px-3 py-2.5 text-xs font-semibold text-eco-dark focus:outline-none focus:border-eco-dark"
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
              <h3 className="text-sm font-bold text-eco-dark">
                Movimientos del Turno ({movements.length})
              </h3>

              <div className="flex items-center gap-1 bg-eco-surface p-1 rounded-full">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    filterType === 'all' ? 'bg-eco-dark text-white' : 'text-eco-creamMuted'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('ingresos')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    filterType === 'ingresos' ? 'bg-[#DCFCE7] text-[#166534]' : 'text-eco-creamMuted'
                  }`}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setFilterType('egresos')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    filterType === 'egresos' ? 'bg-[#FEE2E2] text-[#991B1B]' : 'text-eco-creamMuted'
                  }`}
                >
                  Egresos
                </button>
              </div>
            </div>

            {movements.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-eco-surface border border-black/[0.04] space-y-2">
                <Receipt className="w-8 h-8 text-eco-creamMuted mx-auto" />
                <p className="text-xs font-semibold text-eco-dark">Caja limpia a $0. No hay movimientos activos en este turno.</p>
                <p className="text-[11px] text-eco-creamMuted">Los alquileres y egresos que registres hoy aparecerán aquí.</p>
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
                              ? 'bg-eco-gold text-eco-dark'
                              : 'bg-[#FEE2E2] text-[#991B1B]'
                          }`}
                        >
                          {isIngreso ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-eco-dark leading-tight">
                            {mv.description}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-eco-creamMuted">
                            <span>{timeStr}</span>
                            <span>•</span>
                            <span className="capitalize">{mv.category}</span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleCyclePaymentMethod(mv)}
                              title="Haz clic para cambiar método de pago (Efectivo / Transferencia / Tarjeta)"
                              className="uppercase text-eco-dark font-bold px-2 py-0.5 rounded-full bg-eco-surface hover:bg-eco-gold border border-black/[0.08] transition-colors"
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
                          className="p-1.5 rounded-full text-eco-creamMuted hover:text-[#991B1B] hover:bg-[#FEE2E2] transition-colors"
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
        <ClosingsHistoryTab
          closings={closings}
          onSelectClosing={setSelectedClosing}
          onCopyReport={handleCopyReport}
          onShareWhatsApp={handleShareWhatsApp}
          onDeleteClosing={handleDeleteClosing}
          generateReport={generateHistoricWhatsAppReport}
        />
      )}

      <ShiftClosingModal
        isOpen={isShiftClosingOpen}
        onClose={() => setIsShiftClosingOpen(false)}
        closeStep={closeStep}
        onChangeStep={setCloseStep}
        summary={summary}
        operatorName={operatorName}
        onChangeOperatorName={setOperatorName}
        closingNotes={closingNotes}
        onChangeClosingNotes={setClosingNotes}
        isProcessing={isProcessingClose}
        onConfirmClose={handleConfirmCloseCash}
        copied={copied}
        onCopyReport={handleCopyReport}
        onShareWhatsApp={handleShareWhatsApp}
        reportText={generateWhatsAppReport()}
      />

      <ClosingDetailModal
        closing={selectedClosing}
        onClose={() => setSelectedClosing(null)}
        onDeleteArchivedMovement={handleDeleteArchivedMovement}
        onCopyReport={handleCopyReport}
        onShareWhatsApp={handleShareWhatsApp}
        generateReport={generateHistoricWhatsAppReport}
      />
    </div>
  );
};
