"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flag } from "lucide-react";

interface ForfeitDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ForfeitDialog({
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
}: ForfeitDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-xs" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-red-500" />
            Forfeit Game?
          </DialogTitle>
          <DialogDescription className="text-xs">
            Are you sure you want to forfeit? This will end the game and your opponent will be
            declared the winner. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading} size="sm">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading} size="sm">
            {isLoading ? "Forfeiting..." : "Forfeit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
