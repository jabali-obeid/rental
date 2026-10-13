import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys stored in localStorage or env vars
const STORAGE_SUPABASE_URL = 'rentflow_supabase_url';
const STORAGE_SUPABASE_KEY = 'rentflow_supabase_anon_key';

export function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Remove accidental /rest/v1 or /rest/v1/ at end of URL
  url = url.replace(/\/rest\/v1\/?$/i, '');
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  return url;
}

export function getStoredSupabaseConfig() {
  // Check if URL parameters have supabase credentials (easy cross-device setup via link or QR)
  if (typeof window !== 'undefined' && window.location) {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get('sb_url') || params.get('supabase_url');
    const paramKey = params.get('sb_key') || params.get('supabase_anon_key');
    if (paramUrl && paramKey) {
      const sanitizedUrl = cleanSupabaseUrl(paramUrl);
      localStorage.setItem(STORAGE_SUPABASE_URL, sanitizedUrl);
      localStorage.setItem(STORAGE_SUPABASE_KEY, paramKey.trim());
      // Clean query params from URL without refreshing
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  const rawUrl = localStorage.getItem(STORAGE_SUPABASE_URL) || import.meta.env.VITE_SUPABASE_URL || '';
  const url = cleanSupabaseUrl(rawUrl);
  // Auto-correct stored dirty URL in localStorage
  if (rawUrl && rawUrl !== url && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_SUPABASE_URL, url);
  }
  const key = localStorage.getItem(STORAGE_SUPABASE_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getStoredSupabaseConfig();
  return Boolean(url && key && url.startsWith('http'));
}

export function getShareableConfigUrl(): string {
  if (typeof window === 'undefined') return '';
  const { url, key } = getStoredSupabaseConfig();
  if (!url || !key) return '';
  const base = window.location.origin + window.location.pathname;
  return `${base}?sb_url=${encodeURIComponent(url)}&sb_key=${encodeURIComponent(key)}`;
}

export function saveSupabaseConfig(url: string, key: string) {
  const cleanedUrl = cleanSupabaseUrl(url);
  if (cleanedUrl) localStorage.setItem(STORAGE_SUPABASE_URL, cleanedUrl);
  else localStorage.removeItem(STORAGE_SUPABASE_URL);

  if (key) localStorage.setItem(STORAGE_SUPABASE_KEY, key.trim());
  else localStorage.removeItem(STORAGE_SUPABASE_KEY);

  // Re-instantiate
  initSupabase();
}

let supabaseInstance: SupabaseClient | null = null;

export function initSupabase(): SupabaseClient | null {
  const { url, key } = getStoredSupabaseConfig();
  if (url && key && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.warn('Supabase initialization failed:', e);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return null;
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    return initSupabase();
  }
  return supabaseInstance;
}
