import React, { useState, useMemo } from 'react';
import { Rental, Category, Unit } from '../types';
import { RentalCard } from './RentalCard';
import { Search, Plus } from 'lucide-react';

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
  const [filterState, setFilterState] = useState<'all' | 'green' | 'yellow' | 'red'>('all');

  const now = Date.now();

  // Classify rentals for filtering
  const classifiedRentals = useMemo(() => {
    return rentals.map((r) => {
      const diffMs = new Date(r.expectedEndTime).getTime() - now;
      let state: 'green' | 'yellow' | 'red' = 'green';
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
      green: classifiedRentals.filter((i) => i.state === 'green').length,
      yellow: classifiedRentals.filter((i) => i.state === 'yellow').length,
      red: classifiedRentals.filter((i) => i.state === 'red').length,
    };
  }, [classifiedRentals]);

  const filteredItems = useMemo(() => {
    return classifiedRentals.filter(({ rental, state }) => {
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
  }, [classifiedRentals, filterState, search, units]);

  return (
    <div className="space-y-4 pb-24">
      {/* Search & Fast Filter Bar */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#d5cbbb]/60 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, unidad (K-01) o casillero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#081d15] border border-[#1a422f] rounded-2xl pl-10 pr-4 py-3 text-xs text-[#f3ebd6] placeholder-[#d5cbbb]/40 focus:outline-none focus:border-[#2ea06e] shadow-inner"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-3 text-xs text-[#d5cbbb]/60 hover:text-[#f3ebd6]"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              filterState === 'all'
                ? 'bg-[#1a422f] text-[#f3ebd6] border border-[#f3ebd6]/30 shadow'
                : 'bg-[#081d15] text-[#d5cbbb]/70 border border-[#1a422f]/60 hover:text-[#f3ebd6]'
            }`}
          >
            Todos ({counts.all})
          </button>

          <button
            onClick={() => setFilterState('green')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'green'
                ? 'bg-[#1a422f] text-[#f3ebd6] border border-[#2ea06e] shadow'
                : 'bg-[#081d15] text-[#d5cbbb]/70 border border-[#1a422f]/60 hover:text-[#2ea06e]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#2ea06e]"></span>
            <span>En Tiempo ({counts.green})</span>
          </button>

          <button
            onClick={() => setFilterState('yellow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'yellow'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow'
                : 'bg-[#081d15] text-[#d5cbbb]/70 border border-[#1a422f]/60 hover:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Por Vencer ({counts.yellow})</span>
          </button>

          <button
            onClick={() => setFilterState('red')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              filterState === 'red'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow animate-pulse'
                : 'bg-[#081d15] text-[#d5cbbb]/70 border border-[#1a422f]/60 hover:text-rose-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>En Mora ({counts.red})</span>
          </button>
        </div>
      </div>

      {/* RENTALS GRID */}
      {filteredItems.length === 0 ? (
        <div className="py-14 text-center rounded-3xl bg-[#081d15]/80 border border-[#1a422f] p-6 flex flex-col items-center justify-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#02110c] border border-[#1a422f] flex items-center justify-center text-3xl mb-3 shadow-inner">
            {rentals.length === 0 ? '🌿' : '🔍'}
          </div>
          <h3 className="text-base font-bold text-[#f3ebd6] mb-1">
            {rentals.length === 0 ? 'No hay unidades en alquiler activo' : 'No se encontraron resultados'}
          </h3>
          <p className="text-xs text-[#d5cbbb]/70 max-w-xs mb-5">
            {rentals.length === 0
              ? 'Todas las unidades de Eco Aventura están disponibles en base o parque cerrado.'
              : 'Prueba cambiando los filtros o el término de búsqueda.'}
          </p>
          {rentals.length === 0 && (
            <button
              onClick={onOpenNewRental}
              className="px-5 py-3 rounded-2xl bg-[#f3ebd6] text-[#02110c] font-black text-xs tracking-wide shadow-lg active:scale-95 transition-all flex items-center gap-2 hover:bg-white"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
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
