import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "تأكيد الحذف",
  description,
  itemName,
  confirmLabel = "حذف نهائياً",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-sm bg-white text-center p-0 overflow-hidden">
        {/* Red top strip */}
        <div className="h-1.5 bg-gradient-to-l from-red-400 to-red-600 w-full" />

        <div className="px-6 pt-5 pb-2">
          <DialogHeader className="items-center gap-0 space-y-0 mb-4">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>

            <DialogTitle className="text-gray-800 text-center">{title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mb-5">
            {itemName && (
              <p className="text-sm text-gray-500">
                هل أنت متأكد من حذف{" "}
                <span className="font-semibold text-gray-800">"{itemName}"</span>؟
              </p>
            )}
            <p className="text-sm text-gray-500">
              {description ?? "لا يمكن التراجع عن هذا الإجراء بعد التأكيد."}
            </p>

            {/* Warning banner */}
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600">سيتم حذف البيانات بشكل دائم</span>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-5 flex gap-2 sm:flex-row-reverse justify-center">
          <Button
            onClick={() => { onConfirm(); onOpenChange(false); }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmLabel}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   Hook — drop-in confirmation trigger
───────────────────────────────────────────── */
interface ConfirmState {
  open: boolean;
  title: string;
  itemName: string;
  description: string;
  onConfirm: () => void;
}

const DEFAULT_STATE: ConfirmState = {
  open: false,
  title: "تأكيد الحذف",
  itemName: "",
  description: "",
  onConfirm: () => {},
};

export function useConfirmDelete() {
  const [state, setState] = useState<ConfirmState>(DEFAULT_STATE);

  /** Call this to open the confirmation dialog */
  const confirmDelete = (
    itemName: string,
    onConfirm: () => void,
    options?: { title?: string; description?: string }
  ) => {
    setState({
      open: true,
      title: options?.title ?? "تأكيد الحذف",
      itemName,
      description: options?.description ?? "",
      onConfirm,
    });
  };

  const dialog = (
    <ConfirmDialog
      open={state.open}
      onOpenChange={open => setState(prev => ({ ...prev, open }))}
      title={state.title}
      itemName={state.itemName}
      description={state.description || undefined}
      onConfirm={state.onConfirm}
    />
  );

  return { confirmDelete, dialog };
}
