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
    <div className="space-y-4 pb-24 text-[#1C1C1C]">
      {/* Fleet Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-[24px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
          <div className="text-2xl font-bold text-[#1C1C1C]">{counts.disponible}</div>
          <div className="text-[10px] font-bold text-[#166534] uppercase tracking-wider mt-0.5">Disponibles</div>
        </div>
        <div className="p-4 rounded-[24px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
          <div className="text-2xl font-bold text-[#1C1C1C]">{counts.alquilado}</div>
          <div className="text-[10px] font-bold text-[#92400E] uppercase tracking-wider mt-0.5">Alquilados</div>
        </div>
        <div className="p-4 rounded-[24px] bg-white border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
          <div className="text-2xl font-bold text-[#D97706]">{counts.mantenimiento}</div>
          <div className="text-[10px] font-bold text-[#92400E] uppercase tracking-wider mt-0.5">Taller</div>
        </div>
        <div className="p-4 rounded-[24px] bg-[#1C1C1C] text-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-center">
          <div className="text-2xl font-bold text-[#F7D147]">{counts.total}</div>
          <div className="text-[10px] font-bold text-white/75 uppercase tracking-wider mt-0.5">Total Flota</div>
        </div>
      </div>

      {/* Top Filter & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/95 p-3 rounded-[24px] border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'bg-[#F6F3EA] text-[#52514E] border border-black/[0.05] hover:text-[#1C1C1C]'
            }`}
          >
            Todas ({units.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryFilter(c.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
                selectedCategoryFilter === c.id
                  ? 'bg-[#1C1C1C] text-white shadow-sm'
                  : 'bg-[#F6F3EA] text-[#52514E] border border-black/[0.05] hover:text-[#1C1C1C]'
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F7D147] text-[#1C1C1C] text-xs font-extrabold hover:bg-[#f0c62d] shrink-0 shadow-sm transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-[#1C1C1C]" />
            <span>Editar Tarifas</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1C1C] text-white text-xs font-bold hover:bg-[#333333] shrink-0 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3] text-[#F7D147]" />
            <span>Nueva Unidad</span>
          </button>
        </div>
      </div>

      {/* Units List (Staffwyn Clean Table Card Style) */}
      <div className="bg-white/95 rounded-[28px] border border-black/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-5 divide-y divide-black/[0.06]">
        {filteredUnits.map((u) => {
          const category = categories.find((c) => c.id === u.categoryId);

          return (
            <div
              key={u.id}
              className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              {/* Left Details */}
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                  u.status === 'disponible' ? 'bg-[#F7D147] text-[#1C1C1C]' : 'bg-[#F6F3EA] border border-black/10 text-[#71706B]'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>

                <span className="w-11 h-11 rounded-full bg-[#1C1C1C] font-mono font-black text-xs text-white flex items-center justify-center shrink-0">
                  {u.codeNumber}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#1C1C1C] leading-tight">{u.name}</h4>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-[#F6F3EA] text-[#52514E] border border-black/[0.06]">
                      {category?.name}
                    </span>
                  </div>

                  {u.notes && (
                    <p className="text-[11px] text-[#92400E] mt-0.5 flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      <span>{u.notes}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Right Quick Status Selector */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pt-1 sm:pt-0">
                {u.status === 'alquilado' ? (
                  <span className="px-3.5 py-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse"></span>
                    <span>En Alquiler</span>
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleStatusChange(u.id, 'disponible')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                        u.status === 'disponible'
                          ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] font-bold'
                          : 'bg-[#F6F3EA] text-[#71706B] border border-black/[0.05] hover:text-[#1C1C1C]'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Disponible</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(u.id, 'mantenimiento')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                        u.status === 'mantenimiento'
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold'
                          : 'bg-[#F6F3EA] text-[#71706B] border border-black/[0.05] hover:text-[#1C1C1C]'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Taller</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(u.id, 'baja')}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                        u.status === 'baja'
                          ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] font-bold'
                          : 'bg-[#F6F3EA] text-[#71706B] border border-black/[0.05] hover:text-[#1C1C1C]'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Baja</span>
                    </button>

                    <button
                      onClick={() => handleDeleteUnit(u.id, u.codeNumber)}
                      className="p-1.5 rounded-full text-[#71706B] hover:text-rose-600 hover:bg-[#FEE2E2] transition-colors ml-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[28px] bg-white border border-black/[0.08] shadow-2xl overflow-hidden text-[#1C1C1C]">
            <div className="p-4 border-b border-black/[0.06] flex items-center justify-between bg-[#FAF6E8]">
              <h3 className="text-sm font-bold text-[#1C1C1C] flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#1C1C1C]" />
                <span>Agregar Nueva Unidad - Eco Aventura</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full text-[#71706B] hover:text-[#1C1C1C] hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="p-5 space-y-3.5">
              <div>
                <label htmlFor={newCatId} className="text-xs font-bold text-[#52514E] block mb-1">Categoría</label>
                <select
                  id={newCatId}
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full bg-[#F6F3EA] border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white text-[#1C1C1C]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={newCodeId} className="text-xs font-bold text-[#52514E] block mb-1">
                  Código de Identificación (ej: K-05, KY-04, MP-05) *
                </label>
                <input
                  id={newCodeId}
                  type="text"
                  required
                  placeholder="K-05"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-[#F6F3EA] border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] uppercase"
                />
              </div>

              <div>
                <label htmlFor={newNameId} className="text-xs font-bold text-[#52514E] block mb-1">
                  Nombre descriptivo *
                </label>
                <input
                  id={newNameId}
                  type="text"
                  required
                  placeholder="Ej: Karting Negro Safari Edition"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#F6F3EA] border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                />
              </div>

              <div>
                <label htmlFor={newNotesId} className="text-xs font-bold text-[#52514E] block mb-1">
                  Notas de mantenimiento (opcional)
                </label>
                <input
                  id={newNotesId}
                  type="text"
                  placeholder="Ej: Batería nueva comprada oct-2026"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#F6F3EA] border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#1C1C1C] text-white font-black text-xs tracking-wider shadow-md active:scale-98 transition-all hover:bg-[#333333]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[28px] bg-white border border-black/[0.08] shadow-2xl text-[#1C1C1C]">
            <div className="p-4 border-b border-black/[0.06] flex items-center justify-between sticky top-0 bg-[#FAF6E8]/95 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#1C1C1C]" />
                <h3 className="text-sm font-extrabold text-[#1C1C1C]">Configurar Tarifas y Precios</h3>
              </div>
              <button
                onClick={() => setIsRatesModalOpen(false)}
                className="p-1.5 rounded-full text-[#71706B] hover:text-[#1C1C1C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRates} className="p-5 space-y-4">
              <p className="text-xs text-[#71706B]">
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
                  <div key={c.id} className="p-4 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] space-y-3">
                    <div className="flex items-center justify-between font-bold text-xs text-[#1C1C1C]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1C1C1C]"></span>
                        <span className="font-extrabold">{c.name}</span>
                      </span>
                    </div>

                    {/* Precios Efectivo */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] flex items-center gap-1">
                        💵 Tarifas en Efectivo:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-[#71706B] block mb-0.5">Efectivo 30 min ($)</label>
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
                            className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-1.5 text-center font-bold text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#71706B] block mb-0.5">Efectivo 1 hora ($)</label>
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
                            className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-1.5 text-center font-bold text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Precios Transferencia / Tarjeta */}
                    <div className="space-y-1 pt-2 border-t border-black/[0.06]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#52514E] flex items-center gap-1">
                        📲 Tarifas Transferencia / Tarjeta:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-[#71706B] block mb-0.5">Digital 30 min ($)</label>
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
                            className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-1.5 text-center font-bold text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#71706B] block mb-0.5">Digital 1 hora ($)</label>
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
                            className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-1.5 text-center font-bold text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Recargo por mora */}
                    <div className="pt-2 border-t border-black/[0.06]">
                      <label className="text-[10px] text-[#991B1B] font-bold block mb-0.5">⏱️ Recargo por Mora c/10 min ($)</label>
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
                        className="w-full bg-white border border-black/[0.08] rounded-xl px-2.5 py-1.5 text-center font-bold text-[#991B1B] focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#1C1C1C] text-white font-black text-xs tracking-wider shadow-md active:scale-98 transition-all hover:bg-[#333333] flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3] text-[#F7D147]" />
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
