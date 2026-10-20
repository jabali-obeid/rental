import { Category, Unit, Rental, CashMovement, CashShiftSummary, UnitStatus, DailyClosing, Reservation, PaymentMethod } from '../types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY_CATEGORIES = 'rentflow_data_categories';
const STORAGE_KEY_UNITS = 'rentflow_data_units';
const STORAGE_KEY_RENTALS = 'rentflow_data_rentals';
const STORAGE_KEY_CASH = 'rentflow_data_cash';
const STORAGE_KEY_CLOSINGS = 'rentflow_data_daily_closings';
const STORAGE_KEY_RESERVATIONS = 'rentflow_data_reservations';
const STORAGE_KEY_DELETED_CASH = 'rentflow_data_deleted_cash_ids';

// Seed Initial Data
const INITIAL_CATEGORIES: Category[] = [
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
    defaultRate30m: 18000,
    defaultRate60m: 30000,
    cashRate30m: 18000,
    cashRate60m: 30000,
    digitalRate30m: 18000,
    digitalRate60m: 30000,
    penaltyRate10Min: 6000,
    penaltyRatePerMin: 600,
    isActive: true,
  },
  {
    id: 'c-kayaks-dobles',
    name: 'Kayaks Dobles',
    slug: 'kayaks-dobles',
    icon: 'Ship',
    color: '#0284c7',
    defaultRate30m: 35000,
    defaultRate60m: 60000,
    cashRate30m: 35000,
    cashRate60m: 60000,
    digitalRate30m: 35000,
    digitalRate60m: 60000,
    penaltyRate10Min: 10000,
    penaltyRatePerMin: 1000,
    isActive: true,
  },
];

const INITIAL_UNITS: Unit[] = [
  // Kartings ($18.000 / 30m)
  { id: 'u-k1', categoryId: 'c-kartings', codeNumber: 'K-01', name: 'Karting Rojo GT', status: 'disponible', currentRentalId: null },
  { id: 'u-k2', categoryId: 'c-kartings', codeNumber: 'K-02', name: 'Karting Azul Pro', status: 'disponible', currentRentalId: null },
  { id: 'u-k3', categoryId: 'c-kartings', codeNumber: 'K-03', name: 'Karting Amarillo Sport', status: 'disponible', currentRentalId: null },
  { id: 'u-k4', categoryId: 'c-kartings', codeNumber: 'K-04', name: 'Karting Verde Turbo', status: 'disponible', currentRentalId: null },

  // Carritos Simples ($22.000 / 30m)
  { id: 'u-cs1', categoryId: 'c-carritos-simples', codeNumber: 'CS-01', name: 'Carrito Simple 1', status: 'disponible', currentRentalId: null },
  { id: 'u-cs2', categoryId: 'c-carritos-simples', codeNumber: 'CS-02', name: 'Carrito Simple 2', status: 'disponible', currentRentalId: null },
  { id: 'u-cs3', categoryId: 'c-carritos-simples', codeNumber: 'CS-03', name: 'Carrito Simple 3', status: 'disponible', currentRentalId: null },

  // Monopatines Eléctricos ($22.000 / 30m)
  { id: 'u-mp1', categoryId: 'c-monopatines', codeNumber: 'MP-01', name: 'Xiaomi Mi Pro #1', status: 'disponible', currentRentalId: null },
  { id: 'u-mp2', categoryId: 'c-monopatines', codeNumber: 'MP-02', name: 'Xiaomi Mi Pro #2', status: 'disponible', currentRentalId: null },
  { id: 'u-mp3', categoryId: 'c-monopatines', codeNumber: 'MP-03', name: 'Segway Ninebot Max', status: 'disponible', currentRentalId: null },

  // Carritos Dobles ($28.000 / 30m)
  { id: 'u-cd1', categoryId: 'c-carritos-dobles', codeNumber: 'CD-01', name: 'Carrito Doble 1', status: 'disponible', currentRentalId: null },
  { id: 'u-cd2', categoryId: 'c-carritos-dobles', codeNumber: 'CD-02', name: 'Carrito Doble 2', status: 'disponible', currentRentalId: null },

  // Kayaks Simples & Dobles
  { id: 'u-ky1', categoryId: 'c-kayaks-dobles', codeNumber: 'KY-01', name: 'Kayak Doble Laguna', status: 'disponible', currentRentalId: null },
  { id: 'u-ky2', categoryId: 'c-kayaks-simples', codeNumber: 'KY-02', name: 'Kayak Simple Delta', status: 'disponible', currentRentalId: null },
  { id: 'u-ky3', categoryId: 'c-kayaks-dobles', codeNumber: 'KY-03', name: 'Kayak Doble Explorer', status: 'disponible', currentRentalId: null },
];

const INITIAL_RENTALS: Rental[] = [];
const INITIAL_CASH: CashMovement[] = [];

class DataService {
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private realtimeChannel: any = null;
  private isSyncing = false;
  private lastSyncTime: Date | null = null;
  private pollIntervalId: any = null;

  constructor() {
    this.ensureInitialized();
    this.initBroadcastChannel();
    this.setupWindowListeners();
    this.initRealtimeSync();
  }

  private ensureInitialized() {
    const DATA_VERSION = 'v5_eco_tarifas_oficiales_2026';
    const currentVersion = localStorage.getItem('rentflow_data_version');

    if (currentVersion !== DATA_VERSION) {
      // Overwrite categories with official default rates
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));

      // Reset all units to 'disponible' and unlinked
      const existingUnitsStr = localStorage.getItem(STORAGE_KEY_UNITS);
      let unitsToStore = INITIAL_UNITS;
      if (existingUnitsStr) {
        try {
          const parsed = JSON.parse(existingUnitsStr) as Unit[];
          unitsToStore = parsed.map((u) => ({
            ...u,
            status: 'disponible' as UnitStatus,
            currentRentalId: null,
          }));
        } catch {
          unitsToStore = INITIAL_UNITS;
        }
      }
      localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(unitsToStore));

      // Clean rentals and cash completely for ready-to-use production
      localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_CASH, JSON.stringify([]));
      if (!localStorage.getItem(STORAGE_KEY_CLOSINGS)) {
        localStorage.setItem(STORAGE_KEY_CLOSINGS, JSON.stringify([]));
      }
      localStorage.setItem('rentflow_data_version', DATA_VERSION);
    } else {
      if (!localStorage.getItem(STORAGE_KEY_CATEGORIES)) {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      }
      if (!localStorage.getItem(STORAGE_KEY_UNITS)) {
        localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(INITIAL_UNITS));
      }
      if (!localStorage.getItem(STORAGE_KEY_RENTALS)) {
        localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEY_CASH)) {
        localStorage.setItem(STORAGE_KEY_CASH, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEY_CLOSINGS)) {
        localStorage.setItem(STORAGE_KEY_CLOSINGS, JSON.stringify([]));
      }
    }
  }

  // Cross-Tab Instant Sync (Same Device / Browser)
  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('rentflow_multi_tab_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_NOTIFICATION') {
            this.notify(true);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not initialized:', e);
      }
    }
  }

  private postLocalBroadcast() {
    try {
      this.broadcastChannel?.postMessage({ type: 'SYNC_NOTIFICATION', timestamp: Date.now() });
    } catch {}
  }

  // Window Focus, Visibility & Fallback Polling Listeners
  private setupWindowListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('rentflow_data_')) {
        this.notify(true);
      }
    });

    window.addEventListener('focus', () => {
      this.syncFromSupabase();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.syncFromSupabase();
      }
    });

    // Auto-poll every 10 seconds to keep devices 100% in sync even if sockets reconnect
    if (this.pollIntervalId) clearInterval(this.pollIntervalId);
    this.pollIntervalId = setInterval(() => {
      if (isSupabaseConfigured()) {
        this.syncFromSupabase(true);
      }
    }, 10000);
  }

  // Supabase Multi-Device Realtime Subscriptions
  public initRealtimeSync(): void {
    const supabase = getSupabase();
    if (!supabase) return;

    if (this.realtimeChannel) {
      try {
        supabase.removeChannel(this.realtimeChannel);
      } catch {}
      this.realtimeChannel = null;
    }

    try {
      this.realtimeChannel = supabase
        .channel('rentflow_realtime_stream')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'units' },
          () => {
            this.syncFromSupabase();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rentals' },
          () => {
            this.syncFromSupabase();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cash_movements' },
          () => {
            this.syncFromSupabase();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'daily_closings' },
          () => {
            this.syncFromSupabase();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories' },
          () => {
            this.syncFromSupabase();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Rentflow Realtime: Conexión multi-dispositivo activa.');
          }
        });

      // Immediate background fetch from Supabase
      this.syncFromSupabase();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(skipBroadcast = false) {
    if (!skipBroadcast) {
      this.postLocalBroadcast();
    }
    this.listeners.forEach((fn) => {
      try { fn(); } catch (e) { console.error(e); }
    });
  }

  // Categories
  public getCategories(): Category[] {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    return raw ? JSON.parse(raw) : INITIAL_CATEGORIES;
  }

  public updateCategory(categoryId: string, updates: Partial<Category>): void {
    const categories = this.getCategories().map((c) => {
      if (c.id === categoryId) {
        return { ...c, ...updates };
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    this.notify();
  }

  public addCategory(cat: Omit<Category, 'id'>): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      ...cat,
      id: 'c-' + Date.now(),
    };
    categories.push(newCat);
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    this.notify();
    return newCat;
  }

  // Units
  public getUnits(): Unit[] {
    const raw = localStorage.getItem(STORAGE_KEY_UNITS);
    return raw ? JSON.parse(raw) : INITIAL_UNITS;
  }

  public updateUnitStatus(unitId: string, status: UnitStatus, notes?: string): void {
    let updatedUnit: Unit | undefined;
    const units = this.getUnits().map((u) => {
      if (u.id === unitId) {
        updatedUnit = { ...u, status, notes: notes !== undefined ? notes : u.notes };
        return updatedUnit;
      }
      return u;
    });
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(units));
    if (updatedUnit) this.pushUnitToSupabase(updatedUnit);
    this.notify();
  }

  public addUnit(unit: Omit<Unit, 'id' | 'currentRentalId'>): Unit {
    const units = this.getUnits();
    const newUnit: Unit = {
      ...unit,
      id: 'u-' + Date.now(),
      currentRentalId: null,
    };
    units.push(newUnit);
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(units));
    this.pushUnitToSupabase(newUnit);
    this.notify();
    return newUnit;
  }

  public deleteUnit(unitId: string): void {
    const units = this.getUnits().filter((u) => u.id !== unitId);
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(units));
    this.deleteUnitFromSupabase(unitId);
    this.notify();
  }

  // Rentals
  public getRentals(): Rental[] {
    const raw = localStorage.getItem(STORAGE_KEY_RENTALS);
    return raw ? JSON.parse(raw) : INITIAL_RENTALS;
  }

  public getActiveRentals(): Rental[] {
    return this.getRentals().filter((r) => r.status === 'activo');
  }

  public startRental(newRentalData: Omit<Rental, 'id' | 'createdAt' | 'status'>): Rental {
    const rentals = this.getRentals();
    const units = this.getUnits();

    const id = 'r-' + Date.now();
    const rental: Rental = {
      ...newRentalData,
      id,
      status: 'activo',
      createdAt: new Date().toISOString(),
    };

    rentals.unshift(rental);
    localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify(rentals));

    // Update Unit status to 'alquilado'
    const updatedUnits = units.map((u) => {
      if (u.id === rental.unitId) {
        return { ...u, status: 'alquilado' as UnitStatus, currentRentalId: id };
      }
      return u;
    });
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(updatedUnits));

    // Register initial cash payment
    this.addCashMovement({
      type: 'ingreso_alquiler',
      category: 'Alquiler',
      amount: rental.basePrice,
      paymentMethod: rental.paymentMethod,
      rentalId: id,
      description: `Alquiler ${this.getUnitCode(rental.unitId)} - ${rental.customerName} (${rental.durationMinutes}m)`,
      registeredBy: 'Operador',
    });

    this.pushRentalToSupabase(rental);
    this.notify();
    return rental;
  }

  public extendRental(rentalId: string, extraMinutes: number): void {
    let updatedRental: Rental | undefined;
    const rentals = this.getRentals().map((r) => {
      if (r.id === rentalId) {
        const expectedDate = new Date(r.expectedEndTime);
        const newExpected = new Date(expectedDate.getTime() + extraMinutes * 60 * 1000);
        updatedRental = {
          ...r,
          durationMinutes: r.durationMinutes + extraMinutes,
          expectedEndTime: newExpected.toISOString(),
        };
        return updatedRental;
      }
      return r;
    });
    localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify(rentals));
    if (updatedRental) this.pushRentalToSupabase(updatedRental);
    this.notify();
  }

  public finishRental(
    rentalId: string,
    params: {
      penaltyPrice?: number;
      discount?: number;
      totalFinalPrice?: number;
      paymentMethod?: Rental['paymentMethod'];
    }
  ): void {
    const rentals = this.getRentals();
    const units = this.getUnits();
    const target = rentals.find((r) => r.id === rentalId);
    if (!target) return;

    const penaltyPrice = params.penaltyPrice ?? target.penaltyPrice;
    const discount = params.discount ?? target.discount;
    const totalFinal = params.totalFinalPrice ?? (target.basePrice + penaltyPrice - discount);
    const paymentMethod = params.paymentMethod ?? target.paymentMethod;

    let updatedRental: Rental | undefined;
    const updatedRentals = rentals.map((r) => {
      if (r.id === rentalId) {
        updatedRental = {
          ...r,
          status: 'finalizado' as const,
          actualEndTime: new Date().toISOString(),
          penaltyPrice,
          discount,
          totalPrice: totalFinal,
          paymentMethod,
        };
        return updatedRental;
      }
      return r;
    });
    localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify(updatedRentals));

    // Release unit to 'disponible'
    let freedUnit: Unit | undefined;
    const updatedUnits = units.map((u) => {
      if (u.id === target.unitId) {
        freedUnit = { ...u, status: 'disponible' as UnitStatus, currentRentalId: null };
        return freedUnit;
      }
      return u;
    });
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(updatedUnits));
    if (freedUnit) this.pushUnitToSupabase(freedUnit);

    // If there was a penalty surcharge, record cash movement
    if (penaltyPrice > 0) {
      this.addCashMovement({
        type: 'ingreso_recargo',
        category: 'Recargo por mora',
        amount: penaltyPrice,
        paymentMethod,
        rentalId,
        description: `Recargo demora ${this.getUnitCode(target.unitId)} - ${target.customerName}`,
        registeredBy: 'Operador',
      });
    }

    if (updatedRental) this.pushRentalToSupabase(updatedRental);
    this.notify();
  }

  public cancelRental(rentalId: string): void {
    const rentals = this.getRentals();
    const target = rentals.find((r) => r.id === rentalId);
    if (!target) return;

    let updatedRental: Rental | undefined;
    const updatedRentals = rentals.map((r) => {
      if (r.id === rentalId) {
        updatedRental = { ...r, status: 'cancelado' as const };
        return updatedRental;
      }
      return r;
    });
    localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify(updatedRentals));

    // Release unit
    let freedUnit: Unit | undefined;
    const updatedUnits = this.getUnits().map((u) => {
      if (u.id === target.unitId) {
        freedUnit = { ...u, status: 'disponible' as UnitStatus, currentRentalId: null };
        return freedUnit;
      }
      return u;
    });
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(updatedUnits));
    if (freedUnit) this.pushUnitToSupabase(freedUnit);

    if (updatedRental) this.pushRentalToSupabase(updatedRental);
    this.notify();
  }

  // Cash Movements
  public getCashMovements(): CashMovement[] {
    const raw = localStorage.getItem(STORAGE_KEY_CASH);
    let movements: CashMovement[] = raw ? JSON.parse(raw) : [];

    // AUTO-RECUPERACIÓN: Si hay alquileres registrados pero por alguna razón no se guardaron en caja,
    // vincularlos automáticamente (ignorando los que el usuario haya eliminado voluntariamente).
    const rentals = this.getRentals();
    const existingRentalIds = new Set(movements.filter((m) => m.rentalId).map((m) => m.rentalId));
    const deletedIdsRaw = localStorage.getItem(STORAGE_KEY_DELETED_CASH);
    const deletedIds: Set<string> = new Set(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);
    let hasRecovered = false;

    rentals.forEach((r) => {
      const rentalMvId = 'c-mv-' + r.id;
      if (!existingRentalIds.has(r.id) && !deletedIds.has(rentalMvId)) {
        const item: CashMovement = {
          id: rentalMvId,
          type: 'ingreso_alquiler',
          category: 'Alquiler',
          amount: r.basePrice || r.totalPrice,
          paymentMethod: r.paymentMethod,
          rentalId: r.id,
          description: `Alquiler ${this.getUnitCode(r.unitId)} - ${r.customerName} (${r.durationMinutes}m)`,
          registeredBy: 'Operador',
          createdAt: r.createdAt || new Date().toISOString(),
        };
        movements.push(item);
        hasRecovered = true;
      }
      if (r.penaltyPrice && r.penaltyPrice > 0) {
        const penaltyId = 'c-mv-penalty-' + r.id;
        if (!movements.some((m) => m.id === penaltyId) && !deletedIds.has(penaltyId)) {
          movements.push({
            id: penaltyId,
            type: 'ingreso_recargo',
            category: 'Recargo por mora',
            amount: r.penaltyPrice,
            paymentMethod: r.paymentMethod,
            rentalId: r.id,
            description: `Recargo demora ${this.getUnitCode(r.unitId)} - ${r.customerName}`,
            registeredBy: 'Operador',
            createdAt: r.actualEndTime || r.createdAt || new Date().toISOString(),
          });
          hasRecovered = true;
        }
      }
    });

    if (hasRecovered) {
      movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      localStorage.setItem(STORAGE_KEY_CASH, JSON.stringify(movements));
    }

    return movements;
  }

  // Reservations
  public getReservations(): Reservation[] {
    const raw = localStorage.getItem(STORAGE_KEY_RESERVATIONS);
    return raw ? JSON.parse(raw) : [];
  }

  public getPendingReservationForUnit(unitId: string): Reservation | undefined {
    return this.getReservations().find((res) => res.unitId === unitId && res.status === 'pendiente');
  }

  public createReservation(data: Omit<Reservation, 'id' | 'createdAt' | 'status'>): Reservation {
    const reservations = this.getReservations();
    const id = 'res-' + Date.now();
    const reservation: Reservation = {
      ...data,
      id,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    };

    reservations.unshift(reservation);
    localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(reservations));

    // Cobro anticipado: Registrar inmediatamente en la caja del día
    this.addCashMovement({
      type: 'ingreso_alquiler',
      category: 'Reserva Anticipada',
      amount: reservation.totalPrice,
      paymentMethod: reservation.paymentMethod,
      rentalId: null,
      description: `Reserva ${this.getUnitCode(reservation.unitId)} - ${reservation.customerName} (${reservation.durationMinutes}m)`,
      registeredBy: 'Operador',
    });

    this.notify();
    return reservation;
  }

  public dispatchReservation(reservationId: string): Rental | null {
    const reservations = this.getReservations();
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return null;

    // Actualizar estado de la reserva
    const updatedReservations = reservations.map((r) =>
      r.id === reservationId ? { ...r, status: 'despachado' as const, dispatchedAt: new Date().toISOString() } : r
    );
    localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(updatedReservations));

    // Iniciar alquiler oficial (el cobro ya se computó en caja al reservar)
    const rentals = this.getRentals();
    const units = this.getUnits();
    const now = new Date();
    const expectedEnd = new Date(now.getTime() + target.durationMinutes * 60 * 1000);
    const rentalId = 'r-' + Date.now();

    const rental: Rental = {
      id: rentalId,
      unitId: target.unitId,
      categoryId: target.categoryId,
      customerName: target.customerName,
      customerPhone: target.customerPhone,
      startTime: now.toISOString(),
      durationMinutes: target.durationMinutes,
      expectedEndTime: expectedEnd.toISOString(),
      status: 'activo',
      docType: target.docType,
      docLocker: target.docLocker,
      basePrice: target.basePrice,
      penaltyPrice: 0,
      discount: 0,
      totalPrice: target.totalPrice,
      paymentMethod: target.paymentMethod,
      notes: `Despachado de reserva anticipada #${target.id.slice(-6)}`,
      createdAt: now.toISOString(),
    };

    rentals.unshift(rental);
    localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify(rentals));

    // Marcar unidad alquilada
    const updatedUnits = units.map((u) => {
      if (u.id === target.unitId) {
        return { ...u, status: 'alquilado' as UnitStatus, currentRentalId: rentalId };
      }
      return u;
    });
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(updatedUnits));

    this.pushRentalToSupabase(rental);
    this.notify();
    return rental;
  }

  public cancelReservation(reservationId: string): void {
    const reservations = this.getReservations().map((r) =>
      r.id === reservationId ? { ...r, status: 'cancelado' as const } : r
    );
    localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(reservations));
    this.notify();
  }

  public addCashMovement(data: Omit<CashMovement, 'id' | 'createdAt'>): CashMovement {
    const movements = this.getCashMovements();
    const item: CashMovement = {
      ...data,
      id: 'c-mv-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    movements.unshift(item);
    localStorage.setItem(STORAGE_KEY_CASH, JSON.stringify(movements));
    this.pushCashToSupabase(item);
    this.notify();
    return item;
  }

  public async deleteCashMovement(movementId: string): Promise<void> {
    const movements = this.getCashMovements().filter((m) => m.id !== movementId);
    localStorage.setItem(STORAGE_KEY_CASH, JSON.stringify(movements));

    // Record movement id as deleted so auto-recovery does not restore it
    try {
      const deletedIdsRaw = localStorage.getItem(STORAGE_KEY_DELETED_CASH);
      const deletedIds: string[] = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
      if (!deletedIds.includes(movementId)) {
        deletedIds.push(movementId);
        localStorage.setItem(STORAGE_KEY_DELETED_CASH, JSON.stringify(deletedIds));
      }
    } catch {
      // ignore
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('cash_movements').delete().eq('id', movementId);
        if (error) {
          console.error('❌ Error de Supabase al eliminar movimiento:', error);
        }
      } catch (e) {
        console.warn('Supabase delete cash movement warning:', e);
      }
    }

    this.notify();
  }

  public async updateCashMovementPaymentMethod(movementId: string, newMethod: PaymentMethod): Promise<void> {
    let updatedItem: CashMovement | undefined;
    const movements = this.getCashMovements().map((m) => {
      if (m.id === movementId) {
        updatedItem = { ...m, paymentMethod: newMethod };
        return updatedItem;
      }
      return m;
    });

    localStorage.setItem(STORAGE_KEY_CASH, JSON.stringify(movements));

    if (updatedItem) {
      await this.pushCashToSupabase(updatedItem);
    }

    this.notify();
  }


  public getCashShiftSummary(): CashShiftSummary {
    const movements = this.getCashMovements();
    let totalEfectivo = 0;
    let totalTransferencia = 0;
    let totalTarjeta = 0;
    let totalIngresos = 0;
    let totalEgresos = 0;
    let countAlquileres = 0;

    movements.forEach((mv) => {
      const isIngreso = mv.type === 'ingreso_alquiler' || mv.type === 'ingreso_recargo' || mv.type === 'apertura_caja';
      const isEgreso = mv.type === 'egreso_gasto' || mv.type === 'cierre_caja';

      if (isIngreso) {
        totalIngresos += mv.amount;
        if (mv.type === 'ingreso_alquiler') countAlquileres++;
        if (mv.paymentMethod === 'efectivo') totalEfectivo += mv.amount;
        else if (mv.paymentMethod === 'transferencia') totalTransferencia += mv.amount;
        else if (mv.paymentMethod === 'tarjeta') totalTarjeta += mv.amount;
      } else if (isEgreso) {
        totalEgresos += mv.amount;
        if (mv.paymentMethod === 'efectivo') totalEfectivo -= mv.amount;
        else if (mv.paymentMethod === 'transferencia') totalTransferencia -= mv.amount;
      }
    });

    return {
      totalEfectivo,
      totalTransferencia,
      totalTarjeta,
      totalIngresos,
      totalEgresos,
      balanceNeto: totalIngresos - totalEgresos,
      countAlquileres,
    };
  }

  // Daily Closings & Sales History
  public getDailyClosings(): DailyClosing[] {
    const raw = localStorage.getItem(STORAGE_KEY_CLOSINGS);
    return raw ? JSON.parse(raw) : [];
  }

  public async deleteDailyClosing(closingId: string): Promise<void> {
    const closings = this.getDailyClosings().filter((c) => c.id !== closingId);
    localStorage.setItem(STORAGE_KEY_CLOSINGS, JSON.stringify(closings));

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('daily_closings').delete().eq('id', closingId);
        if (error) {
          console.error('❌ Error de Supabase al borrar cierre diario:', error);
        }
      } catch (e) {
        console.warn('Supabase delete daily closing warning:', e);
      }
    }

    this.notify();
  }

  public async deleteMovementFromClosing(closingId: string, movementId: string): Promise<DailyClosing | null> {
    const closings = this.getDailyClosings();
    const targetIdx = closings.findIndex((c) => c.id === closingId);
    if (targetIdx === -1) return null;

    const closing = closings[targetIdx];
    const newMovements = (closing.movementsSnapshot || []).filter(
      (m, idx) => (m.id ? m.id !== movementId : String(idx) !== movementId)
    );

    // Recalcular métricas del cierre archivado
    let totalEfectivo = 0;
    let totalTransferencia = 0;
    let totalTarjeta = 0;
    let totalIngresos = 0;
    let totalEgresos = 0;
    let countAlquileres = 0;

    newMovements.forEach((mv) => {
      const isIngreso = mv.type === 'ingreso_alquiler' || mv.type === 'ingreso_recargo' || mv.type === 'apertura_caja';
      const isEgreso = mv.type === 'egreso_gasto' || mv.type === 'cierre_caja';

      if (isIngreso) {
        totalIngresos += mv.amount;
        if (mv.type === 'ingreso_alquiler') countAlquileres++;
        if (mv.paymentMethod === 'efectivo') totalEfectivo += mv.amount;
        else if (mv.paymentMethod === 'transferencia') totalTransferencia += mv.amount;
        else if (mv.paymentMethod === 'tarjeta') totalTarjeta += mv.amount;
      } else if (isEgreso) {
        totalEgresos += mv.amount;
      }
    });

    const updatedClosing: DailyClosing = {
      ...closing,
      movementsSnapshot: newMovements,
      totalRentals: countAlquileres,
      totalEfectivo,
      totalTransferencia,
      totalTarjeta,
      totalIngresos,
      totalEgresos,
      balanceNeto: totalIngresos - totalEgresos,
    };

    closings[targetIdx] = updatedClosing;
    localStorage.setItem(STORAGE_KEY_CLOSINGS, JSON.stringify(closings));

    // Persistir cierre actualizado en Supabase
    await this.pushDailyClosingToSupabase(updatedClosing);

    this.notify();
    return updatedClosing;
  }


  public async closeDailyCash(operatorName: string = 'Operador', notes?: string): Promise<DailyClosing> {
    const summary = this.getCashShiftSummary();
    const movements = this.getCashMovements();
    const rentals = this.getRentals();
    const finishedRentals = rentals.filter((r) => r.status === 'finalizado');

    const now = new Date();
    const dateLabel = now.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const closing: DailyClosing = {
      id: 'close-' + now.getTime(),
      closedAt: now.toISOString(),
      closedBy: operatorName || 'Operador',
      dateLabel,
      totalRentals: summary.countAlquileres,
      totalEfectivo: summary.totalEfectivo,
      totalTransferencia: summary.totalTransferencia,
      totalTarjeta: summary.totalTarjeta,
      totalIngresos: summary.totalIngresos,
      totalEgresos: summary.totalEgresos,
      balanceNeto: summary.balanceNeto,
      notes: notes || undefined,
      movementsSnapshot: [...movements],
      rentalsSnapshot: [...finishedRentals],
      createdAt: now.toISOString(),
    };

    // 1. Guardar en historial de cierres local
    const closings = this.getDailyClosings();
    closings.unshift(closing);
    localStorage.setItem(STORAGE_KEY_CLOSINGS, JSON.stringify(closings));

    // 2. Limpiar actividades del día en local (caja a cero)
    localStorage.setItem(STORAGE_KEY_CASH, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEY_DELETED_CASH);

    // Mantener solo los alquileres que aún estén activos en curso para no cortar servicios
    const activeRentals = rentals.filter((r) => r.status === 'activo');
    localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify(activeRentals));

    // 3. Sincronizar Cierre con Supabase
    await this.pushDailyClosingToSupabase(closing);

    // 4. Limpiar en Supabase los movimientos de caja archivados y alquileres finalizados
    const supabase = getSupabase();
    if (supabase) {
      try {
        if (movements.length > 0) {
          const mIds = movements.map((m) => m.id);
          await supabase.from('cash_movements').delete().in('id', mIds);
        }
        if (finishedRentals.length > 0) {
          const rIds = finishedRentals.map((r) => r.id);
          await supabase.from('rentals').delete().in('id', rIds);
        }
      } catch (e) {
        console.warn('Error limpiando movimientos archivados en Supabase:', e);
      }
    }

    this.notify();
    return closing;
  }

  public resetToCleanState(): void {
    const cleanUnits = this.getUnits().map((u) => ({
      ...u,
      status: 'disponible' as UnitStatus,
      currentRentalId: null,
    }));
    localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(cleanUnits));
    localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_CASH, JSON.stringify([]));
    this.notify();
  }

  public resetToDefaultDemo(): void {
    this.resetToCleanState();
  }

  // Supabase Cloud Sync Methods (Non-blocking, local-first)
  private async pushUnitToSupabase(unit: Unit): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      await supabase.from('units').upsert({
        id: unit.id,
        category_id: unit.categoryId,
        code_number: unit.codeNumber,
        name: unit.name,
        status: unit.status,
        current_rental_id: unit.currentRentalId || null,
        notes: unit.notes || null,
      });
    } catch (e) {
      console.warn('Supabase unit sync warning:', e);
    }
  }

  private async deleteUnitFromSupabase(unitId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      await supabase.from('units').delete().eq('id', unitId);
    } catch (e) {
      console.warn('Supabase unit delete warning:', e);
    }
  }

  private async pushRentalToSupabase(rental: Rental): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      await supabase.from('rentals').upsert({
        id: rental.id,
        unit_id: rental.unitId,
        category_id: rental.categoryId,
        customer_name: rental.customerName,
        customer_phone: rental.customerPhone || null,
        start_time: rental.startTime,
        duration_minutes: rental.durationMinutes,
        expected_end_time: rental.expectedEndTime,
        actual_end_time: rental.actualEndTime || null,
        status: rental.status,
        doc_type: rental.docType,
        doc_locker: rental.docLocker,
        doc_photo_url: rental.docPhotoUrl || null,
        base_price: rental.basePrice,
        penalty_price: rental.penaltyPrice,
        discount: rental.discount,
        total_price: rental.totalPrice,
        payment_method: rental.paymentMethod,
        notes: rental.notes || null,
        created_at: rental.createdAt,
      });

      await supabase.from('units').update({
        status: rental.status === 'activo' ? 'alquilado' : 'disponible',
        current_rental_id: rental.status === 'activo' ? rental.id : null,
      }).eq('id', rental.unitId);
    } catch (e) {
      console.warn('Supabase rental sync warning:', e);
    }
  }

  private async pushCashToSupabase(cash: CashMovement): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { error } = await supabase.from('cash_movements').upsert({
        id: cash.id,
        type: cash.type,
        category: cash.category,
        amount: cash.amount,
        payment_method: cash.paymentMethod,
        rental_id: cash.rentalId || null,
        description: cash.description,
        registered_by: cash.registeredBy,
        created_at: cash.createdAt,
      }, { onConflict: 'id' });
      if (error) {
        console.error('❌ Error de Supabase al guardar movimiento en cash_movements:', error);
      }
    } catch (e) {
      console.warn('Supabase cash sync warning:', e);
    }
  }

  private async pushDailyClosingToSupabase(closing: DailyClosing): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { error } = await supabase.from('daily_closings').upsert({
        id: closing.id,
        closed_at: closing.closedAt,
        closed_by: closing.closedBy,
        date_label: closing.dateLabel,
        total_rentals: closing.totalRentals,
        total_efectivo: closing.totalEfectivo,
        total_transferencia: closing.totalTransferencia,
        total_tarjeta: closing.totalTarjeta,
        total_ingresos: closing.totalIngresos,
        total_egresos: closing.totalEgresos,
        balance_neto: closing.balanceNeto,
        notes: closing.notes || null,
        movements_snapshot: closing.movementsSnapshot,
        rentals_snapshot: closing.rentalsSnapshot,
        created_at: closing.createdAt,
      });
      if (error) {
        console.error('❌ Error de Supabase al guardar en daily_closings:', error);
      }
    } catch (e) {
      console.warn('Error subiendo cierre a Supabase:', e);
    }
  }

  public async syncFromSupabase(silent = false): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase || this.isSyncing) return false;
    this.isSyncing = true;
    try {
      const [unitsRes, rentalsRes, cashRes, closingsRes, categoriesRes] = await Promise.all([
        supabase.from('units').select('*'),
        supabase.from('rentals').select('*').order('created_at', { ascending: false }),
        supabase.from('cash_movements').select('*').order('created_at', { ascending: false }),
        supabase.from('daily_closings').select('*').order('closed_at', { ascending: false }),
        supabase.from('categories').select('*'),
      ]);

      if (cashRes.error) {
        console.error('❌ Error consultando cash_movements en Supabase:', cashRes.error);
      }
      if (closingsRes.error) {
        console.error('❌ Error consultando daily_closings en Supabase:', closingsRes.error);
      }

      let hasChanges = false;

      if (unitsRes.data && unitsRes.data.length > 0) {
        const remoteUnits: Unit[] = unitsRes.data.map((u: any) => ({
          id: u.id,
          categoryId: u.category_id,
          codeNumber: u.code_number,
          name: u.name,
          status: u.status,
          currentRentalId: u.current_rental_id || null,
          notes: u.notes || undefined,
        }));
        localStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(remoteUnits));
        hasChanges = true;
      }

      if (rentalsRes.data) {
        const remoteRentals: Rental[] = rentalsRes.data.map((r: any) => ({
          id: r.id,
          unitId: r.unit_id,
          categoryId: r.category_id,
          customerName: r.customer_name,
          customerPhone: r.customer_phone || undefined,
          startTime: r.start_time,
          durationMinutes: r.duration_minutes,
          expectedEndTime: r.expected_end_time,
          actualEndTime: r.actual_end_time || undefined,
          status: r.status,
          docType: r.doc_type,
          docLocker: r.doc_locker,
          docPhotoUrl: r.doc_photo_url || undefined,
          basePrice: Number(r.base_price),
          penaltyPrice: Number(r.penalty_price),
          discount: Number(r.discount),
          totalPrice: Number(r.total_price),
          paymentMethod: r.payment_method,
          notes: r.notes || undefined,
          createdAt: r.created_at,
        }));
        localStorage.setItem(STORAGE_KEY_RENTALS, JSON.stringify(remoteRentals));
        hasChanges = true;
      }

      if (cashRes.data && !cashRes.error) {
        const deletedIdsRaw = localStorage.getItem(STORAGE_KEY_DELETED_CASH);
        const deletedIds: Set<string> = new Set(deletedIdsRaw ? JSON.parse(deletedIdsRaw) : []);
        const remoteCash: CashMovement[] = cashRes.data
          .filter((c: any) => !deletedIds.has(c.id))
          .map((c: any) => ({
            id: c.id,
            type: c.type,
            category: c.category,
            amount: Number(c.amount),
            paymentMethod: c.payment_method,
            rentalId: c.rental_id || undefined,
            description: c.description,
            registeredBy: c.registered_by,
            createdAt: c.created_at,
          }));
        localStorage.setItem(STORAGE_KEY_CASH, JSON.stringify(remoteCash));
        hasChanges = true;
      }

      if (closingsRes.data && !closingsRes.error) {
        const remoteClosings: DailyClosing[] = closingsRes.data.map((dc: any) => ({
          id: dc.id,
          closedAt: dc.closed_at,
          closedBy: dc.closed_by,
          dateLabel: dc.date_label,
          totalRentals: Number(dc.total_rentals),
          totalEfectivo: Number(dc.total_efectivo),
          totalTransferencia: Number(dc.total_transferencia),
          totalTarjeta: Number(dc.total_tarjeta),
          totalIngresos: Number(dc.total_ingresos),
          totalEgresos: Number(dc.total_egresos),
          balanceNeto: Number(dc.balance_neto),
          notes: dc.notes || undefined,
          movementsSnapshot: Array.isArray(dc.movements_snapshot) ? dc.movements_snapshot : [],
          rentalsSnapshot: Array.isArray(dc.rentals_snapshot) ? dc.rentals_snapshot : [],
          createdAt: dc.created_at,
        }));
        localStorage.setItem(STORAGE_KEY_CLOSINGS, JSON.stringify(remoteClosings));
        hasChanges = true;
      }

      if (categoriesRes.data && categoriesRes.data.length > 0) {
        // Enlazar con las tarifas oficiales base
        const idMap = new Map(INITIAL_CATEGORIES.map((c) => [c.id, c]));
        const slugMap = new Map(INITIAL_CATEGORIES.map((c) => [c.slug, c]));

        const remoteCategories: Category[] = categoriesRes.data.map((cat: any) => {
          const defaultRef = idMap.get(cat.id) || slugMap.get(cat.slug);

          // Si Supabase tiene columnas explícitas para tarifa dual las respeta, sino usa las oficiales fijadas
          const cash30 = cat.cash_rate_30m ? Number(cat.cash_rate_30m) : defaultRef?.cashRate30m ?? Number(cat.default_rate_30m) ?? 18000;
          const cash60 = cat.cash_rate_60m ? Number(cat.cash_rate_60m) : defaultRef?.cashRate60m ?? Number(cat.default_rate_60m) ?? 32000;
          const dig30 = cat.digital_rate_30m ? Number(cat.digital_rate_30m) : defaultRef?.digitalRate30m ?? defaultRef?.defaultRate30m ?? cash30;
          const dig60 = cat.digital_rate_60m ? Number(cat.digital_rate_60m) : defaultRef?.digitalRate60m ?? defaultRef?.defaultRate60m ?? cash60;

          return {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            color: cat.color,
            defaultRate30m: cash30,
            defaultRate60m: cash60,
            cashRate30m: cash30,
            cashRate60m: cash60,
            digitalRate30m: dig30,
            digitalRate60m: dig60,
            penaltyRate10Min: Number(cat.penalty_rate_10min) || defaultRef?.penaltyRate10Min || 6000,
            penaltyRatePerMin: cat.penalty_rate_per_min ? Number(cat.penalty_rate_per_min) : defaultRef?.penaltyRatePerMin,
            isActive: Boolean(cat.is_active),
          };
        });
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(remoteCategories));
        hasChanges = true;
      }

      this.lastSyncTime = new Date();
      if (hasChanges && !silent) {
        this.notify(true);
      }
      return true;
    } catch (e) {
      console.warn('Error syncing from Supabase:', e);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  public getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  public isCloudConnected(): boolean {
    return isSupabaseConfigured();
  }

  // Helpers
  public getUnitCode(unitId: string): string {
    const unit = this.getUnits().find((u) => u.id === unitId);
    return unit ? unit.codeNumber : 'Unidad';
  }

  public getCategory(categoryId: string): Category | undefined {
    return this.getCategories().find((c) => c.id === categoryId);
  }
}

export const dataService = new DataService();
