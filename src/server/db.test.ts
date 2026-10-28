import { beforeAll, describe, expect, it } from 'vitest'
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
