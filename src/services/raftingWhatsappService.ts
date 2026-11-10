import { getSupabase, isSupabaseConfigured } from './supabaseClient';

export type RaftingStepType = 'text' | 'image' | 'contact';

export interface RaftingMessageStep {
  id: string;
  type: RaftingStepType;
  title: string;
  enabled: boolean;
  /** Text content (for 'text') or optional image caption (for 'image') */
  text?: string;
  /** Image path (e.g. '/rafting/...') or Base64 data URL */
  imageUrl?: string;
  /** Contact fields (for 'contact' vCard) */
  contactName?: string;
  contactPhone?: string;
  contactOrg?: string;
}

export interface RaftingSendHistoryItem {
  id: string;
  phone: string;
  formattedPhone: string;
  clientLabel?: string;
  sentAt: string;
  mode: 'auto-bridge' | 'evolution-api' | 'manual-wa';
  stepsCount: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface WhatsappBridgeConfig {
  /** 'bridge' uses the included QR micro-server (HTTP + Supabase Realtime relay); 'evolution' uses an external Evolution API */
  provider: 'bridge' | 'evolution';
  /** Direct HTTP URL for the QR Bridge (default http://localhost:3100) */
  bridgeHttpUrl: string;
  /** Delay in milliseconds between each of the ~10 messages */
  delayMs: number;
  /** Optional Evolution API config */
  evolutionUrl: string;
  evolutionApiKey: string;
  evolutionInstance: string;
}

export interface BridgeLiveState {
  connected: boolean;
  whatsappReady: boolean;
  whatsappNumber?: string;
  whatsappName?: string;
  qrDataUrl?: string | null;
  statusText: string;
  lastSeen?: number;
}

export interface SendProgressUpdate {
  jobId: string;
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  status: 'sending' | 'completed' | 'error';
  error?: string;
}

const STORAGE_KEY_STEPS = 'rentflow_rafting_steps_v1';
const STORAGE_KEY_HISTORY = 'rentflow_rafting_history_v1';
const STORAGE_KEY_BRIDGE_CONFIG = 'rentflow_rafting_bridge_config_v1';

export const DEFAULT_RAFTING_STEPS: RaftingMessageStep[] = [
  {
    id: 'step-1-maps-link',
    type: 'text',
    title: '1. Link de Google Maps (Base)',
    enabled: true,
    text: 'https://maps.app.goo.gl/xpzJv5hGTStvF7Qo8?g_st=iw',
  },
  {
    id: 'step-2-maps-pointer',
    type: 'text',
    title: '2. Indicador ubicación base',
    enabled: true,
    text: '👆🏻ubicación base',
  },
  {
    id: 'step-3-recordatorio',
    type: 'text',
    title: '3. Recordatorio importante (Ropa y calzado)',
    enabled: true,
    text: `Recordatorio importante:\n\n°Llevar protector solar, una muda de ropa interior seca y toalla.\nPara hacer la actividad necesitan calzado ajustado , lo mejor son zapatillas o similar (no ojotas ni crocs porque se pierden o salen en el rio) y otro de repuesto  seco.`,
  },
  {
    id: 'step-4-pomelos-info',
    type: 'text',
    title: '4. Info Pomelos Tour + TripAdvisor',
    enabled: true,
    text: `Por qué elegir Pomelos tour? Con nosotros además de hacer rafting en el Río Chimehuin y disfrutar algunos juegos acuaticos, somos la única empresa de SMA que baja Garganta del Diablo, agregando 1km más al recorrido tradicional.\nAdemás,  con nosotros , podes ver el hermoso Lago Huechulafquen ya que Contamos con una muy linda  base totalmente equipada con baños cambiadores  y  un comedor  con deck exterior con impresionantes vistas al Lago, a la naciente del Río Chimehuin y el majestuoso volcán Lanin. Allí, compartimos la merienda  y relajamos un rato después de la actividad.\n Somos los únicos que proveemos de equipo completo con medias de neopreno (los pies van mojados durante todo el recorrido), ademas de trajes y chaquetas rompeviento.\nTenes la posibilidad de venir con tu auto hasta la base, dejarlo estacionado sin costos adicionales. \nTe invitamos a buscar nuestra reputación en las redes, Google y TripAdvisor, como Pomelostour. Pomelo tiene más de 25 años de experiencia en la actividad y somos la única empresa de la Provincia con todos  guias titulados  IRF ( internacional Rafting Federation)\nhttps://www.tripadvisor.com.ar/Attraction_Review-g312843-d3767520-Reviews-Pomelos_Tour_Rafting-San_Martin_de_los_Andes_Province_of_Neuquen_Patagonia.html`,
  },
  {
    id: 'step-5-foto-rio-1',
    type: 'image',
    title: '5. Foto Rafting en el Río Chimehuin (1)',
    enabled: true,
    imageUrl: '/rafting/rafting-rio-1.jpg',
    text: '',
  },
  {
    id: 'step-6-foto-rio-2',
    type: 'image',
    title: '6. Foto Rafting en el Río Chimehuin (2)',
    enabled: true,
    imageUrl: '/rafting/rafting-rio-2.jpg',
    text: '',
  },
  {
    id: 'step-7-maps-offline',
    type: 'text',
    title: '7. Aviso Google Maps sin conexión (Junín)',
    enabled: true,
    text: 'Importante: Descarguen el mapa de Google Maps sin conexión porque después de Junín de los Andes se quedan sin señal 📶',
  },
  {
    id: 'step-8-foto-camino-desvio',
    type: 'image',
    title: '8. Foto del camino y desvío al poste',
    enabled: true,
    imageUrl: '/rafting/camino-desvio-poste.jpg',
    text: '',
  },
  {
    id: 'step-9-foto-poste-combi',
    type: 'image',
    title: '9. Foto poste blanco y negro + Combi Pomelos',
    enabled: true,
    imageUrl: '/rafting/poste-combi-pomelos.jpg',
    text: '',
  },
  {
    id: 'step-10-foto-cartel-rafting',
    type: 'image',
    title: '10. Foto cartel RAFTING con remo',
    enabled: true,
    imageUrl: '/rafting/poste-cartel-rafting.jpg',
    text: '',
  },
  {
    id: 'step-11-texto-poste',
    type: 'text',
    title: '11. Indicación del poste blanco y negro',
    enabled: true,
    text: 'En el poste blanco y negro doblar a la izqr, son 200 metros',
  },
  {
    id: 'step-12-contacto-pomelos',
    type: 'contact',
    title: '12. Contacto Pomelos Tour (Para coordinar)',
    enabled: true,
    contactName: 'Pomelos Tour Rafting',
    contactPhone: '+54 9 2944 317922',
    contactOrg: 'Pomelos Tour SMA',
    text: 'Te dejamos también el contacto directo de Pomelos Tour (+54 9 2944 317922) para cualquier consulta o coordinación:',
  },
];

const DEFAULT_BRIDGE_CONFIG: WhatsappBridgeConfig = {
  provider: 'bridge',
  bridgeHttpUrl: 'http://localhost:3100',
  delayMs: 1400,
  evolutionUrl: '',
  evolutionApiKey: '',
  evolutionInstance: 'eco-aventura',
};

/**
 * Formats an Argentine or international phone number into clean WhatsApp digits (e.g. 5492944317922)
 */
export function normalizeWhatsappPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  // Remove leading 00
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // If user entered local Argentine number starting with 0 (e.g. 02944...)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Remove old '15' prefix after area code if 10-12 digits without 54
  if (!digits.startsWith('54')) {
    // e.g. 294415317922 -> 2944317922
    digits = digits.replace(/^(11|2\d{2,3}|3\d{2,3})15(\d{6,8})$/, '$1$2');
    // Prepend 549 for Argentine mobile numbers (10 digits standard)
    if (digits.length >= 10 && digits.length <= 11) {
      digits = '549' + digits;
    }
  } else if (digits.startsWith('54') && !digits.startsWith('549') && digits.length === 12) {
    // e.g. 542944317922 -> 5492944317922
    digits = '549' + digits.slice(2);
  }

  return digits;
}

/**
 * Converts an image URL (like '/rafting/rafting-rio-1.jpg' or data URL) into a Base64 string
 * so the bridge server or Evolution API can send it even if the bridge runs on a different machine.
 */
export async function resolveImageToBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], base64: match[2] };
    }
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la imagen: ${imageUrl}`);
  }
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve({ base64, mimeType });
    };
    reader.onerror = () => reject(new Error('Error leyendo imagen en base64'));
    reader.readAsDataURL(blob);
  });
}

class RaftingWhatsappService {
  private bridgeState: BridgeLiveState = {
    connected: false,
    whatsappReady: false,
    statusText: 'Verificando conexión con WhatsApp QR...',
  };
  private stateListeners = new Set<(state: BridgeLiveState) => void>();
  private progressListeners = new Map<string, (update: SendProgressUpdate) => void>();
  private realtimeChannel: any = null;

  constructor() {
    this.initSupabaseBridgeChannel();
    this.pollBridgeStatus();
  }

  public getSteps(): RaftingMessageStep[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STEPS);
      if (!raw) return DEFAULT_RAFTING_STEPS;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RAFTING_STEPS;
    } catch {
      return DEFAULT_RAFTING_STEPS;
    }
  }

  public saveSteps(steps: RaftingMessageStep[]): void {
    localStorage.setItem(STORAGE_KEY_STEPS, JSON.stringify(steps));
  }

  public resetStepsToDefault(): RaftingMessageStep[] {
    localStorage.setItem(STORAGE_KEY_STEPS, JSON.stringify(DEFAULT_RAFTING_STEPS));
    return DEFAULT_RAFTING_STEPS;
  }

  public getBridgeConfig(): WhatsappBridgeConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BRIDGE_CONFIG);
      if (!raw) return DEFAULT_BRIDGE_CONFIG;
      return { ...DEFAULT_BRIDGE_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_BRIDGE_CONFIG;
    }
  }

  public saveBridgeConfig(config: WhatsappBridgeConfig): void {
    const cleaned = {
      ...config,
      bridgeHttpUrl: (config.bridgeHttpUrl || 'http://localhost:3100').replace(/\/+$/, ''),
      evolutionUrl: (config.evolutionUrl || '').replace(/\/+$/, ''),
    };
    localStorage.setItem(STORAGE_KEY_BRIDGE_CONFIG, JSON.stringify(cleaned));
    this.checkBridgeNow();
  }

  public getHistory(): RaftingSendHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public addHistory(item: Omit<RaftingSendHistoryItem, 'id' | 'sentAt'>): RaftingSendHistoryItem {
    const newItem: RaftingSendHistoryItem = {
      ...item,
      id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sentAt: new Date().toISOString(),
    };
    const next = [newItem, ...this.getHistory()].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(next));
    return newItem;
  }

  public clearHistory(): void {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify([]));
  }

  public subscribeState(cb: (state: BridgeLiveState) => void): () => void {
    this.stateListeners.add(cb);
    cb(this.bridgeState);
    return () => this.stateListeners.delete(cb);
  }

  private notifyState(partial: Partial<BridgeLiveState>) {
    this.bridgeState = { ...this.bridgeState, ...partial, lastSeen: Date.now() };
    this.stateListeners.forEach((cb) => cb(this.bridgeState));
  }

  public getBridgeState(): BridgeLiveState {
    return this.bridgeState;
  }

  /**
   * Connects to Supabase Realtime channel so a phone on 4G (on Vercel) can talk to the WhatsApp QR Bridge
   * running on a local PC or server without needing port forwarding or static IPs.
   */
  public initSupabaseBridgeChannel() {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;

    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = supabase
      .channel('eco_aventura_whatsapp_bridge', {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'bridge_status' }, ({ payload }) => {
        if (payload) {
          this.notifyState({
            connected: true,
            whatsappReady: Boolean(payload.whatsappReady),
            whatsappNumber: payload.whatsappNumber,
            whatsappName: payload.whatsappName,
            qrDataUrl: payload.qrDataUrl || null,
            statusText: payload.statusText || (payload.whatsappReady ? 'WhatsApp Conectado (Nube)' : 'Esperando escaneo de QR'),
          });
        }
      })
      .on('broadcast', { event: 'send_progress' }, ({ payload }) => {
        if (payload && payload.jobId) {
          const listener = this.progressListeners.get(payload.jobId);
          if (listener) {
            listener(payload as SendProgressUpdate);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.realtimeChannel?.send({
            type: 'broadcast',
            event: 'request_status',
            payload: { timestamp: Date.now() },
          });
        }
      });
  }

  private pollBridgeStatus() {
    this.checkBridgeNow();
    setInterval(() => {
      this.checkBridgeNow();
    }, 6000);
  }

  public async checkBridgeNow(): Promise<BridgeLiveState> {
    const config = this.getBridgeConfig();

    // Try direct HTTP bridge first
    if (config.provider === 'bridge' && config.bridgeHttpUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2200);
        const res = await fetch(`${config.bridgeHttpUrl}/api/status`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          this.notifyState({
            connected: true,
            whatsappReady: Boolean(data.whatsappReady),
            whatsappNumber: data.whatsappNumber,
            whatsappName: data.whatsappName,
            qrDataUrl: data.qrDataUrl || null,
            statusText: data.statusText || (data.whatsappReady ? 'WhatsApp Conectado' : 'Escaneá el QR para vincular'),
          });
          return this.bridgeState;
        }
      } catch {
        // Direct HTTP not reachable (e.g. on 4G mobile), ask via Supabase Realtime
      }
    }

    // Also ping via Supabase Realtime
    if (this.realtimeChannel) {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'request_status',
        payload: { timestamp: Date.now() },
      });
    }

    // If neither answered in the last 12 seconds, mark disconnected
    if (!this.bridgeState.lastSeen || Date.now() - this.bridgeState.lastSeen > 12000) {
      this.bridgeState = {
        connected: false,
        whatsappReady: false,
        qrDataUrl: null,
        statusText: 'Servidor WhatsApp QR desconectado',
      };
      this.stateListeners.forEach((cb) => cb(this.bridgeState));
    }

    return this.bridgeState;
  }

  public async requestLogoutOrNewQr(): Promise<void> {
    const config = this.getBridgeConfig();
    try {
      await fetch(`${config.bridgeHttpUrl}/api/logout`, { method: 'POST' });
      await this.checkBridgeNow();
      return;
    } catch {
      // Fallback to Supabase broadcast
    }
    if (this.realtimeChannel) {
      await this.realtimeChannel.send({
        type: 'broadcast',
        event: 'request_logout',
        payload: { timestamp: Date.now() },
      });
    }
  }

  /**
   * Sends the entire active sequence of Rafting messages automatically in the background
   */
  public async sendRaftingSequence(
    rawPhone: string,
    clientLabel: string,
    onProgress: (update: SendProgressUpdate) => void
  ): Promise<void> {
    const formattedPhone = normalizeWhatsappPhone(rawPhone);
    if (!formattedPhone || formattedPhone.length < 10) {
      throw new Error('Ingresá un número de teléfono válido (ej: 2944 123456 o 11 2345 6789).');
    }

    const activeSteps = this.getSteps().filter((s) => s.enabled);
    if (activeSteps.length === 0) {
      throw new Error('No hay mensajes activos en la secuencia de Rafting.');
    }

    const config = this.getBridgeConfig();
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Prepare payload resolving images to base64 so remote bridges can send them without file path issues
    const preparedSteps = await Promise.all(
      activeSteps.map(async (step) => {
        if (step.type === 'image' && step.imageUrl) {
          const { base64, mimeType } = await resolveImageToBase64(step.imageUrl);
          return {
            ...step,
            imageBase64: base64,
            imageMimeType: mimeType,
          };
        }
        return step;
      })
    );

    if (config.provider === 'evolution') {
      await this.sendViaEvolutionApi(formattedPhone, preparedSteps, config, jobId, onProgress);
      this.addHistory({
        phone: rawPhone,
        formattedPhone,
        clientLabel,
        mode: 'evolution-api',
        stepsCount: preparedSteps.length,
        status: 'success',
      });
      return;
    }

    // Mode 1A: Try direct HTTP to our QR Bridge
    let httpReachable = false;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 2000);
      const ping = await fetch(`${config.bridgeHttpUrl}/api/status`, { signal: controller.signal });
      clearTimeout(t);
      if (ping.ok) {
        const st = await ping.json();
        if (st.whatsappReady) {
          httpReachable = true;
        }
      }
    } catch {
      httpReachable = false;
    }

    if (httpReachable) {
      // Execute step-by-step via HTTP so the UI gets real-time progress per step
      for (let i = 0; i < preparedSteps.length; i++) {
        const step = preparedSteps[i];
        onProgress({
          jobId,
          currentStep: i + 1,
          totalSteps: preparedSteps.length,
          stepTitle: step.title,
          status: 'sending',
        });

        const res = await fetch(`${config.bridgeHttpUrl}/api/send-step`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formattedPhone,
            step,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error al enviar el paso ${i + 1}: ${step.title}`);
        }

        if (i < preparedSteps.length - 1) {
          await new Promise((r) => setTimeout(r, config.delayMs || 1400));
        }
      }

      onProgress({
        jobId,
        currentStep: preparedSteps.length,
        totalSteps: preparedSteps.length,
        stepTitle: '¡Todos los mensajes y fotos enviados!',
        status: 'completed',
      });

      this.addHistory({
        phone: rawPhone,
        formattedPhone,
        clientLabel,
        mode: 'auto-bridge',
        stepsCount: preparedSteps.length,
        status: 'success',
      });
      return;
    }

    // Mode 1B: Send via Supabase Realtime Relay (for 4G cellphones on Vercel talking to the Bridge PC)
    if (this.realtimeChannel && this.bridgeState.whatsappReady) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.progressListeners.delete(jobId);
          reject(new Error('Tiempo de espera agotado esperando respuesta del servidor WhatsApp QR.'));
        }, 90000);

        this.progressListeners.set(jobId, (update) => {
          onProgress(update);
          if (update.status === 'completed') {
            clearTimeout(timeout);
            this.progressListeners.delete(jobId);
            resolve();
          } else if (update.status === 'error') {
            clearTimeout(timeout);
            this.progressListeners.delete(jobId);
            reject(new Error(update.error || 'Error enviando desde el servidor WhatsApp QR'));
          }
        });

        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'send_sequence',
          payload: {
            jobId,
            phone: formattedPhone,
            delayMs: config.delayMs || 1400,
            steps: preparedSteps,
          },
        });
      });

      this.addHistory({
        phone: rawPhone,
        formattedPhone,
        clientLabel,
        mode: 'auto-bridge',
        stepsCount: preparedSteps.length,
        status: 'success',
      });
      return;
    }

    throw new Error(
      'El servidor WhatsApp QR no está conectado en este momento. Iniciá el servidor QR (o escaneá el QR en Configuración > WhatsApp QR) o usá el botón de Envío Directo de abajo.'
    );
  }

  private async sendViaEvolutionApi(
    phone: string,
    steps: Array<RaftingMessageStep & { imageBase64?: string; imageMimeType?: string }>,
    config: WhatsappBridgeConfig,
    jobId: string,
    onProgress: (update: SendProgressUpdate) => void
  ) {
    if (!config.evolutionUrl || !config.evolutionApiKey || !config.evolutionInstance) {
      throw new Error('Completá la URL, API Key e Instancia de Evolution API en Configuración.');
    }

    const headers = {
      'Content-Type': 'application/json',
      apikey: config.evolutionApiKey,
    };

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      onProgress({
        jobId,
        currentStep: i + 1,
        totalSteps: steps.length,
        stepTitle: step.title,
        status: 'sending',
      });

      if (step.type === 'text') {
        const res = await fetch(`${config.evolutionUrl}/message/sendText/${config.evolutionInstance}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            number: phone,
            text: step.text || '',
          }),
        });
        if (!res.ok) throw new Error(`Evolution API error en paso ${i + 1}`);
      } else if (step.type === 'image' && step.imageBase64) {
        const res = await fetch(`${config.evolutionUrl}/message/sendMedia/${config.evolutionInstance}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            number: phone,
            mediatype: 'image',
            mimetype: step.imageMimeType || 'image/jpeg',
            caption: step.text || '',
            media: step.imageBase64,
          }),
        });
        if (!res.ok) throw new Error(`Evolution API error enviando imagen en paso ${i + 1}`);
      } else if (step.type === 'contact') {
        if (step.text) {
          await fetch(`${config.evolutionUrl}/message/sendText/${config.evolutionInstance}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ number: phone, text: step.text }),
          });
        }
        const contactDigits = normalizeWhatsappPhone(step.contactPhone || '+5492944317922');
        await fetch(`${config.evolutionUrl}/message/sendContact/${config.evolutionInstance}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            number: phone,
            contact: [
              {
                fullName: step.contactName || 'Pomelos Tour Rafting',
                wuid: contactDigits,
                phoneNumber: step.contactPhone || '+54 9 2944 317922',
                organization: step.contactOrg || 'Pomelos Tour',
              },
            ],
          }),
        });
      }

      if (i < steps.length - 1) {
        await new Promise((r) => setTimeout(r, config.delayMs || 1400));
      }
    }

    onProgress({
      jobId,
      currentStep: steps.length,
      totalSteps: steps.length,
      stepTitle: '¡Secuencia enviada por Evolution API!',
      status: 'completed',
    });
  }

  /**
   * Builds a combined WhatsApp text message for instant fallback via wa.me
   */
  public buildCombinedFallbackText(): string {
    const activeSteps = this.getSteps().filter((s) => s.enabled);
    const blocks: string[] = [];

    for (const step of activeSteps) {
      if (step.type === 'text' && step.text?.trim()) {
        blocks.push(step.text.trim());
      } else if (step.type === 'contact') {
        const line = `${step.text ? step.text + '\n' : ''}📲 *${step.contactName || 'Pomelos Tour Rafting'}*: ${step.contactPhone || '+54 9 2944 317922'} (https://wa.me/${normalizeWhatsappPhone(step.contactPhone || '+5492944317922')})`;
        blocks.push(line);
      }
    }

    return blocks.join('\n\n────────────────\n\n');
  }
}

export const raftingWhatsappService = new RaftingWhatsappService();

