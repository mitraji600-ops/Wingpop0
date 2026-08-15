"use client"

import * as React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function PrivacyPolicyPage() {
  const sections = [
    { id: "info-collect", title: "1. Information We Collect" },
    { id: "how-use", title: "2. How We Use Information" },
    { id: "auth", title: "3. Authentication" },
    { id: "ugc", title: "4. User-Generated Content" },
    { id: "media", title: "5. Media Storage" },
    { id: "firebase", title: "6. Firebase" },
    { id: "imagekit", title: "7. ImageKit" },
    { id: "firestore", title: "8. Firestore" },
    { id: "cookies", title: "9. Cookies and Technologies" },
    { id: "retention", title: "10. Data Retention" },
    { id: "deletion", title: "11. Account Deletion" },
    { id: "security", title: "12. Security" },
    { id: "rights", title: "13. User Rights" },
    { id: "children", title: "14. Children's Privacy" },
    { id: "changes", title: "15. Changes to this Policy" },
    { id: "contact", title: "16. Contact" },
  ]

  return (
    <main className="min-h-screen flex flex-col pt-24 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen" />

      <Navbar />

      <div className="max-w-5xl mx-auto w-full z-10 flex flex-col md:flex-row gap-8 mb-12">
        
        {/* Table of Contents - Desktop Sticky */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-28 glass-card-light dark:glass-card rounded-3xl p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Contents</h3>
            <nav className="flex flex-col gap-2">
              {sections.map((sec) => (
                <a 
                  key={sec.id} 
                  href={`#${sec.id}`}
                  className="text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 glass-card-light dark:glass-card rounded-3xl p-6 md:p-12 shadow-sm">
          <header className="mb-12 border-b border-black/5 dark:border-white/5 pb-8">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: August 14, 2026</p>
            <p className="mt-6 text-slate-700 dark:text-slate-300 leading-relaxed">
              At Wingpop, we believe in transparency. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.
            </p>
          </header>

          <div className="space-y-12 text-slate-700 dark:text-slate-300 leading-relaxed">
            
            <section id="info-collect">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly to us, such as your display name, username, email address, and the content you post. We do not ask for unnecessary personal data.</p>
            </section>

            <section id="how-use">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. How We Use Information</h2>
              <p>Your information is used to provide, maintain, and improve the Wingpop platform, to authenticate you, and to display your content to the community.</p>
            </section>

            <section id="auth">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Authentication</h2>
              <p>We use Firebase Authentication (including Google Sign-In and email/password) to securely verify your identity. We do not store or have access to your raw passwords.</p>
            </section>

            <section id="ugc">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. User-Generated Content</h2>
              <p>Any content you upload (images, videos, text) is processed and stored to be displayed on Wingpop. You retain ownership of your content, but grant us a license to host and display it.</p>
            </section>

            <section id="media">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Media Storage</h2>
              <p>We rely on specialized third-party services to ensure high-performance delivery of your creative work. Large media files are not stored directly in our application database.</p>
            </section>

            <section id="firebase">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">6. Firebase</h2>
              <p>Our backend relies on Google Firebase. Firebase processes your authentication state securely. Please review Google&apos;s privacy terms for more details on Firebase infrastructure.</p>
            </section>

            <section id="imagekit">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">7. ImageKit</h2>
              <p>We use ImageKit.io for media processing, optimization, and edge delivery. When you upload an image or video, the file is securely transmitted to and hosted by ImageKit.</p>
            </section>

            <section id="firestore">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">8. Firestore</h2>
              <p>Your profile data, app preferences, and pointers to your media (URLs) are stored in Cloud Firestore. This data is protected by strict security rules so only authorized users can modify their respective records.</p>
            </section>

            <section id="cookies">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">9. Cookies and Technologies</h2>
              <p>We use essential cookies and similar local storage technologies strictly for authentication and to remember your theme preferences. We do not use tracking cookies for targeted advertising.</p>
            </section>

            <section id="retention">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">10. Data Retention</h2>
              <p>We retain your information for as long as your account is active. If you delete your account, your data is scheduled for permanent deletion from our active systems.</p>
            </section>

            <section id="deletion">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">11. Account Deletion</h2>
              <p>You may request account deletion at any time. Deleting your account will remove your profile, preferences, and permanently detach you from your uploaded media.</p>
            </section>

            <section id="security">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">12. Security</h2>
              <p>We implement commercially reasonable security measures including encrypted transit, secured databases, and strict access control rules. However, no internet transmission is 100% secure.</p>
            </section>

            <section id="rights">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">13. User Rights</h2>
              <p>Depending on your location, you may have the right to access, correct, or delete your personal data. Contact us to exercise these rights.</p>
            </section>

            <section id="children">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">14. Children&apos;s Privacy</h2>
              <p>Wingpop is not directed at children under the age of 13 (or higher, depending on local laws). We do not knowingly collect personal information from children.</p>
            </section>

            <section id="changes">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">15. Changes to this Policy</h2>
              <p>We may update this policy periodically. We will notify you of any material changes by updating the date at the top of this policy and, where appropriate, through the application.</p>
            </section>

            <section id="contact">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">16. Contact</h2>
              <p>If you have questions about this policy, you can reach out to our privacy team via the platform&apos;s support channels.</p>
            </section>

          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
