import { Category, Rental } from '../types';

const STORAGE_KEY_GSHEETS_URL = 'rentflow_gsheets_webhook_url';
const DEFAULT_GSHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbzYPhZmCl-hRF7JfqisoeOqY1VcVOdgr1W4vwvE-Hr6wQGvq07M6j16KYF4XWTHZNdXxg/exec';

export interface SheetTarget {
  sheetName: string;
  tipoLabel: string;
}

export function getGoogleSheetsWebhookUrl(): string {
  const stored = localStorage.getItem(STORAGE_KEY_GSHEETS_URL);
  if (stored && stored.trim()) return stored.trim();
  const envUrl = import.meta.env.VITE_GSHEETS_WEBHOOK_URL;
  if (typeof envUrl === 'string' && envUrl.trim()) return envUrl.trim();
  return DEFAULT_GSHEETS_WEBHOOK_URL;
}

export function saveGoogleSheetsWebhookUrl(url: string): void {
  const clean = url.trim();
  if (clean) {
    localStorage.setItem(STORAGE_KEY_GSHEETS_URL, clean);
  } else {
    localStorage.removeItem(STORAGE_KEY_GSHEETS_URL);
  }
}

export function isGoogleSheetsConfigured(): boolean {
  return getGoogleSheetsWebhookUrl().startsWith('https://script.google.com/');
}

function formatDateDDMM(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function formatTimeHHMM(isoDate?: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

function normalizeText(value?: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function resolveSheetTarget(category?: Category): SheetTarget {
  const slug = normalizeText(category?.slug);
  const id = normalizeText(category?.id);
  const name = normalizeText(category?.name);

  if (slug.includes('carrito') || id.includes('carrito') || name.includes('carrito')) {
    const isDoble = slug.includes('doble') || id.includes('doble') || name.includes('doble');
    return {
      sheetName: 'CARROS',
      tipoLabel: isDoble ? 'doble' : 'simple',
    };
  }

  if (slug.includes('karting') || id.includes('karting') || name.includes('karting')) {
    return {
      sheetName: 'KARTING',
      tipoLabel: 'simple',
    };
  }

  if (slug.includes('monopatin') || id.includes('monopatin') || name.includes('monopat')) {
    return {
      sheetName: 'MONOPATIN',
      tipoLabel: 'x1',
    };
  }

  if (slug.includes('kayak') || id.includes('kayak') || name.includes('kayak')) {
    const isDoble = slug.includes('doble') || id.includes('doble') || name.includes('doble');
    return {
      sheetName: 'KAYAK',
      tipoLabel: isDoble ? 'doble' : 'simple',
    };
  }

  return {
    sheetName: 'OTROS',
    tipoLabel: category?.name || 'otro',
  };
}

function mapPaymentColumns(method: Rental['paymentMethod']): { ef: string; mp: string } {
  if (method === 'efectivo') return { ef: 'ef', mp: '' };
  if (method === 'tarjeta') return { ef: '', mp: 'tar' };
  if (method === 'mixto') return { ef: 'ef', mp: 'mp' };
  return { ef: '', mp: 'mp' };
}

async function sendToAppsScript(payload: Record<string, unknown>): Promise<boolean> {
  const url = getGoogleSheetsWebhookUrl();
  if (!url) return false;

  try {
    // Google Apps Script Web Apps require text/plain + no-cors from browser PWAs
    // to avoid CORS preflight failures on redirect.
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.warn('[GoogleSheetsSync] Error enviando datos a Apps Script:', err);
    return false;
  }
}

export const googleSheetsService = {
  syncRentalCreate(rental: Rental, category?: Category, quantity = 1, totalAmount?: number): void {
    if (!isGoogleSheetsConfigured()) return;
    const target = resolveSheetTarget(category);
    const { ef, mp } = mapPaymentColumns(rental.paymentMethod);

    const startIso = rental.startTime || rental.createdAt;
    const endIso =
      rental.expectedEndTime ||
      new Date(new Date(startIso).getTime() + rental.durationMinutes * 60 * 1000).toISOString();

    const tipo =
      quantity > 1
        ? target.tipoLabel === 'x1'
          ? `x${quantity}`
          : `${target.tipoLabel} x${quantity}`
        : target.tipoLabel;

    void sendToAppsScript({
      action: 'create',
      rentalId: rental.id,
      sheetName: target.sheetName,
      fecha: formatDateDDMM(startIso),
      nombre: rental.customerName || '-',
      tipo,
      desde: formatTimeHHMM(startIso),
      hasta: formatTimeHHMM(endIso),
      monto: totalAmount ?? rental.basePrice,
      ef,
      mp,
    });
  },

  syncRentalUpdateTimes(rental: Rental, category?: Category): void {
    if (!isGoogleSheetsConfigured()) return;
    const target = resolveSheetTarget(category);

    void sendToAppsScript({
      action: 'update_times',
      rentalId: rental.id,
      sheetName: target.sheetName,
      desde: formatTimeHHMM(rental.startTime),
      hasta: formatTimeHHMM(rental.expectedEndTime),
    });
  },

  syncRentalFinish(rental: Rental, category?: Category): void {
    if (!isGoogleSheetsConfigured()) return;
    if (rental.notes?.includes('[BATCH_MEMBER]')) return;
    const target = resolveSheetTarget(category);
    const { ef, mp } = mapPaymentColumns(rental.paymentMethod);

    const batchMatch = rental.notes?.match(/\[BATCH_TOTAL:(\d+)\]/);
    const finalMonto = batchMatch
      ? Math.max(0, Number(batchMatch[1]) + (rental.penaltyPrice || 0) - (rental.discount || 0))
      : rental.totalPrice;

    void sendToAppsScript({
      action: 'finish',
      rentalId: rental.id,
      sheetName: target.sheetName,
      hasta: formatTimeHHMM(rental.actualEndTime || new Date().toISOString()),
      monto: finalMonto,
      ef,
      mp,
      paintPink: true,
    });
  },

  syncRentalCancel(rental: Rental, category?: Category): void {
    if (!isGoogleSheetsConfigured()) return;
    const target = resolveSheetTarget(category);

    void sendToAppsScript({
      action: 'cancel',
      rentalId: rental.id,
      sheetName: target.sheetName,
    });
  },

  async testConnection(): Promise<boolean> {
    return sendToAppsScript({
      action: 'ping',
      timestamp: new Date().toISOString(),
    });
  },
};

