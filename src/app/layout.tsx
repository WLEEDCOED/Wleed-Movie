import type { Metadata, Viewport } from 'next';
import './globals.css';

// Keep the page zoomable (pinch zoom / double tap on iPad, Ctrl + scroll on
// laptops) and let the layout use the whole screen on notched iPads.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export const metadata: Metadata = {
  title: 'WleedMovie | مشاهدة المسلسلات مترجمة',
  description:
    'موقع WleedMovie لمشاهدة أحدث المسلسلات والأفلام مترجمة بجودة عالية بدون إعلانات مع خوادم متعددة وترجمة عربية تلقائية.',
  keywords: 'مسلسلات, أفلام, مترجم, عربي, مشاهدة, بث, سينما',
};

import Navbar from '@/components/Navbar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-black text-white antialiased selection:bg-red-500/30"
        style={{ fontFamily: 'Tajawal, sans-serif' }}
      >
        <Navbar />

        {/* Main Content */}
        <main className="min-h-screen pb-16">{children}</main>

        {/* Footer */}
        <footer className="border-t border-neutral-800/50 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-neutral-400">
                  WleedMovie
                </span>
              </div>
              <p className="text-sm text-neutral-500">
                © 2024 WleedMovie. جميع الحقوق محفوظة.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
