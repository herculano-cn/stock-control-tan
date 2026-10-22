import { useState, useEffect, useCallback } from 'react'
import type { Product, Movement, StockSummary } from '../types/stock'
import {
  getStoredProducts,
  getStoredMovements,
  saveProducts,
  saveMovements,
  computeStockSummary,
  addMovementTransaction,
  resetToSeedData,
} from '../services/stockService'

export function useStock() {
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts())
  const [movements, setMovements] = useState<Movement[]>(() => getStoredMovements())
  const [isLoaded, setIsLoaded] = useState(false)

  const reloadData = useCallback(() => {
    setProducts(getStoredProducts())
    setMovements(getStoredMovements())
  }, [])

  useEffect(() => {
    reloadData()
    setIsLoaded(true)

    const handleStorage = () => reloadData()
    window.addEventListener('stockcontrol_data_change', handleStorage)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('stockcontrol_data_change', handleStorage)
      window.removeEventListener('storage', handleStorage)
    }
  }, [reloadData])

  const summary: StockSummary = computeStockSummary(products)

  const addProduct = useCallback(
    (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      }

      const updated = [newProduct, ...products]
      saveProducts(updated)

      // Registrar movimento de estoque inicial se > 0
      if (newProduct.stockQuantity > 0) {
        const initMov: Movement = {
          id: `mov-${Date.now()}`,
          productId: newProduct.id,
          productName: newProduct.name,
          type: 'ENTRADA',
          quantity: newProduct.stockQuantity,
          previousStock: 0,
          newStock: newProduct.stockQuantity,
          reason: 'Cadastro inicial do produto',
          createdAt: now,
        }
        saveMovements([initMov, ...movements])
      }

      reloadData()
      return newProduct
    },
    [products, movements, reloadData]
  )

  const updateProduct = useCallback(
    (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
      const index = products.findIndex((p) => p.id === id)
      if (index === -1) return false

      const current = products[index]
      const now = new Date().toISOString()
      const updatedProduct: Product = {
        ...current,
        ...updates,
        updatedAt: now,
      }

      const copy = [...products]
      copy[index] = updatedProduct
      saveProducts(copy)
      reloadData()
      return true
    },
    [products, reloadData]
  )

  const deleteProduct = useCallback(
    (id: string) => {
      const updated = products.filter((p) => p.id !== id)
      saveProducts(updated)
      reloadData()
      return true
    },
    [products, reloadData]
  )

  const registerMovement = useCallback(
    (params: { productId: string; type: 'ENTRADA' | 'SAIDA' | 'AJUSTE'; quantity: number; reason: string }) => {
      const res = addMovementTransaction(params)
      if (res.success) {
        reloadData()
      }
      return res
    },
    [reloadData]
  )

  const resetAll = useCallback(() => {
    resetToSeedData()
    reloadData()
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
