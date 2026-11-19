import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

type Db = typeof import('./db')
let db: Db
let tempDir: string
let originalCwd: string
let nextProductTimestamp = 0

beforeAll(async () => {
  // db.ts resolves its data directory from process.cwd() at import time.
  originalCwd = process.cwd()
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockcontrol-test-'))
  process.chdir(tempDir)
  try {
    db = await import('./db')
  } finally {
    process.chdir(originalCwd)
  }
})

afterAll(() => {
  db.getDatabase().close()
  fs.rmSync(tempDir, { recursive: true, force: true })
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

function newProduct(stock: number) {
  // insertProduct uses Date.now() for initial movement ids; advance a fixed
  // test clock instead of waiting for the wall clock.
  advanceClock()
  return db.insertProduct({
    name: 'Produto de teste',
    description: '',
    category: 'Teste',
    price: 1,
    stockQuantity: stock,
    minStock: 1,
  })
}

function advanceClock() {
  vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 0, 0, 0, nextProductTimestamp++)))
}

function recordMovement(params: Parameters<Db['recordMovementTransaction']>[0]) {
  advanceClock()
  return db.recordMovementTransaction(params)
}

describe('recordMovementTransaction', () => {
  it('SAIDA subtracts quantity from stock (10 - 3 => 7)', () => {
    const p = newProduct(10)
    const r = recordMovement({ productId: p.id, type: 'SAIDA', quantity: 3, reason: 't' })
    expect(r.success).toBe(true)
    expect(r.product?.stockQuantity).toBe(7)
    expect(r.movement?.previousStock).toBe(10)
    expect(r.movement?.newStock).toBe(7)
    expect(db.getProductById(p.id)?.stockQuantity).toBe(7)
    expect(db.getAllMovements()).toContainEqual(r.movement)
  })

  it('SAIDA greater than stock is rejected and stock is unchanged', () => {
    const p = newProduct(5)
    const movementCount = db.getAllMovements().length
    const r = recordMovement({ productId: p.id, type: 'SAIDA', quantity: 6, reason: 't' })
    expect(r.success).toBe(false)
    expect(r.error).toMatch(/Saldo insuficiente/)
    expect(db.getProductById(p.id)?.stockQuantity).toBe(5)
    expect(db.getAllMovements()).toHaveLength(movementCount)
  })

  it('SAIDA equal to stock leaves zero', () => {
    const p = newProduct(4)
    const r = recordMovement({ productId: p.id, type: 'SAIDA', quantity: 4, reason: 't' })
    expect(r.success).toBe(true)
    expect(r.product?.stockQuantity).toBe(0)
  })

  it('ENTRADA adds quantity to stock', () => {
    const p = newProduct(10)
    const r = recordMovement({ productId: p.id, type: 'ENTRADA', quantity: 3, reason: 't' })
    expect(r.product?.stockQuantity).toBe(13)
  })

  it('AJUSTE sets stock to the given quantity', () => {
    const p = newProduct(10)
    const r = recordMovement({ productId: p.id, type: 'AJUSTE', quantity: 2, reason: 't' })
    expect(r.product?.stockQuantity).toBe(2)
    expect(r.movement?.quantity).toBe(8)
  })

  it('AJUSTE can increase stock and records the absolute difference', () => {
    const p = newProduct(2)
    const r = recordMovement({ productId: p.id, type: 'AJUSTE', quantity: 7, reason: 'contagem' })

    expect(r.success).toBe(true)
    expect(r.product?.stockQuantity).toBe(7)
    expect(r.movement).toMatchObject({ previousStock: 2, newStock: 7, quantity: 5 })
    expect(db.getAllMovements()).toContainEqual(r.movement)
  })

  it('AJUSTE to the current stock records a zero-difference movement', () => {
    const p = newProduct(4)
    const r = recordMovement({ productId: p.id, type: 'AJUSTE', quantity: 4, reason: 'contagem' })

    expect(r.success).toBe(true)
    expect(r.product?.stockQuantity).toBe(4)
    expect(r.movement).toMatchObject({ previousStock: 4, newStock: 4, quantity: 0 })
    expect(db.getAllMovements()).toContainEqual(r.movement)
  })

  it('returns a not-found failure without changing movement history', () => {
    const movementsBefore = db.getAllMovements()
    const r = recordMovement({ productId: 'missing-product', type: 'ENTRADA', quantity: 1, reason: 't' })

    expect(db.getProductById('missing-product')).toBeNull()
    expect(r).toEqual({ success: false, error: 'Produto não encontrado.' })
    expect(db.getAllMovements()).toEqual(movementsBefore)
  })

  it.each([Number.NaN, -1])('rejects invalid quantity %s without changing stock or history', (quantity) => {
    const p = newProduct(5)
    const movementsBefore = db.getAllMovements()
    const r = recordMovement({ productId: p.id, type: 'ENTRADA', quantity, reason: 't' })

    expect(r.success).toBe(false)
    expect(r.error).toMatch(/Quantidade informada é inválida/)
    expect(db.getProductById(p.id)?.stockQuantity).toBe(5)
    expect(db.getAllMovements()).toEqual(movementsBefore)
  })

  it.each(['ENTRADA', 'SAIDA'] as const)('rejects zero quantity for %s without changing stock or history', (type) => {
    const p = newProduct(5)
    const movementsBefore = db.getAllMovements()
    const r = recordMovement({ productId: p.id, type, quantity: 0, reason: 't' })

    expect(r.success).toBe(false)
    expect(r.error).toMatch(/deve ser maior que zero/)
    expect(db.getProductById(p.id)?.stockQuantity).toBe(5)
    expect(db.getAllMovements()).toEqual(movementsBefore)
  })

  it('persists a movement and updates the stock summary consistently', () => {
    const before = db.getStockSummaryFromDb()
    advanceClock()
    const lowStockProduct = db.insertProduct({
      name: 'Produto próximo do mínimo', description: '', category: 'Teste', price: 2,
      stockQuantity: 3, minStock: 3,
    })
    advanceClock()
    const outOfStockProduct = db.insertProduct({
      name: 'Produto sem saldo', description: '', category: 'Teste', price: 5,
      stockQuantity: 0, minStock: 0,
    })
    const movement = recordMovement({
      productId: lowStockProduct.id, type: 'ENTRADA', quantity: 2, reason: 'reposição', notes: 'lote local',
    })

    expect(movement.success).toBe(true)
    expect(db.getProductById(lowStockProduct.id)?.stockQuantity).toBe(5)
    expect(db.getAllMovements().find(({ id }) => id === movement.movement?.id)).toMatchObject({
      productId: lowStockProduct.id,
      type: 'ENTRADA',
      quantity: 2,
      previousStock: 3,
      newStock: 5,
      reason: 'reposição',
    })
    expect(db.getStockSummaryFromDb()).toEqual({
      totalItems: before.totalItems + 5,
      totalValue: before.totalValue + 10,
      lowStockCount: before.lowStockCount,
      outOfStockCount: before.outOfStockCount + 1,
      totalProducts: before.totalProducts + 2,
    })
    expect(db.getProductById(outOfStockProduct.id)?.stockQuantity).toBe(0)
  })
})
