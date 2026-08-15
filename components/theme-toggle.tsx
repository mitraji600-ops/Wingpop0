"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // eslint-disable-next-line
    setMounted(true)
  }, [])

  // Sync theme with Firestore when user logs in
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists() && docSnap.data().theme) {
            const userTheme = docSnap.data().theme
            setTheme(userTheme)
          }
        } catch (error) {
          console.error("Error fetching theme preference:", error)
        }
      }
    })
    return () => unsubscribe()
  }, [setTheme])

  const toggleTheme = async () => {
    const newTheme = resolvedTheme === "light" ? "dark" : "light"
    setTheme(newTheme)
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), { theme: newTheme }, { merge: true })
      } catch (error) {
        console.error("Error saving theme preference:", error)
      }
    }
  }

  if (!mounted) {
    return (
      <button className="p-2 rounded-full glass-card-light dark:glass-card text-slate-800 dark:text-slate-200 w-10 h-10 flex items-center justify-center">
        <span className="sr-only">Toggle theme</span>
      </button>
    )
  }

  return (
    <button 
      onClick={toggleTheme} 
      className="p-2 rounded-full glass-card-light dark:glass-card text-slate-800 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors w-10 h-10 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  )
}
