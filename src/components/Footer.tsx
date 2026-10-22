import { Boxes, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40 py-8 px-4 text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center">
            <Boxes className="w-3 h-3" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200">StockControl Pro</span>
          <span>•</span>
          <span>Gestão Inteligente de Estoque, Produtos e Inventário Físico</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Construído com TanStack Start, React 19 & Tailwind CSS</span>
        </div>
      </div>
    </footer>
  )
}
