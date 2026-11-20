import React, { useEffect, useId, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { uiFeedback } from '../services/uiFeedback';
import { useDialogA11y } from '../hooks/useDialogA11y';

export const FeedbackHost: React.FC = () => {
  const [, setVersion] = useState(0);
  const [promptValue, setPromptValue] = useState('');
  const dialogTitleId = useId();
  const promptInputId = useId();

  useEffect(() => {
    return uiFeedback.subscribe(() => setVersion((v) => v + 1));
  }, []);

  const toasts = uiFeedback.getToasts();
  const dialog = uiFeedback.getActiveDialog();

  useEffect(() => {
    if (dialog?.kind === 'prompt') {
      setPromptValue(dialog.options.defaultValue ?? '');
    }
  }, [dialog]);

  const handleCloseDialog = () => {
    if (!dialog) return;
    if (dialog.kind === 'confirm') {
      uiFeedback.resolveConfirm(false);
    } else {
      uiFeedback.resolvePrompt(null);
    }
  };

  const dialogRef = useDialogA11y(Boolean(dialog), handleCloseDialog);

  return (
    <>
      {/* Non-blocking Toast Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[9990] flex flex-col gap-2 pointer-events-none"
        >
          {toasts.map((t) => {
            const styles =
              t.variant === 'error'
                ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                : t.variant === 'success'
                ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#166534]'
                : 'bg-eco-dark border-black/10 text-white';

            return (
              <div
                key={t.id}
                role="status"
                className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg flex items-start gap-2.5 text-xs font-semibold transition-all ${styles}`}
              >
                {t.variant === 'error' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : t.variant === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-eco-gold" />
                )}
                <span className="flex-1 leading-relaxed">{t.message}</span>
                <button
                  type="button"
                  aria-label="Cerrar notificación"
                  onClick={() => uiFeedback.dismissToast(t.id)}
                  className="opacity-70 hover:opacity-100 p-0.5 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Confirm / Prompt Dialog */}
      {dialog && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDialog();
          }}
          className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="w-full max-w-sm rounded-[28px] bg-white border border-black/[0.08] shadow-2xl p-5 space-y-4 text-eco-dark focus:outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id={dialogTitleId} className="text-base font-extrabold text-eco-dark leading-snug">
                {dialog.options.title}
              </h3>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={handleCloseDialog}
                className="p-1.5 rounded-full text-eco-creamMuted hover:text-eco-dark hover:bg-eco-surface shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-eco-creamDark whitespace-pre-line leading-relaxed">
              {dialog.options.message}
            </p>

            {dialog.kind === 'prompt' && (
              <div>
                <label htmlFor={promptInputId} className="sr-only">
                  {dialog.options.title}
                </label>
                <input
                  id={promptInputId}
                  type="text"
                  autoFocus
                  value={promptValue}
                  placeholder={dialog.options.placeholder}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      uiFeedback.resolvePrompt(promptValue);
                    }
                  }}
                  className="w-full bg-eco-surface border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-eco-dark focus:outline-none focus:border-eco-dark"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCloseDialog}
                className="px-4 py-2.5 rounded-full bg-eco-surface hover:bg-[#EAE4D3] text-eco-dark text-xs font-bold transition-colors"
              >
                {dialog.options.cancelLabel || 'Cancelar'}
              </button>

              {dialog.kind === 'confirm' ? (
                <button
                  type="button"
                  onClick={() => uiFeedback.resolveConfirm(true)}
                  className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-colors shadow-sm ${
                    dialog.options.destructive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-eco-dark hover:bg-eco-forestLight text-white'
                  }`}
                >
                  {dialog.options.confirmLabel || 'Confirmar'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => uiFeedback.resolvePrompt(promptValue)}
                  className="px-5 py-2.5 rounded-full bg-eco-dark hover:bg-eco-forestLight text-white text-xs font-extrabold transition-colors shadow-sm"
                >
                  {dialog.options.confirmLabel || 'Aceptar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
