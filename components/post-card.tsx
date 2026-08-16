"use client"

import * as React from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, orderBy, onSnapshot, getDocs, deleteDoc, getCountFromServer } from "firebase/firestore"
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Share2, ChevronLeft, ChevronRight, Trash2, Flag } from "lucide-react"
import { toggleLike, toggleSave, addNotification, reportContent, addComment } from "@/lib/social"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { ReportModal } from "./report-modal"
import { Comments } from "./comments"
import { X } from "lucide-react"
import { Image as IKImage, Video as IKVideo } from "@imagekit/next"
import { formatDistanceToNow } from "date-fns"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { User } from "firebase/auth"
import { UserProfile } from "./auth-provider"
import { Timestamp } from "firebase/firestore"

export interface PostItem {
  id: string
  authorId: string
  caption?: string
  url?: string
  videoUrl?: string
  fileType?: string
  duration?: number
  mediaCount?: number
  createdAt?: Timestamp
}

export interface MediaItem {
  url: string
  mimeType?: string
  imageKitFileId?: string
}

export interface CommentItemData {
  id: string
  authorId: string
  content: string
  createdAt?: Timestamp
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""

export function PostCard({ post, currentUser }: { post: PostItem, currentUser: User | null }) {
  const [author, setAuthor] = React.useState<UserProfile | null>(null)
  const [media, setMedia] = React.useState<MediaItem[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  
  const [liked, setLiked] = React.useState(false)
  const [likeCount, setLikeCount] = React.useState(0)
  const [saved, setSaved] = React.useState(false)
  
  const [showComments, setShowComments] = React.useState(false)
  const [comments, setComments] = React.useState<CommentItemData[]>([])
  const [commentText, setCommentText] = React.useState("")
  
  const [showMenu, setShowMenu] = React.useState(false)
  const [isDeleted, setIsDeleted] = React.useState(false)
  const [showReport, setShowReport] = React.useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false)

  const isPost = post.duration === undefined // Quick hack to distinguish post vs reel
  const targetType = isPost ? "posts" : "reels"

  // Fetch author
  React.useEffect(() => {
    const fetchAuthor = async () => {
      const authorSnap = await getDoc(doc(db, "users", post.authorId))
      if (authorSnap.exists()) setAuthor(authorSnap.data() as UserProfile)
    }
    fetchAuthor()
  }, [post.authorId])

  // Fetch media if it's a multi-image post
  React.useEffect(() => {
    if (isPost && post.mediaCount && post.mediaCount > 1) {
      const fetchMedia = async () => {
        const mediaSnap = await getDocs(query(collection(db, "posts", post.id, "media"), orderBy("order", "asc")))
        setMedia(mediaSnap.docs.map(d => d.data() as MediaItem))
      }
      fetchMedia()
    }
  }, [post.id, post.mediaCount, isPost])

  // Derive active media
  const activeMedia = media.length > 0 
    ? media 
    : [{ url: post.url || post.videoUrl, mimeType: post.fileType }]


  // Real-time Like/Save status if logged in
  React.useEffect(() => {
    if (!currentUser) return
    
    const unsubscribeLike = onSnapshot(doc(db, targetType, post.id, "likes", currentUser.uid), (doc) => {
      setLiked(doc.exists())
    })
    
    const saveType = isPost ? "saved_posts" : "saved_reels"
    const unsubscribeSave = onSnapshot(doc(db, "users", currentUser.uid, saveType, post.id), (doc) => {
      setSaved(doc.exists())
    })

    // Fetch initial count
    getCountFromServer(collection(db, targetType, post.id, "likes")).then(snap => {
      setLikeCount(snap.data().count)
    })

    return () => {
      unsubscribeLike()
      unsubscribeSave()
    }
  }, [post.id, currentUser, targetType, isPost])

  // Comments subscription
  React.useEffect(() => {
    if (!showComments) return
    const q = query(collection(db, targetType, post.id, "comments"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as CommentItemData))
    })
    return () => unsubscribe()
  }, [post.id, showComments, targetType])

  const handleLike = async () => {
    if (!currentUser) return alert("Please sign in")
    const prevLiked = liked
    const prevCount = likeCount
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
    try {
      await toggleLike(targetType, post.id, currentUser.uid, prevLiked)
      if (!prevLiked) addNotification(post.authorId, currentUser.uid, "like", post.id)
    } catch (err) {
      setLiked(prevLiked)
      setLikeCount(prevCount)
    }
  }

  const handleSave = async () => {
    if (!currentUser) return alert("Please sign in")
    const prevSaved = saved
    setSaved(!saved)
    try {
      await toggleSave(currentUser.uid, isPost ? "saved_posts" : "saved_reels", post.id, prevSaved)
    } catch (err) {
      setSaved(prevSaved)
    }
  }

  const handleDelete = async () => {
    if (!currentUser) return alert("Please sign in")
    if (!confirm("Are you sure you want to delete this?")) return
    try {
      const token = await currentUser.getIdToken()
      await fetch(`/api/media/delete?targetType=${isPost ? "post" : "reel"}&targetId=${post.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      setIsDeleted(true)
    } catch (err) {
      alert("Failed to delete")
    }
  }

  const handleReport = () => {
    if (!currentUser) return alert("Please sign in")
    setShowReport(true)
    setShowMenu(false)
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !currentUser) return
    try {
      await addComment(targetType, post.id, currentUser.uid, commentText)
      addNotification(post.authorId, currentUser.uid, "comment", post.id)
      setCommentText("")
    } catch (err) {
      alert("Failed to post comment")
    }
  }

  if (isDeleted) return null

  const currentMedia = activeMedia[currentIndex]

  return (
    <article className="glass-card-light dark:glass-card rounded-3xl overflow-hidden mb-8 shadow-sm">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={author ? `/profile/${author.username}` : "#"} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden shrink-0">
              {author?.photoURL && <img src={author.photoURL} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:underline text-sm">
                {author?.displayName || "Loading..."}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : "Just now"}
              </p>
            </div>
          </Link>
        </div>
        
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-10 py-2">
              {currentUser?.uid === post.authorId ? (
                <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              ) : (
                <button onClick={handleReport} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2">
                  <Flag className="w-4 h-4" /> Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Carousel */}
      <div className="relative bg-black/5 dark:bg-black/20 aspect-square sm:aspect-[4/5] flex items-center justify-center overflow-hidden group">
        <button 
          onClick={() => setIsLightboxOpen(true)}
          className="absolute inset-0 z-10 w-full h-full cursor-zoom-in bg-transparent" 
          aria-label="View full screen"
        />
        {currentMedia && (
          currentMedia.mimeType?.startsWith("video") ? (
            <IKVideo 
              urlEndpoint={urlEndpoint} 
              src={currentMedia.url || ""}
              controls 
              className="w-full h-full object-contain" 
            />
          ) : (
            <IKImage 
              urlEndpoint={urlEndpoint} 
              src={currentMedia.url || ""}
              transformation={[{ width: "800" }]} 
              className="w-full h-full object-cover" 
              alt="Post content"
            />
          )
        )}
        
        {/* Carousel Controls */}
        {activeMedia.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button 
                onClick={() => setCurrentIndex(i => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {currentIndex < activeMedia.length - 1 && (
              <button 
                onClick={() => setCurrentIndex(i => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {activeMedia.map((_, i) => (
                <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === currentIndex ? "bg-white scale-125" : "bg-white/50")} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="flex items-center gap-1.5 group">
            <motion.div
              whileTap={{ scale: 0.8 }}
              animate={liked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart className={cn("w-6 h-6 transition-colors", liked ? "fill-red-500 text-red-500" : "text-slate-700 dark:text-slate-300 group-hover:text-red-500")} />
            </motion.div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{likeCount > 0 && likeCount}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 group">
            <MessageCircle className="w-6 h-6 text-slate-700 dark:text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </button>
          <button className="flex items-center gap-1.5 group">
            <Share2 className="w-6 h-6 text-slate-700 dark:text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </button>
        </div>
        <button onClick={handleSave} className="group">
          <Bookmark className={cn("w-6 h-6 transition-colors", saved ? "fill-indigo-500 text-indigo-500" : "text-slate-700 dark:text-slate-300 group-hover:text-indigo-500")} />
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-4">
          <p className="text-sm text-slate-800 dark:text-slate-200">
            <span className="font-semibold mr-2">{author?.username}</span>
            {post.caption}
          </p>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <Comments targetId={post.id} targetType={targetType} authorId={post.authorId} currentUser={currentUser} />
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && currentMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-full max-w-5xl flex items-center justify-center"
              onClick={() => setIsLightboxOpen(false)}
            >
              {currentMedia.mimeType?.startsWith("video") ? (
                <IKVideo 
                  urlEndpoint={urlEndpoint} 
                  src={currentMedia.url || ""}
                  controls 
                  className="max-w-full max-h-full object-contain rounded-lg" 
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
              ) : (
                <IKImage 
                  urlEndpoint={urlEndpoint} 
                  src={currentMedia.url || ""}
                  transformation={[{ width: "1600" }]} 
                  className="max-w-full max-h-full object-contain rounded-lg" 
                  alt="Post content"
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetId={post.id}
        targetType={targetType}
        reporterId={currentUser?.uid || ""}
      />
    </article>
  )
}
