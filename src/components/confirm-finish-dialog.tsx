import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmFinishDialogProps {
  open: boolean
  orderId: number | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isConfirming?: boolean
}

export function ConfirmFinishDialog({
  open,
  orderId,
  onOpenChange,
  onConfirm,
  isConfirming = false,
}: ConfirmFinishDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar pedido?</DialogTitle>
          <DialogDescription>
            {orderId != null ? (
              <>
                Tem certeza que deseja finalizar o pedido{" "}
                <span className="font-semibold text-foreground">#{orderId}</span>?
                Esta ação é definitiva e não poderá ser desfeita.
              </>
            ) : (
              <>
                Tem certeza que deseja finalizar este pedido? Esta ação é definitiva e
                não poderá ser desfeita.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-[#10B981] text-white hover:bg-[#059669]"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Finalizando..." : "Sim, finalizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
