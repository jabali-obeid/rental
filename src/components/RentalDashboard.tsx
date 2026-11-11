import React, { useState, useMemo } from 'react';
import { Rental, Category, Unit } from '../types';
import { RentalCard } from './RentalCard';
import { isRentalWaitingStart } from '../hooks/useRentalTimer';
import { Search, Plus, Bike, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  rentals: Rental[];
  categories: Category[];
  units: Unit[];
  onOpenNewRental: () => void;
  onFinishRental: (rental: Rental) => void;
  onReserveRental?: (rental: Rental) => void;
}

export const RentalDashboard: React.FC<Props> = ({
  rentals,
  categories,
  units,
  onOpenNewRental,
  onFinishRental,
  onReserveRental,
}) => {
  const [search, setSearch] = useState<string>('');
  const [filterState, setFilterState] = useState<'all' | 'waiting' | 'green' | 'yellow' | 'red'>('all');

  const now = Date.now();

  // Classify rentals for filtering
  const classifiedRentals = useMemo(() => {
    return rentals.map((r) => {
      if (isRentalWaitingStart(r)) {
        return { rental: r, state: 'waiting' as const };
      }
      const diffMs = new Date(r.expectedEndTime).getTime() - now;
      let state: 'waiting' | 'green' | 'yellow' | 'red' = 'green';
      if (diffMs <= 0) {
        state = 'red';
      } else if (diffMs <= 5 * 60 * 1000) {
        state = 'yellow';
      } else {
        state = 'green';
      }
      return { rental: r, state };
    });
  }, [rentals, now]);

  const counts = useMemo(() => {
    return {
      all: classifiedRentals.length,
      waiting: classifiedRentals.filter((i) => i.state === 'waiting').length,
      green: classifiedRentals.filter((i) => i.state === 'green').length,
      yellow: classifiedRentals.filter((i) => i.state === 'yellow').length,
      red: classifiedRentals.filter((i) => i.state === 'red').length,
    };
  }, [classifiedRentals]);

  const fleetStats = useMemo(() => {
    const totalUnits = Math.max(1, units.length);
    const availableUnits = units.filter((u) => u.status === 'disponible').length;
    const maintenanceUnits = units.filter((u) => u.status === 'mantenimiento' || u.status === 'baja').length;
    const activeOnTime = counts.green;
    const activeAttention = counts.waiting + counts.yellow + counts.red;

    const pActive = Math.max(12, Math.round((activeOnTime / totalUnits) * 100) || (rentals.length > 0 ? 45 : 65));
    const pAttention = Math.max(10, Math.round((activeAttention / totalUnits) * 100) || 15);
    const pAvail = Math.max(10, Math.round((availableUnits / totalUnits) * 100) || 15);
    const pMaint = Math.max(5, 100 - Math.min(95, pActive + pAttention + pAvail));

    return {
      availableUnits,
      maintenanceUnits,
      totalUnits: units.length,
      pActive,
      pAttention,
      pAvail,
      pMaint,
    };
  }, [units, counts, rentals.length]);

  const filteredItems = useMemo(() => {
    const items = classifiedRentals.filter(({ rental, state }) => {
      if (filterState !== 'all' && state !== filterState) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const unit = units.find((u) => u.id === rental.unitId);
        const matchCustomer = rental.customerName.toLowerCase().includes(query);
        const matchUnit = unit?.codeNumber.toLowerCase().includes(query) || unit?.name.toLowerCase().includes(query);
        const matchLocker = rental.docLocker.toLowerCase().includes(query);
        if (!matchCustomer && !matchUnit && !matchLocker) return false;
      }
      return true;
    });

    // Prioritize rentals waiting to be started at the top so the track operator sees them immediately
    return items.sort((a, b) => {
      if (a.state === 'waiting' && b.state !== 'waiting') return -1;
      if (a.state !== 'waiting' && b.state === 'waiting') return 1;
      return 0;
    });
  }, [classifiedRentals, filterState, search, units]);

  return (
    <div className="space-y-5 pb-24">
      {/* STAFFWYN HERO HEADER: Greeting + Big Right KPIs + Segmented Pill Progress Bar */}
      <div className="pt-1 sm:pt-3 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#71706B] mb-1">
              Panel Operativo en Tiempo Real
            </p>
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-[#1C1C1C]">
              Hola, Eco Aventura
            </h2>
          </div>

          {/* 3 Big Clean KPI Counters (Staffwyn Top-Right Style) */}
          <div className="flex items-center gap-6 sm:gap-10">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#71706B] mb-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>En pista</span>
              </div>
              <div className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1C1C]">
                {counts.all}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#71706B] mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Disponibles</span>
              </div>
              <div className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1C1C]">
                {fleetStats.availableUnits}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#71706B] mb-0.5">
                <Bike className="w-3.5 h-3.5" />
                <span>Flota total</span>
              </div>
              <div className="text-2xl sm:text-4xl font-normal tracking-tight text-[#1C1C1C]">
                {fleetStats.totalUnits}
              </div>
            </div>
          </div>
        </div>

        {/* Staffwyn Segmented Rounded-Full Progress Bar */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center gap-1.5 w-full h-9 sm:h-10">
            <div
              style={{ width: `${fleetStats.pActive}%` }}
              className="h-full rounded-full bg-[#1C1C1C] text-white text-xs font-bold flex items-center justify-center px-3 transition-all duration-500 shadow-sm"
            >
              {counts.green} en tiempo
            </div>
            <div
              style={{ width: `${fleetStats.pAttention}%` }}
              className="h-full rounded-full bg-[#F7D147] text-[#1C1C1C] text-xs font-bold flex items-center justify-center px-3 transition-all duration-500 shadow-sm"
            >
              {counts.waiting + counts.yellow} atención
            </div>
            <div
              style={{ width: `${fleetStats.pAvail}%` }}
              className="h-full rounded-full bg-diagonal-stripes border border-black/10 text-[#1C1C1C] text-xs font-bold flex items-center justify-center px-3 transition-all duration-500"
            >
              {fleetStats.availableUnits} libres
            </div>
            <div
              style={{ width: `${fleetStats.pMaint}%` }}
              className="h-full rounded-full bg-[#EAE4D3] text-[#1C1C1C] text-xs font-bold flex items-center justify-center px-2.5 transition-all duration-500"
            >
              {counts.red}
            </div>
          </div>

          <div className="flex items-center gap-5 text-[11px] font-medium text-[#71706B] pl-2">
            <span>En Tiempo ({counts.green})</span>
            <span>Por Iniciar / Vencer ({counts.waiting + counts.yellow})</span>
            <span>Disponibles ({fleetStats.availableUnits})</span>
            <span>En Mora ({counts.red})</span>
          </div>
        </div>
      </div>

      {/* Search & Fast Filter Bar */}
      <div className="bg-white/95 rounded-[28px] p-3.5 sm:p-4 border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#71706B] absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, unidad (K-01) o casillero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F6F3EA] border border-black/[0.06] rounded-full pl-10 pr-4 py-3 text-xs text-[#1C1C1C] placeholder-[#71706B] focus:outline-none focus:border-[#1C1C1C] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-3 text-xs font-semibold text-[#71706B] hover:text-[#1C1C1C]"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setFilterState('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
              filterState === 'all'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'bg-[#F6F3EA] text-[#52514E] border border-black/[0.05] hover:text-[#1C1C1C]'
            }`}
          >
            Todos ({counts.all})
          </button>

          <button
            onClick={() => setFilterState('waiting')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'waiting'
                ? 'bg-[#F7D147] text-[#1C1C1C] border border-black/10 shadow-sm'
                : 'bg-[#F6F3EA] text-[#52514E] border border-black/[0.05] hover:text-[#1C1C1C]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#1C1C1C] animate-pulse"></span>
            <span>Por Iniciar ({counts.waiting})</span>
          </button>

          <button
            onClick={() => setFilterState('green')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'green'
                ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] shadow-sm'
                : 'bg-[#F6F3EA] text-[#52514E] border border-black/[0.05] hover:text-[#166534]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
            <span>En Tiempo ({counts.green})</span>
          </button>

          <button
            onClick={() => setFilterState('yellow')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'yellow'
                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shadow-sm'
                : 'bg-[#F6F3EA] text-[#52514E] border border-black/[0.05] hover:text-[#92400E]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
            <span>Por Vencer ({counts.yellow})</span>
          </button>

          <button
            onClick={() => setFilterState('red')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'red'
                ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] shadow-sm animate-pulse'
                : 'bg-[#F6F3EA] text-[#52514E] border border-black/[0.05] hover:text-[#991B1B]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping"></span>
            <span>En Mora ({counts.red})</span>
          </button>
        </div>
      </div>

      {/* RENTALS GRID */}
      {filteredItems.length === 0 ? (
        <div className="py-14 text-center rounded-[28px] bg-white/95 border border-black/[0.05] p-6 flex flex-col items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-16 h-16 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] flex items-center justify-center text-3xl mb-3">
            {rentals.length === 0 ? '🌿' : '🔍'}
          </div>
          <h3 className="text-base font-bold text-[#1C1C1C] mb-1">
            {rentals.length === 0 ? 'No hay unidades en alquiler activo' : 'No se encontraron resultados'}
          </h3>
          <p className="text-xs text-[#71706B] max-w-xs mb-5">
            {rentals.length === 0
              ? 'Todas las unidades de Eco Aventura están disponibles en base o parque cerrado.'
              : 'Prueba cambiando los filtros o el término de búsqueda.'}
          </p>
          {rentals.length === 0 && (
            <button
              onClick={onOpenNewRental}
              className="px-6 py-3 rounded-full bg-[#1C1C1C] text-white font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all flex items-center gap-2 hover:bg-[#333333]"
            >
              <Plus className="w-4 h-4 stroke-[3] text-[#F7D147]" />
              <span>NUEVO ALQUILER ECO AVENTURA</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(({ rental }) => {
            const category = categories.find((c) => c.id === rental.categoryId);
            const unit = units.find((u) => u.id === rental.unitId);
            return (
              <RentalCard
                key={rental.id}
                rental={rental}
                category={category}
                unit={unit}
                onFinishClick={onFinishRental}
                onReserveClick={onReserveRental}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
