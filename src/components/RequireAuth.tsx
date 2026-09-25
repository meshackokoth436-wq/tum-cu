import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { fetchCurrentSession, refreshSession } from '@/features/auth/auth.api';

export function RequireAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const setRoles = useAuthStore((s) => s.setRoles);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const hasValidToken = Boolean(
      accessToken &&
      typeof accessToken === 'string' &&
      accessToken !== 'null' &&
      accessToken !== 'undefined' &&
      accessToken.trim().length > 0
    );

    const bootstrap = async () => {
      try {
        if (!hasValidToken) {
          const refreshed = await refreshSession();
          useAuthStore.getState().setTokens(refreshed.accessToken);
        }
        const session = await fetchCurrentSession();
        if (!mounted) return;
        if (session.user || (session as any).email) setUser((session.user || session) as any);
        setPermissions((session.permissions as string[]) ?? []);
        setRoles((session.roles as Parameters<typeof setRoles>[0]) ?? []);
      } catch {
        if (mounted) logout();
      } finally {
        if (mounted) setChecking(false);
      }
    };

    bootstrap();
    return () => { mounted = false; };
  }, []);

  if (checking) return <div className="grid min-h-screen place-items-center bg-[#f4f7f5]"><div className="rounded-2xl border border-white/70 bg-white/70 px-5 py-3 text-sm font-semibold text-primary-800 shadow-xl backdrop-blur-xl">Securing your session…</div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const user = useAuthStore.getState().user;
  const isSuperAdmin = useAuthStore.getState().isSuperAdmin();
  const membershipType = (user as any)?.membership_type || 'full';
  const isAssociateOrGlobal = membershipType === 'associate' || membershipType === 'special';
  const hasIdentifier = Boolean(user?.admission_number || (user as any)?.membership_number || isAssociateOrGlobal);
  const isMissingInfo = !hasIdentifier || !(user as any)?.declaration_accepted;

  if (isMissingInfo && !isSuperAdmin) {
    return <Navigate to="/personal-information" replace />;
  }

  return <Outlet />;
}
