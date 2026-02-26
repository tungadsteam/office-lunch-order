import { toast } from 'sonner';

interface ConfirmToastOptions {
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

/**
 * Show a sonner toast with Confirm / Cancel action buttons.
 * Replaces native browser confirm() dialogs.
 * Toast stays open (duration: Infinity) until user acts.
 */
export function confirmToast(title: string, options: ConfirmToastOptions): void {
  const { description, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', onConfirm } = options;

  toast(title, {
    description,
    duration: Infinity,
    action: {
      label: confirmLabel,
      onClick: onConfirm,
    },
    cancel: {
      label: cancelLabel,
      onClick: () => {
        /* no-op: Sonner will close the toast when cancel is clicked */
      },
    },
  });
}
