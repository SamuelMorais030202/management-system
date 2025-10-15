"use client"

import { useState, useEffect } from "react"
import { Search, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OrderCard } from "@/components/order-card"
import { FilterBar } from "@/components/filter-bar"
import { LocationSelectorModal, type Location } from "@/components/location-selector-modal"

export interface Order {
  id: string
  customer: string
  location: string
  dueTime: string
  status:
    | "preparoAguardandoProducao"
    | "preparoEmProducao"
    | "preparoCancelado"
    | "preparoPausado"
    | "preparoFinalizado"
  items: OrderItem[]
  timer: string
  isFinishing: boolean
  atrasado?: boolean // Field to mark delayed orders
}

export interface OrderItem {
  quantity: number
  name: string
  modifiers?: string[]
}

// Mock data for orders
const mockOrders: Order[] = [
  {
    id: "329",
    customer: "Samir Thai",
    location: "Retirada",
    dueTime: "23:33",
    status: "preparoCancelado" as const,
    items: [
      { quantity: 1, name: "Sopa de Missô com Camarão" },
      { quantity: 1, name: "California Roll de Caranguejo", modifiers: ["Arroz Branco Premium", "Molho Picante"] },
      { quantity: 1, name: "Sanduíche de Gyro de Carne", modifiers: ["Tomate", "Hummus 1 Porção"] },
      { quantity: 1, name: "Salada Vegana" },
    ],
    timer: "00:18:00",
    isFinishing: true,
    atrasado: true, // Example delayed order
  },
  {
    id: "330",
    customer: "Amazonbwls",
    location: "Retirada",
    dueTime: "23:33",
    status: "preparoEmProducao" as const,
    items: [
      { quantity: 1, name: "Sopa de Missô com Camarão" },
      { quantity: 1, name: "California Roll de Caranguejo", modifiers: ["Arroz Branco Premium", "Molho Picante"] },
      { quantity: 1, name: "Sanduíche de Gyro de Carne", modifiers: ["Tomate", "Hummus 1 Porção"] },
      { quantity: 1, name: "Salada Vegana" },
    ],
    timer: "00:12:00",
    isFinishing: true,
    atrasado: false,
  },
  {
    id: "331",
    customer: "Mema Mizushi",
    location: "Retirada",
    dueTime: "23:33",
    status: "preparoEmProducao" as const,
    items: [
      { quantity: 1, name: "Sopa de Missô com Camarão" },
      { quantity: 1, name: "California Roll de Caranguejo", modifiers: ["Arroz Branco Premium", "Molho Picante"] },
      { quantity: 1, name: "Sanduíche de Gyro de Carne", modifiers: ["Tomate", "Hummus 1 Porção"] },
      { quantity: 1, name: "Salada Vegana" },
    ],
    timer: "00:05:00",
    isFinishing: true,
    atrasado: true, // Example delayed order
  },
  {
    id: "332",
    customer: "Bad Ass Breakfast",
    location: "Retirada",
    dueTime: "23:44",
    status: "preparoAguardandoProducao" as const,
    items: [
      { quantity: 1, name: "California Roll de Caranguejo", modifiers: ["Arroz Branco Premium", "Molho Picante"] },
      { quantity: 1, name: "Salada Vegana" },
      { quantity: 1, name: "Sopa de Missô com Camarão" },
    ],
    timer: "00:00:00",
    isFinishing: false,
    atrasado: false,
  },
  {
    id: "333465882",
    customer: "The Halal Guys",
    location: "Retirada",
    dueTime: "11:45",
    status: "preparoAguardandoProducao" as const,
    items: [
      { quantity: 1, name: "Sopa de Missô com Camarão" },
      { quantity: 1, name: "California Roll de Caranguejo", modifiers: ["Arroz Branco Premium", "Molho Picante"] },
      { quantity: 1, name: "Sanduíche de Gyro de Carne", modifiers: ["Tomate", "Hummus 1 Porção"] },
      { quantity: 1, name: "Salada Vegana" },
    ],
    timer: "00:00:00",
    isFinishing: false,
    atrasado: false,
  },
  {
    id: "332-2",
    customer: "Bad Ass Breakfast",
    location: "Retirada",
    dueTime: "23:44",
    status: "preparoPausado" as const,
    items: [
      { quantity: 1, name: "California Roll de Caranguejo", modifiers: ["Arroz Branco Premium", "Molho Picante"] },
      { quantity: 1, name: "Salada Vegana" },
      { quantity: 1, name: "Sopa de Missô com Camarão" },
    ],
    timer: "00:00:00",
    isFinishing: false,
    atrasado: false,
  },
  {
    id: "332-3",
    customer: "Bad Ass Breakfast",
    location: "Retirada",
    dueTime: "23:44",
    status: "preparoAguardandoProducao" as const,
    items: [
      { quantity: 1, name: "California Roll de Caranguejo", modifiers: ["Arroz Branco Premium", "Molho Picante"] },
      { quantity: 1, name: "Salada Vegana" },
      { quantity: 1, name: "Sopa de Missô com Camarão" },
    ],
    timer: "00:00:00",
    isFinishing: false,
    atrasado: false,
  },
  {
    id: "333465882-2",
    customer: "The Halal Guys",
    location: "Retirada",
    dueTime: "11:45",
    status: "preparoAguardandoProducao" as const,
    items: [
      { quantity: 1, name: "Sopa de Missô com Camarão" },
      { quantity: 1, name: "California Roll de Caranguejo", modifiers: ["Arroz Branco Premium", "Molho Picante"] },
      { quantity: 1, name: "Sanduíche de Gyro de Carne", modifiers: ["Tomate", "Hummus 1 Porção"] },
      { quantity: 1, name: "Salada Vegana" },
    ],
    timer: "00:00:00",
    isFinishing: false,
    atrasado: false,
  },
]

// Mock data for locations
const mockLocations: Location[] = [
  {
    id: "1",
    name: "Kitchen Mink Centro",
    type: "restaurante",
    address: "Rua das Flores, 123 - Centro",
  },
  {
    id: "2",
    name: "Bar do Mink",
    type: "bar",
    address: "Av. Principal, 456 - Jardins",
  },
  {
    id: "3",
    name: "Pizzaria Mink Express",
    type: "pizzaria",
    address: "Rua da Pizza, 789 - Vila Nova",
  },
  {
    id: "4",
    name: "Kitchen Mink Shopping",
    type: "restaurante",
    address: "Shopping Center - Piso 3",
  },
]

export default function KitchenManagementPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState(mockLocations[0].id)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDateTime = (date: Date) => {
    const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear().toString().slice(-2)
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")

    return `${weekday} ${day}/${month}/${year} | ${hours}:${minutes}`
  }

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) || order.id.includes(searchQuery)

    let matchesFilter = false
    if (activeFilter === "all") {
      matchesFilter = true
    } else if (activeFilter === "atrasado") {
      matchesFilter = order.atrasado === true
    } else {
      matchesFilter = order.status === activeFilter
    }

    return matchesSearch && matchesFilter
  })

  const filterCounts = {
    all: mockOrders.length,
    preparoAguardandoProducao: mockOrders.filter((o) => o.status === "preparoAguardandoProducao").length,
    preparoEmProducao: mockOrders.filter((o) => o.status === "preparoEmProducao").length,
    preparoPausado: mockOrders.filter((o) => o.status === "preparoPausado").length,
    preparoCancelado: mockOrders.filter((o) => o.status === "preparoCancelado").length,
    preparoFinalizado: mockOrders.filter((o) => o.status === "preparoFinalizado").length,
    atrasado: mockOrders.filter((o) => o.atrasado === true).length,
  }

  const selectedLocation = mockLocations.find((loc) => loc.id === selectedLocationId) || mockLocations[0]

  const getLocationTypeColor = (type: Location["type"]) => {
    const colors = {
      restaurante: "bg-blue-500",
      bar: "bg-purple-500",
      pizzaria: "bg-orange-500",
    }
    return colors[type]
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar pedidos..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="text-xs font-medium sm:text-sm">{formatDateTime(currentTime)}</div>
        </div>
        <div className="border-t px-4 py-3 sm:px-6">
          <div className="overflow-x-auto">
            <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={filterCounts} />
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <main className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1280px]:grid-cols-4 min-[1536px]:grid-cols-5">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-card">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsLocationModalOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded flex items-center justify-center ${getLocationTypeColor(selectedLocation.type)}`}
              >
                <span className="text-xs font-bold text-white">
                  {selectedLocation.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-medium sm:text-sm">{selectedLocation.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <span className="text-lg">↑</span>
            </Button>
            <span className="text-xs sm:text-sm">Página 1 de 1</span>
            <Button variant="outline" size="icon">
              <span className="text-lg">↓</span>
            </Button>
          </div>
        </div>
      </footer>

      {/* Location Selector Modal */}
      <LocationSelectorModal
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        locations={mockLocations}
        selectedLocationId={selectedLocationId}
        onSelectLocation={setSelectedLocationId}
      />
    </div>
  )
}
