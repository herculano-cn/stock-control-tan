import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import type {
  Product,
  Movement,
  StockSummary,
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  ReplenishmentSuggestion,
} from '../types/stock'
import { INITIAL_PRODUCTS, INITIAL_MOVEMENTS } from '../services/stockService'

const DB_DIR = path.resolve(process.cwd(), 'data')
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}
const DB_PATH = path.join(DB_DIR, 'stock.db')

let dbInstance: InstanceType<typeof Database> | null = null

export function getDatabase(): InstanceType<typeof Database> {
  if (dbInstance) {
    return dbInstance
  }

  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      min_quantity INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      previous_quantity INTEGER NOT NULL,
      new_quantity INTEGER NOT NULL,
      reason TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      number INTEGER NOT NULL UNIQUE,
      supplier TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      total REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      received_at TEXT
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL
    );
  `)

  // Check if seed needed
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
  if (countRow.count === 0) {
    seedDatabase(db)
  }

  dbInstance = db
  return dbInstance
}

export function seedDatabase(db: InstanceType<typeof Database> = getDatabase()) {
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, description, category, price, quantity, min_quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMovement = db.prepare(`
    INSERT INTO movements (id, product_id, product_name, type, quantity, previous_quantity, new_quantity, reason, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM purchase_order_items').run()
    db.prepare('DELETE FROM purchase_orders').run()
    db.prepare('DELETE FROM movements').run()
    db.prepare('DELETE FROM products').run()

    for (const p of INITIAL_PRODUCTS) {
      insertProduct.run(
        p.id,
        p.name,
        p.description || '',
        p.category || '',
        p.price,
        p.stockQuantity,
        p.minStock,
        p.createdAt,
        p.updatedAt
      )
    }

    for (const m of INITIAL_MOVEMENTS) {
      insertMovement.run(
        m.id,
        m.productId,
        m.productName,
        m.type,
        m.quantity,
        m.previousStock,
        m.newStock,
        m.reason || '',
        '',
        m.createdAt
      )
    }
  })

  transaction()
}

export function getAllProducts(): Product[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all() as Array<{
    id: string
    name: string
    description: string
    category: string
    price: number
    quantity: number
    min_quantity: number
    created_at: string
    updated_at: string
  }>

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    price: r.price,
    stockQuantity: r.quantity,
    minStock: r.min_quantity,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export function getProductById(id: string): Product | null {
  const db = getDatabase()
  const r = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as {
    id: string
    name: string
    description: string
    category: string
    price: number
    quantity: number
    min_quantity: number
    created_at: string
    updated_at: string
  } | undefined

  if (!r) return null

  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    price: r.price,
    stockQuantity: r.quantity,
    minStock: r.min_quantity,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function insertProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const db = getDatabase()
  const now = new Date().toISOString()
  const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

  const newProduct: Product = {
    ...product,
    id,
    createdAt: now,
    updatedAt: now,
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO products (id, name, description, category, price, quantity, min_quantity, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newProduct.id,
      newProduct.name,
      newProduct.description,
      newProduct.category,
      newProduct.price,
      newProduct.stockQuantity,
      newProduct.minStock,
      newProduct.createdAt,
      newProduct.updatedAt
    )

    if (newProduct.stockQuantity > 0) {
      const movId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      db.prepare(`
        INSERT INTO movements (id, product_id, product_name, type, quantity, previous_quantity, new_quantity, reason, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movId,
        newProduct.id,
        newProduct.name,
        'ENTRADA',
        newProduct.stockQuantity,
        0,
        newProduct.stockQuantity,
        'Cadastro inicial do produto',
        '',
        now
      )
    }
  })

  transaction()
  return newProduct
}

export function updateProductInDb(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'createdAt'>>
): Product | null {
  const db = getDatabase()
  const current = getProductById(id)
  if (!current) return null

  const now = new Date().toISOString()
  const updated: Product = {
    ...current,
    ...updates,
    updatedAt: now,
  }

  db.prepare(`
    UPDATE products
    SET name = ?, description = ?, category = ?, price = ?, quantity = ?, min_quantity = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.description,
    updated.category,
    updated.price,
    updated.stockQuantity,
    updated.minStock,
    updated.updatedAt,
    id
  )

  return updated
}

export function deleteProductFromDb(id: string): boolean {
  const db = getDatabase()
  const res = db.prepare('DELETE FROM products WHERE id = ?').run(id)
  return res.changes > 0
}

export function getAllMovements(): Movement[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM movements ORDER BY created_at DESC').all() as Array<{
    id: string
    product_id: string
    product_name: string
    type: 'ENTRADA' | 'SAIDA' | 'AJUSTE'
    quantity: number
    previous_quantity: number
    new_quantity: number
    reason: string
    notes: string
    created_at: string
  }>

  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    type: r.type,
    quantity: r.quantity,
    previousStock: r.previous_quantity,
    newStock: r.new_quantity,
    reason: r.reason,
    createdAt: r.created_at,
  }))
}

export function recordMovementTransaction(params: {
  productId: string
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE'
  quantity: number
  reason: string
  notes?: string
}): { success: boolean; error?: string; product?: Product; movement?: Movement } {
  const db = getDatabase()
  const current = getProductById(params.productId)
  if (!current) {
    return { success: false, error: 'Produto não encontrado.' }
  }

  const qty = Number(params.quantity)
  if (isNaN(qty) || qty < 0) {
    return { success: false, error: 'Quantidade informada é inválida.' }
  }

  let newQuantity = current.stockQuantity
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
  const movId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  const movQty = params.type === 'AJUSTE' ? Math.abs(newQuantity - current.stockQuantity) : qty

  const updatedProduct: Product = {
    ...current,
    stockQuantity: newQuantity,
    updatedAt: now,
  }

  const newMovement: Movement = {
    id: movId,
    productId: current.id,
    productName: current.name,
    type: params.type,
    quantity: movQty,
    previousStock: current.stockQuantity,
    newStock: newQuantity,
    reason: params.reason?.trim() || (params.type === 'AJUSTE' ? 'Balanço de inventário' : 'Movimentação manual'),
    createdAt: now,
  }

  const transaction = db.transaction(() => {
    db.prepare('UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?').run(
      newQuantity,
      now,
      current.id
    )

    db.prepare(`
      INSERT INTO movements (id, product_id, product_name, type, quantity, previous_quantity, new_quantity, reason, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movId,
      current.id,
      current.name,
      params.type,
      movQty,
      current.stockQuantity,
      newQuantity,
      newMovement.reason,
      params.notes || '',
      now
    )
  })

  transaction()

  return { success: true, product: updatedProduct, movement: newMovement }
}

export function getStockSummaryFromDb(): StockSummary {
  const products = getAllProducts()
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

/* ==================== Purchase Orders ==================== */

export const PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = ['RASCUNHO', 'CONFIRMADA', 'RECEBIDA', 'CANCELADA']

const round2 = (n: number) => Math.round(n * 100) / 100

function formatOrderCode(n: number) {
  return `OC-${String(n).padStart(4, '0')}`
}

type OrderRow = {
  id: string
  number: number
  supplier: string
  status: PurchaseOrderStatus
  notes: string | null
  total: number
  created_at: string
  updated_at: string
  received_at: string | null
}

type ItemRow = {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

function mapOrder(row: OrderRow, itemRows: ItemRow[]): PurchaseOrder {
  const items: PurchaseOrderItem[] = itemRows.map((i) => ({
    id: i.id,
    productId: i.product_id,
    productName: i.product_name,
    quantity: i.quantity,
    unitPrice: i.unit_price,
    subtotal: round2(i.quantity * i.unit_price),
  }))
  return {
    id: row.id,
    number: row.number,
    code: formatOrderCode(row.number),
    supplier: row.supplier,
    status: row.status,
    notes: row.notes || '',
    items,
    total: row.total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    receivedAt: row.received_at,
  }
}

export function getAllPurchaseOrders(): PurchaseOrder[] {
  const db = getDatabase()
  const orders = db.prepare('SELECT * FROM purchase_orders ORDER BY number DESC').all() as OrderRow[]
  const items = db.prepare('SELECT * FROM purchase_order_items ORDER BY rowid').all() as ItemRow[]
  const byOrder = new Map<string, ItemRow[]>()
  for (const it of items) {
    const list = byOrder.get(it.order_id) || []
    list.push(it)
    byOrder.set(it.order_id, list)
  }
  return orders.map((o) => mapOrder(o, byOrder.get(o.id) || []))
}

export function getPurchaseOrderById(id: string): PurchaseOrder | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id) as OrderRow | undefined
  if (!row) return null
  const items = db
    .prepare('SELECT * FROM purchase_order_items WHERE order_id = ? ORDER BY rowid')
    .all(id) as ItemRow[]
  return mapOrder(row, items)
}

export function createPurchaseOrder(
  input: PurchaseOrderInput
): { success: boolean; error?: string; order?: PurchaseOrder } {
  const db = getDatabase()

  const supplier = typeof input?.supplier === 'string' ? input.supplier.trim() : ''
  if (!supplier) {
    return { success: false, error: 'Fornecedor é obrigatório.' }
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { success: false, error: 'O pedido deve ter ao menos um item.' }
  }

  // Merge duplicated products into a single line
  const lines = new Map<string, { productId: string; productName: string; quantity: number; unitPrice: number }>()
  for (const raw of input.items) {
    const qty = Number(raw?.quantity)
    if (!Number.isInteger(qty) || qty <= 0) {
      return { success: false, error: 'Quantidade de cada item deve ser um inteiro maior que zero.' }
    }
    const product = raw?.productId ? getProductById(String(raw.productId)) : null
    if (!product) {
      return { success: false, error: `Produto não encontrado: ${raw?.productId ?? '(vazio)'}.` }
    }
    const unitPrice =
      raw.unitPrice === undefined || raw.unitPrice === null ? product.price : Number(raw.unitPrice)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return { success: false, error: 'Preço unitário inválido.' }
    }
    const existing = lines.get(product.id)
    if (existing) {
      existing.quantity += qty
    } else {
      lines.set(product.id, { productId: product.id, productName: product.name, quantity: qty, unitPrice })
    }
  }

  const now = new Date().toISOString()
  const id = `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  const total = round2([...lines.values()].reduce((sum, l) => sum + l.quantity * l.unitPrice, 0))

  const transaction = db.transaction(() => {
    const row = db.prepare('SELECT COALESCE(MAX(number), 0) + 1 AS next FROM purchase_orders').get() as {
      next: number
    }
    db.prepare(
      `INSERT INTO purchase_orders (id, number, supplier, status, notes, total, created_at, updated_at, received_at)
       VALUES (?, ?, ?, 'RASCUNHO', ?, ?, ?, ?, NULL)`
    ).run(id, row.next, supplier, input.notes?.trim() || '', total, now, now)

    const insertItem = db.prepare(
      `INSERT INTO purchase_order_items (id, order_id, product_id, product_name, quantity, unit_price)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    let idx = 0
    for (const l of lines.values()) {
      insertItem.run(`${id}-i${idx++}`, id, l.productId, l.productName, l.quantity, l.unitPrice)
    }
  })

  transaction()
  return { success: true, order: getPurchaseOrderById(id)! }
}

/**
 * Moves an order to a new status. Receiving (RECEBIDA) increases stock, records
 * ENTRADA movements and flips the status inside a single atomic transaction;
 * any failure rolls everything back.
 */
export function updatePurchaseOrderStatus(
  id: string,
  newStatus: PurchaseOrderStatus
): { success: boolean; error?: string; notFound?: boolean; order?: PurchaseOrder } {
  const db = getDatabase()

  if (!PURCHASE_ORDER_STATUSES.includes(newStatus)) {
    return { success: false, error: 'Status inválido.' }
  }

  class OrderError extends Error {}

  const transaction = db.transaction((): { notFound?: boolean } | void => {
    // Read inside the transaction so the status check and the update are atomic.
    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id) as OrderRow | undefined
    if (!order) return { notFound: true }

    const current = order.status
    if (current === 'RECEBIDA') {
      throw new OrderError(
        newStatus === 'RECEBIDA' ? 'Pedido já foi recebido e não pode ser recebido novamente.' : 'Pedido já recebido não pode mudar de status.'
      )
    }
    if (current === 'CANCELADA') {
      throw new OrderError(
        newStatus === 'RECEBIDA' ? 'Pedido cancelado não pode ser recebido.' : 'Pedido cancelado não pode mudar de status.'
      )
    }
    if (newStatus === current) {
      throw new OrderError(`Pedido já está com status ${current}.`)
    }
    if (newStatus === 'RASCUNHO') {
      throw new OrderError('Não é possível voltar um pedido para RASCUNHO.')
    }

    const now = new Date().toISOString()

    if (newStatus === 'RECEBIDA') {
      // Guarded update: only succeeds if the order is still open.
      const res = db
        .prepare(
          `UPDATE purchase_orders SET status = 'RECEBIDA', received_at = ?, updated_at = ?
           WHERE id = ? AND status IN ('RASCUNHO', 'CONFIRMADA')`
        )
        .run(now, now, id)
      if (res.changes !== 1) {
        throw new OrderError('Pedido já foi recebido ou cancelado.')
      }

      const items = db.prepare('SELECT * FROM purchase_order_items WHERE order_id = ? ORDER BY rowid').all(id) as ItemRow[]
      const code = formatOrderCode(order.number)
      const insertMovement = db.prepare(`
        INSERT INTO movements (id, product_id, product_name, type, quantity, previous_quantity, new_quantity, reason, notes, created_at)
        VALUES (?, ?, ?, 'ENTRADA', ?, ?, ?, ?, ?, ?)
      `)
      for (const item of items) {
        const product = db.prepare('SELECT quantity, name FROM products WHERE id = ?').get(item.product_id) as
          | { quantity: number; name: string }
          | undefined
        if (!product) {
          throw new OrderError(`Produto "${item.product_name}" não existe mais; recebimento abortado.`)
        }
        const newQty = product.quantity + item.quantity
        db.prepare('UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?').run(newQty, now, item.product_id)
        insertMovement.run(
          `mov-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          item.product_id,
          product.name,
          item.quantity,
          product.quantity,
          newQty,
          `Recebimento ${code}`,
          `Fornecedor: ${order.supplier}`,
          now
        )
      }
    } else {
      const res = db
        .prepare(
          `UPDATE purchase_orders SET status = ?, updated_at = ? WHERE id = ? AND status = ?`
        )
        .run(newStatus, now, id, current)
      if (res.changes !== 1) {
        throw new OrderError('Pedido foi alterado por outra operação.')
      }
    }
  })

  try {
    const r = transaction()
    if (r && r.notFound) {
      return { success: false, notFound: true, error: 'Pedido não encontrado.' }
    }
  } catch (err) {
    if (err instanceof OrderError) {
      return { success: false, error: err.message }
    }
    throw err
  }

  return { success: true, order: getPurchaseOrderById(id)! }
}

/**
 * Suggests replenishment for products at or below minimum stock (critical or out).
 * Target level is twice the minimum stock; suggested quantity is always >= 1.
 */
export function getReplenishmentSuggestions(): ReplenishmentSuggestion[] {
  const suggestions: ReplenishmentSuggestion[] = []
  for (const p of getAllProducts()) {
    if (p.stockQuantity > p.minStock) continue
    const target = Math.max(p.minStock * 2, p.minStock + 1)
    const suggestedQuantity = Math.max(target - p.stockQuantity, 1)
    suggestions.push({
      productId: p.id,
      productName: p.name,
      category: p.category,
      currentStock: p.stockQuantity,
      minStock: p.minStock,
      suggestedQuantity,
      unitPrice: p.price,
      estimatedCost: round2(suggestedQuantity * p.price),
      level: p.stockQuantity === 0 ? 'ESGOTADO' : 'CRITICO',
    })
  }
  // Most urgent first: out of stock, then largest deficit
  return suggestions.sort(
    (a, b) =>
      Number(b.level === 'ESGOTADO') - Number(a.level === 'ESGOTADO') ||
      b.suggestedQuantity - a.suggestedQuantity
  )
}
