import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useStock } from '../../../context/useStock'
import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Trash2, Package, Layers, History } from 'lucide-react'

export const Route = createFileRoute('/products/$id/edit')({
  component: EditProductPage,
})

function EditProductPage() {
  const { id } = Route.useParams()
  const { products, updateProduct, deleteProduct } = useStock()
  const navigate = useNavigate()

  const product = products.find((p) => p.id === id)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    minStock: '',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        price: String(product.price),
        minStock: String(product.minStock),
      })
    }
  }, [product])

  if (!product) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center animate-fadeIn">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Produto não encontrado
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            O produto com código <code>{id}</code> não existe ou foi removido.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 no-underline"
          >
            Voltar para lista de produtos
          </Link>
        </div>
      </main>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('O nome do produto é obrigatório.')
      return
    }

    if (!formData.category.trim()) {
      setError('A categoria é obrigatória.')
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price < 0) {
      setError('Informe um preço válido maior ou igual a zero.')
      return
    }

    const minStock = parseInt(formData.minStock, 10)
    if (isNaN(minStock) || minStock < 0) {
      setError('Informe um estoque mínimo válido.')
      return
    }

    updateProduct(id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      price,
      minStock,
    })

    navigate({ to: '/products' })
  }

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
      deleteProduct(id)
      navigate({ to: '/products' })
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Top Bar */}
      <div className="mb-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 no-underline transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Catálogo de Produtos
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Editar Produto: {product.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Atualize as informações cadastrais e gatilhos de alerta de estoque.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Produto
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 sm:p-8">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Current Balance Banner */}
        <div className="mb-8 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-600 dark:text-slate-300">Estoque físico atual em armazém:</span>{' '}
            <strong className="text-slate-900 dark:text-white text-sm font-extrabold ml-1">
              {product.stockQuantity} unidades
            </strong>
          </div>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline no-underline"
          >
            <History className="w-3.5 h-3.5" />
            Ajustar saldo no inventário →
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Identification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Informações Cadastrais
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Categoria *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Preço Unitário (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Descrição Detalhada
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                rows={3}
              />
            </div>
          </div>

          {/* Section 2: Stock Level Alerts */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Parâmetro de Margem de Segurança
              </h2>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Estoque Mínimo de Alerta *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full sm:w-1/2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dispara aviso de reposição urgente quando o estoque físico cair para igual ou menos que este valor.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/products"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition no-underline"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
