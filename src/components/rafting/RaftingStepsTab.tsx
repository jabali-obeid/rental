import React from 'react';
import {
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Trash2,
  Image as ImageIcon,
  Plus,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import { RaftingMessageStep } from '../../services/raftingWhatsappService';

interface RaftingStepsTabProps {
  steps: RaftingMessageStep[];
  onResetDefaults: () => void;
  onToggleStep: (id: string) => void;
  onUpdateStepField: (id: string, field: keyof RaftingMessageStep, value: string) => void;
  onMoveStep: (index: number, direction: -1 | 1) => void;
  onDeleteStep: (id: string) => void;
  onAddStep: (type: 'text' | 'image' | 'contact') => void;
  onUploadImage: (stepId: string, file: File | undefined) => void;
}

export const RaftingStepsTab: React.FC<RaftingStepsTabProps> = ({
  steps,
  onResetDefaults,
  onToggleStep,
  onUpdateStepField,
  onMoveStep,
  onDeleteStep,
  onAddStep,
  onUploadImage,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-eco-surface border border-black/[0.06]">
        <div>
          <h3 className="text-xs font-extrabold text-eco-dark">
            Personalizar Secuencia de Mensajes y Fotos
          </h3>
          <p className="text-[11px] text-eco-creamMuted">
            Se envían uno por uno en este orden exacto con 1.4 seg de pausa.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetDefaults}
          className="px-3 py-1.5 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FDE68A] text-[#92400E] text-[11px] font-bold flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Originales</span>
        </button>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
              step.enabled
                ? 'bg-eco-surface border-black/[0.06]'
                : 'bg-eco-surface/50 border-black/[0.04] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={step.enabled}
                  onChange={() => onToggleStep(step.id)}
                  className="w-4 h-4 accent-eco-dark rounded cursor-pointer"
                />
                <span className="px-2.5 py-0.5 rounded-full bg-eco-dark text-eco-gold text-[10px] font-black uppercase">
                  {step.type === 'text' ? 'Texto' : step.type === 'image' ? 'Foto' : 'Contacto'}
                </span>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => onUpdateStepField(step.id, 'title', e.target.value)}
                  className="bg-transparent border-b border-transparent focus:border-eco-dark text-xs font-extrabold text-eco-dark focus:outline-none flex-1 min-w-0"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onMoveStep(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 rounded-full bg-white hover:bg-[#EAE4D3] disabled:opacity-30 text-eco-dark border border-black/[0.06]"
                  title="Subir"
                  aria-label="Subir paso"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveStep(index, 1)}
                  disabled={index === steps.length - 1}
                  className="p-1.5 rounded-full bg-white hover:bg-[#EAE4D3] disabled:opacity-30 text-eco-dark border border-black/[0.06]"
                  title="Bajar"
                  aria-label="Bajar paso"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteStep(step.id)}
                  className="p-1.5 rounded-full bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B]"
                  title="Eliminar paso"
                  aria-label="Eliminar paso"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {step.type === 'text' && (
              <textarea
                rows={3}
                value={step.text || ''}
                onChange={(e) => onUpdateStepField(step.id, 'text', e.target.value)}
                className="w-full rounded-xl bg-white border border-black/[0.08] p-2.5 text-xs text-eco-dark focus:outline-none focus:border-eco-dark"
              />
            )}

            {step.type === 'image' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {step.imageUrl && (
                  <img
                    src={step.imageUrl}
                    alt={step.title}
                    className="w-24 h-20 rounded-xl object-cover border border-black/10 shrink-0"
                  />
                )}
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="text"
                    placeholder="Texto o pie de foto opcional..."
                    value={step.text || ''}
                    onChange={(e) => onUpdateStepField(step.id, 'text', e.target.value)}
                    className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-eco-dark focus:outline-none focus:border-eco-dark"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white text-[11px] font-bold cursor-pointer">
                    <ImageIcon className="w-3.5 h-3.5 text-eco-gold" />
                    <span>Cambiar Foto desde el dispositivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onUploadImage(step.id, e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            )}

            {step.type === 'contact' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-eco-creamMuted block mb-1">
                    Nombre del Contacto (Prestador Rafting)
                  </label>
                  <input
                    type="text"
                    value={step.contactName || ''}
                    onChange={(e) => onUpdateStepField(step.id, 'contactName', e.target.value)}
                    className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-eco-dark"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-eco-creamMuted block mb-1">
                    Teléfono de Contacto (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={step.contactPhone || ''}
                    onChange={(e) => onUpdateStepField(step.id, 'contactPhone', e.target.value)}
                    className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-eco-dark font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-eco-creamMuted block mb-1">
                    Mensaje acompañando al contacto
                  </label>
                  <input
                    type="text"
                    value={step.text || ''}
                    onChange={(e) => onUpdateStepField(step.id, 'text', e.target.value)}
                    className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-eco-dark"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new step buttons */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <button
          type="button"
          onClick={() => onAddStep('text')}
          className="py-2.5 px-3 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-eco-gold" />
          <MessageSquare className="w-3.5 h-3.5 text-eco-gold" />
          <span>+ Texto</span>
        </button>
        <button
          type="button"
          onClick={() => onAddStep('image')}
          className="py-2.5 px-3 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-eco-gold" />
          <ImageIcon className="w-3.5 h-3.5 text-eco-gold" />
          <span>+ Foto</span>
        </button>
        <button
          type="button"
          onClick={() => onAddStep('contact')}
          className="py-2.5 px-3 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-eco-gold" />
          <UserCheck className="w-3.5 h-3.5 text-eco-gold" />
          <span>+ Contacto</span>
        </button>
      </div>
    </div>
  );
};
