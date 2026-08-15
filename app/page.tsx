"use client"

import * as React from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Compass, PenTool, Users } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen flex flex-col pt-24 md:pt-32 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen" />

      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full z-10 mb-24">
        <div className="glass-card-light dark:glass-card px-4 py-1.5 rounded-full text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-8 inline-flex items-center gap-2 border border-indigo-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Phase 2 Now Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Crafted for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">creators.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Wingpop is the premium social destination for visual creators. 
          Share your highest-quality work with a community that appreciates craft, 
          powered by edge-optimized media delivery.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {user ? (
            <Link 
              href="/feed" 
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              Go to Feed
            </Link>
          ) : (
            <>
              <Link 
                href="/signup" 
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                Create Account
              </Link>
              <Link 
                href="/signup" 
                className="w-full sm:w-auto px-8 py-4 glass-card-light dark:glass-card text-slate-800 dark:text-slate-200 font-medium rounded-full transition-all hover:bg-white/40 dark:hover:bg-white/10"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 pb-24 z-10">
        <div className="glass-card-light dark:glass-card p-8 rounded-3xl group hover:border-indigo-500/30 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <PenTool className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">Create</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Share your work with the community. Upload high-fidelity images and videos instantly.
          </p>
        </div>

        <div className="glass-card-light dark:glass-card p-8 rounded-3xl group hover:border-purple-500/30 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Compass className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">Discover</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Find creators and content. Immerse yourself in an ad-free, curated visual experience.
          </p>
        </div>

        <div className="glass-card-light dark:glass-card p-8 rounded-3xl group hover:border-blue-500/30 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">Connect</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Build meaningful connections. Collaborate with like-minded creators around the globe.
          </p>
        </div>
      </div>
    </main>
  )
}
