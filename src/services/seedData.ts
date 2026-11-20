import { Category, Unit, Rental, CashMovement } from '../types';

export const STORAGE_KEY_CATEGORIES = 'rentflow_data_categories';
export const STORAGE_KEY_UNITS = 'rentflow_data_units';
export const STORAGE_KEY_RENTALS = 'rentflow_data_rentals';
export const STORAGE_KEY_CASH = 'rentflow_data_cash';
export const STORAGE_KEY_CLOSINGS = 'rentflow_data_daily_closings';
export const STORAGE_KEY_RESERVATIONS = 'rentflow_data_reservations';
export const STORAGE_KEY_DELETED_CASH = 'rentflow_data_deleted_cash_ids';
export const STORAGE_KEY_TICKET_COUNTERS = 'rentflow_data_ticket_counters';
export const STORAGE_KEY_TICKET_PRICES = 'rentflow_data_ticket_prices';

export const DEFAULT_TICKET_PRICES = {
  bungee: 8000,
  palestra: 8000,
};

// Seed Initial Data
export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'c-carritos-simples',
    name: 'Carritos Familiares Simples (Chico)',
    slug: 'carritos-simples',
    icon: 'Users',
    color: '#10b981',
    defaultRate30m: 18000,
    defaultRate60m: 32000,
    cashRate30m: 18000,
    cashRate60m: 32000,
    digitalRate30m: 20000,
    digitalRate60m: 36000,
    penaltyRate10Min: 6000,
    penaltyRatePerMin: 600,
    isActive: true,
  },
  {
    id: 'c-carritos-dobles',
    name: 'Carritos Familiares Dobles (Grande)',
    slug: 'carritos-dobles',
    icon: 'Users',
    color: '#eab308',
    defaultRate30m: 24000,
    defaultRate60m: 42000,
    cashRate30m: 24000,
    cashRate60m: 42000,
    digitalRate30m: 26000,
    digitalRate60m: 46000,
    penaltyRate10Min: 8000,
    penaltyRatePerMin: 800,
    isActive: true,
  },
  {
    id: 'c-kartings',
    name: 'Kartings a Pedal',
    slug: 'kartings',
    icon: 'Car',
    color: '#f97316',
    defaultRate30m: 16000,
    defaultRate60m: 28000,
    cashRate30m: 16000,
    cashRate60m: 28000,
    digitalRate30m: 18000,
    digitalRate60m: 32000,
    penaltyRate10Min: 5500,
    penaltyRatePerMin: 550,
    isActive: true,
  },
  {
    id: 'c-monopatines',
    name: 'Monopatines Eléctricos',
    slug: 'monopatines',
    icon: 'Zap',
    color: '#8b5cf6',
    defaultRate30m: 20000,
    defaultRate60m: 36000,
    cashRate30m: 20000,
    cashRate60m: 36000,
    digitalRate30m: 22000,
    digitalRate60m: 40000,
    penaltyRate10Min: 7000,
    penaltyRatePerMin: 700,
    isActive: true,
  },
  {
    id: 'c-kayaks-simples',
    name: 'Kayaks Simples',
    slug: 'kayaks-simples',
    icon: 'Ship',
    color: '#06b6d4',
    defaultRate30m: 10000,
    defaultRate60m: 20000,
    cashRate30m: 10000,
    cashRate60m: 20000,
    digitalRate30m: 10000,
    digitalRate60m: 20000,
    penaltyRate10Min: 4000,
    penaltyRatePerMin: 400,
    isActive: true,
  },
  {
    id: 'c-kayaks-dobles',
    name: 'Kayaks Dobles',
    slug: 'kayaks-dobles',
    icon: 'Ship',
    color: '#0284c7',
    defaultRate30m: 20000,
    defaultRate60m: 40000,
    cashRate30m: 20000,
    cashRate60m: 40000,
    digitalRate30m: 20000,
    digitalRate60m: 40000,
    penaltyRate10Min: 7000,
    penaltyRatePerMin: 700,
    isActive: true,
  },
];

export const INITIAL_UNITS: Unit[] = [
  // Kartings (4)
  { id: 'u-k1', categoryId: 'c-kartings', codeNumber: 'K-01', name: 'Karting 1', status: 'disponible', currentRentalId: null },
  { id: 'u-k2', categoryId: 'c-kartings', codeNumber: 'K-02', name: 'Karting 2', status: 'disponible', currentRentalId: null },
  { id: 'u-k3', categoryId: 'c-kartings', codeNumber: 'K-03', name: 'Karting 3', status: 'disponible', currentRentalId: null },
  { id: 'u-k4', categoryId: 'c-kartings', codeNumber: 'K-04', name: 'Karting 4', status: 'disponible', currentRentalId: null },

  // Carritos Simples (4)
  { id: 'u-cs1', categoryId: 'c-carritos-simples', codeNumber: 'CS-01', name: 'Carrito Simple 1', status: 'disponible', currentRentalId: null },
  { id: 'u-cs2', categoryId: 'c-carritos-simples', codeNumber: 'CS-02', name: 'Carrito Simple 2', status: 'disponible', currentRentalId: null },
  { id: 'u-cs3', categoryId: 'c-carritos-simples', codeNumber: 'CS-03', name: 'Carrito Simple 3', status: 'disponible', currentRentalId: null },
  { id: 'u-cs4', categoryId: 'c-carritos-simples', codeNumber: 'CS-04', name: 'Carrito Simple 4', status: 'disponible', currentRentalId: null },

  // Carritos Dobles (4)
  { id: 'u-cd1', categoryId: 'c-carritos-dobles', codeNumber: 'CD-01', name: 'Carrito Doble 1', status: 'disponible', currentRentalId: null },
  { id: 'u-cd2', categoryId: 'c-carritos-dobles', codeNumber: 'CD-02', name: 'Carrito Doble 2', status: 'disponible', currentRentalId: null },
  { id: 'u-cd3', categoryId: 'c-carritos-dobles', codeNumber: 'CD-03', name: 'Carrito Doble 3', status: 'disponible', currentRentalId: null },
  { id: 'u-cd4', categoryId: 'c-carritos-dobles', codeNumber: 'CD-04', name: 'Carrito Doble 4', status: 'disponible', currentRentalId: null },

  // Monopatines Eléctricos (7)
  { id: 'u-mp1', categoryId: 'c-monopatines', codeNumber: 'MP-01', name: 'Monopatín 1', status: 'disponible', currentRentalId: null },
  { id: 'u-mp2', categoryId: 'c-monopatines', codeNumber: 'MP-02', name: 'Monopatín 2', status: 'disponible', currentRentalId: null },
  { id: 'u-mp3', categoryId: 'c-monopatines', codeNumber: 'MP-03', name: 'Monopatín 3', status: 'disponible', currentRentalId: null },
  { id: 'u-mp4', categoryId: 'c-monopatines', codeNumber: 'MP-04', name: 'Monopatín 4', status: 'disponible', currentRentalId: null },
  { id: 'u-mp5', categoryId: 'c-monopatines', codeNumber: 'MP-05', name: 'Monopatín 5', status: 'disponible', currentRentalId: null },
  { id: 'u-mp6', categoryId: 'c-monopatines', codeNumber: 'MP-06', name: 'Monopatín 6', status: 'disponible', currentRentalId: null },
  { id: 'u-mp7', categoryId: 'c-monopatines', codeNumber: 'MP-07', name: 'Monopatín 7', status: 'disponible', currentRentalId: null },

  // Kayaks Simples (4)
  { id: 'u-ks1', categoryId: 'c-kayaks-simples', codeNumber: 'KS-01', name: 'Kayak Simple 1', status: 'disponible', currentRentalId: null },
  { id: 'u-ks2', categoryId: 'c-kayaks-simples', codeNumber: 'KS-02', name: 'Kayak Simple 2', status: 'disponible', currentRentalId: null },
  { id: 'u-ks3', categoryId: 'c-kayaks-simples', codeNumber: 'KS-03', name: 'Kayak Simple 3', status: 'disponible', currentRentalId: null },
  { id: 'u-ks4', categoryId: 'c-kayaks-simples', codeNumber: 'KS-04', name: 'Kayak Simple 4', status: 'disponible', currentRentalId: null },

  // Kayaks Dobles (4)
  { id: 'u-kd1', categoryId: 'c-kayaks-dobles', codeNumber: 'KD-01', name: 'Kayak Doble 1', status: 'disponible', currentRentalId: null },
  { id: 'u-kd2', categoryId: 'c-kayaks-dobles', codeNumber: 'KD-02', name: 'Kayak Doble 2', status: 'disponible', currentRentalId: null },
  { id: 'u-kd3', categoryId: 'c-kayaks-dobles', codeNumber: 'KD-03', name: 'Kayak Doble 3', status: 'disponible', currentRentalId: null },
  { id: 'u-kd4', categoryId: 'c-kayaks-dobles', codeNumber: 'KD-04', name: 'Kayak Doble 4', status: 'disponible', currentRentalId: null },
];

export const INITIAL_RENTALS: Rental[] = [];
export const INITIAL_CASH: CashMovement[] = [];
