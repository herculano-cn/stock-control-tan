import type { MovementType } from '../types/stock'
import { ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react'

export function MovementTypeBadge({ type }: { type: MovementType }) {
  if (type === 'ENTRADA') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        Entrada
      </span>
    )
  }

  if (type === 'SAIDA') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 shadow-xs">
        <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        Saída
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60 shadow-xs">
      <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      Ajuste
    </span>
  )
}
