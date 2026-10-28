'use client';

import { useEffect, useState } from 'react';
import type { AnalyticsSnapshot } from '@/lib/site-analytics';

const number = new Intl.NumberFormat('ar-SA');

function shortDay(day: string) {
  return new Date(`${day}T12:00:00+03:00`).toLocaleDateString('ar-SA', {
    weekday: 'short', timeZone: 'Asia/Riyadh',
  });
}

function pageLabel(path: string) {
  if (path === '/') return 'الصفحة الرئيسية';
  if (path === '/movies') return 'الأفلام';
  if (path === '/series') return 'المسلسلات';
  if (path === '/lists') return 'قائمتي';
  return path;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AnalyticsSnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch('/api/admin/stats', { cache: 'no-store' });
        if (!response.ok) throw new Error(response.status === 401 ? 'انتهت جلسة الإدارة. حدّث الصفحة وسجل الدخول.' : 'تعذّر تحديث الإحصائيات.');
        const data = await response.json() as AnalyticsSnapshot;
        if (mounted) { setStats(data); setError(''); }
      } catch (failure) {
        if (mounted) setError(failure instanceof Error ? failure.message : 'تعذّر تحديث الإحصائيات.');
      }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 20_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  const cards = [
    { label: 'زوار الآن', value: stats?.activeVisitors, note: 'نشطون خلال آخر 90 ثانية', icon: '◉', className: 'green' },
    { label: 'في المشغل الآن', value: stats?.watchingVisitors, note: 'المشغل ظاهر لديهم الآن', icon: '▶', className: 'red' },
    { label: 'زيارات الصفحات اليوم', value: stats?.pageViewsToday, note: 'بتوقيت الرياض', icon: '▥', className: 'violet' },
    { label: 'زوار اليوم', value: stats?.uniqueVisitorsToday, note: 'معرّفات مجهولة وفريدة', icon: '◈', className: 'blue' },
  ];
  const maxViews = Math.max(1, ...(stats?.weekly.map(day => day.pageViews) || []));

  return <div className="admin-dashboard">
    <header className="admin-topbar">
      <div className="admin-brand"><span>◩</span> WLEED MOVIE <small>ADMIN</small></div>
      <form action="/api/admin/logout" method="post"><button type="submit">تسجيل الخروج</button></form>
    </header>

    <div className="admin-dashboard-head">
      <div><span className="admin-kicker">نظرة مباشرة</span><h1>لوحة الإدارة</h1><p>حركة الزوار ومتابعة المحتوى على موقعك.</p></div>
      <span className="admin-live"><i /> تحديث تلقائي كل 20 ثانية</span>
    </div>

    {error && <div className="admin-form-error" role="alert">{error}</div>}

    <div className="admin-stat-grid">
      {cards.map(card => <div key={card.label} className={`admin-stat-card ${card.className}`}>
        <div className="admin-stat-icon" aria-hidden="true">{card.icon}</div>
        <div className="admin-stat-value">{card.value === undefined ? '—' : number.format(card.value)}</div>
        <h2>{card.label}</h2><p>{card.note}</p>
      </div>)}
    </div>

    <div className="admin-panels">
      <section className="admin-panel admin-chart-panel">
        <div className="admin-panel-head"><div><span className="admin-kicker">آخر 7 أيام</span><h2>زيارات الصفحات</h2></div><span>اليوم بتوقيت الرياض</span></div>
        <div className="admin-chart" role="img" aria-label="رسم بياني لزيارات الصفحات خلال آخر سبعة أيام">
          {(stats?.weekly || Array.from({ length: 7 }, (_, i) => ({ day: String(i), pageViews: 0 }))).map((day, index) =>
            <div className="admin-chart-column" key={day.day}>
              <span>{stats ? number.format(day.pageViews) : '—'}</span>
              <div className="admin-chart-track"><div className={`admin-chart-bar ${index === 6 ? 'current' : ''}`} style={{ height: `${stats ? Math.max(5, day.pageViews / maxViews * 100) : 5}%` }} /></div>
              <small>{stats ? shortDay(day.day) : '—'}</small>
            </div>)}
        </div>
      </section>
      <section className="admin-panel admin-pages-panel">
        <div className="admin-panel-head"><div><span className="admin-kicker">اليوم</span><h2>الصفحات الأكثر زيارة</h2></div></div>
        {stats?.topPages.length ? <ol className="admin-top-pages">
          {stats.topPages.map((page, index) => <li key={page.path}><span className="admin-page-index">{index + 1}</span><div><strong>{pageLabel(page.path)}</strong><small>{page.path}</small></div><span>{number.format(page.views)}</span></li>)}
        </ol> : <p className="admin-empty">{stats ? 'لا توجد زيارات مسجلة اليوم بعد.' : 'جاري تحميل البيانات...'}</p>}
      </section>
    </div>
    <p className="admin-note">الأرقام المباشرة تقديرية بناءً على الجلسات النشطة خلال 90 ثانية. “في المشغل الآن” تعني أن المشغل ظاهر، ولا تؤكد تشغيل الفيديو داخل كل مزوّد خارجي.</p>
  </div>;
}
