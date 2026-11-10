import { useState, useEffect, useRef } from 'react';
import { Rental, Category } from '../types';
import { soundService } from '../services/sound';

export type TrafficLight = 'WAITING' | 'GREEN' | 'YELLOW' | 'RED';

export function isRentalWaitingStart(rental: Rental): boolean {
  return Boolean(rental.notes && rental.notes.includes('[ESPERANDO_INICIO]'));
}

/**
 * Redondea el monto a la nómina de billetes argentinos en circulación (múltiplos de $1.000)
 */
export function roundToArgentineBills(amount: number): number {
  if (amount <= 0) return 0;
  return Math.max(1000, Math.round(amount / 1000) * 1000);
}

/**
 * Calcula la penalización por demora según la regla oficial de Eco Aventura:
 * - Primeros 10 minutos (0 a 9 min de demora): Flexibilidad sin cargo ($0).
 * - Alquileres de 30 min:
 *   • Minuto 10 al 14: 30% del valor del servicio (redondeado a billetes)
 *   • Minuto 15 al 19: 50% (la mitad del servicio, redondeado a billetes)
 *   • Minuto 20 al 29: 2/3 del servicio (redondeado a billetes)
 *   • Minuto 30+: Turno completo + tramos adicionales
 * - Alquileres por hora (60 min):
 *   • Primeros 10 min (0 a 9 min): Flexibilidad sin cargo ($0).
 *   • Pasados los 10 min: Bloques cada 15 min ajustados y redondeados a billetes.
 */
export function calculateRentalPenalty(
  rental: Rental,
  delayMinutes: number,
  category?: Category
): { suggestedPenalty: number; penaltyLabel: string; delayBlocks: number } {
  const baseServicePrice =
    rental.basePrice ||
    category?.cashRate30m ||
    category?.defaultRate30m ||
    18000;

  // Primeros 10 minutos de flexibilidad sin cargo (0 a 9 min)
  if (delayMinutes < 10) {
    return {
      suggestedPenalty: 0,
      penaltyLabel: 'En margen de flexibilidad (10m sin cargo)',
      delayBlocks: 0,
    };
  }

  // Caso 1: Alquileres de 30 minutos
  if (rental.durationMinutes <= 30) {
    const fullTurn30 = Math.floor(delayMinutes / 30);
    const remMinutes = delayMinutes % 30;

    let fraction = 0;
    let stageDesc = '';

    if (fullTurn30 === 0) {
      if (remMinutes >= 20) {
        fraction = 2 / 3;
        stageDesc = '2/3 del servicio (+20m)';
      } else if (remMinutes >= 15) {
        fraction = 0.5;
        stageDesc = '1/2 del servicio (+15m)';
      } else {
        fraction = 0.3;
        stageDesc = '30% del servicio (10-15m)';
      }
    } else {
      // Si superó 30 min de mora, suma el turno completo más el tramo adicional
      if (remMinutes >= 20) {
        fraction = fullTurn30 + 2 / 3;
      } else if (remMinutes >= 15) {
        fraction = fullTurn30 + 0.5;
      } else if (remMinutes >= 10) {
        fraction = fullTurn30 + 0.3;
      } else {
        fraction = fullTurn30;
      }
      stageDesc = `+${delayMinutes}m de mora`;
    }

    const penalty = roundToArgentineBills(baseServicePrice * fraction);
    return {
      suggestedPenalty: penalty,
      penaltyLabel: stageDesc,
      delayBlocks: Math.ceil(delayMinutes / 5),
    };
  }

  // Caso 2: Alquileres por hora (60 min o más) -> cada 15 min (pasados los 10 min de flexibilidad)
  // 10 a 29 min = 1 bloque de 15m (1/4 hora), 30 a 44 min = 2 bloques (1/2 hora), 45 a 59 min = 3 bloques (3/4 hora), etc.
  const blocks15m = Math.max(1, Math.floor(delayMinutes / 15));
  const ratePer15m = baseServicePrice * (15 / Math.max(60, rental.durationMinutes));
  const penalty = roundToArgentineBills(blocks15m * ratePer15m);

  return {
    suggestedPenalty: penalty,
    penaltyLabel: `${blocks15m} ${blocks15m === 1 ? 'bloque' : 'bloques'} de 15m`,
    delayBlocks: blocks15m,
  };
}

export interface TimerStatus {
  trafficLight: TrafficLight;
  isWaitingStart: boolean;
  isExpired: boolean;
  formattedTime: string;
  minutesRemaining: number;
  secondsRemaining: number;
  delayMinutes: number;
  delaySeconds: number;
  delayBlocks10m: number;
  ratePer10m: number;
  progressPercent: number;
  suggestedPenalty: number;
  penaltyLabel: string;
}

export function useRentalTimer(rental: Rental, category?: Category): TimerStatus {
  const [, setTick] = useState<number>(0);
  const alerted5mRef = useRef<boolean>(false);
  const alertedExpiredRef = useRef<boolean>(false);
  const waitingStart = isRentalWaitingStart(rental);

  useEffect(() => {
    // If rental is finished, canceled, or waiting for manual start, don't tick
    if (rental.status !== 'activo' || waitingStart) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [rental.status, waitingStart]);

  const now = Date.now();
  const startTime = new Date(rental.startTime).getTime();
  const expectedEnd = new Date(rental.expectedEndTime).getTime();
  const totalDurationMs = Math.max(1, expectedEnd - startTime);
  const diffMs = expectedEnd - now;

  const isExpired = !waitingStart && diffMs <= 0;
  let trafficLight: TrafficLight = 'GREEN';

  if (waitingStart) {
    trafficLight = 'WAITING';
  } else if (isExpired) {
    trafficLight = 'RED';
  } else if (diffMs <= 5 * 60 * 1000) {
    trafficLight = 'YELLOW';
  } else {
    trafficLight = 'GREEN';
  }

  // Audio Alerts on state transitions
  useEffect(() => {
    if (rental.status !== 'activo' || waitingStart) return;

    // Trigger yellow warning once when entering last 5 mins
    if (diffMs <= 5 * 60 * 1000 && diffMs > 0 && !alerted5mRef.current) {
      alerted5mRef.current = true;
      soundService.playWarningBeep();
    }

    // Trigger red alarm once when reaching 0
    if (diffMs <= 0 && !alertedExpiredRef.current) {
      alertedExpiredRef.current = true;
      soundService.playTimeAlert();
    }
  }, [diffMs, rental.status, waitingStart]);

  if (waitingStart) {
    const mStr = String(rental.durationMinutes).padStart(2, '0');
    const ratePer10m = category?.penaltyRate10Min || (category?.defaultRate30m ? Math.round(category.defaultRate30m / 3) : 6000);
    return {
      trafficLight: 'WAITING',
      isWaitingStart: true,
      isExpired: false,
      formattedTime: `${mStr}:00`,
      minutesRemaining: rental.durationMinutes,
      secondsRemaining: 0,
      delayMinutes: 0,
      delaySeconds: 0,
      delayBlocks10m: 0,
      ratePer10m,
      progressPercent: 0,
      suggestedPenalty: 0,
      penaltyLabel: '',
    };
  }

  let minutesRemaining = 0;
  let secondsRemaining = 0;
  let delayMinutes = 0;
  let delaySeconds = 0;
  let formattedTime = '00:00';

  if (!isExpired) {
    minutesRemaining = Math.floor(diffMs / 60000);
    secondsRemaining = Math.floor((diffMs % 60000) / 1000);
    const mStr = String(minutesRemaining).padStart(2, '0');
    const sStr = String(secondsRemaining).padStart(2, '0');
    formattedTime = `${mStr}:${sStr}`;
  } else {
    const overdueMs = Math.abs(diffMs);
    delayMinutes = Math.floor(overdueMs / 60000);
    delaySeconds = Math.floor((overdueMs % 60000) / 1000);
    const mStr = String(delayMinutes).padStart(2, '0');
    const sStr = String(delaySeconds).padStart(2, '0');
    formattedTime = `+${mStr}:${sStr}`;
  }

  // Progress percentage
  const elapsedMs = now - startTime;
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

  const { suggestedPenalty, penaltyLabel, delayBlocks } = isExpired
    ? calculateRentalPenalty(rental, delayMinutes, category)
    : { suggestedPenalty: 0, penaltyLabel: '', delayBlocks: 0 };
  const ratePer10m = roundToArgentineBills((rental.basePrice || category?.defaultRate30m || 18000) * 0.3);

  return {
    trafficLight,
    isWaitingStart: false,
    isExpired,
    formattedTime,
    minutesRemaining,
    secondsRemaining,
    delayMinutes,
    delaySeconds,
    delayBlocks10m: delayBlocks,
    ratePer10m,
    progressPercent,
    suggestedPenalty,
    penaltyLabel,
  };
}
