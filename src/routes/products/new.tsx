import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useStock } from '../../context/useStock'
import { useState } from 'react'
import { ArrowLeft, Save, Package, Layers } from 'lucide-react'

export const Route = createFileRoute('/products/new')({
  component: NewProductPage,
})

function NewProductPage() {
  const { addProduct } = useStock()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stockQuantity: '0',
    minStock: '5',
  })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
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

    const stockQuantity = parseInt(formData.stockQuantity, 10)
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      setError('Informe uma quantidade de estoque válida.')
      return
    }

    const minStock = parseInt(formData.minStock, 10)
    if (isNaN(minStock) || minStock < 0) {
      setError('Informe um estoque mínimo válido.')
      return
    }

    await addProduct({
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      price,
      stockQuantity,
      minStock,
    })

    navigate({ to: '/products' })
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Breadcrumb / Back */}
      <div className="mb-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 no-underline transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Catálogo de Produtos
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cadastrar Novo Produto
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Defina as propriedades cadastrais, precificação de venda e gatilhos de reposição do item.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 sm:p-8">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Identification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Identificação do Produto
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
                placeholder="Ex: Teclado Mecânico RGB Switch Azul"
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
                  list="common-categories"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Periféricos, Monitores..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
                <datalist id="common-categories">
                  <option value="Periféricos" />
                  <option value="Monitores" />
                  <option value="Áudio" />
                  <option value="Móveis" />
                  <option value="Vídeo" />
                  <option value="Componentes" />
                  <option value="Cabos & Acessórios" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Preço de Venda Unitário (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Ex: 349.90"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Descrição e Especificações Detalhadas
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Informe particularidades como cor, voltagem, especificações técnicas..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                rows={3}
              />
            </div>
          </div>

          {/* Section 2: Stock Parameters */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Parâmetros de Controle de Estoque
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Estoque Inicial Disponível
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Se for maior que 0, registra automaticamente um lote inicial de entrada.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Estoque Mínimo de Alerta
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Gatilho de reposição que acionará o alerta de nível crítico no dashboard.
                </p>
              </div>
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
              Salvar e Cadastrar Produto
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
