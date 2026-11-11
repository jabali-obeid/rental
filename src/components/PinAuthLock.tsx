import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Delete, ArrowRight } from 'lucide-react';
import { soundService } from '../services/sound';

interface Props {
  onUnlock: () => void;
}

// Cryptographic Salted SHA-256 Hash Check
// The secret PIN is NEVER stored in plain text anywhere in this codebase.
const PIN_HASH = 'c4cab7a55eaa37cba8c74601d08aa7d6daf6d8423987dc187a7ab48dace315a9';
const PIN_SALT = '_eco_aventura_salt_2026';

async function verifyPin(enteredPin: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(enteredPin + PIN_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex === PIN_HASH;
  } catch (e) {
    console.error('Error verifying PIN:', e);
    return false;
  }
}

export const PinAuthLock: React.FC<Props> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Handle typing from keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleAddDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const handleAddDigit = async (digit: string) => {
    if (pin.length >= 4 || isVerifying) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setIsError(false);

    if (nextPin.length === 4) {
      setIsVerifying(true);
      const isValid = await verifyPin(nextPin);
      if (isValid) {
        soundService.playSuccess();
        sessionStorage.setItem('rentflow_pin_authorized', 'true');
        onUnlock();
      } else {
        soundService.playWarningBeep();
        setIsError(true);
        setIsVerifying(false);
        setTimeout(() => {
          setPin('');
        }, 600);
      }
    }
  };

  const handleBackspace = () => {
    if (isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gradient-to-br from-[#FCFBF7] via-[#FAF5E4] to-[#F4E6BA] animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-[32px] bg-white border border-black/[0.06] p-7 shadow-[0_20px_50px_rgb(0,0,0,0.08)] flex flex-col items-center text-center space-y-6">
        
        {/* Brand Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] flex items-center justify-center shadow-md">
            <Lock className="w-8 h-8 text-[#F7D147]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#F7D147] border-2 border-white flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1C1C1C]" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[#1C1C1C] tracking-tight">Eco Aventura</h2>
          <p className="text-xs text-[#71706B]">Ingresá el PIN de seguridad para acceder al sistema</p>
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center gap-3.5 my-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isError
                    ? 'bg-rose-500 border border-rose-400 scale-110 animate-bounce'
                    : isFilled
                    ? 'bg-[#1C1C1C] border border-[#1C1C1C] scale-110 shadow-sm'
                    : 'bg-[#F6F3EA] border border-black/15'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {isError && (
          <p className="text-xs font-bold text-rose-600 animate-in fade-in">
            PIN incorrecto. Reintentá nuevamente.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isVerifying}
              onClick={() => handleAddDigit(digit)}
              className="h-14 rounded-2xl bg-[#F6F3EA] hover:bg-[#F7D147] border border-black/[0.06] text-xl font-extrabold text-[#1C1C1C] shadow-sm active:scale-95 transition-all flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          
          <button
            type="button"
            disabled={isVerifying || pin.length === 0}
            onClick={() => setPin('')}
            className="h-14 rounded-2xl bg-[#F6F3EA] hover:bg-[#EAE4D3] border border-black/[0.06] text-xs font-bold text-[#71706B] shadow-sm active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
          >
            Borrar
          </button>

          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handleAddDigit('0')}
            className="h-14 rounded-2xl bg-[#F6F3EA] hover:bg-[#F7D147] border border-black/[0.06] text-xl font-extrabold text-[#1C1C1C] shadow-sm active:scale-95 transition-all flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            disabled={isVerifying || pin.length === 0}
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-[#F6F3EA] hover:bg-[#EAE4D3] border border-black/[0.06] text-[#1C1C1C] shadow-sm active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
          >
            <Delete className="w-5 h-5 text-[#1C1C1C]" />
          </button>
        </div>

        <div className="text-[11px] text-[#71706B] font-mono">
          🔒 Acceso protegido con cifrado SHA-256
        </div>
      </div>
    </div>
  );
};
