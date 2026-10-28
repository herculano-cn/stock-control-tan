import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusCircle, Trash2, Wand2, PackageCheck, CheckCircle2, XCircle } from 'lucide-react'
import { useStock } from '../../context/useStock'
import {
  fetchPurchaseOrdersApi,
  fetchSuggestionsApi,
  createPurchaseOrderApi,
  updatePurchaseOrderStatusApi,
} from '../../services/stockService'
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  ReplenishmentSuggestion,
} from '../../types/stock'

export const Route = createFileRoute('/purchase-orders/')({
  component: PurchaseOrdersPage,
})

const STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  RASCUNHO: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  CONFIRMADA: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900/60',
  RECEBIDA: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60',
  CANCELADA: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/60',
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

interface DraftItem {
  productId: string
  quantity: number
}

function PurchaseOrdersPage() {
  const { products, reloadData } = useStock()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suggestions, setSuggestions] = useState<ReplenishmentSuggestion[]>([])
  const [supplier, setSupplier] = useState('')
  const [items, setItems] = useState<DraftItem[]>([{ productId: '', quantity: 1 }])
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([fetchPurchaseOrdersApi(), fetchSuggestionsApi()])
      setOrders(o)
      setSuggestions(s)
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Falha ao carregar pedidos' })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const draftTotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        const p = products.find((x) => x.id === it.productId)
        return sum + (p ? p.price * (Number(it.quantity) || 0) : 0)
      }, 0),
    [items, products]
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const valid = items.filter((i) => i.productId)
    const res = await createPurchaseOrderApi({
      supplier,
      items: valid.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
    })
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || 'Erro ao criar pedido' })
      return
    }
    setMessage({ type: 'ok', text: `Pedido ${res.order?.code} criado como rascunho.` })
    setSupplier('')
    setItems([{ productId: '', quantity: 1 }])
    await refresh()
  }

  const applySuggestions = () => {
    if (suggestions.length === 0) return
    setItems(suggestions.map((s) => ({ productId: s.productId, quantity: s.suggestedQuantity })))
    setMessage({ type: 'ok', text: 'Itens preenchidos com a sugestão de reposição. Informe o fornecedor.' })
  }

  const changeStatus = async (order: PurchaseOrder, status: PurchaseOrderStatus) => {
    setBusyId(order.id)
    const res = await updatePurchaseOrderStatusApi(order.id, status)
    setBusyId(null)
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || 'Erro ao atualizar status' })
    } else {
      setMessage({ type: 'ok', text: `Pedido ${order.code} agora está ${status}.` })
    }
    await refresh()
    // Stock changed on receipt: refresh products/movements so dashboard & inventory update immediately.
    if (status === 'RECEBIDA') await reloadData()
  }

  const inputCls =
    'px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm'

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Ordens de Compra
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Crie pedidos a fornecedores e receba mercadorias atualizando o estoque automaticamente.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Suggestions */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-bold text-slate-900 dark:text-white">Sugestão de reposição</h2>
          <button
            type="button"
            onClick={applySuggestions}
            disabled={suggestions.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40"
          >
            <Wand2 className="w-4 h-4" />
            Usar sugestão no novo pedido
          </button>
        </div>
        {suggestions.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum produto abaixo do estoque mínimo.</p>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Produto</th>
                <th>Saldo</th>
                <th>Mínimo</th>
                <th>Sugerido</th>
                <th>Custo estimado</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => (
                <tr key={s.productId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 font-semibold text-slate-900 dark:text-white">
                    {s.productName}{' '}
                    <span className="text-xs font-normal text-amber-600">
                      {s.level === 'ESGOTADO' ? 'Esgotado' : 'Crítico'}
                    </span>
                  </td>
                  <td>{s.currentStock}</td>
                  <td>{s.minStock}</td>
                  <td className="font-bold">{s.suggestedQuantity} un.</td>
                  <td>{formatCurrency(s.estimatedCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* New order */}
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
      >
        <h2 className="font-bold text-slate-900 dark:text-white">Novo pedido</h2>
        <input
          className={`${inputCls} w-full sm:w-96`}
          placeholder="Fornecedor"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          required
        />
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <select
              className={`${inputCls} flex-1`}
              value={it.productId}
              onChange={(e) =>
                setItems(items.map((x, i) => (i === idx ? { ...x, productId: e.target.value } : x)))
              }
            >
              <option value="">Selecione o produto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatCurrency(p.price)})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className={`${inputCls} w-24`}
              value={it.quantity}
              onChange={(e) =>
                setItems(items.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x)))
              }
            />
            <button
              type="button"
              title="Remover item"
              onClick={() => setItems(items.length > 1 ? items.filter((_, i) => i !== idx) : items)}
              className="p-2 text-rose-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setItems([...items, { productId: '', quantity: 1 }])}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600"
          >
            <PlusCircle className="w-4 h-4" />
            Adicionar item
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Total: <strong className="text-slate-900 dark:text-white">{formatCurrency(draftTotal)}</strong>
            </span>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Criar pedido
            </button>
          </div>
        </div>
      </form>

      {/* Orders list */}
      <section className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma ordem de compra cadastrada.</p>
        ) : (
          orders.map((o) => (
            <article
              key={o.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-900 dark:text-white">{o.code}</span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[o.status]}`}
                  >
                    {o.status}
                  </span>
                  <span className="text-sm text-slate-500">{o.supplier}</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className="text-slate-900 dark:text-white">{formatCurrency(o.total)}</strong>
                  {o.status === 'RASCUNHO' && (
                    <button
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() => changeStatus(o, 'CONFIRMADA')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar
                    </button>
                  )}
                  {(o.status === 'RASCUNHO' || o.status === 'CONFIRMADA') && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        onClick={() => changeStatus(o, 'RECEBIDA')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200"
                      >
                        <PackageCheck className="w-4 h-4" />
                        Receber
                      </button>
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        onClick={() => changeStatus(o, 'CANCELADA')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
              <ul className="mt-3 text-sm text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800">
                {o.items.map((i) => (
                  <li key={i.id} className="py-1.5 flex justify-between">
                    <span>
                      {i.quantity} × {i.productName}
                    </span>
                    <span>{formatCurrency(i.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </section>
    </main>
  )
}
