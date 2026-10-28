import express from 'express'
import path from 'node:path'
import {
  getAllProducts,
  getProductById,
  insertProduct,
  updateProductInDb,
  deleteProductFromDb,
  getAllMovements,
  recordMovementTransaction,
  getStockSummaryFromDb,
  seedDatabase,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  getReplenishmentSuggestions,
} from './db'

export function createApiRouter() {
  const router = express.Router()

  // GET /api/products
  router.get('/products', (_req, res) => {
    try {
      const products = getAllProducts()
      res.json(products)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // POST /api/products
  router.post('/products', (req, res) => {
    try {
      const body = req.body || {}
      if (!body.name) {
        return res.status(400).json({ error: 'Nome do produto é obrigatório' })
      }
      const newProduct = insertProduct({
        name: body.name,
        description: body.description || '',
        category: body.category || '',
        price: Number(body.price) || 0,
        stockQuantity: Number(body.stockQuantity) || 0,
        minStock: Number(body.minStock) || 0,
      })
      res.status(201).json(newProduct)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET /api/products/:id
  router.get('/products/:id', (req, res) => {
    try {
      const product = getProductById(req.params.id)
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' })
      }
      res.json(product)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT /api/products/:id
  router.put('/products/:id', (req, res) => {
    try {
      const updated = updateProductInDb(req.params.id, req.body)
      if (!updated) {
        return res.status(404).json({ error: 'Produto não encontrado' })
      }
      res.json(updated)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // DELETE /api/products/:id
  router.delete('/products/:id', (req, res) => {
    try {
      const ok = deleteProductFromDb(req.params.id)
      res.json({ success: ok })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET /api/movements
  router.get('/movements', (_req, res) => {
    try {
      const movements = getAllMovements()
      res.json(movements)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // POST /api/movements
  router.post('/movements', (req, res) => {
    try {
      const body = req.body || {}
      const result = recordMovementTransaction({
        productId: body.productId,
        type: body.type,
        quantity: Number(body.quantity),
        reason: body.reason,
        notes: body.notes,
      })
      if (!result.success) {
        return res.status(400).json(result)
      }
      res.status(201).json(result)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET /api/summary
  router.get('/summary', (_req, res) => {
    try {
      const summary = getStockSummaryFromDb()
      res.json(summary)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET /api/purchase-orders/suggestions (must be declared before /:id)
  router.get('/purchase-orders/suggestions', (_req, res) => {
    try {
      res.json(getReplenishmentSuggestions())
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET /api/purchase-orders
  router.get('/purchase-orders', (_req, res) => {
    try {
      res.json(getAllPurchaseOrders())
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // POST /api/purchase-orders
  router.post('/purchase-orders', (req, res) => {
    try {
      const result = createPurchaseOrder(req.body || {})
      if (!result.success) {
        return res.status(400).json(result)
      }
      res.status(201).json(result.order)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // GET /api/purchase-orders/:id
  router.get('/purchase-orders/:id', (req, res) => {
    try {
      const order = getPurchaseOrderById(req.params.id)
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' })
      }
      res.json(order)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // PUT /api/purchase-orders/:id/status
  router.put('/purchase-orders/:id/status', (req, res) => {
    try {
      const result = updatePurchaseOrderStatus(req.params.id, req.body?.status)
      if (result.notFound) {
        return res.status(404).json(result)
      }
      if (!result.success) {
        return res.status(400).json(result)
      }
      res.json(result.order)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // POST /api/reset-seed
  router.post('/reset-seed', (_req, res) => {
    try {
      seedDatabase()
      const products = getAllProducts()
      const movements = getAllMovements()
      const summary = getStockSummaryFromDb()
      res.json({ success: true, products, movements, summary })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

export function startStandaloneServer(port = 3001) {
  const app = express()
  app.use(express.json())
  app.use('/api', createApiRouter())

  // Serve static files in production if dist/client exists
  const clientDist = path.resolve(process.cwd(), 'dist/client')
  app.use(express.static(clientDist))

  app.listen(port, () => {
    console.log(`Standalone backend API running on http://localhost:${port}`)
  })

  return app
}
