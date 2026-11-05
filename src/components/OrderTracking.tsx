import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, FastForward, PackageSearch, Search } from 'lucide-react'
import { ORDER_STATUSES } from '../types/stock'
import type { Order } from '../types/stock'
import { advanceOrderApi, fetchOrderApi } from '../services/stockService'

const DEFAULT_ORDER_ID = 'CS-2048'

export function OrderTracking() {
  const [order, setOrder] = useState<Order | null>(null)
  const [query, setQuery] = useState(DEFAULT_ORDER_ID)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOrder = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const found = await fetchOrderApi(id)
      if (found) {
        setOrder(found)
      } else {
        setOrder(null)
        setError(`Pedido "${id.trim()}" não encontrado. Verifique o número e tente novamente.`)
      }
    } catch {
      setOrder(null)
      setError('Não foi possível consultar o pedido no momento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrder(DEFAULT_ORDER_ID)
  }, [loadOrder])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setOrder(null)
      setError('Informe o número do pedido para buscar.')
      return
    }
    void loadOrder(query)
  }

  const handleAdvance = async () => {
    if (!order) return
    setAdvancing(true)
    setError(null)
    try {
      const updated = await advanceOrderApi(order.id)
      if (updated) {
        setOrder(updated)
      } else {
        setOrder(null)
        setError(`Pedido "${order.id}" não encontrado.`)
      }
    } catch {
      setError('Não foi possível avançar o status do pedido. Tente novamente.')
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <section
      aria-labelledby="order-tracking-title"
      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <h2 id="order-tracking-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Acompanhe seu pedido
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Veja o andamento em tempo real, sem precisar ligar para a central
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2" role="search">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Número do pedido (ex.: CS-2048)"
            aria-label="Buscar pedido"
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-56"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Buscar pedido
          </button>
        </form>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs p-3">
          {error}
        </div>
      )}

      {loading && !order && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Carregando pedido...</p>
      )}

      {order && (
        <div className="space-y-5" data-testid="order-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="block text-[10px] uppercase text-slate-400">Pedido</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-lg">{order.id}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                {order.status}
              </span>
              <button
                type="button"
                onClick={handleAdvance}
                disabled={advancing}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition flex items-center gap-1.5"
              >
                <FastForward className="w-3.5 h-3.5" />
                Avançar status do pedido
              </button>
            </div>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {ORDER_STATUSES.map((label, index) => {
              const done = index < order.statusIndex
              const current = index === order.statusIndex
              return (
                <li
                  key={label}
                  aria-current={current ? 'step' : undefined}
                  className="flex sm:flex-col items-center sm:items-start gap-3"
                >
                  <span
                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                      done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : current
                          ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-500/20'
                          : 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-400'
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : index + 1}
                  </span>
                  <span
                    className={`text-sm ${
                      current
                        ? 'font-bold text-slate-900 dark:text-white'
                        : done
                          ? 'font-medium text-slate-700 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </section>
  )
}
