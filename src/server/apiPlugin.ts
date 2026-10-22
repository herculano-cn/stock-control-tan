import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
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
} from './db'

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      if (!body) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(body))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export function stockApiPlugin(): Plugin {
  const handleApiRequest = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ? new URL(req.url, 'http://localhost') : null
    if (!url || !url.pathname.startsWith('/api')) {
      return next()
    }

    const pathname = url.pathname
    const method = req.method?.toUpperCase() || 'GET'

    try {
      // GET /api/products
      if (pathname === '/api/products' && method === 'GET') {
        const products = getAllProducts()
        return sendJson(res, 200, products)
      }

      // POST /api/products
      if (pathname === '/api/products' && method === 'POST') {
        const body = await parseJsonBody(req)
        const newProduct = insertProduct({
          name: body.name,
          description: body.description || '',
          category: body.category || '',
          price: Number(body.price) || 0,
          stockQuantity: Number(body.stockQuantity) || 0,
          minStock: Number(body.minStock) || 0,
        })
        return sendJson(res, 201, newProduct)
      }

      // GET /api/products/:id
      const productMatch = pathname.match(/^\/api\/products\/([^\/]+)$/)
      if (productMatch) {
        const id = decodeURIComponent(productMatch[1])
        if (method === 'GET') {
          const product = getProductById(id)
          if (!product) {
            return sendJson(res, 404, { error: 'Produto não encontrado' })
          }
          return sendJson(res, 200, product)
        }

        if (method === 'PUT') {
          const body = await parseJsonBody(req)
          const updated = updateProductInDb(id, body)
          if (!updated) {
            return sendJson(res, 404, { error: 'Produto não encontrado' })
          }
          return sendJson(res, 200, updated)
        }

        if (method === 'DELETE') {
          const ok = deleteProductFromDb(id)
          return sendJson(res, 200, { success: ok })
        }
      }

      // GET /api/movements
      if (pathname === '/api/movements' && method === 'GET') {
        const movements = getAllMovements()
        return sendJson(res, 200, movements)
      }

      // POST /api/movements
      if (pathname === '/api/movements' && method === 'POST') {
        const body = await parseJsonBody(req)
        const result = recordMovementTransaction({
          productId: body.productId,
          type: body.type,
          quantity: Number(body.quantity),
          reason: body.reason,
          notes: body.notes,
        })
        if (!result.success) {
          return sendJson(res, 400, result)
        }
        return sendJson(res, 201, result)
      }

      // GET /api/summary
      if (pathname === '/api/summary' && method === 'GET') {
        const summary = getStockSummaryFromDb()
        return sendJson(res, 200, summary)
      }

      // POST /api/reset-seed
      if (pathname === '/api/reset-seed' && method === 'POST') {
        seedDatabase()
        const products = getAllProducts()
        const movements = getAllMovements()
        const summary = getStockSummaryFromDb()
        return sendJson(res, 200, { success: true, products, movements, summary })
      }

      // If no route matched in /api
      return sendJson(res, 404, { error: 'Endpoint não encontrado' })
    } catch (err: any) {
      console.error('API Error:', err)
      return sendJson(res, 500, { error: err.message || 'Erro interno no servidor' })
    }
  }

  return {
    name: 'vite-plugin-stock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handleApiRequest(req, res, next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handleApiRequest(req, res, next)
      })
    },
  }
}
