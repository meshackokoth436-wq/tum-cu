import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  channel: 'in_app' | 'email' | 'sms';
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const token = useAuthStore.getState().accessToken;
  if (!token) return [];

  try {
    const { data } = await api.get<any>('/notifications', { timeout: 8000 });
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    if (Array.isArray(data?.data?.rows)) {
      return data.data.rows;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function fetchUnreadCount(): Promise<number> {
  const token = useAuthStore.getState().accessToken;
  if (!token) return 0;

  try {
    const { data } = await api.get<any>('/notifications/unread-count', { timeout: 8000 });
    const count = data?.data?.count ?? data?.count ?? 0;
    return typeof count === 'number' ? count : 0;
  } catch (err) {
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await api.post(`/notifications/${id}/read`);
  } catch (err) {
    console.error('Failed to mark notification read:', err);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await api.post('/notifications/read-all');
  } catch (err) {
    console.error('Failed to mark all notifications read:', err);
  }
}

