import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WleedMovie | مشاهدة المسلسلات مترجمة',
  description:
    'موقع WleedMovie لمشاهدة أحدث المسلسلات والأفلام مترجمة بجودة عالية بدون إعلانات مع خوادم متعددة وترجمة عربية تلقائية.',
  keywords: 'مسلسلات, أفلام, مترجم, عربي, مشاهدة, بث, سينما',
};

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
        className="min-h-screen bg-neutral-950 text-white antialiased"
        style={{ fontFamily: 'Tajawal, sans-serif' }}
      >
        {/* Header / Navbar */}
        <header className="sticky top-0 z-50 glass">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/50 transition-shadow">
                  <svg
                    className="w-6 h-6 text-white"
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
                <span className="text-xl font-bold gradient-text">
                  WleedMovie
                </span>
              </a>
              <div className="flex items-center gap-2 md:gap-4">
                <a
                  href="/"
                  className="text-sm text-neutral-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  الرئيسية
                </a>
                <a
                  href="/movies"
                  className="text-sm text-neutral-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  الأفلام
                </a>
                <a
                  href="/series"
                  className="text-sm text-neutral-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  المسلسلات
                </a>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>

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
