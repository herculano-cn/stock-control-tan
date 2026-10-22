import { useState, useEffect, useCallback } from 'react'
import type { Product, Movement, StockSummary } from '../types/stock'
import {
  getStoredProducts,
  getStoredMovements,
  computeStockSummary,
  fetchProductsApi,
  fetchMovementsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  registerMovementApi,
  resetDatabaseApi,
} from '../services/stockService'

export function useStock() {
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts())
  const [movements, setMovements] = useState<Movement[]>(() => getStoredMovements())
  const [isLoaded, setIsLoaded] = useState(false)

  const reloadData = useCallback(async () => {
    try {
      const [prods, movs] = await Promise.all([
        fetchProductsApi(),
        fetchMovementsApi(),
      ])
      setProducts(prods)
      setMovements(movs)
    } catch {
      setProducts(getStoredProducts())
      setMovements(getStoredMovements())
    }
  }, [])

  useEffect(() => {
    reloadData().then(() => setIsLoaded(true))

    const handleStorage = () => {
      setProducts(getStoredProducts())
      setMovements(getStoredMovements())
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('stockcontrol_data_change', handleStorage)
      window.addEventListener('storage', handleStorage)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('stockcontrol_data_change', handleStorage)
        window.removeEventListener('storage', handleStorage)
      }
    }
  }, [reloadData])

  const summary: StockSummary = computeStockSummary(products)

  const addProduct = useCallback(
    async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newProduct = await createProductApi(productData)
      await reloadData()
      return newProduct
    },
    [reloadData]
  )

  const updateProduct = useCallback(
    async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
      const ok = await updateProductApi(id, updates)
      await reloadData()
      return ok
    },
    [reloadData]
  )

  const deleteProduct = useCallback(
    async (id: string) => {
      const ok = await deleteProductApi(id)
      await reloadData()
      return ok
    },
    [reloadData]
  )

  const registerMovement = useCallback(
    async (params: {
      productId: string
      type: 'ENTRADA' | 'SAIDA' | 'AJUSTE'
      quantity: number
      reason: string
    }) => {
      const res = await registerMovementApi(params)
      if (res.success) {
        await reloadData()
      }
      return res
    },
    [reloadData]
  )

  const resetAll = useCallback(async () => {
    await resetDatabaseApi()
    await reloadData()
  }, [reloadData])

  return {
    products,
    movements,
    summary,
    isLoaded,
    addProduct,
    updateProduct,
    deleteProduct,
    registerMovement,
    resetAll,
    reloadData,
  }
}
