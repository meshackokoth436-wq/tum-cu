import { api, type ApiResponse } from '@/services/api';

export interface ETeamProgramme {
  id: string;
  team_id: string;
  eteam_id?: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  focus?: string;
  leader?: string;
}

export interface ETeamAnnouncement {
  id: string;
  team_id: string;
  eteam_id?: string;
  title: string;
  content: string;
  posted_at: string;
}

export interface ETeamPhoto {
  id: string;
  team_id: string;
  eteam_id?: string;
  title: string;
  image_url: string;
  google_photos_url?: string;
  caption?: string;
}

export interface ETeamReport {
  id: string;
  team_id: string;
  eteam_id?: string;
  title: string;
  author: string;
  report_date: string;
  summary: string;
  content: string;
}

export interface ETeam {
  id: string;
  code: string;
  name: string;
  region: string;
  description: string;
  motto?: string;
  scripture_verse?: string;
  chairperson_id?: string;
  chairperson_name?: string;
  chairperson_phone?: string;
  meeting_day?: string;
  meeting_time?: string;
  meeting_venue?: string;
  target_mission_area?: string;
  banner_image_url?: string;
  active_members_count?: number;
  is_active: number | boolean;
  programmes?: ETeamProgramme[];
  announcements?: ETeamAnnouncement[];
  gallery?: ETeamPhoto[];
  reports?: ETeamReport[];
}

export async function fetchETeams(): Promise<ETeam[]> {
  const { data } = await api.get<ApiResponse<ETeam[]>>('/e-teams');
  return data.data;
}

export async function fetchETeam(id: string): Promise<ETeam> {
  const { data } = await api.get<ApiResponse<ETeam>>(`/e-teams/${id}`);
  return data.data;
}

export async function addETeamProgramme(teamId: string, payload: any): Promise<any> {
  const { data } = await api.post<ApiResponse<any>>(`/e-teams/${teamId}/programmes`, payload);
  return data.data;
}

export async function updateETeamProgramme(teamId: string, progId: string, payload: any): Promise<any> {
  const { data } = await api.put<ApiResponse<any>>(`/e-teams/${teamId}/programmes/${progId}`, payload);
  return data.data;
}

export async function deleteETeamProgramme(teamId: string, progId: string): Promise<any> {
  const { data } = await api.delete<ApiResponse<any>>(`/e-teams/${teamId}/programmes/${progId}`);
  return data.data;
}

export async function addETeamAnnouncement(teamId: string, payload: any): Promise<any> {
  const { data } = await api.post<ApiResponse<any>>(`/e-teams/${teamId}/announcements`, payload);
  return data.data;
}

export async function deleteETeamAnnouncement(teamId: string, annId: string): Promise<any> {
  const { data } = await api.delete<ApiResponse<any>>(`/e-teams/${teamId}/announcements/${annId}`);
  return data.data;
}

export async function addETeamPhoto(teamId: string, payload: any): Promise<any> {
  const { data } = await api.post<ApiResponse<any>>(`/e-teams/${teamId}/gallery`, payload);
  return data.data;
}

export async function deleteETeamPhoto(teamId: string, photoId: string): Promise<any> {
  const { data } = await api.delete<ApiResponse<any>>(`/e-teams/${teamId}/gallery/${photoId}`);
  return data.data;
}

export async function addETeamReport(teamId: string, payload: any): Promise<any> {
  const { data } = await api.post<ApiResponse<any>>(`/e-teams/${teamId}/reports`, payload);
  return data.data;
}

export async function appointETeamChairperson(teamId: string, payload: { user_id: string; phone?: string }): Promise<any> {
  const { data } = await api.post<ApiResponse<any>>(`/e-teams/${teamId}/appoint-chairperson`, payload);
  return data.data;
}
