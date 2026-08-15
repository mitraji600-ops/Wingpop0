"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { useAuth } from "@/components/auth-provider"
import { Compass, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Image as IKImage, Video as IKVideo } from "@imagekit/next"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ExplorePage() {
  const [posts, setPosts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchExplore = async () => {
      // In a real app, this would be a more complex query (e.g., trending, recommended)
      // For now, we fetch recent posts
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30))
      const snap = await getDocs(q)
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    fetchExplore()
  }, [])

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen">
      <header className="flex items-center justify-between py-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/feed" className="p-2 -ml-2 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-500" />
            Explore
          </h1>
        </div>
        <ThemeToggle />
      </header>

      {loading ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <div key={i} className="aspect-square bg-slate-200 dark:bg-white/10 animate-pulse rounded-lg sm:rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          {posts.map(post => (
            <Link key={post.id} href={`/feed#${post.id}`} className="relative aspect-square group rounded-lg sm:rounded-2xl overflow-hidden bg-black/5 dark:bg-black/20 block">
              {post.fileType === "video" ? (
                <div className="w-full h-full relative">
                   <IKVideo
                    urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""}
                    src={post.url}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 p-1 bg-black/50 rounded text-white text-xs font-bold">
                    REEL
                  </div>
                </div>
              ) : (
                <IKImage
                  urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""}
                  src={post.url}
                  transformation={[{ width: "400", height: "400", cropMode: "extract" }]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt=""
                  loading="lazy"
                />
              )}
            </Link>
          ))}
        </div>
      )}
      
      {!loading && posts.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          Nothing to explore yet.
        </div>
      )}
    </main>
  )
}
