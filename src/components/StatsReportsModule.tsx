import React, { useMemo, useState } from 'react';
import { Rental, Category, Unit } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { dataService } from '../services/dataService';
import { soundService } from '../services/sound';
import { uiFeedback } from '../services/uiFeedback';
import { Trophy, TrendingUp, DollarSign, Clock, BarChart3, Flame, Trash2, RefreshCw } from 'lucide-react';

interface Props {
  rentals: Rental[];
  categories: Category[];
  units: Unit[];
}

export const StatsReportsModule: React.FC<Props> = ({ rentals, categories, units }) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearHistory = async () => {
    const confirmed = await uiFeedback.confirm({
      title: 'Borrar historial a $0',
      message: '¿Estás seguro de que querés borrar todo el historial de facturación, alquileres y cierres de caja (tanto en este dispositivo como en la nube Supabase) y dejar todo en $0?',
      confirmLabel: 'Borrar todo',
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
    setIsClearing(true);
    try {
      await dataService.resetToCleanState();
      soundService.playSuccess();
      uiFeedback.toast('Historial reiniciado a $0.', 'success');
    } finally {
      setIsClearing(false);
    }
  };
  const stats = useMemo(() => {
    let totalRevenue = 0;
    const categoryCounts: Record<string, number> = {};
    const unitCounts: Record<string, number> = {};

    rentals.forEach((r) => {
      totalRevenue += r.totalPrice;
      categoryCounts[r.categoryId] = (categoryCounts[r.categoryId] || 0) + 1;
      unitCounts[r.unitId] = (unitCounts[r.unitId] || 0) + 1;
    });

    const closings = dataService.getDailyClosings();
    let historicalRevenue = 0;
    let historicalRentalsCount = 0;
    const allRecordedRentalsMap = new Map<string, Rental>();
    rentals.forEach((r) => allRecordedRentalsMap.set(r.id, r));
    closings.forEach((c) => {
      historicalRevenue += c.totalIngresos;
      historicalRentalsCount += c.totalRentals;
      c.rentalsSnapshot?.forEach((r) => {
        if (!allRecordedRentalsMap.has(r.id)) {
          allRecordedRentalsMap.set(r.id, r);
        }
      });
    });

    const slotDefs = [
      { label: '09:00 - 12:00', labelShort: 'Mañana', match: (h: number) => h < 13 },
      { label: '13:00 - 16:00', labelShort: 'Mediodía', match: (h: number) => h >= 13 && h < 16 },
      { label: '16:00 - 19:00', labelShort: 'Tarde', match: (h: number) => h >= 16 && h < 19 },
      { label: '19:00 - 22:00', labelShort: 'Noche', match: (h: number) => h >= 19 },
    ];
    const slotCounts = [0, 0, 0, 0];
    allRecordedRentalsMap.forEach((r) => {
      const hour = new Date(r.startTime).getHours();
      const idx = slotDefs.findIndex((s) => s.match(hour));
      if (idx !== -1) slotCounts[idx] += 1;
    });
    const totalSlotRentals = slotCounts.reduce((acc, n) => acc + n, 0);
    const maxSlotCount = Math.max(0, ...slotCounts);
    const hourlySlots = slotDefs.map((slot, idx) => {
      const count = slotCounts[idx];
      const percent = totalSlotRentals > 0 ? Math.round((count / totalSlotRentals) * 100) : 0;
      const isPeak = maxSlotCount > 0 && count === maxSlotCount;
      return {
        label: slot.label,
        labelShort: slot.labelShort,
        count,
        percent,
        isPeak,
      };
    });

    const combinedRevenue = totalRevenue + historicalRevenue;
    const combinedCount = rentals.length + historicalRentalsCount;
    const averageTicket = combinedCount > 0 ? Math.round(combinedRevenue / combinedCount) : 0;

    const categoryRanking = categories.map((c) => ({
      ...c,
      count: categoryCounts[c.id] || 0,
      percent: rentals.length > 0 ? Math.round(((categoryCounts[c.id] || 0) / rentals.length) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    const unitRanking = units.map((u) => {
      const cat = categories.find((c) => c.id === u.categoryId);
      return {
        ...u,
        categoryName: cat?.name || '',
        categoryColor: cat?.color || '#10b981',
        count: unitCounts[u.id] || 0,
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    const activeRentalsCount = rentals.filter((r) => r.status === 'activo').length;
    const occupancyPercent = units.length > 0 ? Math.round((activeRentalsCount / units.length) * 100) : 0;

    return {
      totalRevenue: combinedRevenue,
      averageTicket,
      totalCount: combinedCount,
      categoryRanking,
      unitRanking,
      occupancyPercent,
      hourlySlots,
    };
  }, [rentals, categories, units]);

  return (
    <div className="space-y-4 pb-24 text-eco-dark">
      {/* TOP BAR WITH CLEAR HISTORY BUTTON */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-lg font-bold text-eco-dark">Métricas e Historial Acumulado</h2>
          <p className="text-xs text-eco-creamMuted">Resumen general de facturación y salidas</p>
        </div>

        {(stats.totalCount > 0 || stats.totalRevenue > 0) && (
          <button
            type="button"
            disabled={isClearing}
            onClick={handleClearHistory}
            className="px-4 py-2 rounded-full bg-[#FEE2E2] hover:bg-[#FECACA] border border-[#FCA5A5] text-[#991B1B] text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            {isClearing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#991B1B]" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 text-[#991B1B]" />
            )}
            <span>{isClearing ? 'Borrando...' : 'Borrar Historial a $0'}</span>
          </button>
        )}
      </div>

      {/* HIGHLIGHT KPIS (Bento Grid with Staffwyn Dark Accent Card) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-5 rounded-[28px] bg-eco-dark text-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex items-center justify-between text-white/70 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-eco-gold">Facturación Total</span>
            <DollarSign className="w-4 h-4 text-eco-gold" />
          </div>
          <div className="text-2xl font-black text-white">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-white/60 mt-1">Acumulado Eco Aventura</div>
        </div>

        <div className="p-5 rounded-[28px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-eco-creamMuted mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-eco-dark">Ticket Promedio</span>
            <TrendingUp className="w-4 h-4 text-eco-dark" />
          </div>
          <div className="text-2xl font-black text-eco-dark">
            ${stats.averageTicket.toLocaleString()}
          </div>
          <div className="text-[10px] text-eco-creamMuted mt-1">Por cada salida</div>
        </div>

        <div className="p-5 rounded-[28px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-eco-creamMuted mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-eco-dark">Total Alquileres</span>
            <BarChart3 className="w-4 h-4 text-eco-dark" />
          </div>
          <div className="text-2xl font-black text-eco-dark">
            {stats.totalCount}
          </div>
          <div className="text-[10px] text-eco-creamMuted mt-1">Servicios despachados</div>
        </div>

        <div className="p-5 rounded-[28px] bg-eco-gold text-eco-dark shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-eco-dark/80 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-eco-dark">Ocupación Flota</span>
            <Flame className="w-4 h-4 text-eco-dark" />
          </div>
          <div className="text-2xl font-black text-eco-dark">
            {stats.occupancyPercent}%
          </div>
          <div className="text-[10px] text-eco-dark/75 mt-1">En pista en este instante</div>
        </div>
      </div>

      {/* CATEGORY RANKING */}
      <div className="p-5 rounded-[28px] bg-white border border-black/[0.05] space-y-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-eco-creamMuted flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-eco-dark" />
          <span>Ranking de Categorías Más Alquiladas</span>
        </h3>

        <div className="space-y-3">
          {stats.categoryRanking.map((cat, idx) => (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-eco-creamMuted">#{idx + 1}</span>
                  <div className="flex items-center gap-1.5 font-semibold text-eco-dark">
                    <span className="text-eco-dark">
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </span>
                    <span>{cat.name}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-eco-dark">
                  {cat.count} salidas ({cat.percent}%)
                </span>
              </div>

              <div className="w-full bg-eco-surface rounded-full h-2.5 overflow-hidden border border-black/[0.05]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    idx === 0 ? 'bg-eco-dark' : 'bg-eco-gold'
                  }`}
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP UNITS RANKING */}
      <div className="p-5 rounded-[28px] bg-white border border-black/[0.05] space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-eco-creamMuted flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[#D97706]" />
          <span>Top 5 Unidades Más Demandadas</span>
        </h3>

        <div className="space-y-2">
          {stats.unitRanking.map((u, i) => (
            <div
              key={u.id}
              className="p-3 rounded-2xl bg-eco-surface border border-black/[0.05] flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-black text-eco-creamMuted text-xs font-mono">0{i + 1}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-eco-dark text-white font-mono font-bold text-xs">
                  {u.codeNumber}
                </span>
                <span className="text-xs text-eco-dark font-semibold truncate max-w-[140px]">
                  {u.name}
                </span>
              </div>
              <span className="text-xs font-bold text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full font-mono">
                {u.count} salidas
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* OCCUPANCY BY TIME SLOTS */}
      <div className="p-5 rounded-[28px] bg-white border border-black/[0.05] space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-eco-creamMuted flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-eco-dark" />
          <span>Franjas Horarias de Mayor Demanda</span>
        </h3>

        <div className="space-y-2.5">
          {stats.hourlySlots.map((slot) => (
            <div key={slot.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-eco-dark">{slot.label}</span>
                  {slot.isPeak && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-eco-gold text-eco-dark">
                      HORA PICO
                    </span>
                  )}
                </div>
                <span className="font-bold text-eco-creamDark tabular-nums">
                  {slot.percent}% ({slot.count} {slot.count === 1 ? 'salida' : 'salidas'})
                </span>
              </div>

              <div className="w-full bg-eco-surface rounded-full h-2.5 overflow-hidden border border-black/[0.05]">
                <div
                  className={`h-full rounded-full ${
                    slot.isPeak ? 'bg-eco-gold' : 'bg-eco-dark'
                  }`}
                  style={{ width: `${slot.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
