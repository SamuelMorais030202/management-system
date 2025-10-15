"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export interface Location {
  id: string
  name: string
  type: "restaurante" | "bar" | "pizzaria"
  address: string
}

interface LocationSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  selectedLocationId: string
  onSelectLocation: (locationId: string) => void
}

export function LocationSelectorModal({
  open,
  onOpenChange,
  locations,
  selectedLocationId,
  onSelectLocation,
}: LocationSelectorModalProps) {
  const getLocationTypeLabel = (type: Location["type"]) => {
    const labels = {
      restaurante: "Restaurante",
      bar: "Bar",
      pizzaria: "Pizzaria",
    }
    return labels[type]
  }

  const getLocationTypeColor = (type: Location["type"]) => {
    const colors = {
      restaurante: "bg-blue-500",
      bar: "bg-purple-500",
      pizzaria: "bg-orange-500",
    }
    return colors[type]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Ponto de Venda</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {locations.map((location) => {
            const isSelected = location.id === selectedLocationId
            return (
              <Button
                key={location.id}
                variant={isSelected ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => {
                  onSelectLocation(location.id)
                  onOpenChange(false)
                }}
              >
                <div
                  className={`h-10 w-10 rounded flex items-center justify-center flex-shrink-0 ${getLocationTypeColor(location.type)}`}
                >
                  <span className="text-xs font-bold text-white">{location.name.substring(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{location.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {getLocationTypeLabel(location.type)} • {location.address}
                  </div>
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
