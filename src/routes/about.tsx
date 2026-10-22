import { createFileRoute } from '@tanstack/react-router'
import { Boxes, ShieldCheck, Zap, Database } from 'lucide-react'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn space-y-8">
      <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-4">
          <Boxes className="w-4 h-4" />
          <span>Sobre o StockControl Pro</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Sistema Profissional de Controle de Estoque
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          O StockControl foi projetado para operações que necessitam de rastreabilidade precisa,
          gestão de limites de reposição e conferência física rápida de inventário.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
            <h3 className="font-bold text-xs uppercase text-slate-900 dark:text-white">Alta Performance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Desenvolvido com TanStack Start, React 19 e Tailwind CSS.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
            <h3 className="font-bold text-xs uppercase text-slate-900 dark:text-white">Auditoria Completa</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Livro de registros de todas as entradas, saídas e ajustes de balanço.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-2" />
            <h3 className="font-bold text-xs uppercase text-slate-900 dark:text-white">Segurança de Saldo</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Validação estrita impedindo saídas além do estoque disponível.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
