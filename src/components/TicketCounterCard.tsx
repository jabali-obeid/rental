import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface TicketCounterCardProps {
  title: string;
  subtitle: string;
  count: number;
  price: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const TOTAL_TICKS = 40;

/**
 * Tactile circular dial counter card inspired by Braun/Apple timer dials.
 * Displays the daily ticket count inside a dark radial-tick dial with -1 / +1 buttons.
 */
export const TicketCounterCard: React.FC<TicketCounterCardProps> = ({
  title,
  subtitle,
  count,
  price,
  onIncrement,
  onDecrement,
}) => {
  const center = 100;
  const tickOuterR = 90;
  const tickInnerR = 76;
  const litTicks = count === 0 ? 0 : ((count - 1) % TOTAL_TICKS) + 1;
  const totalAmount = count * price;

  return (
    <section className="rounded-[28px] bg-white border border-black/[0.08] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.05)] space-y-3.5">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 px-1">
        <div>
          <h3 className="text-sm font-black tracking-tight text-eco-dark leading-none">
            {title}
          </h3>
          <p className="text-[11px] font-medium text-eco-creamMuted mt-1">
            {subtitle}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-block px-2.5 py-1 rounded-full bg-eco-surface border border-black/[0.06] text-[10px] font-bold font-mono text-eco-dark">
            ${price.toLocaleString()} c/u
          </span>
          <div className="text-[11px] font-mono font-extrabold text-[#166534] mt-1">
            ${totalAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Circular Dial Display */}
      <div className="flex justify-center">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full rounded-full shadow-lg"
            aria-hidden="true"
          >
            <circle cx={center} cy={center} r={96} fill="#1C1C1C" />

            {Array.from({ length: TOTAL_TICKS }, (_, idx) => {
              const tickIndex = idx + 1;
              const angleDeg = (tickIndex / TOTAL_TICKS) * 360 - 90;
              const angleRad = (angleDeg * Math.PI) / 180;
              const isMajor = tickIndex % 5 === 0;
              const inner = isMajor ? tickInnerR - 3 : tickInnerR;
              const x1 = center + inner * Math.cos(angleRad);
              const y1 = center + inner * Math.sin(angleRad);
              const x2 = center + tickOuterR * Math.cos(angleRad);
              const y2 = center + tickOuterR * Math.sin(angleRad);
              const isLit = tickIndex <= litTicks;

              return (
                <line
                  key={tickIndex}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isLit ? '#F7D147' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={isMajor ? 2.6 : 1.7}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Center Daily Counter */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black tracking-tight text-white leading-none tabular-nums">
              {count}
            </span>
            <span className="text-xs font-semibold text-white/75 mt-1.5">
              {count === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom -1 / +1 Tactile Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onDecrement}
          disabled={count === 0}
          aria-label={`Restar 1 ticket de ${title}`}
          className="min-h-[48px] rounded-2xl bg-eco-surface hover:bg-[#EAE4D3] border border-black/[0.08] text-eco-dark font-black text-base shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-35 disabled:pointer-events-none"
        >
          <Minus className="w-4 h-4 stroke-[2.8]" />
          <span>1</span>
        </button>

        <button
          type="button"
          onClick={onIncrement}
          aria-label={`Sumar 1 ticket de ${title}`}
          className="min-h-[48px] rounded-2xl bg-eco-gold hover:bg-[#f0c62d] border border-black/[0.1] text-eco-dark font-black text-base shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.8]" />
          <span>1</span>
        </button>
      </div>
    </section>
  );
};
