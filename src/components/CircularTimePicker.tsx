import React, { useRef, useState } from 'react';

interface CircularTimePickerProps {
  value: number;
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
  presets?: number[];
}

const DEFAULT_PRESETS = [15, 30, 60];
const TOTAL_TICKS = 60;

/**
 * Interactive Apple-style circular timer picker with preset shortcuts (15/30/60m),
 * hold-and-grab circular dial drag, and -5/+5 fine-tuning buttons.
 */
export const CircularTimePicker: React.FC<CircularTimePickerProps> = ({
  value,
  onChange,
  min = 5,
  max = 180,
  presets = DEFAULT_PRESETS,
}) => {
  const dialRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    lastAngleDeg: number;
    accumulatedMinutes: number;
  } | null>(null);

  const clampMinutes = (m: number) => Math.max(min, Math.min(max, Math.round(m)));

  // Convert pointer clientX/clientY to clockwise degrees from 12 o'clock [0, 360)
  const getAngleFromPointer = (clientX: number, clientY: number): number => {
    const el = dialRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    // atan2(dx, -dy) gives 0 at 12 o'clock, +90 at 3 o'clock, +180 at 6 o'clock, -90 at 9 o'clock
    let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const angleDeg = getAngleFromPointer(e.clientX, e.clientY);

    // Map initial tap directly onto the current 60-minute lap (0 deg => 60 min)
    const lapBase = value > 60 ? Math.floor((value - 1) / 60) * 60 : 0;
    let tappedInLap = Math.round((angleDeg / 360) * 60);
    if (tappedInLap === 0) tappedInLap = 60;
    const initialMinutes = clampMinutes(lapBase + tappedInLap);

    dragStateRef.current = {
      lastAngleDeg: angleDeg,
      accumulatedMinutes: initialMinutes,
    };
    setIsDragging(true);
    onChange(initialMinutes);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !dragStateRef.current) return;
    const angleDeg = getAngleFromPointer(e.clientX, e.clientY);
    let deltaDeg = angleDeg - dragStateRef.current.lastAngleDeg;

    // Shortest-path wrap-around across 0/360
    if (deltaDeg > 180) deltaDeg -= 360;
    if (deltaDeg < -180) deltaDeg += 360;

    const deltaMinutes = (deltaDeg / 360) * 60;
    const nextExact = Math.max(min, Math.min(max, dragStateRef.current.accumulatedMinutes + deltaMinutes));
    dragStateRef.current.lastAngleDeg = angleDeg;
    dragStateRef.current.accumulatedMinutes = nextExact;

    const rounded = clampMinutes(nextExact);
    if (rounded !== value) {
      onChange(rounded);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    dragStateRef.current = null;
  };

  // Visual position on the 60-minute face
  const dialMinutes = value === 0 ? 0 : ((value - 1) % 60) + 1;
  const activeRatio = dialMinutes / 60;
  const thumbAngleRad = ((activeRatio * 360 - 90) * Math.PI) / 180;
  const center = 100;
  const tickOuterR = 88;
  const tickInnerR = 76;
  const thumbR = 82;
  const thumbX = center + thumbR * Math.cos(thumbAngleRad);
  const thumbY = center + thumbR * Math.sin(thumbAngleRad);

  return (
    <div className="rounded-3xl bg-[#F6F3EA] border border-black/[0.06] p-3.5 space-y-3 select-none">
      {/* Shortcut Pills: 15 / 30 / 60 min */}
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => {
          const isActive = value === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`py-2 px-3 rounded-full text-xs font-extrabold border transition-all text-center active:scale-95 ${
                isActive
                  ? 'bg-[#1C1C1C] border-[#1C1C1C] text-[#F7D147] shadow-sm'
                  : 'bg-white border-black/[0.06] text-[#52514E] hover:text-[#1C1C1C]'
              }`}
            >
              {preset} min
            </button>
          );
        })}
      </div>

      {/* Circular Hold-and-Grab Dial */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg
            ref={dialRef}
            viewBox="0 0 200 200"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: 'none' }}
            className={`w-full h-full rounded-full shadow-lg ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            aria-label="Selector circular de minutos"
          >
            {/* Dark Dial Background */}
            <circle cx={center} cy={center} r={96} fill="#1C1C1C" />

            {/* 60 Radial Ticks */}
            {Array.from({ length: TOTAL_TICKS }, (_, idx) => {
              const tickMinute = idx + 1;
              const angleDeg = (tickMinute / TOTAL_TICKS) * 360 - 90;
              const angleRad = (angleDeg * Math.PI) / 180;
              const isMajor = tickMinute % 5 === 0;
              const inner = isMajor ? tickInnerR - 3 : tickInnerR;
              const x1 = center + inner * Math.cos(angleRad);
              const y1 = center + inner * Math.sin(angleRad);
              const x2 = center + tickOuterR * Math.cos(angleRad);
              const y2 = center + tickOuterR * Math.sin(angleRad);

              const isLit = value > 60 || tickMinute <= dialMinutes;

              return (
                <line
                  key={tickMinute}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isLit ? '#F7D147' : 'rgba(255,255,255,0.18)'}
                  strokeWidth={isMajor ? 2.6 : 1.6}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Grabbable Thumb Knob on the Ring */}
            <circle
              cx={thumbX}
              cy={thumbY}
              r={isDragging ? 8.5 : 7}
              fill="#F7D147"
              stroke="#1C1C1C"
              strokeWidth={2.5}
              className="transition-[r] duration-100"
            />
          </svg>

          {/* Center Readout (pointer-events-none so dragging works anywhere on the circle) */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black tracking-tight text-white leading-none">
              {value}
            </span>
            <span className="text-xs font-semibold text-white/60 mt-1">
              mins
            </span>
            {value > 60 && (
              <span className="text-[10px] font-bold text-[#F7D147] mt-0.5">
                {Math.floor(value / 60)}h {value % 60 > 0 ? `${value % 60}m` : ''}
              </span>
            )}
          </div>
        </div>

        <p className="text-[10px] font-medium text-[#71706B] mt-1.5">
          Mantén y gira el círculo para ajustar a mano
        </p>
      </div>

      {/* -5 / +5 Fine-tune Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(clampMinutes(value - 5))}
          className="py-2 rounded-2xl bg-white border border-black/[0.08] text-sm font-black text-[#1C1C1C] hover:bg-[#EAE4D3] active:scale-95 transition-all shadow-sm"
        >
          -5
        </button>
        <button
          type="button"
          onClick={() => onChange(clampMinutes(value + 5))}
          className="py-2 rounded-2xl bg-white border border-black/[0.08] text-sm font-black text-[#1C1C1C] hover:bg-[#EAE4D3] active:scale-95 transition-all shadow-sm"
        >
          +5
        </button>
      </div>
    </div>
  );
};

