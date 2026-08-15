"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { deleteUser, signOut } from "firebase/auth"
import { doc, deleteDoc, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { Settings as SettingsIcon, LogOut, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion, AnimatePresence } from "motion/react"

export default function SettingsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/signup")
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/")
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setIsDeleting(true)
    
    try {
      // Note: First call backend to delete all user posts, comments, likes, media files, and profile
      const idToken = await user.getIdToken()
      const res = await fetch("/api/users/delete", {
          method: "DELETE",
          headers: {
              "Authorization": `Bearer ${idToken}`
          }
      })
      
      if (!res.ok) {
          throw new Error("Failed to delete user data")
      }
      
      // Delete Firebase Auth User
      await deleteUser(user)
      
      // Redirect handled by AuthProvider/effect automatically
      router.push("/")
    } catch (error: any) {
      console.error(error)
      // Usually "auth/requires-recent-login"
      if (error.code === "auth/requires-recent-login") {
        alert("For security reasons, please sign out and sign in again before deleting your account.")
      } else {
        alert("Failed to delete account. Please try again.")
      }
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col pt-24 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen" />
      
      <Navbar />

      <div className="max-w-2xl mx-auto w-full z-10 mb-12">
        <header className="mb-8 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-indigo-500" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        </header>

        <div className="glass-card-light dark:glass-card rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Appearance</h2>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Theme Preference</span>
              <ThemeToggle />
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Account</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Email Address</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Username</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">@{profile?.username}</div>
                </div>
              </div>
            </div>
          </section>
          
          <section className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 pb-2">Danger Zone</h2>
            
            <div className="flex flex-col gap-4 items-start">
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-slate-200/50 hover:bg-slate-300/50 dark:bg-white/5 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/10"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>

              <button 
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors border border-red-200 dark:border-red-500/20"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-xl relative border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Delete Account</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove your profile data from our servers.
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete My Account"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
