import { useState, useEffect, useRef } from 'react';
import { Rental, Category } from '../types';
import { soundService } from '../services/sound';

export type TrafficLight = 'WAITING' | 'GREEN' | 'YELLOW' | 'RED';

export function isRentalWaitingStart(rental: Rental): boolean {
  return Boolean(rental.notes && rental.notes.includes('[ESPERANDO_INICIO]'));
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
  delayBlocks10m: number; // Cantidad de bloques de 10 min de mora acumulados
  ratePer10m: number;     // Tarifa por cada bloque de 10 minutos
  progressPercent: number;
  suggestedPenalty: number;
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

  // Mora calculada por cada bloque de 10 minutos (1 a 10 min = 1 bloque, 11 a 20 min = 2 bloques)
  const delayBlocks10m = isExpired ? Math.max(1, Math.ceil(Math.max(1, delayMinutes) / 10)) : 0;
  const ratePer10m = category?.penaltyRate10Min || (category?.defaultRate30m ? Math.round(category.defaultRate30m / 3) : 6000);
  const suggestedPenalty = isExpired ? delayBlocks10m * ratePer10m : 0;

  return {
    trafficLight,
    isWaitingStart: false,
    isExpired,
    formattedTime,
    minutesRemaining,
    secondsRemaining,
    delayMinutes,
    delaySeconds,
    delayBlocks10m,
    ratePer10m,
    progressPercent,
    suggestedPenalty,
  };
}
