'use client';

import { useState, useEffect } from 'react';

export default function BraveRecommendationModal() {
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const checkBrowser = async () => {
      try {
        // 1. فحص Brave على أجهزة الكمبيوتر والأندرويد (Official API)
        const nav = navigator as unknown as { 
          brave?: { isBrave?: () => Promise<boolean> };
          userAgent?: string;
        };

        let isBrave = false;

        if (typeof nav.brave?.isBrave === 'function') {
          isBrave = await nav.brave.isBrave();
        }

        // 2. فحص Brave على الآيفون والآيباد (iOS User Agent)
        if (!isBrave && nav.userAgent && /Brave/i.test(nav.userAgent)) {
          isBrave = true;
        }

        // إذا كان يستخدم Brave، نفتح الموقع فوراً
        if (isBrave) {
          setIsLocked(false);
        } else {
          // ليس Brave: نقفل الصفحة تماماً
          setIsLocked(true);
        }
      } catch {
        setIsLocked(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkBrowser();
  }, []);

  // قفل التمرير في الصفحة طالما المشاهد ليس في Brave
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }, [isLocked]);

  // محاولة الإغلاق: يتم رفض الإغلاق وإظهار رسالة "لمصلحتك حمل بريف"
  const handleAttemptClose = () => {
    setShowWarning(true);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // أثناء الفحص الأولي لا نعرض شيئاً لتفادي الوميض
  if (isChecking || !isLocked) return null;

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl select-none"
      onClick={handleAttemptClose}
    >
      <div 
        className={`relative w-full max-w-md bg-neutral-950 border-2 border-orange-500/40 rounded-3xl p-7 shadow-2xl shadow-orange-500/20 text-center transition-transform ${
          shake ? 'animate-bounce' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* زر الإغلاق الوهمي (إذا ضغطه تطلع له الرسالة ولا يقفل) */}
        <button
          onClick={handleAttemptClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
          title="إغلاق"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* الأيقونة */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-600/30 border border-orange-500/40 flex items-center justify-center text-4xl shadow-xl shadow-orange-600/20 animate-pulse">
          🦁
        </div>

        {/* العنوان الإجباري */}
        <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
          الدخول عبر متصفح Brave فقط 🦁
        </h2>

        {/* تنبيه تحذيري عند محاولة الإغلاق */}
        {showWarning && (
          <div className="mb-4 py-2 px-3 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 font-bold text-sm animate-fade-in">
            ⚠️ لمصلحتك حمل بريف! الموقع محمي ومقفل ولن يفتح إلا من داخله.
          </div>
        )}

        {/* نص الإجبار */}
        <p className="text-sm text-neutral-300 leading-relaxed mb-6 font-medium">
          لمشاهدة بدون إعلانات مزعجة ونوافذ منبثقة، تم إقفال الموقع؛{' '}
          <span className="text-orange-400 font-bold">لن يشتغل الموقع ولا مشغل الأفلام</span> إلا بعد فتح الرابط من داخل تطبيق متصفح{' '}
          <span className="text-white font-extrabold underline underline-offset-4 decoration-orange-500">Brave</span> المجاني.
        </p>

        {/* الأزرار الإجبارية */}
        <div className="flex flex-col gap-3">
          <a
            href="https://brave.com/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 hover:brightness-110 text-white font-black text-base transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2.5 active:scale-95"
          >
            <span>تحميل متصفح Brave الآن</span>
            <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-5 rounded-2xl border border-neutral-800 hover:border-neutral-600 bg-neutral-900/80 text-neutral-300 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>فتحت الرابط من Brave؟ اضغط للتحديث</span>
          </button>
        </div>
      </div>
    </div>
  );
}
