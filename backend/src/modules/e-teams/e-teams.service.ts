import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database';
import { AuthorizationError, BadRequestError, NotFoundError } from '../../utils/errors';

export interface ETeamRecord {
  id: string;
  code: string;
  name: string;
  short_name?: string;
  region: string;
  description: string;
  mission_purpose?: string;
  vision?: string;
  scripture_theme?: string;
  cover_image_url?: string;
  logo_url?: string;
  meeting_schedule?: string;
  meeting_venue?: string;
  chairperson_id?: string | null;
  chairperson_name?: string | null;
  chairperson_phone?: string | null;
  is_active: number | boolean;
}

export class ETeamsService {
  async getTeams(): Promise<ETeamRecord[]> {
    const rows = await query<ETeamRecord[]>(`SELECT * FROM evangelism_teams WHERE is_active = 1 ORDER BY name ASC`);
    return rows || [];
  }

  async getTeamById(idOrCode: string): Promise<any> {
    const rows = await query<ETeamRecord[]>(
      `SELECT * FROM evangelism_teams WHERE (id = :idOrCode OR code = :idOrCode) AND is_active = 1 LIMIT 1`,
      { idOrCode }
    );
    if (!rows?.length) throw new NotFoundError('Evangelism Team');
    const team = rows[0];

    const programmes = await query<any[]>(
      `SELECT id, team_id, title, activity_type, scheduled_date AS date, time_slot AS time,
              venue, description AS focus, leader_name AS leader, status, cover_image_url
         FROM eteam_programmes WHERE team_id = :teamId ORDER BY scheduled_date ASC, time_slot ASC`,
      { teamId: team.id }
    );
    const announcements = await query<any[]>(
      `SELECT id, team_id, title, content, priority, published_at AS posted_at, expires_at
         FROM eteam_announcements
        WHERE team_id = :teamId AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY published_at DESC`,
      { teamId: team.id }
    );
    const gallery = await query<any[]>(
      `SELECT id, team_id, title, event_date, image_url, google_photos_url, caption
         FROM eteam_gallery WHERE team_id = :teamId ORDER BY event_date DESC, created_at DESC`,
      { teamId: team.id }
    );
    const reports = await query<any[]>(
      `SELECT r.id, r.team_id, r.title, r.activity_date AS report_date,
              r.summary, CONCAT(COALESCE(r.location, ''), CASE WHEN r.location IS NULL OR r.location = '' THEN '' ELSE ' · ' END, COALESCE(r.outreach_type, '')) AS author,
              r.summary AS content, r.location, r.participants_count, r.souls_reached,
              r.outreach_type, r.outcomes, r.follow_up_notes
         FROM eteam_reports r
        WHERE r.team_id = :teamId ORDER BY r.activity_date DESC, r.created_at DESC`,
      { teamId: team.id }
    );

    return {
      ...team,
      banner_image_url: team.cover_image_url || null,
      scripture_verse: team.scripture_theme || null,
      meeting_day: team.meeting_schedule || null,
      meeting_time: null,
      motto: null,
      programmes: programmes || [],
      announcements: announcements || [],
      gallery: gallery || [],
      reports: reports || [],
    };
  }

  private async getUserRoles(userId: string) {
    return query<any[]>(
      `SELECT r.code AS role_code, ur.scope_type, ur.scope_id
         FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId AND ur.is_current = TRUE`,
      { userId }
    );
  }

  async verifyChairpersonScope(user: any, teamIdOrCode: string): Promise<ETeamRecord> {
    const team = await this.getTeamById(teamIdOrCode);
    const userId = user.sub || user.id;
    if (!userId) throw new AuthorizationError('A valid user session is required.');

    const roles = await this.getUserRoles(userId);
    const isSuperAdmin = roles.some((r) => r.role_code === 'super_admin') || user.permissions?.has?.('system.manage_roles');
    if (isSuperAdmin) return team;

    if (team.chairperson_id === userId) return team;

    const scoped = roles.some((r) => r.role_code === 'e_team_chairperson' && r.scope_type === 'e_team' && r.scope_id === team.id);
    if (scoped) return team;

    throw new AuthorizationError(`You are not authorized to manage ${team.name}. Your E-Team role is scoped to its appointed team only.`);
  }

  async addProgramme(teamId: string, data: any, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    if (!data.title?.trim()) throw new BadRequestError('Programme title is required');
    const id = `ep-${uuidv4().substring(0, 8)}`;
    await query(
      `INSERT INTO eteam_programmes
        (id, team_id, title, activity_type, scheduled_date, time_slot, venue, description, leader_name, created_by)
       VALUES (:id, :teamId, :title, :activity_type, :scheduled_date, :time_slot, :venue, :description, :leader_name, :created_by)`,
      {
        id, teamId: team.id, title: data.title.trim(), activity_type: data.activity_type || 'fellowship',
        scheduled_date: data.date || new Date().toISOString().slice(0, 10), time_slot: data.time || '5:00 PM - 7:00 PM',
        venue: data.venue || team.meeting_venue || 'TUMCU', description: data.focus || data.description || null,
        leader_name: data.leader || team.chairperson_name || null, created_by: user.sub,
      }
    );
    return { id, message: 'Programme added successfully' };
  }

  async updateProgramme(teamId: string, progId: string, data: any, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query(
      `UPDATE eteam_programmes SET title=:title, activity_type=:activity_type, scheduled_date=:scheduled_date,
       time_slot=:time_slot, venue=:venue, description=:description, leader_name=:leader_name, updated_at=NOW()
       WHERE id=:progId AND team_id=:teamId`,
      { progId, teamId: team.id, title: data.title, activity_type: data.activity_type || 'fellowship', scheduled_date: data.date, time_slot: data.time, venue: data.venue, description: data.focus || data.description || null, leader_name: data.leader || null }
    );
    return { progId, message: 'Programme updated successfully' };
  }

  async deleteProgramme(teamId: string, progId: string, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query('DELETE FROM eteam_programmes WHERE id=:progId AND team_id=:teamId', { progId, teamId: team.id });
    return { message: 'Programme deleted' };
  }

  async addAnnouncement(teamId: string, data: any, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    if (!data.title?.trim() || !data.content?.trim()) throw new BadRequestError('Announcement title and message are required');
    const id = `ea-${uuidv4().substring(0, 8)}`;
    await query(
      `INSERT INTO eteam_announcements (id, team_id, title, content, priority, published_at, created_by)
       VALUES (:id, :teamId, :title, :content, :priority, NOW(), :created_by)`,
      { id, teamId: team.id, title: data.title.trim(), content: data.content.trim(), priority: data.priority || 'normal', created_by: user.sub }
    );
    return { id, message: 'Announcement posted successfully' };
  }

  async deleteAnnouncement(teamId: string, annId: string, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query('DELETE FROM eteam_announcements WHERE id=:annId AND team_id=:teamId', { annId, teamId: team.id });
    return { message: 'Announcement removed' };
  }

  async addPhoto(teamId: string, data: any, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    if (!data.title?.trim() || !data.image_url?.trim()) throw new BadRequestError('Photo title and image URL are required');
    const id = `eg-${uuidv4().substring(0, 8)}`;
    await query(
      `INSERT INTO eteam_gallery (id, team_id, title, event_date, image_url, google_photos_url, caption, created_by)
       VALUES (:id, :teamId, :title, :event_date, :image_url, :google_photos_url, :caption, :created_by)`,
      { id, teamId: team.id, title: data.title.trim(), event_date: data.event_date || new Date().toISOString().slice(0, 10), image_url: data.image_url.trim(), google_photos_url: data.google_photos_url || null, caption: data.caption || null, created_by: user.sub }
    );
    return { id, message: 'Photo added to team gallery' };
  }

  async deletePhoto(teamId: string, photoId: string, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query('DELETE FROM eteam_gallery WHERE id=:photoId AND team_id=:teamId', { photoId, teamId: team.id });
    return { message: 'Photo removed from gallery' };
  }

  async addReport(teamId: string, data: any, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    if (!data.title?.trim() || !data.summary?.trim()) throw new BadRequestError('Report title and summary are required');
    const id = `er-${uuidv4().substring(0, 8)}`;
    await query(
      `INSERT INTO eteam_reports
       (id, team_id, title, activity_date, location, participants_count, souls_reached, outreach_type, summary, outcomes, follow_up_notes, submitted_by)
       VALUES (:id,:teamId,:title,:activity_date,:location,:participants_count,:souls_reached,:outreach_type,:summary,:outcomes,:follow_up_notes,:submitted_by)`,
      { id, teamId: team.id, title: data.title.trim(), activity_date: data.report_date || new Date().toISOString().slice(0,10), location: data.location || 'TUM / Mission field', participants_count: Number(data.participants_count) || 0, souls_reached: Number(data.souls_reached) || 0, outreach_type: data.outreach_type || 'evangelism', summary: data.summary.trim(), outcomes: data.content || data.outcomes || null, follow_up_notes: data.follow_up_notes || null, submitted_by: user.sub }
    );
    return { id, message: 'Activity report submitted successfully' };
  }

  async appointChairperson(teamId: string, userId: string, assignedBy: string, phone?: string) {
    const team = await this.getTeamById(teamId);
    const userRows = await query<any[]>(`SELECT id, full_name, phone_number FROM users WHERE id=:userId AND deleted_at IS NULL AND account_status='active' LIMIT 1`, { userId });
    if (!userRows?.length) throw new NotFoundError('Approved member');
    const member = userRows[0];
    const roleRows = await query<any[]>(`SELECT id FROM roles WHERE code='e_team_chairperson' LIMIT 1`);
    if (!roleRows?.length) throw new NotFoundError('E-Team Chairperson role');
    const roleId = roleRows[0].id;

    // End any previous appointment for this team.
    await query(`UPDATE user_roles SET is_current=FALSE, end_date=CURDATE() WHERE scope_type='e_team' AND scope_id=:teamId AND role_id=:roleId AND is_current=TRUE`, { teamId: team.id, roleId });
    await query(`UPDATE evangelism_teams SET chairperson_id=:userId, chairperson_name=:name, chairperson_phone=:phone, leader_id=:userId, updated_at=NOW() WHERE id=:teamId`, { teamId: team.id, userId: member.id, name: member.full_name, phone: phone || member.phone_number || null });

    const existing = await query<any[]>(`SELECT id FROM user_roles WHERE user_id=:userId AND role_id=:roleId AND scope_type='e_team' AND scope_id=:teamId LIMIT 1`, { userId: member.id, roleId, teamId: team.id });
    if (existing?.length) {
      await query(`UPDATE user_roles SET is_current=TRUE, start_date=CURDATE(), end_date=NULL, assigned_by=:assignedBy WHERE id=:id`, { id: existing[0].id, assignedBy });
    } else {
      await query(`INSERT INTO user_roles (id,user_id,role_id,scope_type,scope_id,start_date,is_current,assigned_by) VALUES (:id,:userId,:roleId,'e_team',:teamId,CURDATE(),TRUE,:assignedBy)`, { id: `ur-${uuidv4().slice(0, 8)}`, userId: member.id, roleId, teamId: team.id, assignedBy });
    }
    return { message: `${member.full_name} appointed as Chairperson for ${team.name}`, teamId: team.id, chairperson: member.full_name };
  }
}

export const eteamsService = new ETeamsService();
