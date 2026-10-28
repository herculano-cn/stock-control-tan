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

export type PurchaseOrderStatus = 'RASCUNHO' | 'CONFIRMADA' | 'RECEBIDA' | 'CANCELADA'

export interface PurchaseOrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface PurchaseOrder {
  id: string
  /** Sequential order number (1, 2, 3...) */
  number: number
  /** Human readable code, e.g. OC-0001 */
  code: string
  supplier: string
  status: PurchaseOrderStatus
  notes: string
  items: PurchaseOrderItem[]
  total: number
  createdAt: string
  updatedAt: string
  receivedAt: string | null
}

export interface PurchaseOrderInput {
  supplier: string
  notes?: string
  items: Array<{ productId: string; quantity: number; unitPrice?: number }>
}

export interface ReplenishmentSuggestion {
  productId: string
  productName: string
  category: string
  currentStock: number
  minStock: number
  suggestedQuantity: number
  unitPrice: number
  estimatedCost: number
  level: 'CRITICO' | 'ESGOTADO'
}
