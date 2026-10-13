import React, { useState, useId } from 'react';
import { Unit, Category, UnitStatus } from '../types';
import { dataService } from '../services/dataService';
import { Plus, Wrench, CheckCircle, Ban, Trash2, X, PlusCircle, DollarSign, Check, Sliders } from 'lucide-react';
import { soundService } from '../services/sound';

interface Props {
  units: Unit[];
  categories: Category[];
}

export const InventoryModule: React.FC<Props> = ({ units, categories }) => {
  const newCodeId = useId();
  const newNameId = useId();
  const newCatId = useId();
  const newNotesId = useId();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState<boolean>(false);

  // New Unit Form State
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newCategoryId, setNewCategoryId] = useState<string>(categories[0]?.id || '');
  const [newNotes, setNewNotes] = useState<string>('');

  // Rates edit state (cloned from current categories)
  const [ratesDraft, setRatesDraft] = useState<Record<string, {
    cash30m: number;
    cash60m: number;
    dig30m: number;
    dig60m: number;
    penalty10m: number;
  }>>(() => {
    const init: Record<string, { cash30m: number; cash60m: number; dig30m: number; dig60m: number; penalty10m: number }> = {};
    categories.forEach((c) => {
      init[c.id] = {
        cash30m: c.cashRate30m ?? c.defaultRate30m,
        cash60m: c.cashRate60m ?? c.defaultRate60m,
        dig30m: c.digitalRate30m ?? c.defaultRate30m,
        dig60m: c.digitalRate60m ?? c.defaultRate60m,
        penalty10m: c.penaltyRate10Min || (c.penaltyRatePerMin ? c.penaltyRatePerMin * 10 : Math.round(c.defaultRate30m / 3)),
      };
    });
    return init;
  });

  const counts = {
    total: units.length,
    disponible: units.filter((u) => u.status === 'disponible').length,
    alquilado: units.filter((u) => u.status === 'alquilado').length,
    mantenimiento: units.filter((u) => u.status === 'mantenimiento').length,
    baja: units.filter((u) => u.status === 'baja').length,
  };

  const filteredUnits = units.filter((u) => {
    if (selectedCategoryFilter !== 'all' && u.categoryId !== selectedCategoryFilter) return false;
    return true;
  });

  const handleStatusChange = (unitId: string, newStatus: UnitStatus) => {
    dataService.updateUnitStatus(unitId, newStatus);
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      alert('Completa el código y nombre de la unidad');
      return;
    }

    dataService.addUnit({
      codeNumber: newCode.trim().toUpperCase(),
      name: newName.trim(),
      categoryId: newCategoryId,
      status: 'disponible',
      notes: newNotes.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setNewCode('');
    setNewName('');
    setNewNotes('');
  };

  const handleDeleteUnit = (unitId: string, unitCode: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar la unidad ${unitCode}?`)) {
      dataService.deleteUnit(unitId);
    }
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    Object.entries(ratesDraft).forEach(([catId, vals]) => {
      dataService.updateCategory(catId, {
        defaultRate30m: vals.cash30m,
        defaultRate60m: vals.cash60m,
        cashRate30m: vals.cash30m,
        cashRate60m: vals.cash60m,
        digitalRate30m: vals.dig30m,
        digitalRate60m: vals.dig60m,
        penaltyRate10Min: vals.penalty10m,
        penaltyRatePerMin: Math.round(vals.penalty10m / 10),
      });
    });
    soundService.playSuccess();
    setIsRatesModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-24 text-[#f3ebd6]">
      {/* Fleet Summary Counters */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3.5 rounded-2xl bg-[#081d15] border border-[#1a422f] text-center">
          <div className="text-xl font-black text-[#f3ebd6]">{counts.disponible}</div>
          <div className="text-[10px] font-bold text-[#2ea06e] uppercase tracking-tight">Disponibles</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#081d15] border border-[#1a422f] text-center">
          <div className="text-xl font-black text-cyan-400">{counts.alquilado}</div>
          <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-tight">Alquilados</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#081d15] border border-[#1a422f] text-center">
          <div className="text-xl font-black text-amber-400">{counts.mantenimiento}</div>
          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-tight">Taller</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#081d15] border border-[#1a422f] text-center">
          <div className="text-xl font-black text-[#d5cbbb]">{counts.total}</div>
          <div className="text-[10px] font-bold text-[#d5cbbb]/70 uppercase tracking-tight">Total Flota</div>
        </div>
      </div>

      {/* Top Filter & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#1a422f] text-[#f3ebd6] border border-[#f3ebd6]/30 shadow'
                : 'bg-[#081d15] text-[#d5cbbb]/70 border border-[#1a422f] hover:text-[#f3ebd6]'
            }`}
          >
            Todas ({units.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategoryFilter === c.id
                  ? 'bg-[#1a422f] text-[#f3ebd6] border border-[#f3ebd6]/30 shadow'
                  : 'bg-[#081d15] text-[#d5cbbb]/70 border border-[#1a422f] hover:text-[#f3ebd6]'
              }`}
            >
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Buttons: Edit Rates & Add Unit */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Refresh draft with latest categories
              const init: Record<string, { cash30m: number; cash60m: number; dig30m: number; dig60m: number; penalty10m: number }> = {};
              categories.forEach((c) => {
                init[c.id] = {
                  cash30m: c.cashRate30m ?? c.defaultRate30m,
                  cash60m: c.cashRate60m ?? c.defaultRate60m,
                  dig30m: c.digitalRate30m ?? c.defaultRate30m,
                  dig60m: c.digitalRate60m ?? c.defaultRate60m,
                  penalty10m: c.penaltyRate10Min || (c.penaltyRatePerMin ? c.penaltyRatePerMin * 10 : Math.round(c.defaultRate30m / 3)),
                };
              });
              setRatesDraft(init);
              setIsRatesModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#081d15] border border-[#1a422f] text-[#f3ebd6] text-xs font-bold hover:bg-[#1a422f] shrink-0 shadow transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-[#2ea06e]" />
            <span>Editar Tarifas</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f3ebd6] text-[#02110c] text-xs font-black hover:bg-white shrink-0 shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Nueva Unidad</span>
          </button>
        </div>
      </div>

      {/* Units List */}
      <div className="space-y-2.5">
        {filteredUnits.map((u) => {
          const category = categories.find((c) => c.id === u.categoryId);

          return (
            <div
              key={u.id}
              className="p-3.5 rounded-2xl bg-[#081d15] border border-[#1a422f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
            >
              {/* Left Details */}
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-[#02110c] font-mono font-black text-sm text-[#f3ebd6] flex items-center justify-center border border-[#1a422f] shadow-inner">
                  {u.codeNumber}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#f3ebd6] leading-tight">{u.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#02110c] text-[#2ea06e] border border-[#1a422f]">
                      {category?.name}
                    </span>
                  </div>

                  {u.notes && (
                    <p className="text-[11px] text-amber-300/90 mt-0.5 flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      <span>{u.notes}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Right Quick Status Selector */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 border-[#1a422f] pt-2 sm:pt-0">
                {u.status === 'alquilado' ? (
                  <span className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>En Alquiler</span>
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleStatusChange(u.id, 'disponible')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                        u.status === 'disponible'
                          ? 'bg-[#1a422f] text-[#f3ebd6] border border-[#2ea06e] font-bold'
                          : 'bg-[#02110c] text-[#d5cbbb]/60 border border-[#1a422f] hover:text-[#f3ebd6]'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-[#2ea06e]" />
                      <span>Disponible</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(u.id, 'mantenimiento')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                        u.status === 'mantenimiento'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500 font-bold'
                          : 'bg-[#02110c] text-[#d5cbbb]/60 border border-[#1a422f] hover:text-white'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      <span>Taller</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(u.id, 'baja')}
                      className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                        u.status === 'baja'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500 font-bold'
                          : 'bg-[#02110c] text-[#d5cbbb]/60 border border-[#1a422f] hover:text-white'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>Baja</span>
                    </button>

                    <button
                      onClick={() => handleDeleteUnit(u.id, u.codeNumber)}
                      className="p-1.5 rounded-xl text-[#d5cbbb]/50 hover:text-rose-400 hover:bg-[#02110c] transition-colors ml-1"
                      title="Eliminar de la base"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Unit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02110c]/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#081d15] border border-[#1a422f] shadow-2xl overflow-hidden text-[#f3ebd6]">
            <div className="p-4 border-b border-[#1a422f] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#f3ebd6] flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#2ea06e]" />
                <span>Agregar Nueva Unidad - Eco Aventura</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full text-[#d5cbbb] hover:text-[#f3ebd6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="p-4 space-y-3.5">
              <div>
                <label htmlFor={newCatId} className="text-xs font-bold text-[#d5cbbb] block mb-1">Categoría</label>
                <select
                  id={newCatId}
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] focus:outline-none focus:border-[#f3ebd6]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#081d15] text-[#f3ebd6]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={newCodeId} className="text-xs font-bold text-[#d5cbbb] block mb-1">
                  Código de Identificación (ej: K-05, KY-04, MP-05) *
                </label>
                <input
                  id={newCodeId}
                  type="text"
                  required
                  placeholder="K-05"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#f3ebd6] focus:outline-none focus:border-[#f3ebd6] uppercase"
                />
              </div>

              <div>
                <label htmlFor={newNameId} className="text-xs font-bold text-[#d5cbbb] block mb-1">
                  Nombre descriptivo *
                </label>
                <input
                  id={newNameId}
                  type="text"
                  required
                  placeholder="Ej: Karting Negro Safari Edition"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] focus:outline-none focus:border-[#f3ebd6]"
                />
              </div>

              <div>
                <label htmlFor={newNotesId} className="text-xs font-bold text-[#d5cbbb] block mb-1">
                  Notas de mantenimiento (opcional)
                </label>
                <input
                  id={newNotesId}
                  type="text"
                  placeholder="Ej: Batería nueva comprada oct-2026"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] focus:outline-none focus:border-[#f3ebd6]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#f3ebd6] text-[#02110c] font-black text-xs tracking-wider shadow-lg active:scale-98 transition-all hover:bg-white"
                >
                  GUARDAR UNIDAD EN INVENTARIO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rates Modal */}
      {isRatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02110c]/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#081d15] border border-[#1a422f] shadow-2xl text-[#f3ebd6]">
            <div className="p-4 border-b border-[#1a422f] flex items-center justify-between sticky top-0 bg-[#081d15]/95 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#2ea06e]" />
                <h3 className="text-sm font-extrabold text-[#f3ebd6]">Configurar Tarifas y Precios</h3>
              </div>
              <button
                onClick={() => setIsRatesModalOpen(false)}
                className="p-1.5 rounded-full text-[#d5cbbb] hover:text-[#f3ebd6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRates} className="p-4 space-y-4">
              <p className="text-xs text-[#d5cbbb]/70">
                Modifica aquí las tarifas base y recargos por demora. Se aplicarán de inmediato a los nuevos alquileres.
              </p>

              {categories.map((c) => {
                const currentVals = ratesDraft[c.id] || {
                  cash30m: c.cashRate30m ?? c.defaultRate30m,
                  cash60m: c.cashRate60m ?? c.defaultRate60m,
                  dig30m: c.digitalRate30m ?? c.defaultRate30m,
                  dig60m: c.digitalRate60m ?? c.defaultRate60m,
                  penalty10m: c.penaltyRate10Min || 6000,
                };

                return (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-[#02110c] border border-[#1a422f] space-y-3">
                    <div className="flex items-center justify-between font-bold text-xs text-[#f3ebd6]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                        <span className="font-extrabold">{c.name}</span>
                      </span>
                    </div>

                    {/* Precios Efectivo */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2ea06e] flex items-center gap-1">
                        💵 Tarifas en Efectivo:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-[#d5cbbb]/70 block mb-0.5">Efectivo 30 min ($)</label>
                          <input
                            type="number"
                            step="100"
                            min="0"
                            value={currentVals.cash30m}
                            onChange={(e) =>
                              setRatesDraft({
                                ...ratesDraft,
                                [c.id]: { ...currentVals, cash30m: Number(e.target.value) || 0 },
                              })
                            }
                            className="w-full bg-[#081d15] border border-[#1a422f] rounded-xl px-2.5 py-1.5 text-center font-bold text-[#f3ebd6] focus:outline-none focus:border-[#2ea06e]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#d5cbbb]/70 block mb-0.5">Efectivo 1 hora ($)</label>
                          <input
                            type="number"
                            step="100"
                            min="0"
                            value={currentVals.cash60m}
                            onChange={(e) =>
                              setRatesDraft({
                                ...ratesDraft,
                                [c.id]: { ...currentVals, cash60m: Number(e.target.value) || 0 },
                              })
                            }
                            className="w-full bg-[#081d15] border border-[#1a422f] rounded-xl px-2.5 py-1.5 text-center font-bold text-[#f3ebd6] focus:outline-none focus:border-[#2ea06e]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Precios Transferencia / Tarjeta */}
                    <div className="space-y-1 pt-1 border-t border-[#1a422f]/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                        📲 Tarifas Transferencia / Tarjeta:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-[#d5cbbb]/70 block mb-0.5">Digital 30 min ($)</label>
                          <input
                            type="number"
                            step="100"
                            min="0"
                            value={currentVals.dig30m}
                            onChange={(e) =>
                              setRatesDraft({
                                ...ratesDraft,
                                [c.id]: { ...currentVals, dig30m: Number(e.target.value) || 0 },
                              })
                            }
                            className="w-full bg-[#081d15] border border-[#1a422f] rounded-xl px-2.5 py-1.5 text-center font-bold text-[#f3ebd6] focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#d5cbbb]/70 block mb-0.5">Digital 1 hora ($)</label>
                          <input
                            type="number"
                            step="100"
                            min="0"
                            value={currentVals.dig60m}
                            onChange={(e) =>
                              setRatesDraft({
                                ...ratesDraft,
                                [c.id]: { ...currentVals, dig60m: Number(e.target.value) || 0 },
                              })
                            }
                            className="w-full bg-[#081d15] border border-[#1a422f] rounded-xl px-2.5 py-1.5 text-center font-bold text-[#f3ebd6] focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Recargo por mora */}
                    <div className="pt-1 border-t border-[#1a422f]/60">
                      <label className="text-[10px] text-rose-300 font-bold block mb-0.5">⏱️ Recargo por Mora c/10 min ($)</label>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        value={currentVals.penalty10m}
                        onChange={(e) =>
                          setRatesDraft({
                            ...ratesDraft,
                            [c.id]: { ...currentVals, penalty10m: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-full bg-[#081d15] border border-[#1a422f] rounded-xl px-2.5 py-1.5 text-center font-bold text-rose-300 focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#f3ebd6] text-[#02110c] font-black text-xs tracking-wider shadow-lg active:scale-98 transition-all hover:bg-white flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>GUARDAR TODAS LAS TARIFAS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
