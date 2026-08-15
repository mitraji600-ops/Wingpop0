import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth-provider"

export function Navbar() {
  const { user } = useAuth()

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
      <nav className="max-w-5xl mx-auto glass-card-light dark:glass-card rounded-2xl md:rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto shadow-sm">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
            W
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">Wingpop</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Link 
                href="/feed" 
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full transition-colors shadow-sm"
              >
                Go to Feed
              </Link>
            ) : (
              <>
                <Link 
                  href="/signup" 
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full transition-colors shadow-sm"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
}
