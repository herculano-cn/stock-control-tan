import { createFileRoute, Link } from '@tanstack/react-router'
import { useStock } from '../../context/useStock'
import { StockBadge } from '../../components/StockBadge'
import { StockMovementModal } from '../../components/StockMovementModal'
import { useState, useMemo } from 'react'
import type { Product, MovementType } from '../../types/stock'
import {
  Package,
  PlusCircle,
  Search,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  X,
} from 'lucide-react'

interface ProductSearch {
  category?: string
  status?: string
  q?: string
}

export const Route = createFileRoute('/products/')({
  validateSearch: (search: Record<string, unknown>): ProductSearch => {
    return {
      category: search.category ? String(search.category) : undefined,
      status: search.status ? String(search.status) : undefined,
      q: search.q ? String(search.q) : undefined,
    }
  },
  component: ProductsListPage,
})

function ProductsListPage() {
  const { products, deleteProduct, registerMovement } = useStock()
  const searchParams = Route.useSearch()

  const [searchTerm, setSearchTerm] = useState(searchParams.q || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.category || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.status || '')

  // Movement modal state
  const [movementModal, setMovementModal] = useState<{
    product: Product | null
    type: MovementType
  }>({ product: null, type: 'ENTRADA' })

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set).sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search text
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchesName = p.name.toLowerCase().includes(term)
        const matchesDesc = p.description.toLowerCase().includes(term)
        const matchesCat = p.category.toLowerCase().includes(term)
        if (!matchesName && !matchesDesc && !matchesCat) return false
      }

      // Category filter
      if (selectedCategory && p.category !== selectedCategory) {
        return false
      }

      // Status filter
      if (statusFilter === 'alert') {
        if (p.stockQuantity > p.minStock) return false
      } else if (statusFilter === 'out') {
        if (p.stockQuantity > 0) return false
      } else if (statusFilter === 'normal') {
        if (p.stockQuantity <= p.minStock) return false
      }

      return true
    })
  }, [products, searchTerm, selectedCategory, statusFilter])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const handleDelete = (p: Product) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${p.name}"?`)) {
      deleteProduct(p.id)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setStatusFilter('')
  }

  const hasActiveFilters = Boolean(searchTerm || selectedCategory || statusFilter)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Top Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            Catálogo & Estoque Físico
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gerenciamento de Produtos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cadastre novos itens, configure margens de estoque mínimo e gerencie movimentações imediatas.
          </p>
        </div>

        <Link
          to="/products/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition no-underline self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Cadastrar Novo Produto
        </Link>
      </div>

      {/* Modern Filter and Search Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, categoria ou especificação técnica..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="">Todas as Categorias ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="">Todos os Níveis de Estoque</option>
              <option value="alert">⚠️ Alerta (Crítico ou Esgotado)</option>
              <option value="out">🔴 Apenas Esgotados (0 un.)</option>
              <option value="normal">🟢 Estoque Confortável</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Exibindo <strong>{filteredProducts.length}</strong> de {products.length} itens encontrados
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Products Table Shell */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Produto & Descrição</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Preço Unit.</th>
                <th className="py-3.5 px-4">Saldo Físico</th>
                <th className="py-3.5 px-4">Mínimo</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                      Nenhum produto atende aos critérios
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Verifique os filtros de categoria ou termo de busca.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                        {p.description || 'Sem descrição cadastrada'}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(p.price)}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-slate-900 dark:text-white text-base">
                        {p.stockQuantity} un.
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {p.minStock} un.
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StockBadge quantity={p.stockQuantity} minStock={p.minStock} />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick stock in */}
                        <button
                          type="button"
                          onClick={() => setMovementModal({ product: p, type: 'ENTRADA' })}
                          title="Dar entrada (+)"
                          className="p-2 rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>

                        {/* Quick stock out */}
                        <button
                          type="button"
                          onClick={() => setMovementModal({ product: p, type: 'SAIDA' })}
                          disabled={p.stockQuantity === 0}
                          title={p.stockQuantity === 0 ? 'Sem estoque disponível' : 'Dar saída (-)'}
                          className="p-2 rounded-lg text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ArrowDownRight className="w-4 h-4" />
                        </button>

                        {/* Open modal for custom movement */}
                        <button
                          type="button"
                          onClick={() => setMovementModal({ product: p, type: 'AJUSTE' })}
                          title="Balanço ou ajuste de inventário"
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white transition"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>

                        {/* Edit product */}
                        <Link
                          to="/products/$id/edit"
                          params={{ id: p.id }}
                          title="Editar cadastro"
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white transition no-underline flex items-center justify-center"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>

                        {/* Delete product */}
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          title="Excluir produto"
                          className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Modal */}
      <StockMovementModal
        isOpen={movementModal.product !== null}
        onClose={() => setMovementModal({ product: null, type: 'ENTRADA' })}
        productId={movementModal.product?.id}
        productName={movementModal.product?.name}
        currentStock={movementModal.product?.stockQuantity}
        defaultType={movementModal.type}
        onConfirm={registerMovement}
      />
    </main>
  )
}
