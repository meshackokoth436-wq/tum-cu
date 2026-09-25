import { create } from 'zustand';

export interface AuthRole {
  role_id?: string;
  code: string;
  name: string;
  category: string;
  scope_type: string;
  scope_id: string | null;
}

interface AuthUser {
  full_name: string;
  email: string;
  account_status: string;
  [key: string]: unknown;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  permissions: string[];
  roles: AuthRole[];
  isAuthenticated: boolean;
  isSuperAdmin: () => boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  setTokens: (accessToken: string) => void;
  setPermissions: (permissions: string[]) => void;
  setRoles: (roles: AuthRole[]) => void;
  hasPermission: (code: string) => boolean;
  hasRole: (roleCode: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
      accessToken: null,
      user: null,
      permissions: [],
      roles: [],
      isAuthenticated: false,
      isSuperAdmin: () => {
        const state = get();
        if (!state.isAuthenticated || !state.accessToken || !state.user) return false;
        const role = String(state.user?.role || '').toLowerCase().trim();
        if (role === 'super_admin') return true;

        if (state.roles.some((r) => r.code === 'super_admin' || r.role_id === 'role-1')) {
          return true;
        }

        return state.permissions.includes('*') || state.permissions.includes('system.manage_roles');
      },
      setSession: (accessToken, user) =>
        set({ accessToken, user, permissions: [], roles: [], isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setTokens: (accessToken) => set({ accessToken, isAuthenticated: true }),
      setPermissions: (permissions) => set({ permissions }),
      setRoles: (roles) => set({ roles }),
      hasPermission: (code) => {
        const state = get();
        if (!state.isAuthenticated || !state.accessToken) return false;
        if (state.isSuperAdmin()) {
          return true;
        }
        return state.permissions.includes(code) || state.permissions.includes('*');
      },
      hasRole: (roleCode: string) => {
        const state = get();
        if (!state.isAuthenticated || !state.user) return false;
        if (state.isSuperAdmin()) return true;
        const target = (roleCode || '').toLowerCase().trim();
        const userRole = String(state.user?.role || '').toLowerCase().trim();
        if (userRole === target) return true;
        return (state.roles || []).some(
          (r) => (r.code || '').toLowerCase().trim() === target || (r.role_id || '').toLowerCase().trim() === target
        );
      },
      logout: () =>
        set({ accessToken: null, user: null, permissions: [], roles: [], isAuthenticated: false }),
    }));
