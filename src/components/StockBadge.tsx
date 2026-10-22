interface StockBadgeProps {
  quantity: number
  minStock: number
  showNumbers?: boolean
}

export function StockBadge({ quantity, minStock, showNumbers = false }: StockBadgeProps) {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        Esgotado {showNumbers ? `(${quantity})` : ''}
      </span>
    )
  }

  if (quantity <= minStock) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Baixo Estoque {showNumbers ? `(${quantity}/${minStock})` : ''}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Em Estoque {showNumbers ? `(${quantity})` : ''}
    </span>
  )
}
