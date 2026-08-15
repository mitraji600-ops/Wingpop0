"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth, googleProvider, db } from "@/lib/firebase"
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore"
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function SignupPage() {
  const { user, loading } = useAuth()
  const [isLogin, setIsLogin] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && user) {
      router.replace("/feed")
    }
  }, [user, loading, router])

  const handleGoogle = async () => {
    try {
      setIsLoading(true)
      setError("")
      const result = await signInWithPopup(auth, googleProvider)
      
      // Check if user already exists
      const userRef = doc(db, "users", result.user.uid)
      const userSnap = await getDoc(userRef)
      
      if (!userSnap.exists()) {
        const baseUsername = result.user.displayName?.replace(/\s+/g, '').toLowerCase() || 'creator'
        const username = `${baseUsername}${Math.floor(Math.random() * 10000)}`
        
        const batch = writeBatch(db)
        batch.set(userRef, {
          uid: result.user.uid,
          displayName: result.user.displayName || 'Creator',
          username,
          photoURL: result.user.photoURL || '',
          theme: "system",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        batch.set(doc(db, "usernames", username), { uid: result.user.uid })
        await batch.commit()
      }
      
      router.push("/feed")
    } catch (err: any) {
      setError("Failed to sign in with Google. Please try again.")
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const displayName = formData.get("displayName") as string
    const usernameInput = formData.get("username") as string
    const username = usernameInput ? usernameInput.toLowerCase().replace(/[^a-z0-9_]/g, '') : ''

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
        router.push("/feed")
      } else {
        // Pre-check username availability
        const usernameSnap = await getDoc(doc(db, "usernames", username))
        if (usernameSnap.exists()) {
          setError("This username is already taken.")
          setIsLoading(false)
          return
        }

        const userCred = await createUserWithEmailAndPassword(auth, email, password)
        
        const batch = writeBatch(db)
        batch.set(doc(db, "users", userCred.user.uid), {
          uid: userCred.user.uid,
          displayName,
          username,
          photoURL: '',
          theme: "system",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        batch.set(doc(db, "usernames", username), { uid: userCred.user.uid })
        
        try {
          await batch.commit()
          router.push("/feed")
        } catch (batchErr) {
          console.error("Batch write failed", batchErr)
          setError("Failed to secure username. Please try another one.")
        }
      }
    } catch (err: any) {
      console.error(err)
      let message = "An error occurred. Please try again."
      if (err.code === "auth/email-already-in-use") message = "This email is already registered."
      if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") message = "Invalid email or password."
      if (err.code === "auth/weak-password") message = "Password should be at least 6 characters."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen" />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 group z-20">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
          W
        </div>
      </Link>

      <div className="w-full max-w-md glass-card-light dark:glass-card rounded-3xl p-8 shadow-xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {isLogin ? "Welcome back" : "Create your Wingpop account"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          {isLogin ? "Enter your credentials to access your account." : "Join the premium community for visual creators."}
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">Display Name</label>
                <input 
                  name="displayName"
                  type="text" 
                  required
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">Username</label>
                <input 
                  name="username"
                  type="text" 
                  required
                  pattern="[a-zA-Z0-9_]+"
                  title="Only letters, numbers, and underscores allowed"
                  placeholder="@janedoe"
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">Email</label>
            <input 
              name="email"
              type="email" 
              required
              autoComplete="email"
              placeholder="jane@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
              {isLogin && (
                <Link href="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 pr-10"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="pt-2 pb-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white/50 dark:bg-black/20 dark:border-white/10" />
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  I agree to the <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link> and Terms of Service, and confirm I am eligible to use Wingpop.
                </span>
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-md"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-slate-200 dark:before:bg-white/10 after:h-px after:flex-1 after:bg-slate-200 dark:after:bg-white/10">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">OR</span>
        </div>

        <button 
          onClick={handleGoogle}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline focus:outline-none"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  )
}
