import type {
  Product,
  Movement,
  MovementType,
  StockSummary,
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderStatus,
  ReplenishmentSuggestion,
} from '../types/stock'

const PRODUCTS_STORAGE_KEY = 'stockcontrol_products_v1'
const MOVEMENTS_STORAGE_KEY = 'stockcontrol_movements_v1'

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Teclado Mecânico RGB',
    description: 'Teclado mecânico switch azul com retroiluminação RGB e conexão USB-C',
    category: 'Periféricos',
    price: 349.9,
    stockQuantity: 18,
    minStock: 5,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'prod-2',
    name: 'Mouse Gamer 16000 DPI',
    description: 'Sensor óptico de alta precisão, 6 botões programáveis e cabo paracord',
    category: 'Periféricos',
    price: 189.5,
    stockQuantity: 4,
    minStock: 8,
    createdAt: '2026-03-02T11:00:00.000Z',
    updatedAt: '2026-03-02T11:00:00.000Z',
  },
  {
    id: 'prod-3',
    name: 'Monitor UltraWide 29"',
    description: 'Painel IPS Full HD 75Hz com HDR10, sRGB 99% e suporte FreeSync',
    category: 'Monitores',
    price: 1299.0,
    stockQuantity: 2,
    minStock: 5,
    createdAt: '2026-03-03T09:30:00.000Z',
    updatedAt: '2026-03-03T09:30:00.000Z',
  },
  {
    id: 'prod-4',
    name: 'Headset Sem Fio Pro 7.1',
    description: 'Áudio espacial 7.1 surround, bateria de 30 horas e microfone destacável',
    category: 'Áudio',
    price: 499.0,
    stockQuantity: 0,
    minStock: 3,
    createdAt: '2026-03-04T14:15:00.000Z',
    updatedAt: '2026-03-04T14:15:00.000Z',
  },
  {
    id: 'prod-5',
    name: 'Cadeira Ergonômica Mesh',
    description: 'Apoio lombar ajustável 3D, braços reguláveis e rodízios em PU anti-risco',
    category: 'Móveis',
    price: 899.9,
    stockQuantity: 12,
    minStock: 4,
    createdAt: '2026-03-05T08:00:00.000Z',
    updatedAt: '2026-03-05T08:00:00.000Z',
  },
  {
    id: 'prod-6',
    name: 'Webcam 4K Ultra Clear',
    description: 'Autofoco inteligente, microfone estéreo com cancelamento de ruído e tampa de privacidade',
    category: 'Vídeo',
    price: 389.0,
    stockQuantity: 9,
    minStock: 3,
    createdAt: '2026-03-06T16:20:00.000Z',
    updatedAt: '2026-03-06T16:20:00.000Z',
  },
]

export const INITIAL_MOVEMENTS: Movement[] = [
  {
    id: 'mov-1',
    productId: 'prod-1',
    productName: 'Teclado Mecânico RGB',
    type: 'ENTRADA',
    quantity: 20,
    previousStock: 0,
    newStock: 20,
    reason: 'Lote inicial de compras NF 1042',
    createdAt: '2026-03-01T10:30:00.000Z',
  },
  {
    id: 'mov-2',
    productId: 'prod-1',
    productName: 'Teclado Mecânico RGB',
    type: 'SAIDA',
    quantity: 2,
    previousStock: 20,
    newStock: 18,
    reason: 'Venda Pedido #8491',
    createdAt: '2026-03-02T15:20:00.000Z',
  },
  {
    id: 'mov-3',
    productId: 'prod-2',
    productName: 'Mouse Gamer 16000 DPI',
    type: 'ENTRADA',
    quantity: 10,
    previousStock: 0,
    newStock: 10,
    reason: 'Estoque de inauguração',
    createdAt: '2026-03-02T11:15:00.000Z',
  },
  {
    id: 'mov-4',
    productId: 'prod-2',
    productName: 'Mouse Gamer 16000 DPI',
    type: 'SAIDA',
    quantity: 6,
    previousStock: 10,
    newStock: 4,
    reason: 'Vendas balcão',
    createdAt: '2026-03-05T18:00:00.000Z',
  },
  {
    id: 'mov-5',
    productId: 'prod-4',
    productName: 'Headset Sem Fio Pro 7.1',
    type: 'AJUSTE',
    quantity: 0,
    previousStock: 1,
    newStock: 0,
    reason: 'Inventário físico: peça avariada descartada',
    createdAt: '2026-03-06T17:40:00.000Z',
  },
]

// In-memory cache for SSR / fallback
let inMemoryProducts: Product[] = [...INITIAL_PRODUCTS]
let inMemoryMovements: Movement[] = [...INITIAL_MOVEMENTS]

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/* ==================== LocalStorage Fallbacks ==================== */

export function getStoredProducts(): Product[] {
  if (!isBrowser() || typeof window.localStorage === 'undefined') {
    return inMemoryProducts
  }

  try {
    const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS))
      return INITIAL_PRODUCTS
    }
    return JSON.parse(raw) as Product[]
  } catch (e) {
    console.error('Error reading products from localStorage:', e)
    return inMemoryProducts
  }
}

export function saveProducts(products: Product[]): void {
  inMemoryProducts = products
  if (isBrowser() && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products))
      window.dispatchEvent(new Event('stockcontrol_data_change'))
    } catch (e) {
      console.error('Error saving products to localStorage:', e)
    }
  }
}

export function getStoredMovements(): Movement[] {
  if (!isBrowser() || typeof window.localStorage === 'undefined') {
    return inMemoryMovements
  }

  try {
    const raw = window.localStorage.getItem(MOVEMENTS_STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_MOVEMENTS))
      return INITIAL_MOVEMENTS
    }
    return JSON.parse(raw) as Movement[]
  } catch (e) {
    console.error('Error reading movements from localStorage:', e)
    return inMemoryMovements
  }
}

export function saveMovements(movements: Movement[]): void {
  inMemoryMovements = movements
  if (isBrowser() && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(movements))
      window.dispatchEvent(new Event('stockcontrol_data_change'))
    } catch (e) {
      console.error('Error saving movements to localStorage:', e)
    }
  }
}

export function computeStockSummary(products: Product[]): StockSummary {
  let totalItems = 0
  let totalValue = 0
  let lowStockCount = 0
  let outOfStockCount = 0

  for (const p of products) {
    totalItems += p.stockQuantity
    totalValue += p.price * p.stockQuantity
    if (p.stockQuantity === 0) {
      outOfStockCount++
    } else if (p.stockQuantity <= p.minStock) {
      lowStockCount++
    }
  }

  return {
    totalItems,
    totalValue,
    lowStockCount,
    outOfStockCount,
    totalProducts: products.length,
  }
}

/* ==================== Backend REST API Calls (SQLite Persisted) ==================== */

export async function fetchProductsApi(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products')
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = await res.json()
    saveProducts(data)
    return data
  } catch (e) {
    console.warn('API /api/products unavailable, using fallback data:', e)
    return getStoredProducts()
  }
}

export async function fetchMovementsApi(): Promise<Movement[]> {
  try {
    const res = await fetch('/api/movements')
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = await res.json()
    saveMovements(data)
    return data
  } catch (e) {
    console.warn('API /api/movements unavailable, using fallback data:', e)
    return getStoredMovements()
  }
}

export async function fetchSummaryApi(): Promise<StockSummary> {
  try {
    const res = await fetch('/api/summary')
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn('API /api/summary unavailable, using fallback data:', e)
    return computeStockSummary(getStoredProducts())
  }
}

export async function createProductApi(
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const newProduct = await res.json()
    // Sync to local fallback
    const current = getStoredProducts()
    saveProducts([newProduct, ...current])
    return newProduct
  } catch (e) {
    console.warn('API createProduct failed, falling back to local storage:', e)
    const now = new Date().toISOString()
    const fallbackProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    }
    const current = getStoredProducts()
    saveProducts([fallbackProduct, ...current])
    return fallbackProduct
  }
}

export async function updateProductApi(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<boolean> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const updated = await res.json()
    const current = getStoredProducts()
    const index = current.findIndex((p) => p.id === id)
    if (index !== -1) {
      current[index] = updated
      saveProducts([...current])
    }
    return true
  } catch (e) {
    console.warn('API updateProduct failed, falling back to local storage:', e)
    const current = getStoredProducts()
    const index = current.findIndex((p) => p.id === id)
    if (index === -1) return false
    const now = new Date().toISOString()
    current[index] = { ...current[index], ...updates, updatedAt: now }
    saveProducts([...current])
    return true
  }
}

export async function deleteProductApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const current = getStoredProducts()
    saveProducts(current.filter((p) => p.id !== id))
    return true
  } catch (e) {
    console.warn('API deleteProduct failed, falling back to local storage:', e)
    const current = getStoredProducts()
    saveProducts(current.filter((p) => p.id !== id))
    return true
  }
}

export async function registerMovementApi(params: {
  productId: string
  type: MovementType
  quantity: number
  reason: string
  notes?: string
}): Promise<{ success: boolean; error?: string; product?: Product; movement?: Movement }> {
  try {
    const res = await fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao registrar movimentação' }
    }

    if (data.product) {
      const prods = getStoredProducts()
      const idx = prods.findIndex((p) => p.id === data.product.id)
      if (idx !== -1) {
        prods[idx] = data.product
        saveProducts([...prods])
      }
    }
    if (data.movement) {
      const movs = getStoredMovements()
      saveMovements([data.movement, ...movs])
    }

    return data
  } catch (e: any) {
    console.warn('API registerMovement failed, falling back to local storage:', e)
    return addMovementTransaction(params)
  }
}

/* ==================== Purchase Orders API ==================== */

export async function fetchPurchaseOrdersApi(): Promise<PurchaseOrder[]> {
  const res = await fetch('/api/purchase-orders')
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

export async function fetchSuggestionsApi(): Promise<ReplenishmentSuggestion[]> {
  const res = await fetch('/api/purchase-orders/suggestions')
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

export async function createPurchaseOrderApi(
  input: PurchaseOrderInput
): Promise<{ success: boolean; error?: string; order?: PurchaseOrder }> {
  try {
    const res = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'Erro ao criar pedido' }
    return { success: true, order: data }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Servidor indisponível' }
  }
}

export async function updatePurchaseOrderStatusApi(
  id: string,
  status: PurchaseOrderStatus
): Promise<{ success: boolean; error?: string; order?: PurchaseOrder }> {
  try {
    const res = await fetch(`/api/purchase-orders/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'Erro ao atualizar status' }
    return { success: true, order: data }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Servidor indisponível' }
  }
}

export async function resetDatabaseApi(): Promise<void> {
  try {
    const res = await fetch('/api/reset-seed', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      if (data.products) saveProducts(data.products)
      if (data.movements) saveMovements(data.movements)
      return
    }
  } catch (e) {
    console.warn('API reset-seed failed, falling back to local storage:', e)
  }
  resetToSeedData()
}

export function addMovementTransaction(params: {
  productId: string
  type: MovementType
  quantity: number
  reason: string
}): { success: boolean; error?: string; product?: Product; movement?: Movement } {
  const products = getStoredProducts()
  const movements = getStoredMovements()

  const productIndex = products.findIndex((p) => p.id === params.productId)
  if (productIndex === -1) {
    return { success: false, error: 'Produto não encontrado.' }
  }

  const current = products[productIndex]
  let newQuantity = current.stockQuantity
  const qty = Number(params.quantity)

  if (isNaN(qty) || qty < 0) {
    return { success: false, error: 'Quantidade informada é inválida.' }
  }

  if (params.type === 'ENTRADA') {
    if (qty <= 0) {
      return { success: false, error: 'Quantidade de entrada deve ser maior que zero.' }
    }
    newQuantity = current.stockQuantity + qty
  } else if (params.type === 'SAIDA') {
    if (qty <= 0) {
      return { success: false, error: 'Quantidade de saída deve ser maior que zero.' }
    }
    if (current.stockQuantity < qty) {
      return {
        success: false,
        error: `Saldo insuficiente! Estoque atual é ${current.stockQuantity} un., não é possível retirar ${qty} un.`,
      }
    }
    newQuantity = current.stockQuantity - qty
  } else if (params.type === 'AJUSTE') {
    newQuantity = qty
  }

  const now = new Date().toISOString()
  const updatedProduct: Product = {
    ...current,
    stockQuantity: newQuantity,
    updatedAt: now,
  }

  const newMovement: Movement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: current.id,
    productName: current.name,
    type: params.type,
    quantity: params.type === 'AJUSTE' ? Math.abs(newQuantity - current.stockQuantity) : qty,
    previousStock: current.stockQuantity,
    newStock: newQuantity,
    reason: params.reason?.trim() || (params.type === 'AJUSTE' ? 'Balanço de inventário' : 'Movimentação manual'),
    createdAt: now,
  }

  products[productIndex] = updatedProduct
  movements.unshift(newMovement)

  saveProducts(products)
  saveMovements(movements)

  return { success: true, product: updatedProduct, movement: newMovement }
}

export function resetToSeedData(): void {
  saveProducts(INITIAL_PRODUCTS)
  saveMovements(INITIAL_MOVEMENTS)
}
