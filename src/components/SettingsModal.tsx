import React, { useState, useId } from 'react';
import { getStoredSupabaseConfig, saveSupabaseConfig, getShareableConfigUrl, isSupabaseConfigured } from '../services/supabaseClient';
import { soundService } from '../services/sound';
import { dataService } from '../services/dataService';
import { raftingWhatsappService } from '../services/raftingWhatsappService';
import {
  X,
  Database,
  Volume2,
  RefreshCw,
  Download,
  Check,
  Share2,
  Smartphone,
  Copy,
  Wifi,
  CloudCheck,
  Send
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenRaftingConfig?: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onOpenRaftingConfig }) => {
  const supabaseUrlId = useId();
  const supabaseKeyId = useId();

  const [config, setConfig] = useState(getStoredSupabaseConfig());
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'supabase' | 'audio' | 'data'>('supabase');

  if (!isOpen) return null;

  const isConnected = isSupabaseConfigured();

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(config.url, config.key);
    dataService.initRealtimeSync();
    raftingWhatsappService.initSupabaseBridgeChannel();
    setSaveStatus('¡Conectando y activando tiempo real multi-dispositivo...!');
    const ok = await dataService.syncFromSupabase();
    if (ok) {
      setSaveStatus('¡Conectado! Todos los dispositivos compartirán la misma información.');
    } else {
      setSaveStatus('¡Credenciales guardadas con éxito!');
    }
    soundService.playSuccess();
    setTimeout(() => setSaveStatus(''), 4500);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const ok = await dataService.syncFromSupabase();
    setIsSyncing(false);
    if (ok) {
      soundService.playSuccess();
      setSaveStatus('¡Sincronización completada con la nube!');
      setTimeout(() => setSaveStatus(''), 3000);
    } else {
      alert('No se pudo sincronizar. Verifica la conexión a internet y las credenciales.');
    }
  };

  const handleCopyDeviceLink = () => {
    const link = getShareableConfigUrl();
    if (!link) {
      alert('Ingresa y guarda primero la URL y la Key de Supabase para generar el enlace.');
      return;
    }
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleTestAudioAlarm = () => {
    soundService.playTimeAlert();
  };

  const handleTestChime = () => {
    soundService.playCashRegister();
  };

  const handleResetDemo = () => {
    if (window.confirm('¿Deseas reiniciar la operación a cero (0km)? Se liberarán todas las unidades de la flota y se vaciarán los alquileres y la caja a $0 para comenzar limpios.')) {
      dataService.resetToCleanState();
      soundService.playSuccess();
      onClose();
    }
  };

  const handleExportJSON = () => {
    const fullBackup = {
      brand: 'Eco Aventura',
      categories: dataService.getCategories(),
      units: dataService.getUnits(),
      rentals: dataService.getRentals(),
      cashMovements: dataService.getCashMovements(),
      dailyClosings: dataService.getDailyClosings(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eco-aventura-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-[28px] bg-white border border-black/[0.08] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#1C1C1C]">
        {/* Header */}
        <div className="p-4 border-b border-black/[0.06] bg-[#FAF6E8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center text-[#F7D147]">
              ⚙️
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1C1C1C]">Configuración - Eco Aventura</h3>
              <p className="text-[11px] text-[#71706B]">Multi-dispositivo, sonido y base de datos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#71706B] hover:text-[#1C1C1C]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-black/[0.06] bg-[#F6F3EA] p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              activeTab === 'supabase'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'text-[#52514E] hover:text-[#1C1C1C]'
            }`}
          >
            Supabase / Enlace Móvil
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              activeTab === 'audio'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'text-[#52514E] hover:text-[#1C1C1C]'
            }`}
          >
            Audio & Alertas
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              activeTab === 'data'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'text-[#52514E] hover:text-[#1C1C1C]'
            }`}
          >
            Datos & Backup
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              {/* Connection Status Box */}
              <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                isConnected
                  ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]'
                  : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    {isConnected ? (
                      <Wifi className="w-4 h-4 text-[#16A34A] animate-pulse" />
                    ) : (
                      <Database className="w-4 h-4 text-[#D97706]" />
                    )}
                    <span>
                      {isConnected ? 'Tiempo Real Multi-Dispositivo Conectado' : 'Modo Almacenamiento Local (1 Dispositivo)'}
                    </span>
                  </div>
                  {isConnected && (
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-[#1C1C1C] hover:text-white text-[#1C1C1C] border border-black/10 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {isConnected
                    ? 'Todos los celulares y computadoras conectados a esta misma base de datos verán los alquileres, flota y caja en tiempo real.'
                    : 'Para que dos o más dispositivos sincronicen en simultáneo, ingresa las credenciales de tu proyecto Supabase a continuación.'}
                </p>
              </div>

              {/* Cross-Device Share Link Card */}
              {isConnected && (
                <div className="p-3.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1C1C1C]">
                    <Smartphone className="w-4 h-4 text-[#1C1C1C]" />
                    <span>Conectar otro celular al instante (Sin escribir claves)</span>
                  </div>
                  <p className="text-[11px] text-[#71706B]">
                    Copia este enlace y ábrelo o envíalo por WhatsApp al otro teléfono. Se configurará y sincronizará en tiempo real de forma 100% automática:
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyDeviceLink}
                    className="w-full py-2.5 px-3 rounded-full bg-[#F7D147] hover:bg-[#f0c62d] text-[#1C1C1C] font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4 text-[#1C1C1C]" />}
                    <span>{copiedLink ? '¡Enlace de conexión copiado!' : 'Copiar enlace para el otro celular'}</span>
                  </button>
                </div>
              )}

              {/* Form to enter/update Supabase Credentials */}
              <form onSubmit={handleSaveSupabase} className="space-y-3">
                <div>
                  <label htmlFor={supabaseUrlId} className="text-xs font-bold text-[#52514E] block mb-1">
                    SUPABASE PROJECT URL
                  </label>
                  <input
                    id={supabaseUrlId}
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    className="w-full bg-[#F6F3EA] border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-[#1C1C1C] placeholder-[#71706B] focus:outline-none focus:border-[#1C1C1C] font-mono"
                  />
                </div>

                <div>
                  <label htmlFor={supabaseKeyId} className="text-xs font-bold text-[#52514E] block mb-1">
                    SUPABASE ANON PUBLIC KEY
                  </label>
                  <input
                    id={supabaseKeyId}
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={config.key}
                    onChange={(e) => setConfig({ ...config, key: e.target.value })}
                    className="w-full bg-[#F6F3EA] border border-black/[0.08] rounded-xl px-3 py-2.5 text-xs text-[#1C1C1C] placeholder-[#71706B] focus:outline-none focus:border-[#1C1C1C] font-mono"
                  />
                </div>

                {saveStatus && (
                  <div className="p-2.5 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#16A34A]" />
                    <span>{saveStatus}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#1C1C1C] text-white font-black text-xs tracking-wider shadow-md active:scale-98 transition-all hover:bg-[#333333]"
                >
                  GUARDAR Y ACTIVAR TIEMPO REAL
                </button>
              </form>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] text-xs text-[#52514E]">
                <div className="flex items-center gap-2 font-bold text-[#1C1C1C] mb-1">
                  <Volume2 className="w-4 h-4 text-[#1C1C1C]" />
                  <span>Sintetizador Web Audio API</span>
                </div>
                <p className="text-[11px] text-[#71706B]">
                  Las alertas y alarmas se generan por hardware directamente en el altavoz del celular, garantizando funcionamiento instantáneo en playa o parque sin conexión.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleTestAudioAlarm}
                  className="w-full py-3 px-4 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold flex items-center justify-between hover:bg-[#FECACA] active:scale-98 transition-all"
                >
                  <span>Probar Alarma de Tiempo Cumplido (Rojo)</span>
                  <span className="text-base">🚨</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestChime}
                  className="w-full py-3 px-4 rounded-2xl bg-[#F7D147] border border-black/10 text-[#1C1C1C] text-xs font-bold flex items-center justify-between hover:bg-[#f0c62d] active:scale-98 transition-all"
                >
                  <span>Probar Sonido de Cobro / Caja Registradora</span>
                  <span className="text-base">🔔</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] text-xs text-[#71706B]">
                <p className="text-[11px]">
                  Herramientas de respaldo local y restauración para la flota de Eco Aventura.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full py-3 px-4 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] text-[#1C1C1C] text-xs font-bold flex items-center justify-between hover:bg-[#EAE4D3] active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#1C1C1C]" />
                  <span>Descargar Backup JSON Completo</span>
                </div>
                <span className="text-[10px] text-[#71706B]">Incluye alquileres, caja e historial</span>
              </button>

              {onOpenRaftingConfig && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRaftingConfig();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#F7D147] border border-black/10 text-[#1C1C1C] text-xs font-bold flex items-center justify-between hover:bg-[#f0c62d] active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#1C1C1C]" />
                    <span>Plantillas de Rafting (Pomelos) y WhatsApp QR</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#1C1C1C]">Editar 12 mensajes / QR</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full py-3 px-4 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-bold flex items-center justify-between hover:bg-[#FDE68A] active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#D97706]" />
                  <span>Reiniciar Operación a Cero (0km)</span>
                </div>
                <span className="text-[10px] text-[#92400E]">Flota libre y caja en $0</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
