'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'wleed_hide_brave_notice';

export default function BraveRecommendationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true); // Default checked for user convenience

  useEffect(() => {
    // Check if user already dismissed it forever
    try {
      const isHidden = localStorage.getItem(STORAGE_KEY);
      if (isHidden === 'true') return;
    } catch {
      // LocalStorage access restricted in some private modes
    }

    // Show after a brief delay so the page loads smoothly
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // Ignore error
      }
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl shadow-red-950/20 text-center animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top-left */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors"
          aria-label="إغلاق"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/10">
          🦁
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-white mb-2">
          نصيحة لمشاهدة بدون إعلانات 🛡️
        </h3>

        {/* Description */}
        <p className="text-sm text-neutral-300 leading-relaxed mb-5">
          للحصول على أفضل تجربة وتجنب النوافذ المنبثقة والإعلانات المزعجة نهائياً على الجوال أو الكمبيوتر، ننصحك بفتح الموقع عبر متصفح{' '}
          <span className="font-bold text-orange-400">Brave</span> المجاني.
        </p>

        {/* Don't show again checkbox */}
        <label className="flex items-center justify-center gap-2 cursor-pointer select-none text-xs text-neutral-400 hover:text-neutral-200 transition-colors mb-5">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-red-500 focus:ring-offset-0 cursor-pointer accent-red-600"
          />
          <span>عدم إظهار هذه الرسالة مرة أخرى</span>
        </label>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <a
            href="https://brave.com/download/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2"
          >
            <span>تحميل متصفح Brave</span>
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            onClick={handleClose}
            className="py-2.5 px-5 rounded-xl border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white font-semibold text-sm transition-all bg-neutral-900/60"
          >
            فهمت، شكراً
          </button>
        </div>
      </div>
    </div>
  );
}
