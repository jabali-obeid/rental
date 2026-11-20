import React, { useState, useMemo } from 'react';
import { Rental, Category, Unit } from '../types';
import { RentalCard } from './RentalCard';
import { isRentalWaitingStart } from '../hooks/useRentalTimer';
import { useSharedNow } from '../hooks/useSharedNow';
import { IconSearch, IconPlus } from './EcoIcons';

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

  const now = useSharedNow(rentals.length > 0);

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
    const totalUnits = units.length;
    const availableUnits = units.filter((u) => u.status === 'disponible').length;
    const maintenanceUnits = units.filter((u) => u.status === 'mantenimiento' || u.status === 'baja').length;
    const activeOnTime = counts.green;
    const activeAttention = counts.waiting + counts.yellow;
    const activeOverdue = counts.red;

    if (totalUnits === 0) {
      return {
        availableUnits: 0,
        maintenanceUnits: 0,
        totalUnits: 0,
        pActive: 25,
        pAttention: 25,
        pAvail: 25,
        pOverdue: 25,
      };
    }

    const pActive = Math.round((activeOnTime / totalUnits) * 100);
    const pAttention = Math.round((activeAttention / totalUnits) * 100);
    const pAvail = Math.round((availableUnits / totalUnits) * 100);
    const pOverdue = Math.round((activeOverdue / totalUnits) * 100);

    return {
      availableUnits,
      maintenanceUnits,
      totalUnits,
      pActive,
      pAttention,
      pAvail,
      pOverdue,
    };
  }, [units, counts]);

  const filteredItems = useMemo(() => {
    const items = classifiedRentals.filter(({ rental, state }) => {
      if (filterState !== 'all' && state !== filterState) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const unit = units.find((u) => u.id === rental.unitId);
        const matchCustomer = rental.customerName.toLowerCase().includes(query);
        const virtualCode = rental.categoryId === 'c-bungee' ? 'bun bungee' : rental.categoryId === 'c-palestra' ? 'pal palestra' : '';
        const matchUnit =
          unit?.codeNumber.toLowerCase().includes(query) ||
          unit?.name.toLowerCase().includes(query) ||
          virtualCode.includes(query);
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
      {/* HERO HEADER: Greeting + Real Fleet Status Sentence + Segmented Pill Progress Bar */}
      <div className="pt-1 sm:pt-3 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 px-1">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-eco-creamMuted mb-0.5 sm:mb-1">
              Panel Operativo
            </p>
            <h2 className="text-xl sm:text-4xl font-bold tracking-tight text-eco-dark">
              Hola, Eco Aventura
            </h2>
          </div>

          <p className="text-xs sm:text-sm font-medium text-eco-creamDark bg-white/70 sm:bg-transparent px-3 py-2 sm:p-0 rounded-2xl border border-black/[0.04] sm:border-0">
            {counts.all > 0
              ? `${counts.all} ${counts.all === 1 ? 'unidad en pista' : 'unidades en pista'} ahora · ${fleetStats.availableUnits} libres de ${fleetStats.totalUnits} en flota.`
              : `Toda la flota (${fleetStats.totalUnits} unidades) disponible en base para salir.`}
          </p>
        </div>

        {/* Staffwyn Segmented Rounded-Full Progress Bar */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center gap-1 sm:gap-1.5 w-full h-8 sm:h-10">
            {fleetStats.pActive > 0 && (
              <div
                style={{ width: `${fleetStats.pActive}%` }}
                className="h-full min-w-[2.25rem] rounded-full bg-eco-dark text-white text-[11px] sm:text-xs font-bold flex items-center justify-center px-1.5 sm:px-3 transition-all duration-500 shadow-sm truncate whitespace-nowrap overflow-hidden"
                title={`${counts.green} en tiempo`}
              >
                <span className="sm:inline">{counts.green}</span>
                <span className="hidden xs:inline ml-1">en tiempo</span>
              </div>
            )}
            {fleetStats.pAttention > 0 && (
              <div
                style={{ width: `${fleetStats.pAttention}%` }}
                className="h-full min-w-[2.25rem] rounded-full bg-eco-gold text-eco-dark text-[11px] sm:text-xs font-bold flex items-center justify-center px-1.5 sm:px-3 transition-all duration-500 shadow-sm truncate whitespace-nowrap overflow-hidden"
                title={`${counts.waiting + counts.yellow} por iniciar / vencer`}
              >
                <span className="sm:inline">{counts.waiting + counts.yellow}</span>
                <span className="hidden xs:inline ml-1">atención</span>
              </div>
            )}
            {(fleetStats.pAvail > 0 || (fleetStats.pActive === 0 && fleetStats.pAttention === 0 && fleetStats.pOverdue === 0)) && (
              <div
                style={{ width: `${Math.max(fleetStats.pAvail, fleetStats.pActive === 0 && fleetStats.pAttention === 0 && fleetStats.pOverdue === 0 ? 100 : 0)}%` }}
                className="h-full min-w-[2.25rem] flex-1 rounded-full bg-diagonal-stripes border border-black/10 text-eco-dark text-[11px] sm:text-xs font-bold flex items-center justify-center px-1.5 sm:px-3 transition-all duration-500 truncate whitespace-nowrap overflow-hidden"
                title={`${fleetStats.availableUnits} libres`}
              >
                <span className="sm:inline">{fleetStats.availableUnits}</span>
                <span className="hidden xs:inline ml-1">libres</span>
              </div>
            )}
            {fleetStats.pOverdue > 0 && (
              <div
                style={{ width: `${fleetStats.pOverdue}%` }}
                className="h-full min-w-[2.25rem] rounded-full bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-[11px] sm:text-xs font-bold flex items-center justify-center px-1 sm:px-2.5 transition-all duration-500 truncate whitespace-nowrap overflow-hidden"
                title={`${counts.red} en mora`}
              >
                {counts.red}
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 text-[11px] font-medium text-eco-creamMuted pl-2">
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
          <IconSearch className="w-4 h-4 text-eco-creamMuted absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, unidad (K-01) o casillero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-eco-surface border border-black/[0.06] rounded-full pl-10 pr-4 py-3 text-xs text-eco-dark placeholder-eco-creamMuted focus:outline-none focus:border-eco-dark transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-3 text-xs font-semibold text-eco-creamMuted hover:text-eco-dark"
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
                ? 'bg-eco-dark text-white shadow-sm'
                : 'bg-eco-surface text-eco-creamDark border border-black/[0.05] hover:text-eco-dark'
            }`}
          >
            Todos ({counts.all})
          </button>

          <button
            onClick={() => setFilterState('waiting')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'waiting'
                ? 'bg-eco-gold text-eco-dark border border-black/10 shadow-sm'
                : 'bg-eco-surface text-eco-creamDark border border-black/[0.05] hover:text-eco-dark'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-eco-dark"></span>
            <span>Por Iniciar ({counts.waiting})</span>
          </button>

          <button
            onClick={() => setFilterState('green')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'green'
                ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] shadow-sm'
                : 'bg-eco-surface text-eco-creamDark border border-black/[0.05] hover:text-[#166534]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-eco-leaf"></span>
            <span>En Tiempo ({counts.green})</span>
          </button>

          <button
            onClick={() => setFilterState('yellow')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'yellow'
                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shadow-sm'
                : 'bg-eco-surface text-eco-creamDark border border-black/[0.05] hover:text-[#92400E]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
            <span>Por Vencer ({counts.yellow})</span>
          </button>

          <button
            onClick={() => setFilterState('red')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'red'
                ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] shadow-sm'
                : 'bg-eco-surface text-eco-creamDark border border-black/[0.05] hover:text-[#991B1B]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
            <span>En Mora ({counts.red})</span>
          </button>
        </div>
      </div>

      {/* RENTALS GRID */}
      {filteredItems.length === 0 ? (
        <div className="py-14 text-center rounded-[28px] bg-white/95 border border-black/[0.05] p-6 flex flex-col items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-16 h-16 rounded-2xl bg-eco-surface border border-black/[0.06] flex items-center justify-center text-3xl mb-3">
            {rentals.length === 0 ? '🌿' : '🔍'}
          </div>
          <h3 className="text-base font-bold text-eco-dark mb-1">
            {rentals.length === 0 ? 'No hay unidades en alquiler activo' : 'No se encontraron resultados'}
          </h3>
          <p className="text-xs text-eco-creamMuted max-w-xs mb-5">
            {rentals.length === 0
              ? 'Todas las unidades de Eco Aventura están disponibles en base o parque cerrado.'
              : 'Prueba cambiando los filtros o el término de búsqueda.'}
          </p>
          {rentals.length === 0 && (
            <button
              onClick={onOpenNewRental}
              className="px-6 py-3 rounded-full bg-eco-dark text-white font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all flex items-center gap-2 hover:bg-eco-forestLight"
            >
              <IconPlus className="w-4 h-4 text-eco-gold" />
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
