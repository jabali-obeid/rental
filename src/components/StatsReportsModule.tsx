import React, { useMemo } from 'react';
import { Rental, Category, Unit } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { dataService } from '../services/dataService';
import { Trophy, TrendingUp, DollarSign, Clock, BarChart3, Flame } from 'lucide-react';

interface Props {
  rentals: Rental[];
  categories: Category[];
  units: Unit[];
}

export const StatsReportsModule: React.FC<Props> = ({ rentals, categories, units }) => {
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
    closings.forEach((c) => {
      historicalRevenue += c.totalIngresos;
      historicalRentalsCount += c.totalRentals;
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
    };
  }, [rentals, categories, units]);

  const hourlySlots = [
    { label: '09:00 - 12:00', percent: 45, labelShort: 'Mañana' },
    { label: '13:00 - 16:00', percent: 70, labelShort: 'Mediodía' },
    { label: '16:00 - 19:00', percent: 95, labelShort: 'Tarde / Pico', isPeak: true },
    { label: '19:00 - 22:00', percent: 60, labelShort: 'Noche' },
  ];

  return (
    <div className="space-y-4 pb-24 text-[#f3ebd6]">
      {/* HIGHLIGHT KPIS */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-4 rounded-2xl bg-[#081d15] border border-[#1a422f]">
          <div className="flex items-center justify-between text-[#d5cbbb] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2ea06e]">Facturación Total</span>
            <DollarSign className="w-4 h-4 text-[#2ea06e]" />
          </div>
          <div className="text-2xl font-black text-[#f3ebd6]">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#2ea06e] mt-1">Acumulado Eco Aventura</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#081d15] border border-[#1a422f]">
          <div className="flex items-center justify-between text-[#d5cbbb] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Ticket Promedio</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-[#f3ebd6]">
            ${stats.averageTicket.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#d5cbbb]/60 mt-1">Por cada salida</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#081d15] border border-[#1a422f]">
          <div className="flex items-center justify-between text-[#d5cbbb] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Total Alquileres</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-[#f3ebd6]">
            {stats.totalCount}
          </div>
          <div className="text-[10px] text-[#d5cbbb]/60 mt-1">Servicios despachados</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#081d15] border border-[#1a422f]">
          <div className="flex items-center justify-between text-[#d5cbbb] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Ocupación Flota</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {stats.occupancyPercent}%
          </div>
          <div className="text-[10px] text-[#d5cbbb]/60 mt-1">En pista en este instante</div>
        </div>
      </div>

      {/* CATEGORY RANKING */}
      <div className="p-4 rounded-2xl bg-[#081d15] border border-[#1a422f] space-y-3 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/80 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[#f3ebd6]" />
          <span>Ranking de Categorías Más Alquiladas</span>
        </h3>

        <div className="space-y-3">
          {stats.categoryRanking.map((cat, idx) => (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#d5cbbb]">#{idx + 1}</span>
                  <div className="flex items-center gap-1.5 font-semibold text-[#f3ebd6]">
                    <span className="text-[#2ea06e]">
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </span>
                    <span>{cat.name}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#f3ebd6]">
                  {cat.count} salidas ({cat.percent}%)
                </span>
              </div>

              <div className="w-full bg-[#02110c] rounded-full h-2 overflow-hidden border border-[#1a422f]">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-[#2ea06e]"
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP UNITS RANKING */}
      <div className="p-4 rounded-2xl bg-[#081d15] border border-[#1a422f] space-y-3 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/80 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[#2ea06e]" />
          <span>Top 5 Unidades Más Demandadas</span>
        </h3>

        <div className="space-y-2">
          {stats.unitRanking.map((u, i) => (
            <div
              key={u.id}
              className="p-2.5 rounded-xl bg-[#02110c] border border-[#1a422f] flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-black text-[#f3ebd6] text-xs font-mono">0{i + 1}</span>
                <span className="px-2 py-0.5 rounded-lg bg-[#081d15] text-[#f3ebd6] font-mono font-bold text-xs border border-[#1a422f]">
                  {u.codeNumber}
                </span>
                <span className="text-xs text-[#d5cbbb] font-medium truncate max-w-[140px]">
                  {u.name}
                </span>
              </div>
              <span className="text-xs font-bold text-[#2ea06e] font-mono">
                {u.count} salidas
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* OCCUPANCY BY TIME SLOTS */}
      <div className="p-4 rounded-2xl bg-[#081d15] border border-[#1a422f] space-y-3 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#d5cbbb]/80 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Franjas Horarias de Mayor Demanda</span>
        </h3>

        <div className="space-y-2.5">
          {hourlySlots.map((slot) => (
            <div key={slot.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-[#f3ebd6]">{slot.label}</span>
                  {slot.isPeak && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#1a422f] text-[#f3ebd6] border border-[#2ea06e]">
                      HORA PICO 🔥
                    </span>
                  )}
                </div>
                <span className="font-bold text-[#d5cbbb]">{slot.percent}% Ocupación</span>
              </div>

              <div className="w-full bg-[#02110c] rounded-full h-2 overflow-hidden border border-[#1a422f]">
                <div
                  className={`h-full rounded-full ${
                    slot.isPeak ? 'bg-[#f3ebd6]' : 'bg-[#1a422f]'
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
