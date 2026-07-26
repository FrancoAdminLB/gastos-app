"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#161B3D] border-[rgba(255,255,255,0.1)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-[rgba(255,255,255,0.5)]">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.1)]">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-[#FF6B6B] text-white hover:bg-[#FF5252]"
            onClick={onConfirm}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
