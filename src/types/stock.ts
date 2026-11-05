export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE'

export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  stockQuantity: number
  minStock: number
  createdAt: string
  updatedAt: string
}

export interface Movement {
  id: string
  productId: string
  productName: string
  type: MovementType
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  createdAt: string
}

export interface StockSummary {
  totalItems: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
  totalProducts: number
}

export const ORDER_STATUSES = [
  'Pedido confirmado',
  'Em separação',
  'Em transporte',
  'Entregue',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface Order {
  id: string
  customer: string
  statusIndex: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
}
