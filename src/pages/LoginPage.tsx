import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Home, LockKeyhole, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { fetchCurrentSession, login } from '@/features/auth/auth.api';
import { useAuthStore } from '@/store/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const setRoles = useAuthStore((s) => s.setRoles);
  const sessionExpired = new URLSearchParams(location.search).get('session') === 'expired';
  const justRegistered = Boolean((location.state as { justRegistered?: boolean } | null)?.justRegistered);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (result) => {
      setSession(result.accessToken, result.user as never);
      try {
        const session = await fetchCurrentSession();
        setPermissions(Array.isArray(session.permissions) ? session.permissions as string[] : []);
        setRoles(Array.isArray(session.roles) ? session.roles as never : []);
      } catch {
        // The backend session is still valid; the dashboard can rehydrate /me later.
      }
      navigate('/dashboard', { replace: true });
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid credentials. Please verify your details and try again.');
    },
  });

  return (
    <div className="auth-photo-bg flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/12 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-xl"><ArrowLeft size={14} /><Home size={14} /> Back to Home</Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/12 px-3 py-2 text-[10px] font-bold text-white shadow-lg backdrop-blur-xl"><ShieldCheck size={13} /> Secure TUMCU account</span>
        </div>

        <Card variant="glass" className="border border-white/30 bg-white/16 p-7 shadow-2xl shadow-black/25 backdrop-blur-2xl sm:p-9">
          <div className="flex items-start justify-between"><div><h1 className="text-2xl font-black text-white">Welcome back</h1><p className="mt-1 text-xs text-white/75">Sign in with your TUMCU account.</p></div><div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white"><LockKeyhole size={18} /></div></div>

          {sessionExpired && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">Your session ended. Please sign in again.</div>}
          {justRegistered && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">Registration received. Your membership application is awaiting administrator approval.</div>}

          <form className="mt-7 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setError(null); mutation.mutate({ identifier: identifier.trim(), password }); }}>
            <Input label="Email, admission number, or phone" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter your registered identifier" required autoComplete="username" />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
            {error && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-700"><AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
            <Button type="submit" loading={mutation.isPending} className="mt-1">Sign In</Button>
          </form>

          <div className="mt-6 rounded-xl border border-white/20 bg-black/15 p-4 text-xs text-white/70 shadow-inner backdrop-blur-md">
            <p className="font-bold text-white">Account approval</p>
            <p className="mt-1 leading-5 text-white/70">New registrations remain pending until an authorised administrator approves the membership application. Your account status is controlled by the TECUMP backend.</p>
          </div>

          <p className="mt-6 text-center text-xs text-white/70">Not registered yet? <Link to="/register" className="font-bold text-gold-300 hover:text-gold-200 hover:underline">Register for Membership</Link></p>
        </Card>
      </div>
    </div>
  );
}
