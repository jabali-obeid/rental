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
    const confirmMsg = `¿Estás seguro de que deseas eliminar este movimiento?\n\n"${mv.description}" (${signo}$${mv.amount.toLocaleString()})\n\nEsta acción recalculará los totales del turno.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await dataService.deleteCashMovement(mv.id);
      soundService.playSuccess();
    } catch (err) {
      console.error(err);
      alert('Error al intentar eliminar el movimiento');
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
    return (
      `*🌿 ECO AVENTURA - CIERRE DE CAJA / ARQUEO DIARIO*\n` +
      `📅 Fecha: ${today}\n` +
      `---------------------------------\n` +
      `🛵 Alquileres Realizados: *${summary.countAlquileres}*\n` +
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
    return (
      `*🌿 ECO AVENTURA - REPORTE DE CIERRE HISTÓRICO*\n` +
      `📅 Fecha: ${item.dateLabel}\n` +
      `👤 Operador: ${item.closedBy}\n` +
      `---------------------------------\n` +
      `🛵 Alquileres Totales: *${item.totalRentals}*\n` +
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
    <div className="space-y-4 pb-24 text-[#f3ebd6]">
      {/* MODULE HEADER & SUB-TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#081d15] border border-[#1a422f]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubTab('today')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
              subTab === 'today'
                ? 'bg-[#1a422f] text-[#f3ebd6] shadow-sm'
                : 'text-[#d5cbbb]/70 hover:text-[#f3ebd6]'
            }`}
          >
            <Banknote className="w-4 h-4 text-[#2ea06e]" />
            <span>Caja del Día Actual</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#02110c] text-[#2ea06e] font-mono font-bold">
              ${summary.balanceNeto.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
              subTab === 'history'
                ? 'bg-[#1a422f] text-[#f3ebd6] shadow-sm'
                : 'text-[#d5cbbb]/70 hover:text-[#f3ebd6]'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Historial de Cierres</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#02110c] text-amber-400 font-bold">
              {closings.length}
            </span>
          </button>
        </div>

        {subTab === 'today' && (
          <div className="flex items-center gap-2 px-2">
            <button
              onClick={() => {
                setCloseStep('summary');
                setIsShiftClosingOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Efectivo en mano */}
            <div className="p-3.5 rounded-2xl bg-[#081d15] border border-[#1a422f] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#d5cbbb] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2ea06e]">Efectivo</span>
                <Banknote className="w-4 h-4 text-[#2ea06e]" />
              </div>
              <div className="text-xl font-black text-[#f3ebd6] tracking-tight">
                ${summary.totalEfectivo.toLocaleString()}
              </div>
              <div className="text-[10px] text-[#2ea06e] mt-1">Caja física disponible</div>
            </div>

            {/* Transferencias */}
            <div className="p-3.5 rounded-2xl bg-[#081d15] border border-[#1a422f] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#d5cbbb] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Transfer.</span>
                <Smartphone className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-black text-[#f3ebd6] tracking-tight">
                ${summary.totalTransferencia.toLocaleString()}
              </div>
              <div className="text-[10px] text-cyan-300 mt-1">Bancos / MP</div>
            </div>

            {/* Tarjetas */}
            <div className="p-3.5 rounded-2xl bg-[#081d15] border border-[#1a422f] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#d5cbbb] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Tarjetas</span>
                <CreditCard className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-black text-[#f3ebd6] tracking-tight">
                ${summary.totalTarjeta.toLocaleString()}
              </div>
              <div className="text-[10px] text-purple-300 mt-1">POS / Terminal</div>
            </div>

            {/* Egresos */}
            <div className="p-3.5 rounded-2xl bg-[#081d15] border border-[#1a422f] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#d5cbbb] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Gastos</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-black text-rose-300 tracking-tight">
                -${summary.totalEgresos.toLocaleString()}
              </div>
              <div className="text-[10px] text-rose-400 mt-1">Egresos registrados</div>
            </div>
          </div>

          {/* BALANCE NETO HERO BAR */}
          <div className="p-4 rounded-2xl bg-[#081d15] border border-[#1a422f] flex items-center justify-between gap-3 shadow-lg">
            <div>
              <span className="text-xs uppercase font-bold text-[#d5cbbb]/70 block tracking-wider">
                Balance Neto en Turno Activo
              </span>
              <div className="text-2xl font-black text-[#f3ebd6]">
                ${summary.balanceNeto.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCloseStep('summary');
                  setIsShiftClosingOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#02110c] border border-[#1a422f] text-[#f3ebd6] font-bold text-xs hover:border-[#2ea06e] active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4 text-[#2ea06e]" />
                <span>Ver Arqueo</span>
              </button>

              <button
                onClick={() => {
                  setCloseStep('confirm');
                  setIsShiftClosingOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Turno</span>
              </button>
            </div>
          </div>

          {/* QUICK EXPENSE FORM */}
          <div className="rounded-2xl bg-[#081d15] border border-[#1a422f] p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" />
                <span>Registrar Egreso / Gasto Menor</span>
              </h3>
              <span className="text-[10px] text-[#d5cbbb]/60">Resta de la caja diaria</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['Combustible', 'Repuestos', 'Insumos', 'Viáticos', 'Otro'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setExpenseCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    expenseCategory === cat
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-[#02110c] text-[#d5cbbb] border border-[#1a422f] hover:text-[#f3ebd6]'
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
                    className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] placeholder-[#d5cbbb]/40 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs font-bold text-[#d5cbbb]/50">$</span>
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
                      className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl pl-6 pr-3 py-2 text-xs font-bold text-[#f3ebd6] placeholder-[#d5cbbb]/40 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value as PaymentMethod)}
                    className="bg-[#02110c] border border-[#1a422f] rounded-xl px-2 py-2 text-xs font-semibold text-[#f3ebd6] focus:outline-none focus:border-rose-500"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs tracking-wider shadow active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>REGISTRAR GASTO EN CAJA</span>
              </button>
            </form>
          </div>

          {/* MOVEMENTS HISTORY LIST OF CURRENT DAY */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/70">
                Movimientos del Turno ({movements.length})
              </h3>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                    filterType === 'all' ? 'bg-[#1a422f] text-[#f3ebd6]' : 'text-[#d5cbbb]/60'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('ingresos')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                    filterType === 'ingresos' ? 'bg-[#1a422f] text-[#2ea06e]' : 'text-[#d5cbbb]/60'
                  }`}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setFilterType('egresos')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                    filterType === 'egresos' ? 'bg-rose-950/80 text-rose-300' : 'text-[#d5cbbb]/60'
                  }`}
                >
                  Egresos
                </button>
              </div>
            </div>

            {movements.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#081d15] border border-[#1a422f] space-y-2">
                <Receipt className="w-8 h-8 text-[#2ea06e]/50 mx-auto" />
                <p className="text-xs text-[#d5cbbb]">Caja limpia a $0. No hay movimientos activos en este turno.</p>
                <p className="text-[11px] text-[#d5cbbb]/60">Los alquileres y egresos que registres hoy aparecerán aquí.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMovements.map((mv) => {
                  const isIngreso = mv.type.startsWith('ingreso');
                  const timeStr = new Date(mv.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={mv.id}
                      className="p-3 rounded-2xl bg-[#081d15] border border-[#1a422f] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                            isIngreso
                              ? 'bg-[#02110c] text-[#2ea06e] border border-[#1a422f]'
                              : 'bg-rose-950/50 text-rose-400 border border-rose-900/50'
                          }`}
                        >
                          {isIngreso ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-[#f3ebd6] leading-tight">
                            {mv.description}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#d5cbbb]/60">
                            <span>{timeStr}</span>
                            <span>•</span>
                            <span className="capitalize">{mv.category}</span>
                            <span>•</span>
                            <span className="uppercase text-[#f3ebd6] font-bold">{mv.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className={`text-sm font-black font-mono ${
                            isIngreso ? 'text-[#2ea06e]' : 'text-rose-400'
                          }`}
                        >
                          {isIngreso ? '+' : '-'}${mv.amount.toLocaleString()}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMovement(mv)}
                          className="p-1.5 rounded-lg text-[#d5cbbb]/40 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/70 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Cierres de Caja Guardados ({closings.length})</span>
            </h3>
            <span className="text-[11px] text-[#d5cbbb]/60">Persistidos en la nube Supabase</span>
          </div>

          {closings.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-[#081d15] border border-[#1a422f] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#02110c] border border-[#1a422f] flex items-center justify-center mx-auto text-amber-400">
                <History className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#f3ebd6]">Sin cierres registrados aún</h4>
              <p className="text-xs text-[#d5cbbb]/70 max-w-sm mx-auto">
                Al finalizar la jornada o turno, presiona <strong>&quot;Arqueo y Cerrar Caja&quot;</strong>. Todos los movimientos, cobros y ventas se archivarán de forma permanente aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {closings.map((c) => {
                const dateObj = new Date(c.closedAt);
                const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-[#081d15] border border-[#1a422f] hover:border-amber-400/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1a422f]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            Cierre de Caja
                          </span>
                          <span className="text-xs text-[#d5cbbb]/70 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeString} hs
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-[#f3ebd6] mt-1 capitalize">
                          {c.dateLabel}
                        </h4>
                        <div className="text-[11px] text-[#d5cbbb]/70 flex items-center gap-1.5 mt-0.5">
                          <UserCheck className="w-3 h-3 text-[#2ea06e]" />
                          <span>Cerrado por: <strong>{c.closedBy}</strong></span>
                          <span>•</span>
                          <span>{c.totalRentals} alquileres completados</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#d5cbbb]/60 block">Balance Neto</span>
                        <div className="text-lg font-black text-[#2ea06e] font-mono">
                          ${c.balanceNeto.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* METHOD BREAKDOWN PILLS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-[#02110c] border border-[#1a422f]">
                        <span className="text-[10px] text-[#2ea06e] block uppercase font-sans font-bold">Efectivo</span>
                        <span className="font-bold text-[#f3ebd6]">${c.totalEfectivo.toLocaleString()}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#02110c] border border-[#1a422f]">
                        <span className="text-[10px] text-cyan-300 block uppercase font-sans font-bold">Transferencias</span>
                        <span className="font-bold text-[#f3ebd6]">${c.totalTransferencia.toLocaleString()}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#02110c] border border-[#1a422f]">
                        <span className="text-[10px] text-purple-300 block uppercase font-sans font-bold">Tarjetas</span>
                        <span className="font-bold text-[#f3ebd6]">${c.totalTarjeta.toLocaleString()}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#02110c] border border-[#1a422f]">
                        <span className="text-[10px] text-rose-400 block uppercase font-sans font-bold">Gastos</span>
                        <span className="font-bold text-rose-300">-${c.totalEgresos.toLocaleString()}</span>
                      </div>
                    </div>

                    {c.notes && (
                      <div className="p-2.5 rounded-xl bg-[#02110c]/80 border border-[#1a422f] text-xs text-[#d5cbbb] italic">
                        &quot;{c.notes}&quot;
                      </div>
                    )}

                    {/* ACTIONS */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setSelectedClosing(c)}
                        className="px-3 py-1.5 rounded-xl bg-[#02110c] hover:bg-[#1a422f] text-[#f3ebd6] border border-[#1a422f] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver {c.movementsSnapshot?.length || 0} Movimientos</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyReport(generateHistoricWhatsAppReport(c))}
                          className="p-2 rounded-xl bg-[#02110c] hover:bg-[#1a422f] text-[#f3ebd6] border border-[#1a422f] transition-all"
                          title="Copiar resumen"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(generateHistoricWhatsAppReport(c))}
                          className="px-3 py-1.5 rounded-xl bg-[#2ea06e]/20 hover:bg-[#2ea06e]/30 text-[#2ea06e] border border-[#2ea06e]/40 font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02110c]/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#081d15] border border-[#1a422f] shadow-2xl p-5 space-y-4 text-[#f3ebd6]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1a422f]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#2ea06e]" />
                <h3 className="text-base font-extrabold text-[#f3ebd6]">
                  {closeStep === 'summary' ? 'Arqueo de Caja Eco Aventura' : 'Confirmar Cierre de Turno'}
                </h3>
              </div>
              <button
                onClick={() => setIsShiftClosingOpen(false)}
                className="text-[#d5cbbb] hover:text-[#f3ebd6]"
              >
                ✕
              </button>
            </div>

            {closeStep === 'summary' ? (
              <>
                <div className="rounded-2xl bg-[#02110c] p-4 border border-[#1a422f] space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between text-[#d5cbbb] pb-2 border-b border-[#1a422f] font-sans">
                    <span>Alquileres Cerrados:</span>
                    <span className="text-[#f3ebd6] font-bold">{summary.countAlquileres} servicios</span>
                  </div>
                  <div className="flex justify-between text-[#2ea06e]">
                    <span>Efectivo Físico en Caja:</span>
                    <span className="font-bold">${summary.totalEfectivo.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-cyan-300">
                    <span>Transferencias Bancarias/MP:</span>
                    <span className="font-bold">${summary.totalTransferencia.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-purple-300">
                    <span>Tarjetas / POS:</span>
                    <span className="font-bold">${summary.totalTarjeta.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-400 pt-1 border-t border-[#1a422f]">
                    <span>Total Egresos / Gastos:</span>
                    <span className="font-bold">-${summary.totalEgresos.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-white text-sm font-black pt-2 border-t-2 border-[#1a422f] font-sans">
                    <span>BALANCE NETO TOTAL:</span>
                    <span className="text-[#f3ebd6]">${summary.balanceNeto.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCopyReport(generateWhatsAppReport())}
                    className="py-2.5 px-3 rounded-xl bg-[#02110c] hover:bg-[#1a422f] text-[#f3ebd6] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-[#1a422f]"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#2ea06e]" /> : <Copy className="w-4 h-4 text-[#f3ebd6]" />}
                    <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(generateWhatsAppReport())}
                    className="py-2.5 px-3 rounded-xl bg-[#2ea06e]/20 hover:bg-[#2ea06e]/30 text-[#2ea06e] border border-[#2ea06e]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                {/* Big Action: Proceed to Close Cash */}
                <button
                  onClick={() => setCloseStep('confirm')}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>CERRAR CAJA Y ARCHIVAR DÍA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <History className="w-4 h-4" />
                    <span>¿Cerrar el turno y reiniciar caja a $0?</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Se guardará este informe y todos sus movimientos en el <strong>Historial de Cierres</strong>. Las actividades del día se archivarán y la caja iniciará limpia en $0 para el siguiente operador o turno.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#d5cbbb] mb-1">
                      Nombre del Operador que cierra
                    </label>
                    <input
                      type="text"
                      required
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] focus:outline-none focus:border-[#2ea06e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#d5cbbb] mb-1">
                      Observaciones / Notas del turno (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej: Turno completo sin diferencias en efectivo"
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] focus:outline-none focus:border-[#2ea06e]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCloseStep('summary')}
                    className="py-3 rounded-xl bg-[#02110c] hover:bg-[#1a422f] text-[#d5cbbb] text-xs font-bold border border-[#1a422f]"
                  >
                    Volver atrás
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingClose}
                    onClick={handleConfirmCloseCash}
                    className="py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02110c]/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[#081d15] border border-[#1a422f] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#f3ebd6]">
            {/* Header */}
            <div className="p-4 border-b border-[#1a422f] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#f3ebd6]">
                    Detalle de Cierre - {selectedClosing.dateLabel}
                  </h3>
                  <p className="text-[11px] text-[#d5cbbb]/70">
                    Operador: {selectedClosing.closedBy} • Balance: ${selectedClosing.balanceNeto.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClosing(null)}
                className="text-[#d5cbbb] hover:text-[#f3ebd6]"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Financial Snapshot */}
              <div className="p-3.5 rounded-2xl bg-[#02110c] border border-[#1a422f] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#2ea06e] font-sans font-bold block">EFECTIVO</span>
                  <span className="text-[#f3ebd6] font-bold">${selectedClosing.totalEfectivo.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-cyan-300 font-sans font-bold block">TRANSFERENCIAS</span>
                  <span className="text-[#f3ebd6] font-bold">${selectedClosing.totalTransferencia.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-300 font-sans font-bold block">TARJETAS</span>
                  <span className="text-[#f3ebd6] font-bold">${selectedClosing.totalTarjeta.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-400 font-sans font-bold block">GASTOS</span>
                  <span className="text-rose-300 font-bold">-${selectedClosing.totalEgresos.toLocaleString()}</span>
                </div>
              </div>

              {/* Movements List in this shift */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/70">
                  Movimientos Archivados ({selectedClosing.movementsSnapshot?.length || 0})
                </h4>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {selectedClosing.movementsSnapshot?.map((mv, idx) => {
                    const isIngreso = mv.type.startsWith('ingreso');
                    const timeStr = new Date(mv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={mv.id || idx}
                        className="p-2.5 rounded-xl bg-[#02110c] border border-[#1a422f] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#f3ebd6]">{mv.description}</div>
                          <div className="text-[10px] text-[#d5cbbb]/60 flex items-center gap-1.5">
                            <span>{timeStr}</span>
                            <span>•</span>
                            <span className="uppercase">{mv.paymentMethod}</span>
                          </div>
                        </div>

                        <div className={`font-mono font-bold ${isIngreso ? 'text-[#2ea06e]' : 'text-rose-400'}`}>
                          {isIngreso ? '+' : '-'}${mv.amount.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#1a422f] bg-[#02110c] flex items-center justify-between">
              <button
                onClick={() => handleCopyReport(generateHistoricWhatsAppReport(selectedClosing))}
                className="px-3 py-2 rounded-xl bg-[#081d15] text-[#f3ebd6] border border-[#1a422f] text-xs font-bold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Reporte</span>
              </button>

              <button
                onClick={() => handleShareWhatsApp(generateHistoricWhatsAppReport(selectedClosing))}
                className="px-4 py-2 rounded-xl bg-[#2ea06e] hover:bg-[#2ea06e]/90 text-[#02110c] font-black text-xs flex items-center gap-1.5 shadow"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
