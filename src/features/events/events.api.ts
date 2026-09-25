import { api, type ApiResponse } from '@/services/api';

export interface PublicEvent {
  id: string;
  title: string;
  event_type: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  status: string;
  capacity: number | null;
  day_of_week?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  category?: string;
}

export interface WeeklyProgramme {
  id: string;
  day: string;
  title: string;
  programme_type?: string;
  time: string;
  venue: string;
  leader?: string;
  description?: string;
}

/** Public endpoint — only approved/open/ongoing/completed events, never drafts. */
export async function fetchPublicEvents(): Promise<PublicEvent[]> {
  try {
    const { data } = await api.get<any>('/events/public');
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error('Failed to fetch public events:', err);
    return [];
  }
}

/** Admin / Authenticated: fetch all events */
export async function fetchAllEvents(): Promise<PublicEvent[]> {
  try {
    const { data } = await api.get<any>('/events');
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.rows)) return data.data.rows;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error('Failed to fetch all events:', err);
    return [];
  }
}

export async function createEvent(payload: Partial<PublicEvent>): Promise<PublicEvent> {
  const { data } = await api.post<ApiResponse<PublicEvent>>('/events', payload);
  return data.data;
}

export async function updateEvent(id: string, payload: Partial<PublicEvent>): Promise<PublicEvent> {
  const { data } = await api.put<ApiResponse<PublicEvent>>(`/events/${id}`, payload);
  return data.data;
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/events/${id}`);
}

/** Weekly programmes endpoints */
export async function fetchProgrammes(): Promise<WeeklyProgramme[]> {
  try {
    const { data } = await api.get<any>('/programmes');
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error('Failed to fetch programmes:', err);
    return [];
  }
}

export async function createProgramme(payload: Partial<WeeklyProgramme>): Promise<WeeklyProgramme> {
  const { data } = await api.post<ApiResponse<WeeklyProgramme>>('/programmes', payload);
  return data.data;
}

export async function updateProgramme(id: string, payload: Partial<WeeklyProgramme>): Promise<WeeklyProgramme> {
  const { data } = await api.put<ApiResponse<WeeklyProgramme>>(`/programmes/${id}`, payload);
  return data.data;
}

export async function deleteProgramme(id: string): Promise<void> {
  await api.delete(`/programmes/${id}`);
}

export async function fetchMondayForecast(): Promise<any> {
  try {
    const { data } = await api.get<any>('/programmes/monday-forecast');
    return data?.data;
  } catch (err) {
    console.error('Failed to fetch Monday forecast:', err);
    return null;
  }
}

export function downloadSemesterCalendarIcs(): void {
  const link = document.createElement('a');
  link.href = '/api/programmes/calendar.ics';
  link.setAttribute('download', 'tumcu-semester-program-2026.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  worship_night: 'Worship Night',
  missions: 'Missions',
  evangelism: 'Evangelism',
  high_school_mission: 'High School Mission',
  retreat: 'Retreat',
  conference: 'Conference',
  leadership_summit: 'Leadership Summit',
  bible_study: 'Bible Study',
  prayer_retreat: 'Prayer Retreat',
  sunday_service: 'Sunday Service',
  fellowship: 'Fellowship',
  training: 'Training',
  agm: 'AGM',
  sgm: 'SGM',
  camp: 'Camp',
  graduation_thanksgiving: 'Graduation Thanksgiving',
  other: 'Event',
};

