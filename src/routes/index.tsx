import { createFileRoute, Link } from '@tanstack/react-router'
import { useStock } from '../context/useStock'
import { StockBadge } from '../components/StockBadge'
import { MovementTypeBadge } from '../components/MovementTypeBadge'
import { StockMovementModal } from '../components/StockMovementModal'
import { useState } from 'react'
import type { Product } from '../types/stock'
import {
  Package,
  Boxes,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  ArrowUpDown,
  History,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { products, movements, summary, registerMovement } = useStock()
  const [modalProduct, setModalProduct] = useState<Product | null>(null)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const criticalProducts = products.filter(
    (p) => p.stockQuantity <= p.minStock
  )

  const recentMovements = movements.slice(0, 6)

  // Calculated overall stock health ratio
  const totalMinRequired = products.reduce((acc, p) => acc + p.minStock, 0)
  const healthPercentage = totalMinRequired > 0 
    ? Math.min(100, Math.round((summary.totalItems / totalMinRequired) * 100))
    : 100

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-10 text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/30">
        <div className="absolute -right-16 -top-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-64 h-64 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Painel Operacional em Tempo Real
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Visão Geral do Estoque
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Monitore saldos físicos, produtos em nível crítico, valuation do estoque e rastreabilidade total de movimentações.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/products/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition no-underline"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              Novo Produto
            </Link>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700/90 text-white font-semibold text-xs border border-white/15 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition no-underline"
            >
              <ArrowUpDown className="w-4 h-4 text-indigo-200" />
              Balanço Rápido
            </Link>
          </div>
        </div>

        {/* Global Stock Capacity Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 space-y-2">
            <div className="flex justify-between text-xs text-indigo-200 font-medium">
              <span>Nível de Cobertura Global vs Estoque Mínimo Recomendado</span>
              <span className="font-bold text-white">{healthPercentage}% da meta segura</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  healthPercentage < 50
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                    : healthPercentage < 80
                      ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                      : 'bg-gradient-to-r from-emerald-400 to-teal-300'
                }`}
                style={{ width: `${Math.min(100, healthPercentage)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-indigo-200 justify-start md:justify-end">
            <div>
              <span className="block text-slate-400 text-[10px] uppercase">Mínimo Global</span>
              <span className="font-bold text-white text-sm">{totalMinRequired} un.</span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <span className="block text-slate-400 text-[10px] uppercase">Saldo Atual</span>
              <span className="font-bold text-white text-sm">{summary.totalItems} un.</span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Produtos Ativos
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary.totalProducts}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
            SKUs cadastrados no catálogo
          </div>
        </div>

        {/* Physical Stock Items */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Unidades em Saldo
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {summary.totalItems}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
            Itens físicos em armazém
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Patrimônio em Estoque
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalValue)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Valoração por preço unitário
          </div>
        </div>

        {/* Critical Stock */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Alertas de Estoque
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/60">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {summary.lowStockCount + summary.outOfStockCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{summary.outOfStockCount} esgotados</span>
            <span>•</span>
            <span>{summary.lowStockCount} abaixo do mín.</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Critical Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Critical Stock Replenishment List */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Reposição Urgente & Nível Crítico ({criticalProducts.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Produtos que atingiram ou estão abaixo da margem de segurança configurada
                </p>
              </div>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 no-underline"
            >
              Catálogo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {criticalProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-base">
                Estoque saudável e abastecido!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Nenhum produto cadastrado está abaixo do nível mínimo de reposição no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {criticalProducts.map((p) => {
                const ratio = p.minStock > 0 ? Math.min(100, Math.round((p.stockQuantity / p.minStock) * 100)) : 0
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {p.name}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            {p.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {p.description || 'Sem descrição cadastrada'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <StockBadge quantity={p.stockQuantity} minStock={p.minStock} showNumbers />
                        <button
                          type="button"
                          onClick={() => setModalProduct(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-600/30 transition flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Repor
                        </button>
                      </div>
                    </div>

                    {/* Progress bar of current vs min stock */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          Saldo: <strong className="text-slate-900 dark:text-white">{p.stockQuantity} un.</strong> (Mínimo: {p.minStock} un.)
                        </span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {p.stockQuantity === 0 ? 'Sem estoque' : `${ratio}% do estoque mínimo`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            p.stockQuantity === 0
                              ? 'bg-rose-500'
                              : ratio <= 50
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(5, ratio)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Right Column: Recent Activity Log */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Últimas Ações
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Movimentações recentes
                  </p>
                </div>
              </div>
              <Link
                to="/inventory"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 no-underline"
              >
                Ver Todas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentMovements.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhuma movimentação registrada até o momento.
                </div>
              ) : (
                recentMovements.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                        {m.productName}
                      </span>
                      <MovementTypeBadge type={m.type} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Qtd:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {m.type === 'ENTRADA' ? `+${m.quantity}` : m.type === 'SAIDA' ? `-${m.quantity}` : `${m.quantity}`} un.
                        </strong>
                      </span>
                      <span>
                        Saldo: {m.previousStock} → <strong className="text-slate-900 dark:text-white">{m.newStock}</strong>
                      </span>
                    </div>
                    {m.reason && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1">
                        "{m.reason}"
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(m.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              to="/inventory"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition no-underline"
            >
              <History className="w-3.5 h-3.5" />
              Abrir Registro Geral de Auditoria
            </Link>
          </div>
        </section>
      </div>

      {/* Movement Modal */}
      <StockMovementModal
        isOpen={modalProduct !== null}
        onClose={() => setModalProduct(null)}
        productId={modalProduct?.id}
        productName={modalProduct?.name}
        currentStock={modalProduct?.stockQuantity}
        defaultType="ENTRADA"
        onConfirm={registerMovement}
      />
    </main>
  )
}
