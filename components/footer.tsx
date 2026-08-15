import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/5 py-12 mt-20 relative z-10">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            W
          </div>
          <span className="font-semibold text-sm text-slate-800 dark:text-white">Wingpop</span>
          <span className="text-xs text-slate-500 ml-2">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Community Guidelines</Link>
          <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
