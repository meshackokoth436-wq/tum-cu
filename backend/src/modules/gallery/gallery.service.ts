import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database';
import { BadRequestError, NotFoundError } from '../../utils/errors';

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

export class GalleryService {
  async getAlbums(category?: string, includeUnpublished = false): Promise<GalleryAlbum[]> {
    let sql = 'SELECT * FROM gallery_albums WHERE 1=1';
    const params: Record<string, any> = {};

    if (!includeUnpublished) {
      sql += ' AND is_published = 1';
    }

    if (category && category !== 'all') {
      sql += ' AND category = :category';
      params.category = category;
    }

    sql += ' ORDER BY event_date DESC, created_at DESC';
    const rows = await query<GalleryAlbum[]>(sql, params);
    return rows || [];
  }

  async getAlbumById(id: string): Promise<GalleryAlbum> {
    const rows = await query<GalleryAlbum[]>('SELECT * FROM gallery_albums WHERE id = :id LIMIT 1', { id });
    if (!rows || rows.length === 0) throw new NotFoundError('Gallery Album');
    return rows[0];
  }

  async createAlbum(data: Partial<GalleryAlbum>, creatorId?: string): Promise<GalleryAlbum> {
    if (!data.title || !data.cover_image_url) {
      throw new BadRequestError('Album title and cover image URL are required');
    }

    if (data.google_photos_url && !data.google_photos_url.startsWith('http://') && !data.google_photos_url.startsWith('https://')) {
      throw new BadRequestError('Google Photos link must be a valid URL starting with http:// or https://');
    }

    const id = `album-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    const eventDate = data.event_date || now.split('T')[0];

    await query(
      `INSERT INTO gallery_albums (
        id, title, category, event_type, event_date, description,
        cover_image_url, google_photos_url, photo_count, is_published,
        created_by, created_at
      ) VALUES (
        :id, :title, :category, :event_type, :event_date, :description,
        :cover_image_url, :google_photos_url, :photo_count, :is_published,
        :created_by, :created_at
      )`,
      {
        id,
        title: data.title,
        category: data.category || 'Special Events',
        event_type: data.event_type || 'service',
        event_date: eventDate,
        description: data.description || null,
        cover_image_url: data.cover_image_url,
        google_photos_url: data.google_photos_url || null,
        photo_count: Number(data.photo_count) || 0,
        is_published: data.is_published !== false ? 1 : 0,
        created_by: creatorId || null,
        created_at: now,
      }
    );

    return this.getAlbumById(id);
  }

  async updateAlbum(id: string, data: Partial<GalleryAlbum>): Promise<GalleryAlbum> {
    const existing = await this.getAlbumById(id);

    if (data.google_photos_url && !data.google_photos_url.startsWith('http://') && !data.google_photos_url.startsWith('https://')) {
      throw new BadRequestError('Google Photos link must be a valid URL starting with http:// or https://');
    }

    await query(
      `UPDATE gallery_albums SET
        title = :title,
        category = :category,
        event_type = :event_type,
        event_date = :event_date,
        description = :description,
        cover_image_url = :cover_image_url,
        google_photos_url = :google_photos_url,
        photo_count = :photo_count,
        is_published = :is_published,
        updated_at = :now
      WHERE id = :id`,
      {
        id,
        title: data.title ?? existing.title,
        category: data.category ?? existing.category,
        event_type: data.event_type ?? existing.event_type,
        event_date: data.event_date ?? existing.event_date,
        description: data.description !== undefined ? data.description : existing.description,
        cover_image_url: data.cover_image_url ?? existing.cover_image_url,
        google_photos_url: data.google_photos_url !== undefined ? data.google_photos_url : existing.google_photos_url,
        photo_count: data.photo_count !== undefined ? Number(data.photo_count) : existing.photo_count,
        is_published: data.is_published !== undefined ? (data.is_published ? 1 : 0) : existing.is_published,
        now: new Date().toISOString(),
      }
    );

    return this.getAlbumById(id);
  }

  async deleteAlbum(id: string): Promise<void> {
    await this.getAlbumById(id);
    await query('DELETE FROM gallery_albums WHERE id = :id', { id });
  }
}

export const galleryService = new GalleryService();
