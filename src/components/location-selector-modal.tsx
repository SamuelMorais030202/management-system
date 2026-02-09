
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Terminals } from "@/hooks/useLoadTerminals"
import { getLocationTypeColor } from "@/utils/getLocationTypeColor"

interface LocationSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Terminals[]
  selectedLocationId: number | null
  onSelectLocation: (locationId: number | null) => void
}

export function LocationSelectorModal({
  open,
  onOpenChange,
  locations,
  selectedLocationId,
  onSelectLocation,
}: LocationSelectorModalProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Ponto de Venda</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {/* Opção "Ver todos" */}
          <Button
            key="ver-todos"
            variant={selectedLocationId === null ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => {
              onSelectLocation(null)
              onOpenChange(false)
            }}
          >
            <div
              className={`h-10 w-10 rounded flex items-center justify-center flex-shrink-0 ${getLocationTypeColor("Ver todos")}`}
            >
              <span className="text-xs font-bold text-white">{"Ver todos".substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Ver todos</div>
            </div>
            {selectedLocationId === null && <Check className="h-5 w-5 text-primary" />}
          </Button>

          {/* Lista de terminais */}
          {locations && locations.map((location) => {
            const isSelected = location.terminalId === selectedLocationId
            return (
              <Button
                key={location.terminalId}
                variant={isSelected ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => {
                  onSelectLocation(location.terminalId)
                  onOpenChange(false)
                }}
              >
                <div
                  className={`h-10 w-10 rounded flex items-center justify-center flex-shrink-0 ${getLocationTypeColor(location.nome)}`}
                >
                  <span className="text-xs font-bold text-white">{location.nome.substring(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{location.nome}</div>
                </div>
                {isSelected && <Check className="h-5 w-5 text-primary" />}
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
