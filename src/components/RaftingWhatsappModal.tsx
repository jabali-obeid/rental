import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Phone,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Image as ImageIcon,
  MessageSquare,
  UserCheck,
  History,
  Settings2,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RefreshCw,
  Wifi,
  Sparkles,
} from 'lucide-react';
import {
  raftingWhatsappService,
  RaftingMessageStep,
  BridgeLiveState,
  SendProgressUpdate,
  RaftingSendHistoryItem,
  normalizeWhatsappPhone,
} from '../services/raftingWhatsappService';
import { soundService } from '../services/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'send' | 'steps' | 'qr' | 'history';
}

export const RaftingWhatsappModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialTab = 'send',
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'steps' | 'qr' | 'history'>(initialTab);
  const [phone, setPhone] = useState('');
  const [clientLabel, setClientLabel] = useState('');
  const [bridgeState, setBridgeState] = useState<BridgeLiveState>(
    raftingWhatsappService.getBridgeState()
  );
  const [steps, setSteps] = useState<RaftingMessageStep[]>(() =>
    raftingWhatsappService.getSteps()
  );
  const [history, setHistory] = useState<RaftingSendHistoryItem[]>(() =>
    raftingWhatsappService.getHistory()
  );
  const [bridgeConfig, setBridgeConfig] = useState(() =>
    raftingWhatsappService.getBridgeConfig()
  );

  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState<SendProgressUpdate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCheckingQr, setIsCheckingQr] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSteps(raftingWhatsappService.getSteps());
      setHistory(raftingWhatsappService.getHistory());
      setBridgeConfig(raftingWhatsappService.getBridgeConfig());
      raftingWhatsappService.checkBridgeNow();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = raftingWhatsappService.subscribeState((state) => {
      setBridgeState(state);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const formattedPhone = normalizeWhatsappPhone(phone);
  const enabledSteps = steps.filter((s) => s.enabled);

  const handleAutoSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formattedPhone || formattedPhone.length < 10) {
      setErrorMsg('Ingresá un número válido (ej: 2944 123456 o 11 2345 6789).');
      return;
    }

    setIsSending(true);
    setProgress({
      jobId: 'init',
      currentStep: 1,
      totalSteps: enabledSteps.length,
      stepTitle: 'Iniciando envío automático por WhatsApp...',
      status: 'sending',
    });

    try {
      await raftingWhatsappService.sendRaftingSequence(phone, clientLabel, (update) => {
        setProgress(update);
      });
      soundService.playSuccess();
      setSuccessMsg(
        `¡Se enviaron los ${enabledSteps.length} mensajes, fotos y ubicación al +${formattedPhone}!`
      );
      setHistory(raftingWhatsappService.getHistory());
      setPhone('');
      setClientLabel('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudo completar el envío automático.');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Direct fallback 1: Opens WhatsApp with all text messages, Google Maps link, TripAdvisor and Pomelos contact pre-filled
   */
  const handleDirectWhatsAppTexts = () => {
    if (!formattedPhone || formattedPhone.length < 10) {
      setErrorMsg('Ingresá primero el número de teléfono del cliente arriba.');
      return;
    }
    const text = raftingWhatsappService.buildCombinedFallbackText();
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    raftingWhatsappService.addHistory({
      phone,
      formattedPhone,
      clientLabel,
      mode: 'manual-wa',
      stepsCount: enabledSteps.length,
      status: 'success',
    });
    setHistory(raftingWhatsappService.getHistory());
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /**
   * Direct fallback 2: Uses mobile Web Share API to share all 5 road & rafting photos directly to WhatsApp
   */
  const handleSharePhotosMobile = async () => {
    try {
      const imageSteps = enabledSteps.filter((s) => s.type === 'image' && s.imageUrl);
      const files: File[] = [];

      for (let i = 0; i < imageSteps.length; i++) {
        const res = await fetch(imageSteps[i].imageUrl!);
        const blob = await res.blob();
        files.push(new File([blob], `rafting-pomelos-${i + 1}.jpg`, { type: blob.type || 'image/jpeg' }));
      }

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          title: 'Fotos Camino y Base Rafting - Pomelos Tour',
          text: 'En el poste blanco y negro doblar a la izqr, son 200 metros',
          files,
        });
      } else {
        alert(
          'Tu navegador actual no soporta compartir múltiples archivos directo. Usá el envío automático por QR o tocá cada foto abajo para abrirla.'
        );
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        alert('Error al preparar las fotos para compartir.');
      }
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Step Editor handlers
  const handleToggleStep = (id: string) => {
    const next = steps.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setSteps(next);
    raftingWhatsappService.saveSteps(next);
  };

  const handleUpdateStepField = (id: string, field: keyof RaftingMessageStep, value: string) => {
    const next = steps.map((s) => (s.id === id ? { ...s, [field]: value } : s));
    setSteps(next);
    raftingWhatsappService.saveSteps(next);
  };

  const handleMoveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setSteps(next);
    raftingWhatsappService.saveSteps(next);
  };

  const handleDeleteStep = (id: string) => {
    if (!window.confirm('¿Eliminar este mensaje de la secuencia?')) return;
    const next = steps.filter((s) => s.id !== id);
    setSteps(next);
    raftingWhatsappService.saveSteps(next);
  };

  const handleAddStep = (type: 'text' | 'image' | 'contact') => {
    const newStep: RaftingMessageStep = {
      id: `step-custom-${Date.now()}`,
      type,
      title:
        type === 'text'
          ? `${steps.length + 1}. Nuevo mensaje de texto`
          : type === 'image'
            ? `${steps.length + 1}. Nueva foto de referencia`
            : `${steps.length + 1}. Nuevo contacto`,
      enabled: true,
      text: type === 'text' ? 'Escribí acá el mensaje...' : '',
      imageUrl: type === 'image' ? '/rafting/poste-cartel-rafting.jpg' : undefined,
      contactName: type === 'contact' ? 'Pomelos Tour Rafting' : undefined,
      contactPhone: type === 'contact' ? '+54 9 2944 317922' : undefined,
    };
    const next = [...steps, newStep];
    setSteps(next);
    raftingWhatsappService.saveSteps(next);
  };

  const handleUploadImageForStep = (stepId: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        handleUpdateStepField(stepId, 'imageUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetDefaultSteps = () => {
    if (
      window.confirm(
        '¿Restaurar los 12 mensajes, fotos del poste blanco y negro y ubicación originales de Pomelos Tour?'
      )
    ) {
      const defaults = raftingWhatsappService.resetStepsToDefault();
      setSteps(defaults);
      soundService.playSuccess();
    }
  };

  const handleSaveBridgeSettings = (e: React.FormEvent) => {
    e.preventDefault();
    raftingWhatsappService.saveBridgeConfig(bridgeConfig);
    soundService.playSuccess();
  };

  const handleRefreshQr = async () => {
    setIsCheckingQr(true);
    await raftingWhatsappService.checkBridgeNow();
    setTimeout(() => setIsCheckingQr(false), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-[28px] bg-white border border-black/[0.08] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#1C1C1C]">
        {/* Modal Header */}
        <div className="px-4 py-3.5 border-b border-black/[0.06] flex items-center justify-between bg-[#FAF6E8]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center shadow-sm shrink-0">
              <Send className="w-4 h-4 text-[#F7D147] stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-[#1C1C1C] truncate">
                  Envío Automático Rafting (Pomelos Tour)
                </h2>
                <span
                  onClick={() => setActiveTab('qr')}
                  className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${bridgeState.whatsappReady
                      ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                      : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${bridgeState.whatsappReady ? 'bg-[#16A34A] animate-pulse' : 'bg-[#D97706]'
                      }`}
                  />
                  <span>{bridgeState.whatsappReady ? 'QR Activo' : 'Conectar QR'}</span>
                </span>
              </div>
              <p className="text-[11px] text-[#71706B] truncate">
                Manda ubicación, recordatorio, info, 5 fotos del camino y contacto con solo poner el número
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white border border-black/[0.08] text-[#71706B] hover:text-[#1C1C1C] transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1.5 bg-[#F6F3EA] border-b border-black/[0.06]">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-extrabold transition-all ${activeTab === 'send'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'text-[#52514E] hover:text-[#1C1C1C]'
              }`}
          >
            <Send className="w-3.5 h-3.5 text-[#F7D147]" />
            <span>Enviar Info</span>
          </button>

          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-extrabold transition-all ${activeTab === 'steps'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'text-[#52514E] hover:text-[#1C1C1C]'
              }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Mensajes ({enabledSteps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-extrabold transition-all ${activeTab === 'qr'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'text-[#52514E] hover:text-[#1C1C1C]'
              }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>WhatsApp QR</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-extrabold transition-all ${activeTab === 'history'
                ? 'bg-[#1C1C1C] text-white shadow-sm'
                : 'text-[#52514E] hover:text-[#1C1C1C]'
              }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({history.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: SEND TO CLIENT */}
          {activeTab === 'send' && (
            <div className="space-y-4">
              {/* Main Phone Form */}
              <form onSubmit={handleAutoSend} className="space-y-3.5">
                <div className="p-4 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-[#1C1C1C] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Teléfono de WhatsApp del Cliente</span>
                    </label>
                    {formattedPhone && (
                      <span className="text-[11px] font-mono text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#86EFAC] font-bold">
                        Se enviará a: +{formattedPhone}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-[#71706B] select-none">
                        🇦🇷 +54 9
                      </span>
                      <input
                        type="tel"
                        autoFocus
                        placeholder="Ej: 2944 556677 o 11 4455 6677"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        disabled={isSending}
                        className="w-full pl-20 pr-4 py-3.5 rounded-xl bg-white border-2 border-black/[0.08] focus:border-[#1C1C1C] text-base sm:text-lg font-extrabold text-[#1C1C1C] placeholder-[#71706B]/50 focus:outline-none transition-all font-mono"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Nombre / Nota (opcional)"
                      value={clientLabel}
                      onChange={(e) => setClientLabel(e.target.value)}
                      disabled={isSending}
                      className="sm:w-48 px-3.5 py-3 rounded-xl bg-white border border-black/[0.08] focus:border-[#1C1C1C] text-xs font-semibold text-[#1C1C1C] placeholder-[#71706B] focus:outline-none"
                    />
                  </div>

                  <p className="text-[11px] text-[#71706B]">
                    Podés escribir solo característica + número (sin 0 ni 15) o pegar el número completo tal cual te aparece en WhatsApp.
                  </p>
                </div>

                {/* Live Progress Bar while sending */}
                {isSending && progress && (
                  <div className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] space-y-2.5 animate-pulse">
                    <div className="flex items-center justify-between text-xs font-extrabold text-[#1C1C1C]">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-[#1C1C1C] animate-spin" />
                        <span>{progress.stepTitle}</span>
                      </span>
                      <span className="text-[#1C1C1C]">
                        {progress.currentStep} / {progress.totalSteps}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-black/10">
                      <div
                        className="h-full bg-[#1C1C1C] transition-all duration-300"
                        style={{
                          width: `${Math.round((progress.currentStep / Math.max(1, progress.totalSteps)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                  <div className="p-3.5 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-xs font-bold flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p>{errorMsg}</p>
                      {!bridgeState.whatsappReady && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('qr')}
                          className="underline text-[#1C1C1C] hover:opacity-80 font-extrabold"
                        >
                          Ir a pestaña WhatsApp QR para vincular o ver estado →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Primary Automatic Send Button */}
                <button
                  type="submit"
                  disabled={isSending || !phone.trim()}
                  className="w-full py-4 px-5 rounded-full bg-[#1C1C1C] hover:bg-[#333333] disabled:opacity-40 text-white font-black text-sm sm:text-base tracking-wide shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.99] transition-all"
                >
                  <Sparkles className="w-5 h-5 stroke-[2.5] text-[#F7D147]" />
                  <span>
                    {isSending
                      ? `ENVIANDO SECUENCIA (${progress?.currentStep || 1}/${enabledSteps.length})...`
                      : `ENVIAR PACK RAFTING AUTOMÁTICO (${enabledSteps.length} MENSAJES)`}
                  </span>
                </button>
              </form>

              {/* Quick Direct / Fallback Tools (No server required) */}
              <div className="p-3.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#52514E]">
                    Envío Directo desde el Celular (Sin Servidor QR)
                  </span>
                  <span className="text-[10px] text-[#166534] font-bold">
                    100% disponible siempre
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDirectWhatsAppTexts}
                    className="py-2.5 px-3 rounded-full bg-[#F7D147] hover:bg-[#f0c62d] text-[#1C1C1C] text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4 text-[#1C1C1C]" />
                    <span>Abrir WhatsApp con Textos + Links</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSharePhotosMobile}
                    className="py-2.5 px-3 rounded-full bg-white hover:bg-[#EAE4D3] text-[#1C1C1C] text-xs font-bold flex items-center justify-center gap-2 border border-black/[0.08] transition-all active:scale-95"
                  >
                    <Share2 className="w-4 h-4 text-[#1C1C1C]" />
                    <span>Compartir las 5 Fotos al Chat</span>
                  </button>
                </div>
              </div>

              {/* Compact Preview of the 12 Messages */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold text-[#71706B] uppercase tracking-wider">
                    Secuencia que recibe el cliente ({enabledSteps.length} pasos en orden)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('steps')}
                    className="text-[11px] font-bold text-[#1C1C1C] hover:underline"
                  >
                    Editar mensajes o fotos →
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                  {enabledSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="p-2.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.05] flex items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[#1C1C1C] text-[#F7D147] font-black text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        {step.type === 'image' && step.imageUrl && (
                          <img
                            src={step.imageUrl}
                            alt={step.title}
                            className="w-10 h-10 rounded-lg object-cover border border-black/10 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-[#1C1C1C] truncate">{step.title}</p>
                          <p className="text-[11px] text-[#71706B] truncate">
                            {step.type === 'text' && step.text}
                            {step.type === 'image' && (step.text || 'Foto de referencia enviada al chat')}
                            {step.type === 'contact' &&
                              `Contacto: ${step.contactName} (${step.contactPhone})`}
                          </p>
                        </div>
                      </div>

                      {step.type === 'text' && step.text && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(step.id, step.text!)}
                          className="p-1.5 rounded-full bg-white hover:bg-[#F7D147] text-[#1C1C1C] border border-black/[0.06] shrink-0"
                          title="Copiar este mensaje"
                        >
                          {copiedId === step.id ? (
                            <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT SEQUENCE OF MESSAGES & PHOTOS */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.06]">
                <div>
                  <h3 className="text-xs font-extrabold text-[#1C1C1C]">
                    Personalizar Secuencia de Mensajes y Fotos
                  </h3>
                  <p className="text-[11px] text-[#71706B]">
                    Se envían uno por uno en este orden exacto con 1.4 seg de pausa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaultSteps}
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
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${step.enabled
                        ? 'bg-[#F6F3EA] border-black/[0.06]'
                        : 'bg-[#F6F3EA]/50 border-black/[0.04] opacity-60'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={step.enabled}
                          onChange={() => handleToggleStep(step.id)}
                          className="w-4 h-4 accent-[#1C1C1C] rounded cursor-pointer"
                        />
                        <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1C] text-[#F7D147] text-[10px] font-black uppercase">
                          {step.type === 'text'
                            ? 'Texto'
                            : step.type === 'image'
                              ? 'Foto'
                              : 'Contacto'}
                        </span>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleUpdateStepField(step.id, 'title', e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-[#1C1C1C] text-xs font-extrabold text-[#1C1C1C] focus:outline-none flex-1 min-w-0"
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveStep(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 rounded-full bg-white hover:bg-[#EAE4D3] disabled:opacity-30 text-[#1C1C1C] border border-black/[0.06]"
                          title="Subir"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(index, 1)}
                          disabled={index === steps.length - 1}
                          className="p-1.5 rounded-full bg-white hover:bg-[#EAE4D3] disabled:opacity-30 text-[#1C1C1C] border border-black/[0.06]"
                          title="Bajar"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-1.5 rounded-full bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B]"
                          title="Eliminar paso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {step.type === 'text' && (
                      <textarea
                        rows={3}
                        value={step.text || ''}
                        onChange={(e) => handleUpdateStepField(step.id, 'text', e.target.value)}
                        className="w-full rounded-xl bg-white border border-black/[0.08] p-2.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
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
                            onChange={(e) => handleUpdateStepField(step.id, 'text', e.target.value)}
                            className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                          />
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white text-[11px] font-bold cursor-pointer">
                            <ImageIcon className="w-3.5 h-3.5 text-[#F7D147]" />
                            <span>Cambiar Foto desde el dispositivo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadImageForStep(step.id, e.target.files?.[0])}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {step.type === 'contact' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-[#71706B] block mb-1">
                            Nombre del Contacto (Prestador Rafting)
                          </label>
                          <input
                            type="text"
                            value={step.contactName || ''}
                            onChange={(e) =>
                              handleUpdateStepField(step.id, 'contactName', e.target.value)
                            }
                            className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-[#1C1C1C]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#71706B] block mb-1">
                            Teléfono de Contacto (WhatsApp)
                          </label>
                          <input
                            type="text"
                            value={step.contactPhone || ''}
                            onChange={(e) =>
                              handleUpdateStepField(step.id, 'contactPhone', e.target.value)
                            }
                            className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-[#1C1C1C] font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-[#71706B] block mb-1">
                            Mensaje acompañando al contacto
                          </label>
                          <input
                            type="text"
                            value={step.text || ''}
                            onChange={(e) => handleUpdateStepField(step.id, 'text', e.target.value)}
                            className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-[#1C1C1C]"
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
                  onClick={() => handleAddStep('text')}
                  className="py-2.5 px-3 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F7D147]" />
                  <MessageSquare className="w-3.5 h-3.5 text-[#F7D147]" />
                  <span>+ Texto</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('image')}
                  className="py-2.5 px-3 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F7D147]" />
                  <ImageIcon className="w-3.5 h-3.5 text-[#F7D147]" />
                  <span>+ Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddStep('contact')}
                  className="py-2.5 px-3 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F7D147]" />
                  <UserCheck className="w-3.5 h-3.5 text-[#F7D147]" />
                  <span>+ Contacto</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: WHATSAPP QR CONNECTION */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              {/* Live Connection Card */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${bridgeState.whatsappReady
                    ? 'bg-[#DCFCE7] border-[#86EFAC]'
                    : 'bg-[#F6F3EA] border-black/[0.06]'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Wifi
                      className={`w-5 h-5 ${bridgeState.whatsappReady ? 'text-[#16A34A] animate-pulse' : 'text-[#D97706]'
                        }`}
                    />
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-[#1C1C1C]">
                        {bridgeState.whatsappReady
                          ? `¡WhatsApp Vinculado! (${bridgeState.whatsappNumber || 'Activo'})`
                          : bridgeState.statusText}
                      </h3>
                      <p className="text-[11px] text-[#71706B]">
                        {bridgeState.whatsappReady
                          ? 'Todos los celulares pueden disparar los 12 mensajes en segundo plano.'
                          : 'Escaneá el código QR desde tu WhatsApp > Dispositivos vinculados.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRefreshQr}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-[#EAE4D3] border border-black/[0.08] text-xs font-bold flex items-center gap-1.5 text-[#1C1C1C]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingQr ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                </div>

                {/* QR Code Display if available */}
                {!bridgeState.whatsappReady && bridgeState.qrDataUrl && (
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl max-w-xs mx-auto space-y-2 shadow-md border border-black/10">
                    <img
                      src={bridgeState.qrDataUrl}
                      alt="Código QR de WhatsApp"
                      className="w-56 h-56 object-contain"
                    />
                    <span className="text-[11px] font-extrabold text-[#1C1C1C] text-center">
                      Abrí WhatsApp en tu teléfono → Dispositivos vinculados → Vincular un dispositivo
                    </span>
                  </div>
                )}

                {!bridgeState.connected && (
                  <div className="p-3.5 rounded-xl bg-white border border-black/[0.06] text-xs space-y-2">
                    <p className="font-extrabold text-[#92400E]">
                      ¿Cómo encender el servidor WhatsApp QR gratuito?
                    </p>
                    <p className="text-[11px] text-[#52514E] leading-relaxed">
                      En la carpeta del proyecto tenés listo el puente automático. Corré este comando en la terminal (o dejalo corriendo en una PC/servidor conectado a tu Supabase):
                    </p>
                    <code className="block p-2.5 rounded-lg bg-[#1C1C1C] text-[#F7D147] font-mono text-[11px] select-all">
                      npm run whatsapp-bridge
                    </code>
                    <p className="text-[11px] text-[#71706B]">
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

              {/* Bridge / Evolution API Configuration */}
              <form
                onSubmit={handleSaveBridgeSettings}
                className="p-4 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] space-y-3"
              >
                <h4 className="text-xs font-extrabold text-[#1C1C1C] uppercase tracking-wider">
                  Ajustes Avanzados de Conexión
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBridgeConfig({ ...bridgeConfig, provider: 'bridge' })}
                    className={`py-2 px-3 rounded-full text-xs font-bold border ${bridgeConfig.provider === 'bridge'
                        ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white'
                        : 'bg-white border-black/[0.06] text-[#52514E]'
                      }`}
                  >
                    Servidor QR Incluido (Supabase / Local)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBridgeConfig({ ...bridgeConfig, provider: 'evolution' })}
                    className={`py-2 px-3 rounded-full text-xs font-bold border ${bridgeConfig.provider === 'evolution'
                        ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white'
                        : 'bg-white border-black/[0.06] text-[#52514E]'
                      }`}
                  >
                    Evolution API Externa
                  </button>
                </div>

                {bridgeConfig.provider === 'bridge' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#52514E] block mb-1">
                        URL del Servidor QR (Local o Nube)
                      </label>
                      <input
                        type="text"
                        value={bridgeConfig.bridgeHttpUrl}
                        onChange={(e) =>
                          setBridgeConfig({ ...bridgeConfig, bridgeHttpUrl: e.target.value })
                        }
                        placeholder="http://localhost:3100"
                        className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-[#1C1C1C] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#52514E] block mb-1">
                        Pausa entre cada mensaje (ms)
                      </label>
                      <input
                        type="number"
                        min={500}
                        max={8000}
                        step={100}
                        value={bridgeConfig.delayMs}
                        onChange={(e) =>
                          setBridgeConfig({
                            ...bridgeConfig,
                            delayMs: Number(e.target.value) || 1400,
                          })
                        }
                        className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-[#1C1C1C] font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-[#52514E] block mb-1">
                        Evolution API URL
                      </label>
                      <input
                        type="url"
                        value={bridgeConfig.evolutionUrl}
                        onChange={(e) =>
                          setBridgeConfig({ ...bridgeConfig, evolutionUrl: e.target.value })
                        }
                        placeholder="https://api.tudominio.com"
                        className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-[#1C1C1C] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#52514E] block mb-1">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={bridgeConfig.evolutionApiKey}
                        onChange={(e) =>
                          setBridgeConfig({ ...bridgeConfig, evolutionApiKey: e.target.value })
                        }
                        placeholder="Global / Instance Key"
                        className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-[#1C1C1C] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#52514E] block mb-1">
                        Nombre de Instancia
                      </label>
                      <input
                        type="text"
                        value={bridgeConfig.evolutionInstance}
                        onChange={(e) =>
                          setBridgeConfig({ ...bridgeConfig, evolutionInstance: e.target.value })
                        }
                        placeholder="eco-aventura"
                        className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs text-[#1C1C1C] font-mono"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#1C1C1C] text-white font-black text-xs hover:bg-[#333333] transition-all"
                >
                  Guardar Configuración de Envío
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: SEND HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-[#1C1C1C]">
                  Últimos clientes a los que se les envió Info de Rafting
                </h3>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      raftingWhatsappService.clearHistory();
                      setHistory([]);
                    }}
                    className="text-[11px] text-[#991B1B] hover:underline font-bold"
                  >
                    Limpiar historial
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] text-center text-xs text-[#71706B]">
                  Todavía no se registraron envíos de info de Rafting en este dispositivo.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[#F6F3EA] border border-black/[0.06] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-[#1C1C1C]">
                            +{item.formattedPhone}
                          </span>
                          {item.clientLabel && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F7D147] text-[#1C1C1C] text-[10px] font-bold">
                              {item.clientLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#71706B] mt-0.5">
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
                        onClick={() => {
                          setPhone(item.formattedPhone);
                          setClientLabel(item.clientLabel || '');
                          setActiveTab('send');
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#1C1C1C] hover:bg-[#333333] text-white text-[11px] font-bold shrink-0"
                      >
                        Reenviar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

