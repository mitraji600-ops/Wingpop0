"use client"

import * as React from "react"
import Link from "next/link"
import { auth } from "@/lib/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { Loader2, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      let message = "An error occurred. Please try again."
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
         // Security best practice: don't reveal if email exists. Just show success.
         setSuccess(true)
         setIsLoading(false)
         return
      }
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
        
        <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Reset Password
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {success ? (
           <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm text-center">
              If an account exists for that email, we have sent password reset instructions. Please check your inbox.
           </div>
        ) : (
           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-1">
               <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">Email address</label>
               <input 
                 name="email"
                 type="email" 
                 required
                 autoComplete="email"
                 placeholder="jane@example.com"
                 className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
               />
             </div>

             <button 
               type="submit" 
               disabled={isLoading}
               className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-md"
             >
               {isLoading ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
               ) : (
                 "Send Reset Link"
               )}
             </button>
           </form>
        )}
      </div>
    </main>
  )
}
