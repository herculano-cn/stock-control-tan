import { Link } from '@tanstack/react-router'
import { useStock } from '../context/useStock'
import ThemeToggle from './ThemeToggle'
import {
  Boxes,
  LayoutDashboard,
  Package,
  History,
  RotateCcw,
} from 'lucide-react'

export default function Header() {
  const { summary, resetAll } = useStock()

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const alertCount = summary.lowStockCount + summary.outOfStockCount

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 group no-underline"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-sm shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  StockControl
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                    Pro
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Controle de Estoque & Balanço
                </span>
              </div>
            </Link>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                activeProps={{
                  className:
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 transition-colors',
                }}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/products"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                activeProps={{
                  className:
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 transition-colors',
                }}
              >
                <Package className="w-4 h-4" />
                <span>Produtos</span>
              </Link>
              <Link
                to="/inventory"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                activeProps={{
                  className:
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 transition-colors',
                }}
              >
                <History className="w-4 h-4" />
                <span>Inventário & Auditoria</span>
              </Link>
            </nav>
          </div>

          {/* Quick Stats Pill + Actions + Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Value pill */}
            <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Disponível:{' '}
                <strong className="text-slate-900 dark:text-slate-100 font-bold">
                  {summary.totalItems} un.
                </strong>
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-slate-500 dark:text-slate-400">
                Valor Total:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatCurrency(summary.totalValue)}
                </strong>
              </span>

              {alertCount > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <Link
                    to="/products"
                    search={{ status: 'alert' }}
                    className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 hover:underline no-underline"
                    title={`${alertCount} produtos precisam de reposição`}
                  >
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    <span>{alertCount} alertas</span>
                  </Link>
                </>
              )}
            </div>

            {/* Reset mock data */}
            <button
              onClick={async () => {
                if (window.confirm('Deseja restaurar os dados de demonstração originais do estoque?')) {
                  await resetAll()
                }
              }}
              title="Restaurar dados de exemplo originais"
              type="button"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            activeProps={{
              className: 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
            }}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/products"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            activeProps={{
              className: 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
            }}
          >
            <Package className="w-4 h-4" />
            <span>Produtos</span>
          </Link>
          <Link
            to="/inventory"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            activeProps={{
              className: 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
            }}
          >
            <History className="w-4 h-4" />
            <span>Inventário</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
