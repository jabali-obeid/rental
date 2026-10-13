export type UnitStatus = 'disponible' | 'alquilado' | 'mantenimiento' | 'baja';
export type RentalStatus = 'activo' | 'finalizado' | 'cancelado';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto';
export type DocType = 'DNI' | 'Licencia' | 'Pasaporte' | 'Cédula' | 'Llaves' | 'Otro';
export type CashMovementType = 'ingreso_alquiler' | 'ingreso_recargo' | 'egreso_gasto' | 'apertura_caja' | 'cierre_caja';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // 'Car' | 'Ship' | 'Zap' | 'Users' | 'Bike'
  color: string;
  defaultRate30m: number; // Base fallback rate
  defaultRate60m: number;
  cashRate30m?: number; // Tarifa Efectivo 30m
  cashRate60m?: number; // Tarifa Efectivo 60m
  digitalRate30m?: number; // Tarifa Transferencia / Tarjeta 30m
  digitalRate60m?: number; // Tarifa Transferencia / Tarjeta 60m
  penaltyRate10Min: number; // Late fee charged per 10-minute block
  penaltyRatePerMin?: number;
  isActive: boolean;
}

export interface Unit {
  id: string;
  categoryId: string;
  codeNumber: string;
  name: string;
  status: UnitStatus;
  currentRentalId?: string | null;
  notes?: string;
}

export interface Rental {
  id: string;
  unitId: string;
  categoryId: string;
  customerName: string;
  customerPhone?: string;
  startTime: string; // ISO string
  durationMinutes: number;
  expectedEndTime: string; // ISO string
  actualEndTime?: string | null;
  status: RentalStatus;
  docType: DocType;
  docLocker: string; // E.g., 'Casillero 03', 'Sobre B-1'
  docPhotoUrl?: string; // Optional camera capture base64/url
  basePrice: number;
  penaltyPrice: number;
  discount: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    efectivo?: number;
    transferencia?: number;
    tarjeta?: number;
  };
  notes?: string;
  createdAt: string;
}

export interface CashMovement {
  id: string;
  type: CashMovementType;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  rentalId?: string | null;
  description: string;
  registeredBy: string;
  createdAt: string;
}

export interface CashShiftSummary {
  totalEfectivo: number;
  totalTransferencia: number;
  totalTarjeta: number;
  totalIngresos: number;
  totalEgresos: number;
  balanceNeto: number;
  countAlquileres: number;
}

export interface DailyClosing {
  id: string;
  closedAt: string;
  closedBy: string;
  dateLabel: string;
  totalRentals: number;
  totalEfectivo: number;
  totalTransferencia: number;
  totalTarjeta: number;
  totalIngresos: number;
  totalEgresos: number;
  balanceNeto: number;
  notes?: string;
  movementsSnapshot: CashMovement[];
  rentalsSnapshot: Rental[];
  createdAt: string;
}

