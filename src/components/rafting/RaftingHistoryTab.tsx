import React from 'react';
import { RaftingSendHistoryItem } from '../../services/raftingWhatsappService';

interface RaftingHistoryTabProps {
  history: RaftingSendHistoryItem[];
  onClearHistory: () => void;
  onResend: (item: RaftingSendHistoryItem) => void;
}

export const RaftingHistoryTab: React.FC<RaftingHistoryTabProps> = ({
  history,
  onClearHistory,
  onResend,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-eco-dark">
          Últimos clientes a los que se les envió Info de Rafting
        </h3>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-[11px] text-[#991B1B] hover:underline font-bold"
          >
            Limpiar historial
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-8 rounded-2xl bg-eco-surface border border-black/[0.06] text-center text-xs text-eco-creamMuted">
          Todavía no se registraron envíos de info de Rafting en este dispositivo.
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-eco-surface border border-black/[0.06] flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-eco-dark">
                    +{item.formattedPhone}
                  </span>
                  {item.clientLabel && (
                    <span className="px-2.5 py-0.5 rounded-full bg-eco-gold text-eco-dark text-[10px] font-bold">
                      {item.clientLabel}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-eco-creamMuted mt-0.5">
                  {new Date(item.sentAt).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  • {item.stepsCount} pasos (
                  {item.mode === 'auto-bridge'
                    ? 'Automático QR'
                    : item.mode === 'evolution-api'
                      ? 'Evolution API'
                      : 'Envío Directo'}
                  )
                </p>
              </div>

              <button
                type="button"
                onClick={() => onResend(item)}
                className="px-3.5 py-1.5 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white text-[11px] font-bold shrink-0"
              >
                Reenviar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
