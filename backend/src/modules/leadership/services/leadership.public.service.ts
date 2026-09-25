import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';

export interface PublicLeader {
  id: string;
  assignment_id: string;
  position_id: string;
  position_name: string;
  position_category: string;
  assignment_type: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  display_name: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  display_order: number;
}

export interface LeadershipProfileInput {
  display_name?: string | null;
  photo_url?: string | null;
  public_email?: string | null;
  public_phone?: string | null;
  bio?: string | null;
  display_order?: number;
  is_visible?: boolean;
}

export class LeadershipPublicService {
  async listVisible(): Promise<PublicLeader[]> {
    return query<PublicLeader[]>(`
      SELECT
        a.id AS assignment_id,
        a.id,
        a.position_id,
        p.name AS position_name,
        p.category AS position_category,
        a.assignment_type,
        a.academic_year,
        a.start_date,
        a.end_date,
        COALESCE(NULLIF(lp.display_name, ''), u.full_name) AS display_name,
        COALESCE(lp.photo_url, u.passport_photo_url) AS photo_url,
        COALESCE(NULLIF(lp.public_email, ''), u.email) AS email,
        COALESCE(NULLIF(lp.public_phone, ''), u.phone_number) AS phone,
        lp.bio,
        COALESCE(lp.display_order, p.display_order) AS display_order
      FROM leadership_assignments a
      INNER JOIN leadership_positions p ON p.id = a.position_id
      INNER JOIN users u ON u.id = a.user_id
      LEFT JOIN leadership_public_profiles lp ON lp.assignment_id = a.id
      WHERE a.status = 'active'
        AND u.account_status = 'active'
        AND (lp.is_visible IS NULL OR lp.is_visible = TRUE)
      ORDER BY COALESCE(lp.display_order, p.display_order) ASC, p.display_order ASC, u.full_name ASC
    `);
  }

  async getProfile(assignmentId: string): Promise<LeadershipProfileInput | null> {
    const rows = await query<any[]>(`
      SELECT
        lp.display_name,
        lp.photo_url,
        lp.public_email,
        lp.public_phone,
        lp.bio,
        lp.display_order,
        lp.is_visible,
        u.full_name AS user_full_name,
        u.passport_photo_url AS user_photo_url,
        u.email AS user_email,
        u.phone_number AS user_phone
      FROM leadership_assignments a
      INNER JOIN users u ON u.id = a.user_id
      LEFT JOIN leadership_public_profiles lp ON lp.assignment_id = a.id
      WHERE a.id = :assignmentId
      LIMIT 1`,
      { assignmentId }
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      display_name: r.display_name || r.user_full_name || '',
      photo_url: r.photo_url || r.user_photo_url || null,
      public_email: r.public_email || r.user_email || null,
      public_phone: r.public_phone || r.user_phone || null,
      bio: r.bio || null,
      display_order: r.display_order ?? 0,
      is_visible: r.is_visible !== false,
    };
  }

  async upsertProfile(assignmentId: string, data: LeadershipProfileInput): Promise<void> {
    const assignments = await query<any[]>(
      'SELECT id FROM leadership_assignments WHERE id = :assignmentId AND status = \'active\' LIMIT 1',
      { assignmentId }
    );
    if (!assignments.length) throw new Error('Active leadership assignment not found');

    if (data.display_name && data.display_name.length > 150) throw new Error('Display name is too long');
    if (data.public_email && data.public_email.length > 150) throw new Error('Public email is too long');
    if (data.public_phone && data.public_phone.length > 30) throw new Error('Public phone is too long');
    if (data.bio && data.bio.length > 1000) throw new Error('Leadership bio is too long');
    if (data.photo_url && !(data.photo_url.startsWith('/uploads/') || /^https:\/\//i.test(data.photo_url))) {
      throw new Error('Profile photo must be an uploaded site image or HTTPS URL');
    }
    const existing = await this.getProfile(assignmentId);
    if (existing) {
      await query(
        `UPDATE leadership_public_profiles
         SET display_name = :display_name,
             photo_url = :photo_url,
             public_email = :public_email,
             public_phone = :public_phone,
             bio = :bio,
             display_order = :display_order,
             is_visible = :is_visible
         WHERE assignment_id = :assignmentId`,
        {
          assignmentId,
          display_name: data.display_name?.trim() || null,
          photo_url: data.photo_url?.trim() || null,
          public_email: data.public_email?.trim() || null,
          public_phone: data.public_phone?.trim() || null,
          bio: data.bio?.trim() || null,
          display_order: Number.isFinite(data.display_order) ? data.display_order : 0,
          is_visible: data.is_visible !== false,
        }
      );
      return;
    }

    await query(
      `INSERT INTO leadership_public_profiles
       (id, assignment_id, display_name, photo_url, public_email, public_phone, bio, display_order, is_visible)
       VALUES (:id, :assignmentId, :display_name, :photo_url, :public_email, :public_phone, :bio, :display_order, :is_visible)`,
      {
        id: uuidv4(),
        assignmentId,
        display_name: data.display_name?.trim() || null,
        photo_url: data.photo_url?.trim() || null,
        public_email: data.public_email?.trim() || null,
        public_phone: data.public_phone?.trim() || null,
        bio: data.bio?.trim() || null,
        display_order: Number.isFinite(data.display_order) ? data.display_order : 0,
        is_visible: data.is_visible !== false,
      }
    );
  }
}
