import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'Wingpop',
  description: 'Crafted for creators.',
  openGraph: {
    title: 'Wingpop',
    description: 'Crafted for creators.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wingpop',
    description: 'Crafted for creators.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="mesh-bg-light dark:mesh-bg text-slate-800 dark:text-slate-200 min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
