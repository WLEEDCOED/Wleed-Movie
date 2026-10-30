import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guide | WLEEDMOVIE',
  description: 'دليل اختيار الترجمة العربية وتحميل ملفات SRT وضبط توقيتها في مشغلات WLEEDMOVIE.',
};

const steps = [
  { number: '01', title: 'اختر أي سيرفر', description: 'افتح صفحة المشاهدة واختر السيرفر الذي يعمل معك. يستخدم الفيديو Atlantic مثالًا بصريًا فقط.' },
  { number: '02', title: 'ابحث عن الترجمة العربية', description: 'افتح قائمة Captions أو CC داخل المشغل، ثم اختر Arabic إذا كانت متوفرة.' },
  { number: '03', title: 'حمّل ملف الترجمة', description: 'إذا لم تجد العربية داخل المشغل، استخدم زر تحميل SRT في صفحة المشاهدة عندما يكون الملف متوفرًا.' },
  { number: '04', title: 'أضف الملف إلى المشغل', description: 'في السيرفر الذي يدعم رفع الترجمة، اختر Upload subtitle file وحدد ملف SRT الذي حمّلته.' },
  { number: '05', title: 'اضبط التوقيت', description: 'إن ظهرت الترجمة مبكرًا، زد التأخير (+). وإن ظهرت متأخرة، قلله (−). اختبرها بعد التقديم في الفيديو.' },
];

export default function GuidePage() {
  return <div className="guide-page content-shell" dir="rtl">
    <div className="guide-intro">
      <span className="guide-eyebrow">WLEEDMOVIE / GUIDE</span>
      <h1>الترجمة، خطوة بخطوة.</h1>
      <p>دليل سريع لاختيار الترجمة العربية، تحميل ملف SRT، وضبط المزامنة أثناء المشاهدة.</p>
    </div>

    <div className="guide-video-shell">
      <div className="guide-video-top"><span className="guide-video-status"><i aria-hidden="true" /> دليل مرئي</span><span>00:43 · بدون صوت</span></div>
      <video className="guide-video" controls playsInline preload="metadata" poster="/subtitle-guide-poster.jpg" aria-label="فيديو يشرح اختيار الترجمة العربية وتحميل ملف SRT وضبط التوقيت">
        <source src="/subtitle-guide-silent.mp4" type="video/mp4" />
        متصفحك لا يدعم تشغيل الفيديو.
      </video>
    </div>

    <section className="guide-steps" aria-labelledby="guide-steps-title">
      <div className="guide-section-heading"><span>THE PROCESS</span><h2 id="guide-steps-title">الخطوات الأساسية</h2></div>
      <div className="guide-step-grid">{steps.map(step => <article className="guide-step" key={step.number}><span className="guide-step-number">{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
      <p className="guide-note">القوائم والأزرار تختلف بين السيرفرات، وبعض المشغلات لا تدعم رفع ملف ترجمة أو تعديل توقيته. اختر سيرفرًا يدعم الخيار الذي تحتاجه.</p>
    </section>
  </div>;
}
