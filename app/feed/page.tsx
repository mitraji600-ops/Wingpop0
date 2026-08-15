"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { upload } from "@imagekit/next"
import { ThemeToggle } from "@/components/theme-toggle"
import { auth, db } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore"
import { ImagePlus, Video as VideoIcon, Loader2, LogOut, Compass, User, Settings } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PostCard } from "@/components/post-card"
import Link from "next/link"

export default function FeedPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  
  const [posts, setPosts] = React.useState<any[]>([])
  
  // Upload State
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const abortController = React.useRef(new AbortController())
  
  const [files, setFiles] = React.useState<File[]>([])
  const [caption, setCaption] = React.useState("")
  const [showUploadModal, setShowUploadModal] = React.useState(false)

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/signup")
    }
  }, [user, loading, router])

  // Fetch posts listener
  React.useEffect(() => {
    if (!user) return
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPosts(fetchedPosts)
    })
    return () => unsubscribe()
  }, [user])

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/")
  }

  const authenticator = async () => {
    if (!user) throw new Error("User not authenticated")
    const idToken = await user.getIdToken()
    const res = await fetch("/api/upload-auth", {
      headers: {
        "Authorization": `Bearer ${idToken}`
      }
    })
    if (!res.ok) throw new Error("Upload auth failed")
    return res.json()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files))
      setShowUploadModal(true)
    }
  }

  const executeUpload = async () => {
    if (files.length === 0 || !user) return
    
    setUploading(true)
    setProgress(0)
    abortController.current = new AbortController()
    
    try {
      const authParams = await authenticator()
      const uploadedIds: string[] = []
      
      const isVideo = files[0].type.startsWith('video/')
      if (isVideo && files.length > 1) {
        throw new Error("Only one video can be uploaded at a time")
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const uploadResponse = await upload({
          file,
          fileName: file.name,
          ...authParams,
          onUploadProgress: (e: any) => {
            setProgress(Math.round(((e.loaded / e.total) + i) / files.length * 100))
          },
          abortSignal: abortController.current.signal,
        })
        if (uploadResponse.fileId) uploadedIds.push(uploadResponse.fileId)
      }

      const idToken = await user.getIdToken()
      
      if (isVideo) {
        // Create Reel
        const res = await fetch("/api/reels", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            imageKitFileId: uploadedIds[0],
            caption
          })
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to create reel")
        }
      } else {
        // Create Post
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            mediaFiles: uploadedIds.map(id => ({ imageKitFileId: id })),
            caption,
            allowDownloads: true
          })
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to create post")
        }
      }
      
      setShowUploadModal(false)
      setFiles([])
      setCaption("")
      
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(error.message || "Failed to upload")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
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
    <main className="max-w-2xl mx-auto p-4 md:p-6 min-h-screen">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 mb-8 gap-4 border-b border-black/10 dark:border-white/5">
        <div className="flex flex-col">
          <Link href="/feed" className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white hover:opacity-80 transition-opacity">Wingpop</Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Welcome back, {profile?.displayName || 'Creator'}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Link href="/explore" className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5">
            <Compass className="w-4 h-4" /> Explore
          </Link>
          {profile?.username && (
            <Link href={`/profile/${profile.username}`} className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5">
              <User className="w-4 h-4" /> Profile
            </Link>
          )}
          <Link href="/settings" className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5">
             <Settings className="w-4 h-4" /> Settings
          </Link>
          <ThemeToggle />
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium rounded-full bg-slate-200/50 hover:bg-slate-300/50 dark:bg-white/5 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="mb-8 p-6 rounded-3xl glass-card-light dark:glass-card shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Create a new post</h2>
        <label className="flex flex-col items-center justify-center w-full gap-3 px-4 py-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-indigo-400 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-600 dark:text-slate-300">
          <div className="flex gap-2">
            <ImagePlus className="w-6 h-6 text-indigo-500" />
            <VideoIcon className="w-6 h-6 text-indigo-500" />
          </div>
          <span className="font-medium text-sm sm:text-base">Select Images or a Video to share</span>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*,video/*"
            multiple
            className="hidden" 
            onChange={handleFileSelect}
          />
        </label>
      </div>

      <div className="space-y-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} currentUser={user} />
        ))}
        {posts.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No posts yet. Be the first to share something!
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">New Post</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Selected {files.length} file(s).
            </p>
            <textarea 
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="w-full h-32 p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 resize-none text-slate-900 dark:text-white"
            />
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setShowUploadModal(false)
                  setFiles([])
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
                className="px-4 py-2 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                onClick={executeUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-2 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading {progress}%
                  </>
                ) : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
