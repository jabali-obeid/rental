import React from 'react';
import { Wifi, RefreshCw } from 'lucide-react';
import {
  BridgeLiveState,
  WhatsappBridgeConfig,
  raftingWhatsappService,
} from '../../services/raftingWhatsappService';

interface RaftingQrTabProps {
  bridgeState: BridgeLiveState;
  bridgeConfig: WhatsappBridgeConfig;
  isCheckingQr: boolean;
  onRefreshQr: () => void;
  onChangeBridgeConfig: (config: WhatsappBridgeConfig) => void;
  onSaveBridgeSettings: (e: React.FormEvent) => void;
}

export const RaftingQrTab: React.FC<RaftingQrTabProps> = ({
  bridgeState,
  bridgeConfig,
  isCheckingQr,
  onRefreshQr,
  onChangeBridgeConfig,
  onSaveBridgeSettings,
}) => {
  return (
    <div className="space-y-4">
      <div
        className={`p-4 rounded-2xl border space-y-3 ${
          bridgeState.whatsappReady
            ? 'bg-[#DCFCE7] border-[#86EFAC]'
            : 'bg-eco-surface border-black/[0.06]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Wifi
              className={`w-5 h-5 ${
                bridgeState.whatsappReady ? 'text-eco-leaf animate-pulse' : 'text-[#D97706]'
              }`}
            />
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-eco-dark">
                {bridgeState.whatsappReady
                  ? `¡WhatsApp Vinculado! (${bridgeState.whatsappNumber || 'Activo'})`
                  : bridgeState.statusText}
              </h3>
              <p className="text-[11px] text-eco-creamMuted">
                {bridgeState.whatsappReady
                  ? 'Todos los celulares pueden disparar los 12 mensajes en segundo plano.'
                  : 'Escaneá el código QR desde tu WhatsApp > Dispositivos vinculados.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefreshQr}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-[#EAE4D3] border border-black/[0.08] text-xs font-bold flex items-center gap-1.5 text-eco-dark"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingQr ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {!bridgeState.whatsappReady && bridgeState.qrDataUrl && (
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl max-w-xs mx-auto space-y-2 shadow-md border border-black/10">
            <img
              src={bridgeState.qrDataUrl}
              alt="Código QR de WhatsApp"
              className="w-56 h-56 object-contain"
            />
            <span className="text-[11px] font-extrabold text-eco-dark text-center">
              Abrí WhatsApp en tu teléfono → Dispositivos vinculados → Vincular un dispositivo
            </span>
          </div>
        )}

        {!bridgeState.connected && (
          <div className="p-3.5 rounded-xl bg-white border border-black/[0.06] text-xs space-y-2">
            <p className="font-extrabold text-[#92400E]">
              ¿Cómo encender el servidor WhatsApp QR gratuito?
            </p>
            <p className="text-[11px] text-eco-creamDark leading-relaxed">
              En la carpeta del proyecto tenés listo el puente automático. Corré este comando en la terminal (o dejalo corriendo en una PC/servidor conectado a tu Supabase):
            </p>
            <code className="block p-2.5 rounded-lg bg-eco-dark text-eco-gold font-mono text-[11px] select-all">
              npm run whatsapp-bridge
            </code>
            <p className="text-[11px] text-eco-creamMuted">
              Al encenderlo, el código QR aparece automáticamente acá arriba y cualquier celular en 4G conectado a tu Supabase podrá enviar toda la secuencia con 1 clic.
            </p>
          </div>
        )}

        {bridgeState.whatsappReady && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => raftingWhatsappService.requestLogoutOrNewQr()}
              className="text-[11px] text-[#991B1B] hover:underline font-bold"
            >
              Cerrar sesión de este número / Cambiar WhatsApp
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={onSaveBridgeSettings}
        className="p-4 rounded-2xl bg-eco-surface border border-black/[0.06] space-y-3"
      >
        <h4 className="text-xs font-extrabold text-eco-dark uppercase tracking-wider">
          Ajustes Avanzados de Conexión
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChangeBridgeConfig({ ...bridgeConfig, provider: 'bridge' })}
            className={`py-2 px-3 rounded-full text-xs font-bold border ${
              bridgeConfig.provider === 'bridge'
                ? 'bg-eco-dark border-eco-dark text-white'
                : 'bg-white border-black/[0.06] text-eco-creamDark'
            }`}
          >
            Servidor QR Incluido (Supabase / Local)
          </button>
          <button
            type="button"
            onClick={() => onChangeBridgeConfig({ ...bridgeConfig, provider: 'evolution' })}
            className={`py-2 px-3 rounded-full text-xs font-bold border ${
              bridgeConfig.provider === 'evolution'
                ? 'bg-eco-dark border-eco-dark text-white'
                : 'bg-white border-black/[0.06] text-eco-creamDark'
            }`}
          >
            Evolution API Externa
          </button>
        </div>

        {bridgeConfig.provider === 'bridge' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-eco-creamDark block mb-1">
                URL del Servidor QR (Local o Nube)
              </label>
              <input
                type="text"
                value={bridgeConfig.bridgeHttpUrl}
                onChange={(e) =>
                  onChangeBridgeConfig({ ...bridgeConfig, bridgeHttpUrl: e.target.value })
                }
                placeholder="http://localhost:3100"
                className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-eco-dark font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-eco-creamDark block mb-1">
                Pausa entre cada mensaje (ms)
              </label>
              <input
                type="number"
                min={500}
                max={8000}
                step={100}
                value={bridgeConfig.delayMs}
                onChange={(e) =>
                  onChangeBridgeConfig({
                    ...bridgeConfig,
                    delayMs: Number(e.target.value) || 1400,
                  })
                }
                className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-eco-dark font-mono"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-eco-creamDark block mb-1">
                Evolution API URL
              </label>
              <input
                type="url"
                value={bridgeConfig.evolutionUrl}
                onChange={(e) =>
                  onChangeBridgeConfig({ ...bridgeConfig, evolutionUrl: e.target.value })
                }
                placeholder="https://api.tudominio.com"
                className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-eco-dark font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-eco-creamDark block mb-1">
                API Key
              </label>
              <input
                type="password"
                value={bridgeConfig.evolutionApiKey}
                onChange={(e) =>
                  onChangeBridgeConfig({ ...bridgeConfig, evolutionApiKey: e.target.value })
                }
                placeholder="Global / Instance Key"
                className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-eco-dark font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-eco-creamDark block mb-1">
                Nombre de Instancia
              </label>
              <input
                type="text"
                value={bridgeConfig.evolutionInstance}
                onChange={(e) =>
                  onChangeBridgeConfig({ ...bridgeConfig, evolutionInstance: e.target.value })
                }
                placeholder="eco-aventura"
                className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-eco-dark font-mono"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-full bg-eco-dark text-white font-black text-xs hover:bg-eco-forestLight transition-all"
        >
          Guardar Configuración de Envío
        </button>
      </form>
    </div>
  );
};
