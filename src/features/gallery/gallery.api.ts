import { api, type ApiResponse } from '@/services/api';

export interface GalleryAlbum {
  id: string;
  title: string;
  category: string;
  event_type?: string;
  event_date: string;
  description?: string;
  cover_image_url: string;
  google_photos_url?: string;
  photo_count: number;
  is_published: number | boolean;
  created_by?: string;
  created_at: string;
}

export async function fetchGalleryAlbums(params?: {
  category?: string;
  include_unpublished?: boolean;
}): Promise<GalleryAlbum[]> {
  const { data } = await api.get<ApiResponse<GalleryAlbum[]>>('/gallery/albums', { params });
  return data.data;
}

export async function fetchGalleryAlbum(id: string): Promise<GalleryAlbum> {
  const { data } = await api.get<ApiResponse<GalleryAlbum>>(`/gallery/albums/${id}`);
  return data.data;
}

export async function createGalleryAlbum(payload: Partial<GalleryAlbum>): Promise<GalleryAlbum> {
  const { data } = await api.post<ApiResponse<GalleryAlbum>>('/gallery/albums', payload);
  return data.data;
}

export async function updateGalleryAlbum(id: string, payload: Partial<GalleryAlbum>): Promise<GalleryAlbum> {
  const { data } = await api.put<ApiResponse<GalleryAlbum>>(`/gallery/albums/${id}`, payload);
  return data.data;
}

export async function deleteGalleryAlbum(id: string): Promise<void> {
  await api.delete(`/gallery/albums/${id}`);
}
