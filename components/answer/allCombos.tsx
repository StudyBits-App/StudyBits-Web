"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { CheckCircle } from "lucide-react";

interface AllCombosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllCombos({ open, onOpenChange }: AllCombosProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md w-full text-center">
        <DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 pt-4">
            <CheckCircle className="h-16 w-16 text-teal-500" />
            <DialogTitle className="text-2xl">Lets call it a day!</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-2 text-center">
              You have answered questions for all courses and units you are
              studying.
            </DialogDescription>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
