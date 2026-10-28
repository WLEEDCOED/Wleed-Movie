import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, adminConfigured, verifyAdminSession } from '@/lib/admin-auth';
import { analyticsConfigured } from '@/lib/site-analytics';
import AdminDashboard from '@/components/AdminDashboard';
import './admin.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'لوحة الإدارة | WleedMovie',
  robots: { index: false, follow: false },
};

const errorMessages: Record<string, string> = {
  invalid: 'كلمة المرور غير صحيحة.',
  locked: 'محاولات كثيرة. حاول مجددًا بعد 15 دقيقة.',
  unavailable: 'تعذّر الاتصال بخدمة الإحصائيات. حاول لاحقًا.',
  setup: 'لوحة الإدارة غير مهيّأة بعد.',
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = (await cookies()).get(ADMIN_COOKIE)?.value;
  const signedIn = verifyAdminSession(session);
  const ready = adminConfigured() && analyticsConfigured();
  const { error } = await searchParams;

  return <div className="admin-page" dir="rtl">
    {!signedIn ? <div className="admin-login">
      <div className="admin-brand"><span>◩</span> WLEED MOVIE <small>ADMIN</small></div>
      <div className="admin-login-card">
        <span className="admin-kicker">الدخول الخاص</span>
        <h1>لوحة الإدارة</h1>
        <p>إحصائيات الزوار والمشاهدة المباشرة في مكان واحد.</p>
        {ready ? <form action="/api/admin/login" method="post">
          <label htmlFor="admin-password">كلمة المرور</label>
          <input id="admin-password" name="password" type="password" autoComplete="current-password" required minLength={8} />
          {error && errorMessages[error] && <div className="admin-form-error" role="alert">{errorMessages[error]}</div>}
          <button type="submit">دخول اللوحة <span aria-hidden="true">←</span></button>
        </form> : <div className="admin-form-error" role="status">لوحة الإدارة غير مهيّأة بعد.</div>}
      </div>
      <p className="admin-login-foot">هذه الصفحة متاحة من رابطها المباشر فقط.</p>
    </div> : <AdminDashboard />}
  </div>;
}
