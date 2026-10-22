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
