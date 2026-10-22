import React from 'react'
import type { MovementType } from '../types/stock'
import {
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react'

interface StockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  productId?: string
  productName?: string
  currentStock?: number
  defaultType?: MovementType
  onConfirm: (params: {
    productId: string
    type: MovementType
    quantity: number
    reason: string
  }) => { success: boolean; error?: string }
}

export function StockMovementModal({
  isOpen,
  onClose,
  productId,
  productName,
  currentStock = 0,
  defaultType = 'ENTRADA',
  onConfirm,
}: StockMovementModalProps) {
  const [type, setType] = React.useState<MovementType>(defaultType)
  const [quantity, setQuantity] = React.useState<string>('1')
  const [reason, setReason] = React.useState<string>('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setType(defaultType)
      setQuantity(defaultType === 'AJUSTE' ? String(currentStock) : '1')
      setReason('')
      setError(null)
    }
  }, [isOpen, defaultType, currentStock])

  if (!isOpen || !productId) return null

  const parsedQty = parseFloat(quantity) || 0
  let previewStock = currentStock
  if (type === 'ENTRADA') previewStock = currentStock + parsedQty
  if (type === 'SAIDA') previewStock = currentStock - parsedQty
  if (type === 'AJUSTE') previewStock = parsedQty

  const isInsufficientStock = type === 'SAIDA' && parsedQty > currentStock

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isNaN(parsedQty) || parsedQty < 0) {
      setError('Informe uma quantidade válida.')
      return
    }

    if (type !== 'AJUSTE' && parsedQty <= 0) {
      setError('A quantidade deve ser estritamente maior que zero.')
      return
    }

    if (type === 'SAIDA' && parsedQty > currentStock) {
      setError(`Saldo insuficiente! Estoque atual é de apenas ${currentStock} un.`)
      return
    }

    const result = onConfirm({
      productId,
      type,
      quantity: parsedQty,
      reason,
    })

    if (!result.success) {
      setError(result.error || 'Erro ao registrar movimentação')
      return
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Movimentar Estoque
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Produto: <span className="font-semibold text-slate-800 dark:text-slate-200">{productName}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/50 p-3 text-xs text-rose-700 dark:text-rose-300 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Movement Type Tabs */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setType('ENTRADA')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Entrada (+)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('SAIDA')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'SAIDA'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Saída (-)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('AJUSTE')
                  setQuantity(String(currentStock))
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'AJUSTE'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Ajuste (=)</span>
              </button>
            </div>
          </div>

          {/* Dynamic Result Indicator Box */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
                Saldo Atual
              </span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                {currentStock} un.
              </span>
            </div>
            <div className="text-slate-400 text-lg font-light">→</div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
                Estoque Resultante
              </span>
              <span
                className={`text-base font-black ${
                  isInsufficientStock
                    ? 'text-rose-600 dark:text-rose-400'
                    : previewStock === 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {previewStock} un.
              </span>
            </div>
          </div>

          {isInsufficientStock && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>A quantidade de saída excede as {currentStock} unidades disponíveis!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              {type === 'AJUSTE' ? 'Nova Quantidade Contada (Total Real Físico)' : 'Quantidade'}
            </label>
            <input
              type="number"
              min={type === 'AJUSTE' ? '0' : '1'}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              placeholder="Ex: 5"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Motivo ou Referência da Operação
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              placeholder={
                type === 'ENTRADA'
                  ? 'Ex: Compra fornecedor NF #4928'
                  : type === 'SAIDA'
                    ? 'Ex: Venda pedido balcão #104'
                    : 'Ex: Auditoria e conferência física'
              }
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isInsufficientStock}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
