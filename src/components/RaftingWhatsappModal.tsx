import React, { useState, useEffect, useId } from 'react';
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
import { useDialogA11y } from '../hooks/useDialogA11y';
import { uiFeedback } from '../services/uiFeedback';
import { RaftingStepsTab } from './rafting/RaftingStepsTab';
import { RaftingQrTab } from './rafting/RaftingQrTab';
import { RaftingHistoryTab } from './rafting/RaftingHistoryTab';

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
  const titleId = useId();
  const dialogRef = useDialogA11y(isOpen, onClose);
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
        uiFeedback.toast(
          'Tu navegador actual no soporta compartir múltiples archivos directo. Usá el envío automático por QR o tocá cada foto abajo para abrirla.',
          'info'
        );
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        uiFeedback.toast('Error al preparar las fotos para compartir.', 'error');
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

  const handleDeleteStep = async (id: string) => {
    const confirmed = await uiFeedback.confirm({
      title: 'Eliminar mensaje',
      message: '¿Eliminar este mensaje de la secuencia?',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) return;
    const next = steps.filter((s) => s.id !== id);
    setSteps(next);
    raftingWhatsappService.saveSteps(next);
    uiFeedback.toast('Mensaje eliminado de la secuencia.', 'info');
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

  const handleResetDefaultSteps = async () => {
    const confirmed = await uiFeedback.confirm({
      title: 'Restaurar secuencia original',
      message: '¿Restaurar los 12 mensajes, fotos del poste blanco y negro y ubicación originales de Pomelos Tour?',
      confirmLabel: 'Restaurar',
    });
    if (confirmed) {
      const defaults = raftingWhatsappService.resetStepsToDefault();
      setSteps(defaults);
      soundService.playSuccess();
      uiFeedback.toast('Secuencia restaurada a valores originales.', 'success');
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-2xl rounded-[28px] bg-white border border-black/[0.08] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-eco-dark focus:outline-none"
      >
        {/* Modal Header */}
        <div className="px-4 py-3.5 border-b border-black/[0.06] flex items-center justify-between bg-eco-cream">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-eco-dark flex items-center justify-center shadow-sm shrink-0">
              <Send className="w-4 h-4 text-eco-gold stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id={titleId} className="text-sm sm:text-base font-black tracking-tight text-eco-dark truncate">
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
                    className={`w-1.5 h-1.5 rounded-full ${bridgeState.whatsappReady ? 'bg-eco-leaf animate-pulse' : 'bg-[#D97706]'
                      }`}
                  />
                  <span>{bridgeState.whatsappReady ? 'QR Activo' : 'Conectar QR'}</span>
                </span>
              </div>
              <p className="text-[11px] text-eco-creamMuted truncate">
                Manda ubicación, recordatorio, info, 5 fotos del camino y contacto con solo poner el número
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="p-2 rounded-full bg-white border border-black/[0.08] text-eco-creamMuted hover:text-eco-dark transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1.5 bg-eco-surface border-b border-black/[0.06]">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-extrabold transition-all ${activeTab === 'send'
                ? 'bg-eco-dark text-white shadow-sm'
                : 'text-eco-creamDark hover:text-eco-dark'
              }`}
          >
            <Send className="w-3.5 h-3.5 text-eco-gold" />
            <span>Enviar Info</span>
          </button>

          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-extrabold transition-all ${activeTab === 'steps'
                ? 'bg-eco-dark text-white shadow-sm'
                : 'text-eco-creamDark hover:text-eco-dark'
              }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Mensajes ({enabledSteps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-extrabold transition-all ${activeTab === 'qr'
                ? 'bg-eco-dark text-white shadow-sm'
                : 'text-eco-creamDark hover:text-eco-dark'
              }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>WhatsApp QR</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-extrabold transition-all ${activeTab === 'history'
                ? 'bg-eco-dark text-white shadow-sm'
                : 'text-eco-creamDark hover:text-eco-dark'
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
                <div className="p-4 rounded-2xl bg-eco-surface border border-black/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-eco-dark flex items-center gap-1.5">
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
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-eco-creamMuted select-none">
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
                        className="w-full pl-20 pr-4 py-3.5 rounded-xl bg-white border-2 border-black/[0.08] focus:border-eco-dark text-base sm:text-lg font-extrabold text-eco-dark placeholder-eco-creamMuted/50 focus:outline-none transition-all font-mono"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Nombre / Nota (opcional)"
                      value={clientLabel}
                      onChange={(e) => setClientLabel(e.target.value)}
                      disabled={isSending}
                      className="sm:w-48 px-3.5 py-3 rounded-xl bg-white border border-black/[0.08] focus:border-eco-dark text-xs font-semibold text-eco-dark placeholder-eco-creamMuted focus:outline-none"
                    />
                  </div>

                  <p className="text-[11px] text-eco-creamMuted">
                    Podés escribir solo característica + número (sin 0 ni 15) o pegar el número completo tal cual te aparece en WhatsApp.
                  </p>
                </div>

                {/* Live Progress Bar while sending */}
                {isSending && progress && (
                  <div className="p-4 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] space-y-2.5 animate-pulse">
                    <div className="flex items-center justify-between text-xs font-extrabold text-eco-dark">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-eco-dark animate-spin" />
                        <span>{progress.stepTitle}</span>
                      </span>
                      <span className="text-eco-dark">
                        {progress.currentStep} / {progress.totalSteps}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-black/10">
                      <div
                        className="h-full bg-eco-dark transition-all duration-300"
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
                    <CheckCircle2 className="w-5 h-5 text-eco-leaf shrink-0" />
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
                          className="underline text-eco-dark hover:opacity-80 font-extrabold"
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
                  className="w-full py-4 px-5 rounded-full bg-eco-dark hover:bg-eco-forestLight disabled:opacity-40 text-white font-black text-sm sm:text-base tracking-wide shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.99] transition-all"
                >
                  <Sparkles className="w-5 h-5 stroke-[2.5] text-eco-gold" />
                  <span>
                    {isSending
                      ? `ENVIANDO SECUENCIA (${progress?.currentStep || 1}/${enabledSteps.length})...`
                      : `ENVIAR PACK RAFTING AUTOMÁTICO (${enabledSteps.length} MENSAJES)`}
                  </span>
                </button>
              </form>

              {/* Quick Direct / Fallback Tools (No server required) */}
              <div className="p-3.5 rounded-2xl bg-eco-surface border border-black/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-eco-creamDark">
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
                    className="py-2.5 px-3 rounded-full bg-eco-gold hover:bg-[#f0c62d] text-eco-dark text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4 text-eco-dark" />
                    <span>Abrir WhatsApp con Textos + Links</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSharePhotosMobile}
                    className="py-2.5 px-3 rounded-full bg-white hover:bg-[#EAE4D3] text-eco-dark text-xs font-bold flex items-center justify-center gap-2 border border-black/[0.08] transition-all active:scale-95"
                  >
                    <Share2 className="w-4 h-4 text-eco-dark" />
                    <span>Compartir las 5 Fotos al Chat</span>
                  </button>
                </div>
              </div>

              {/* Compact Preview of the 12 Messages */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold text-eco-creamMuted uppercase tracking-wider">
                    Secuencia que recibe el cliente ({enabledSteps.length} pasos en orden)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('steps')}
                    className="text-[11px] font-bold text-eco-dark hover:underline"
                  >
                    Editar mensajes o fotos →
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                  {enabledSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="p-2.5 rounded-2xl bg-eco-surface border border-black/[0.05] flex items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-eco-dark text-eco-gold font-black text-[11px] flex items-center justify-center shrink-0">
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
                          <p className="font-bold text-eco-dark truncate">{step.title}</p>
                          <p className="text-[11px] text-eco-creamMuted truncate">
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
                          className="p-1.5 rounded-full bg-white hover:bg-eco-gold text-eco-dark border border-black/[0.06] shrink-0"
                          title="Copiar este mensaje"
                        >
                          {copiedId === step.id ? (
                            <Check className="w-3.5 h-3.5 text-eco-leaf" />
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
            <RaftingStepsTab
              steps={steps}
              onResetDefaults={handleResetDefaultSteps}
              onToggleStep={handleToggleStep}
              onUpdateStepField={handleUpdateStepField}
              onMoveStep={handleMoveStep}
              onDeleteStep={handleDeleteStep}
              onAddStep={handleAddStep}
              onUploadImage={handleUploadImageForStep}
            />
          )}

          {/* TAB 3: WHATSAPP QR CONNECTION */}
          {activeTab === 'qr' && (
            <RaftingQrTab
              bridgeState={bridgeState}
              bridgeConfig={bridgeConfig}
              isCheckingQr={isCheckingQr}
              onRefreshQr={handleRefreshQr}
              onChangeBridgeConfig={setBridgeConfig}
              onSaveBridgeSettings={handleSaveBridgeSettings}
            />
          )}

          {/* TAB 4: SEND HISTORY */}
          {activeTab === 'history' && (
            <RaftingHistoryTab
              history={history}
              onClearHistory={() => {
                raftingWhatsappService.clearHistory();
                setHistory([]);
              }}
              onResend={(item) => {
                setPhone(item.formattedPhone);
                setClientLabel(item.clientLabel || '');
                setActiveTab('send');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

