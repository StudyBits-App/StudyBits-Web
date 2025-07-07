"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface FinalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinalDialog({ open, onOpenChange }: FinalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md w-full text-center">
        <DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 pt-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <DialogTitle className="text-2xl">
              Your question has been saved!
            </DialogTitle>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
