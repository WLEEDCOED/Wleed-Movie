import type { Metadata, Viewport } from 'next';
import Navbar from '@/components/Navbar';
import PresenceTracker from '@/components/PresenceTracker';
import BraveRecommendationModal from '@/components/BraveRecommendationModal';
import { analyticsConfigured } from '@/lib/site-analytics';
import './globals.css';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#08080b' };
export const metadata: Metadata = {
  title: 'WleedMovie | Movies & Shows',
  description: 'Discover movies and shows on WleedMovie.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" dir="ltr" data-theme="default"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body><Navbar/><BraveRecommendationModal/><PresenceTracker enabled={analyticsConfigured()}/><main>{children}</main><footer className="site-footer content-shell"><div><span className="footer-mark">◩</span><strong>WLEED<span>MOVIE</span></strong></div><p>Find your next favorite movie or show. Powered by TMDB.</p><span>© {new Date().getFullYear()} WleedMovie</span></footer></body></html>;
}
