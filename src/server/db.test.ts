import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

type Db = typeof import('./db')
let db: Db

beforeAll(async () => {
  // db.ts resolves its data directory from process.cwd() at import time.
  process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'stockcontrol-test-')))
  db = await import('./db')
})

function newProduct(stock: number) {
  // insertProduct derives movement ids from Date.now(); wait for the clock to
  // tick so two products created back to back never collide.
  const t = Date.now()
  while (Date.now() === t) { /* spin */ }
  return db.insertProduct({
    name: 'Produto de teste',
    description: '',
    category: 'Teste',
    price: 1,
    stockQuantity: stock,
    minStock: 1,
  })
}

describe('recordMovementTransaction', () => {
  it('SAIDA subtracts quantity from stock (10 - 3 => 7)', () => {
    const p = newProduct(10)
    const r = db.recordMovementTransaction({ productId: p.id, type: 'SAIDA', quantity: 3, reason: 't' })
    expect(r.success).toBe(true)
    expect(r.product?.stockQuantity).toBe(7)
    expect(r.movement?.previousStock).toBe(10)
    expect(r.movement?.newStock).toBe(7)
    expect(db.getProductById(p.id)?.stockQuantity).toBe(7)
  })

  it('SAIDA greater than stock is rejected and stock is unchanged', () => {
    const p = newProduct(5)
    const r = db.recordMovementTransaction({ productId: p.id, type: 'SAIDA', quantity: 6, reason: 't' })
    expect(r.success).toBe(false)
    expect(r.error).toMatch(/Saldo insuficiente/)
    expect(db.getProductById(p.id)?.stockQuantity).toBe(5)
  })

  it('SAIDA equal to stock leaves zero', () => {
    const p = newProduct(4)
    const r = db.recordMovementTransaction({ productId: p.id, type: 'SAIDA', quantity: 4, reason: 't' })
    expect(r.success).toBe(true)
    expect(r.product?.stockQuantity).toBe(0)
  })

  it('ENTRADA adds quantity to stock', () => {
    const p = newProduct(10)
    const r = db.recordMovementTransaction({ productId: p.id, type: 'ENTRADA', quantity: 3, reason: 't' })
    expect(r.product?.stockQuantity).toBe(13)
  })

  it('AJUSTE sets stock to the given quantity', () => {
    const p = newProduct(10)
    const r = db.recordMovementTransaction({ productId: p.id, type: 'AJUSTE', quantity: 2, reason: 't' })
    expect(r.product?.stockQuantity).toBe(2)
    expect(r.movement?.quantity).toBe(8)
  })
})

describe('purchase orders', () => {
  const mkOrder = (items: Array<{ productId: string; quantity: number; unitPrice?: number }>) => {
    const r = db.createPurchaseOrder({ supplier: 'Fornecedor X', items })
    expect(r.success).toBe(true)
    return r.order!
  }

  it('creates orders with sequential numbers, supplier, items and computed total', () => {
    const a = newProduct(0)
    const b = newProduct(0)
    const o1 = mkOrder([
      { productId: a.id, quantity: 2, unitPrice: 10.5 },
      { productId: b.id, quantity: 3, unitPrice: 4 },
    ])
    const o2 = mkOrder([{ productId: a.id, quantity: 1 }])
    expect(o1.status).toBe('RASCUNHO')
    expect(o1.supplier).toBe('Fornecedor X')
    expect(o1.items).toHaveLength(2)
    expect(o1.total).toBe(33)
    expect(o2.number).toBe(o1.number + 1)
    expect(o2.code).toMatch(/^OC-\d{4}$/)
    expect(o2.total).toBe(1) // defaults to product price
    expect(db.getPurchaseOrderById(o1.id)?.items[0].subtotal).toBe(21)
  })

  it('rejects invalid input', () => {
    const p = newProduct(0)
    expect(db.createPurchaseOrder({ supplier: ' ', items: [{ productId: p.id, quantity: 1 }] }).success).toBe(false)
    expect(db.createPurchaseOrder({ supplier: 'F', items: [] }).success).toBe(false)
    expect(db.createPurchaseOrder({ supplier: 'F', items: [{ productId: p.id, quantity: 0 }] }).success).toBe(false)
    expect(db.createPurchaseOrder({ supplier: 'F', items: [{ productId: p.id, quantity: 1.5 }] }).success).toBe(false)
    expect(db.createPurchaseOrder({ supplier: 'F', items: [{ productId: 'nope', quantity: 1 }] }).success).toBe(false)
  })

  it('receiving increases stock, records ENTRADA movements and updates total value', () => {
    const a = newProduct(5)
    const b = newProduct(0)
    const before = db.getStockSummaryFromDb()
    const movementsBefore = db.getAllMovements().length
    const o = mkOrder([
      { productId: a.id, quantity: 10 },
      { productId: b.id, quantity: 4 },
    ])
    const r = db.updatePurchaseOrderStatus(o.id, 'RECEBIDA')
    expect(r.success).toBe(true)
    expect(r.order?.status).toBe('RECEBIDA')
    expect(r.order?.receivedAt).toBeTruthy()
    expect(db.getProductById(a.id)?.stockQuantity).toBe(15)
    expect(db.getProductById(b.id)?.stockQuantity).toBe(4)
    const movs = db.getAllMovements()
    expect(movs.length).toBe(movementsBefore + 2)
    const entry = movs.find((m) => m.productId === a.id && m.reason.includes(o.code))
    expect(entry).toMatchObject({ type: 'ENTRADA', quantity: 10, previousStock: 5, newStock: 15 })
    const after = db.getStockSummaryFromDb()
    expect(after.totalItems).toBe(before.totalItems + 14)
    expect(after.totalValue).toBeCloseTo(before.totalValue + 14, 5) // price 1 each
  })

  it('prevents duplicate receipt and receipt of cancelled orders', () => {
    const p = newProduct(0)
    const o = mkOrder([{ productId: p.id, quantity: 3 }])
    expect(db.updatePurchaseOrderStatus(o.id, 'RECEBIDA').success).toBe(true)
    const again = db.updatePurchaseOrderStatus(o.id, 'RECEBIDA')
    expect(again.success).toBe(false)
    expect(db.getProductById(p.id)?.stockQuantity).toBe(3)

    const c = mkOrder([{ productId: p.id, quantity: 3 }])
    expect(db.updatePurchaseOrderStatus(c.id, 'CANCELADA').success).toBe(true)
    const rc = db.updatePurchaseOrderStatus(c.id, 'RECEBIDA')
    expect(rc.success).toBe(false)
    expect(db.getProductById(p.id)?.stockQuantity).toBe(3)
    expect(db.updatePurchaseOrderStatus(o.id, 'CANCELADA').success).toBe(false)
  })

  it('supports RASCUNHO -> CONFIRMADA -> RECEBIDA and rejects invalid transitions', () => {
    const p = newProduct(0)
    const o = mkOrder([{ productId: p.id, quantity: 2 }])
    expect(db.updatePurchaseOrderStatus(o.id, 'CONFIRMADA').order?.status).toBe('CONFIRMADA')
    expect(db.updatePurchaseOrderStatus(o.id, 'RASCUNHO').success).toBe(false)
    expect(db.updatePurchaseOrderStatus(o.id, 'FOO' as any).success).toBe(false)
    expect(db.updatePurchaseOrderStatus(o.id, 'RECEBIDA').success).toBe(true)
    expect(db.updatePurchaseOrderStatus('missing', 'RECEBIDA').notFound).toBe(true)
  })

  it('rolls back everything when receipt fails midway (atomic)', () => {
    const a = newProduct(5)
    const b = newProduct(5)
    const o = mkOrder([
      { productId: a.id, quantity: 10 },
      { productId: b.id, quantity: 10 },
    ])
    db.deleteProductFromDb(b.id) // second item can no longer be received
    const movementsBefore = db.getAllMovements().length
    const r = db.updatePurchaseOrderStatus(o.id, 'RECEBIDA')
    expect(r.success).toBe(false)
    expect(db.getProductById(a.id)?.stockQuantity).toBe(5)
    expect(db.getPurchaseOrderById(o.id)?.status).toBe('RASCUNHO')
    expect(db.getAllMovements().length).toBe(movementsBefore)
  })

  it('suggests quantity > 0 for critical and out-of-stock products only', () => {
    const critical = db.insertProduct({ name: 'Crit', description: '', category: 'T', price: 2, stockQuantity: 1, minStock: 5 })
    const out = db.insertProduct({ name: 'Out', description: '', category: 'T', price: 2, stockQuantity: 0, minStock: 0 })
    const ok = db.insertProduct({ name: 'Ok', description: '', category: 'T', price: 2, stockQuantity: 50, minStock: 5 })
    const s = db.getReplenishmentSuggestions()
    const c = s.find((x) => x.productId === critical.id)!
    expect(c.suggestedQuantity).toBeGreaterThan(0)
    expect(c.level).toBe('CRITICO')
    expect(c.estimatedCost).toBe(c.suggestedQuantity * 2)
    const o = s.find((x) => x.productId === out.id)!
    expect(o.suggestedQuantity).toBeGreaterThan(0)
    expect(o.level).toBe('ESGOTADO')
    expect(s.find((x) => x.productId === ok.id)).toBeUndefined()
    for (const x of s) expect(x.suggestedQuantity).toBeGreaterThan(0)
  })
})

describe('purchase orders REST API', () => {
  let server: import('node:http').Server
  let base = ''

  beforeAll(async () => {
    const { default: express } = await import('express')
    const { createApiRouter } = await import('./index')
    const app = express()
    app.use(express.json())
    app.use('/api', createApiRouter())
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve())
    })
    base = `http://127.0.0.1:${(server.address() as any).port}/api`
  })

  afterAll(() => {
    server.close()
  })

  const call = async (method: string, url: string, body?: unknown) => {
    const res = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    return { status: res.status, body: await res.json() }
  }

  it('full flow: create, list, get, suggestions, receive, no double receipt, summary updated', async () => {
    const p = newProduct(2)
    db.updateProductInDb(p.id, { minStock: 10 })

    const sug = await call('GET', '/purchase-orders/suggestions')
    expect(sug.status).toBe(200)
    expect(sug.body.find((s: any) => s.productId === p.id).suggestedQuantity).toBeGreaterThan(0)

    expect((await call('POST', '/purchase-orders', { supplier: '', items: [] })).status).toBe(400)

    const created = await call('POST', '/purchase-orders', {
      supplier: 'ACME',
      items: [{ productId: p.id, quantity: 8 }],
    })
    expect(created.status).toBe(201)
    const id = created.body.id

    expect((await call('GET', '/purchase-orders')).body.some((o: any) => o.id === id)).toBe(true)
    expect((await call('GET', `/purchase-orders/${id}`)).body.total).toBe(8)
    expect((await call('GET', '/purchase-orders/missing')).status).toBe(404)

    const summaryBefore = (await call('GET', '/summary')).body
    const rec = await call('PUT', `/purchase-orders/${id}/status`, { status: 'RECEBIDA' })
    expect(rec.status).toBe(200)
    expect(rec.body.status).toBe('RECEBIDA')
    expect((await call('GET', `/products/${p.id}`)).body.stockQuantity).toBe(10)
    const summaryAfter = (await call('GET', '/summary')).body
    expect(summaryAfter.totalItems).toBe(summaryBefore.totalItems + 8)

    const dup = await call('PUT', `/purchase-orders/${id}/status`, { status: 'RECEBIDA' })
    expect(dup.status).toBe(400)
    expect((await call('GET', `/products/${p.id}`)).body.stockQuantity).toBe(10)
    expect((await call('PUT', '/purchase-orders/missing/status', { status: 'RECEBIDA' })).status).toBe(404)
    expect((await call('PUT', `/purchase-orders/${id}/status`, { status: 'XYZ' })).status).toBe(400)
  })
})
