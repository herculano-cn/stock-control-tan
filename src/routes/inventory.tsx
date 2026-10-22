import { createFileRoute } from '@tanstack/react-router'
import { useStock } from '../context/useStock'
import { StockBadge } from '../components/StockBadge'
import { MovementTypeBadge } from '../components/MovementTypeBadge'
import { StockMovementModal } from '../components/StockMovementModal'
import { useState, useMemo } from 'react'
import type { Product, MovementType } from '../types/stock'
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
} from 'lucide-react'

export const Route = createFileRoute('/inventory')({
  component: InventoryPage,
})

function InventoryPage() {
  const { products, movements, registerMovement } = useStock()

  // Modal state
  const [activeModal, setActiveModal] = useState<{
    product: Product | null
    type: MovementType
  }>({ product: null, type: 'ENTRADA' })

  // Filters for movement history
  const [historySearch, setHistorySearch] = useState('')
  const [historyType, setHistoryType] = useState<string>('')

  // Quick physical inventory audit box
  const [quickBalanceProdId, setQuickBalanceProdId] = useState<string>('')
  const [quickBalanceQty, setQuickBalanceQty] = useState<string>('')
  const [quickBalanceReason, setQuickBalanceReason] = useState<string>('')
  const [quickBalanceMsg, setQuickBalanceMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const selectedProductForAudit = products.find((p) => p.id === quickBalanceProdId)

  const handleQuickBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setQuickBalanceMsg(null)

    if (!quickBalanceProdId) {
      setQuickBalanceMsg({ type: 'err', text: 'Selecione um produto para o balanço.' })
      return
    }

    const qty = parseInt(quickBalanceQty, 10)
    if (isNaN(qty) || qty < 0) {
      setQuickBalanceMsg({ type: 'err', text: 'Informe uma contagem válida (maior ou igual a 0).' })
      return
    }

    const res = await registerMovement({
      productId: quickBalanceProdId,
      type: 'AJUSTE',
      quantity: qty,
      reason: quickBalanceReason.trim() || 'Contagem física rápida de inventário',
    })

    if (res.success) {
      setQuickBalanceMsg({ type: 'ok', text: 'Contagem registrada e saldo atualizado com sucesso!' })
      setQuickBalanceQty('')
      setQuickBalanceReason('')
      setQuickBalanceProdId('')
    } else {
      setQuickBalanceMsg({ type: 'err', text: res.error || 'Erro ao atualizar saldo de estoque.' })
    }
  }

  // Filtered movements list
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (historyType && m.type !== historyType) {
        return false
      }
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase()
        const matchProd = m.productName.toLowerCase().includes(q)
        const matchReason = m.reason?.toLowerCase().includes(q)
        if (!matchProd && !matchReason) return false
      }
      return true
    })
  }, [movements, historyType, historySearch])

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
          Auditoria & Rastreabilidade
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Gestão de Inventário & Movimentações
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Realize balanço físico em tempo real, registre entradas/saídas operacionais e consulte o livro de auditoria completo.
        </p>
      </div>

      {/* Grid: Quick Physical Audit vs Quick Operations list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rapid Balanço / Physical Count Form */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Contagem Física Ágil
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ajuste direto por balanço de prateleira
                </p>
              </div>
            </div>

            {quickBalanceMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  quickBalanceMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                }`}
              >
                {quickBalanceMsg.type === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{quickBalanceMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleQuickBalanceSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Item a Conferir *
                </label>
                <select
                  value={quickBalanceProdId}
                  onChange={(e) => {
                    setQuickBalanceProdId(e.target.value)
                    const p = products.find((x) => x.id === e.target.value)
                    if (p) setQuickBalanceQty(String(p.stockQuantity))
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  <option value="">Selecione o produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Atual: {p.stockQuantity} un.)
                    </option>
                  ))}
                </select>
              </div>

              {selectedProductForAudit && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs flex justify-between">
                  <span className="text-slate-500">Saldo no sistema:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedProductForAudit.stockQuantity} un.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Contagem Real Apurada (unidades) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={quickBalanceQty}
                  onChange={(e) => setQuickBalanceQty(e.target.value)}
                  placeholder="Ex: 14"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Justificativa / Responsável
                </label>
                <input
                  type="text"
                  value={quickBalanceReason}
                  onChange={(e) => setQuickBalanceReason(e.target.value)}
                  placeholder="Ex: Auditoria mensal março - Bloco B"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                <Scale className="w-4 h-4" />
                Registrar Balanço
              </button>
            </form>
          </div>
        </div>

        {/* Quick Operations by product */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Lançamento Rápido de Movimentações
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dê entrada ou saída em qualquer produto em 1 clique
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400">
              {products.length} itens no total
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {p.name}
                    </span>
                    <StockBadge quantity={p.stockQuantity} minStock={p.minStock} />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Saldo disponível:{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {p.stockQuantity} un.
                    </strong>{' '}
                    • Margem mínima: {p.minStock} un.
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setActiveModal({ product: p, type: 'ENTRADA' })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 transition"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal({ product: p, type: 'SAIDA' })}
                    disabled={p.stockQuantity === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    Saída
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal({ product: p, type: 'AJUSTE' })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-100 transition"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Ajuste
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movement Audit History */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Registro Geral de Auditoria ({filteredMovements.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Histórico com carimbo de data/hora, saldo prévio, quantidade e justificativa
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar produto ou justificativa..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={historyType}
              onChange={(e) => setHistoryType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">Todos os Tipos de Operação</option>
              <option value="ENTRADA">Apenas Entradas</option>
              <option value="SAIDA">Apenas Saídas</option>
              <option value="AJUSTE">Apenas Balanços / Ajustes</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Qtd. Movimentada</th>
                <th className="py-3 px-4">Saldo Anterior → Novo</th>
                <th className="py-3 px-4">Motivo / Referência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Nenhum registro de movimentação encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {m.productName}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <MovementTypeBadge type={m.type} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {m.type === 'ENTRADA' ? `+${m.quantity}` : m.type === 'SAIDA' ? `-${m.quantity}` : `${m.quantity}`} un.
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      <span className="text-slate-500">{m.previousStock} un.</span>
                      <span className="mx-1.5 text-slate-400">→</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{m.newStock} un.</strong>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-sm truncate">
                      {m.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Movement Modal */}
      <StockMovementModal
        isOpen={activeModal.product !== null}
        onClose={() => setActiveModal({ product: null, type: 'ENTRADA' })}
        productId={activeModal.product?.id}
        productName={activeModal.product?.name}
        currentStock={activeModal.product?.stockQuantity}
        defaultType={activeModal.type}
        onConfirm={registerMovement}
      />
    </main>
  )
}
