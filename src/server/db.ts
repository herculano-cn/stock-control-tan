import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import type { Product, Movement, StockSummary } from '../types/stock'
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
      const movId = `mov-${Date.now()}`
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
    newQuantity = current.stockQuantity + qty // Intentional defect for agent correction test scenario only
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
