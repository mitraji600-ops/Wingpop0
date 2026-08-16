"use client"

import * as React from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, doc, getDoc, limit } from "firebase/firestore"
import { addComment, addNotification } from "@/lib/social"
import { MoreHorizontal, Flag } from "lucide-react"
import { ReportModal } from "./report-modal"
import { formatDistanceToNow } from "date-fns"
import { User } from "firebase/auth"
import { UserProfile } from "./auth-provider"
import { CommentItemData } from "./post-card"

export function Comments({ 
  targetId, 
  targetType, 
  authorId, 
  currentUser 
}: { 
  targetId: string, 
  targetType: "posts" | "reels", 
  authorId: string, 
  currentUser: User | null
}) {
  const [comments, setComments] = React.useState<CommentItemData[]>([])
  const [commentText, setCommentText] = React.useState("")

  React.useEffect(() => {
    const q = query(collection(db, targetType, targetId, "comments"), orderBy("createdAt", "desc"), limit(50))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as CommentItemData))
    })
    return () => unsubscribe()
  }, [targetId, targetType])

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !currentUser) return
    try {
      await addComment(targetType, targetId, currentUser.uid, commentText)
      addNotification(authorId, currentUser.uid, "comment", targetId)
      setCommentText("")
    } catch (err) {
      alert("Failed to post comment")
    }
  }

  return (
    <div className="px-4 pb-4 border-t border-black/5 dark:border-white/5 pt-4">
      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-xs text-center text-slate-500">No comments yet. Be the first!</p>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} currentUser={currentUser} />
          ))
        )}
      </div>
      {currentUser && (
        <form onSubmit={submitComment} className="flex items-center gap-2">
          <input 
            type="text" 
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button type="submit" disabled={!commentText.trim()} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 disabled:opacity-50">
            Post
          </button>
        </form>
      )}
    </div>
  )
}

function CommentItem({ comment, currentUser }: { comment: CommentItemData, currentUser: User | null }) {
  const [author, setAuthor] = React.useState<UserProfile | null>(null)
  const [showMenu, setShowMenu] = React.useState(false)
  const [showReport, setShowReport] = React.useState(false)

  React.useEffect(() => {
    getDoc(doc(db, "users", comment.authorId)).then(snap => {
      if (snap.exists()) setAuthor(snap.data() as UserProfile)
    })
  }, [comment.authorId])

  return (
    <div className="flex gap-3 items-start group">
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden shrink-0">
        {author?.photoURL && <img src={author.photoURL} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{author?.username || "..."}</span>
          <span className="text-xs text-slate-500">
            {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : "Just now"}
          </span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 break-words">{comment.content}</p>
      </div>

      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-6 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-10 py-1">
            <button 
              onClick={() => {
                if (!currentUser) return alert("Please sign in")
                setShowReport(true)
                setShowMenu(false)
              }} 
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
            >
              <Flag className="w-3 h-3" /> Report
            </button>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetId={comment.id}
        targetType="comments"
        reporterId={currentUser?.uid || ""}
      />
    </div>
  )
}
