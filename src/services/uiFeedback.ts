export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface PromptOptions {
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export type ActiveDialog =
  | {
      kind: 'confirm';
      options: ConfirmOptions;
      resolve: (value: boolean) => void;
    }
  | {
      kind: 'prompt';
      options: PromptOptions;
      resolve: (value: string | null) => void;
    };

type StateListener = () => void;

class UiFeedbackService {
  private listeners = new Set<StateListener>();
  private toasts: ToastItem[] = [];
  private activeDialog: ActiveDialog | null = null;

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  getToasts(): ToastItem[] {
    return this.toasts;
  }

  getActiveDialog(): ActiveDialog | null {
    return this.activeDialog;
  }

  toast(message: string, variant: ToastVariant = 'info'): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.toasts = [...this.toasts, { id, message, variant }];
    this.emit();

    setTimeout(() => {
      this.dismissToast(id);
    }, 3600);
  }

  dismissToast(id: string): void {
    if (!this.toasts.some((t) => t.id === id)) return;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  }

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (this.activeDialog) {
        if (this.activeDialog.kind === 'confirm') this.activeDialog.resolve(false);
        else this.activeDialog.resolve(null);
      }
      this.activeDialog = { kind: 'confirm', options, resolve };
      this.emit();
    });
  }

  prompt(options: PromptOptions): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      if (this.activeDialog) {
        if (this.activeDialog.kind === 'confirm') this.activeDialog.resolve(false);
        else this.activeDialog.resolve(null);
      }
      this.activeDialog = { kind: 'prompt', options, resolve };
      this.emit();
    });
  }

  resolveConfirm(result: boolean): void {
    if (this.activeDialog?.kind !== 'confirm') return;
    const { resolve } = this.activeDialog;
    this.activeDialog = null;
    this.emit();
    resolve(result);
  }

  resolvePrompt(result: string | null): void {
    if (this.activeDialog?.kind !== 'prompt') return;
    const { resolve } = this.activeDialog;
    this.activeDialog = null;
    this.emit();
    resolve(result);
  }
}

export const uiFeedback = new UiFeedbackService();
