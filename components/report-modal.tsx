"use client"

import * as React from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { X, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

export function ReportModal({ 
  isOpen, 
  onClose, 
  targetId, 
  targetType, 
  reporterId 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  targetId: string, 
  targetType: string, 
  reporterId: string 
}) {
  const [reason, setReason] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "reports"), {
        targetId,
        targetType,
        reason,
        reporterId,
        createdAt: serverTimestamp()
      })
      alert("Report submitted successfully. Our team will review it.")
      onClose()
      setReason("")
    } catch (err) {
      alert("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
     <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-xl relative border border-slate-200 dark:border-white/10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Report Content</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reason for reporting
                </label>
                <textarea
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Please describe why this content is inappropriate..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white resize-none h-32"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Report"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
