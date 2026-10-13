import React, { useState, useId } from 'react';
import { getStoredSupabaseConfig, saveSupabaseConfig, getShareableConfigUrl, isSupabaseConfigured } from '../services/supabaseClient';
import { soundService } from '../services/sound';
import { dataService } from '../services/dataService';
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
  CloudCheck
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02110c]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#081d15] border border-[#1a422f] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#f3ebd6]">
        {/* Header */}
        <div className="p-4 border-b border-[#1a422f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#02110c] border border-[#1a422f] flex items-center justify-center text-[#2ea06e]">
              ⚙️
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#f3ebd6]">Configuración - Eco Aventura</h3>
              <p className="text-[11px] text-[#d5cbbb]">Multi-dispositivo, sonido y base de datos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#d5cbbb] hover:text-[#f3ebd6]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#1a422f] bg-[#02110c] p-1">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'supabase'
                ? 'bg-[#1a422f] text-[#f3ebd6] shadow'
                : 'text-[#d5cbbb]/60 hover:text-[#f3ebd6]'
            }`}
          >
            Supabase / Enlace Móvil
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'audio'
                ? 'bg-[#1a422f] text-[#f3ebd6] shadow'
                : 'text-[#d5cbbb]/60 hover:text-[#f3ebd6]'
            }`}
          >
            Audio & Alertas
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'data'
                ? 'bg-[#1a422f] text-[#f3ebd6] shadow'
                : 'text-[#d5cbbb]/60 hover:text-[#f3ebd6]'
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
                  ? 'bg-emerald-950/40 border-[#2ea06e]/50 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    {isConnected ? (
                      <Wifi className="w-4 h-4 text-[#2ea06e] animate-pulse" />
                    ) : (
                      <Database className="w-4 h-4 text-amber-400" />
                    )}
                    <span>
                      {isConnected ? 'Tiempo Real Multi-Dispositivo Conectado' : 'Modo Almacenamiento Local (1 Dispositivo)'}
                    </span>
                  </div>
                  {isConnected && (
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="px-2.5 py-1 rounded-lg bg-[#02110c] hover:bg-[#1a422f] text-[#f3ebd6] border border-[#1a422f] text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  {isConnected
                    ? 'Todos los celulares y computadoras conectados a esta misma base de datos verán los alquileres, flota y caja en tiempo real.'
                    : 'Para que dos o más dispositivos sincronicen en simultáneo, ingresa las credenciales de tu proyecto Supabase a continuación.'}
                </p>
              </div>

              {/* Cross-Device Share Link Card */}
              {isConnected && (
                <div className="p-3.5 rounded-2xl bg-[#02110c] border border-[#1a422f] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#f3ebd6]">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Conectar otro celular al instante (Sin escribir claves)</span>
                  </div>
                  <p className="text-[11px] text-[#d5cbbb]/70">
                    Copia este enlace y ábrelo o envíalo por WhatsApp al otro teléfono. Se configurará y sincronizará en tiempo real de forma 100% automática:
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyDeviceLink}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#1a422f] hover:bg-[#265e43] text-[#f3ebd6] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 border border-[#2ea06e]/40 shadow"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-[#2ea06e]" /> : <Copy className="w-4 h-4 text-cyan-300" />}
                    <span>{copiedLink ? '¡Enlace de conexión copiado!' : 'Copiar enlace para el otro celular'}</span>
                  </button>
                </div>
              )}

              {/* Form to enter/update Supabase Credentials */}
              <form onSubmit={handleSaveSupabase} className="space-y-3">
                <div>
                  <label htmlFor={supabaseUrlId} className="text-xs font-bold text-[#d5cbbb] block mb-1">
                    SUPABASE PROJECT URL
                  </label>
                  <input
                    id={supabaseUrlId}
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] placeholder-[#d5cbbb]/40 focus:outline-none focus:border-[#f3ebd6] font-mono"
                  />
                </div>

                <div>
                  <label htmlFor={supabaseKeyId} className="text-xs font-bold text-[#d5cbbb] block mb-1">
                    SUPABASE ANON PUBLIC KEY
                  </label>
                  <input
                    id={supabaseKeyId}
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={config.key}
                    onChange={(e) => setConfig({ ...config, key: e.target.value })}
                    className="w-full bg-[#02110c] border border-[#1a422f] rounded-xl px-3 py-2 text-xs text-[#f3ebd6] placeholder-[#d5cbbb]/40 focus:outline-none focus:border-[#f3ebd6] font-mono"
                  />
                </div>

                {saveStatus && (
                  <div className="p-2.5 rounded-xl bg-[#1a422f] border border-[#2ea06e] text-[#f3ebd6] text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2ea06e]" />
                    <span>{saveStatus}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#f3ebd6] text-[#02110c] font-black text-xs tracking-wider shadow-lg active:scale-98 transition-all hover:bg-white"
                >
                  GUARDAR Y ACTIVAR TIEMPO REAL
                </button>
              </form>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-[#02110c] border border-[#1a422f] text-xs text-[#d5cbbb]">
                <div className="flex items-center gap-2 font-bold text-[#f3ebd6] mb-1">
                  <Volume2 className="w-4 h-4 text-[#2ea06e]" />
                  <span>Sintetizador Web Audio API</span>
                </div>
                <p className="text-[11px] text-[#d5cbbb]/70">
                  Las alertas y alarmas se generan por hardware directamente en el altavoz del celular, garantizando funcionamiento instantáneo en playa o parque sin conexión.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleTestAudioAlarm}
                  className="w-full py-3 px-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center justify-between hover:bg-rose-900/60 active:scale-98 transition-all"
                >
                  <span>Probar Alarma de Tiempo Cumplido (Rojo)</span>
                  <span className="text-base">🚨</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestChime}
                  className="w-full py-3 px-4 rounded-xl bg-[#1a422f] border border-[#f3ebd6]/30 text-[#f3ebd6] text-xs font-bold flex items-center justify-between hover:bg-[#265e43] active:scale-98 transition-all"
                >
                  <span>Probar Sonido de Cobro / Caja Registradora</span>
                  <span className="text-base">🔔</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#02110c] border border-[#1a422f] text-xs text-[#d5cbbb]/70">
                <p className="text-[11px]">
                  Herramientas de respaldo local y restauración para la flota de Eco Aventura.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full py-3 px-4 rounded-xl bg-[#02110c] border border-[#1a422f] text-[#f3ebd6] text-xs font-bold flex items-center justify-between hover:bg-[#1a422f] active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#2ea06e]" />
                  <span>Descargar Backup JSON Completo</span>
                </div>
                <span className="text-[10px] text-[#d5cbbb]/60">Incluye alquileres, caja e historial</span>
              </button>

              <button
                type="button"
                onClick={handleResetDemo}
                className="w-full py-3 px-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between hover:bg-amber-950/60 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span>Reiniciar Operación a Cero (0km)</span>
                </div>
                <span className="text-[10px] text-amber-400">Flota libre y caja en $0</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
