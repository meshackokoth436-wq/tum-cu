import { v4 as uuidv4 } from 'uuid';
import { BaseService } from '../../../core/base.service';
import { Leadership, LeadershipPosition, LeadershipAssignment, LeaderResponsibilitiesView } from '../interfaces/leadership.interface';
import { LeadershipRepository } from '../repositories/leadership.repository';
import { query, memoryDb } from '../../../config/database';
import { BusinessRuleError, NotFoundError } from '../../../utils/errors';

export class LeadershipService extends BaseService<Leadership> {
  private readonly leadershipRepo: LeadershipRepository;

  constructor(repository: LeadershipRepository = new LeadershipRepository()) {
    super(repository);
    this.leadershipRepo = repository;
  }

  private getRoleIdForPosition(positionCode: string): string {
    switch (positionCode) {
      case 'chairperson':
        return 'role-3';
      case 'first_vice_chairperson':
        return 'role-4';
      case 'second_vice_chairperson':
        return 'role-5';
      case 'secretary':
        return 'role-6';
      case 'treasurer':
        return 'role-7';
      case 'prayer_chairperson':
        return 'role-8';
      case 'worship_chairperson':
      case 'missions_chairperson':
      case 'discipleship_chairperson':
      case 'assets_chairperson':
      case 'publicity_chairperson':
      case 'non_residents_chairperson':
      case 'welfare_chairperson':
      case 'media_ministry_leader':
      default:
        return 'role-9';
    }
  }

  private syncUserRoleForLeadership(userId: string, roleId: string, positionId: string, activate: boolean): void {
    if (!memoryDb.tables.user_roles) {
      memoryDb.tables.user_roles = [];
    }

    if (activate) {
      const existingUr = memoryDb.tables.user_roles.find(
        (ur) => ur.user_id === userId && ur.role_id === roleId
      );
      if (existingUr) {
        existingUr.is_current = true;
        existingUr.scope_type = 'position';
        existingUr.scope_id = positionId;
      } else {
        memoryDb.tables.user_roles.push({
          id: uuidv4(),
          user_id: userId,
          role_id: roleId,
          scope_type: 'position',
          scope_id: positionId,
          is_current: true,
        });
      }
    } else {
      // Deactivate role when appointment ends or is revoked
      const existingUr = memoryDb.tables.user_roles.find(
        (ur) => ur.user_id === userId && ur.role_id === roleId
      );
      if (existingUr) {
        existingUr.is_current = false;
      }
    }
  }

  async listPositions(): Promise<LeadershipPosition[]> {
    return this.leadershipRepo.findPositions();
  }

  async listAssignments(filters?: { status?: string; positionId?: string; userId?: string }): Promise<LeadershipAssignment[]> {
    return this.leadershipRepo.findAssignments(filters);
  }

  async assignLeader(params: {
    positionId: string;
    userId: string;
    assignmentType: 'permanent' | 'acting' | 'co-opted' | 'temporary';
    academicYear?: string;
    notes?: string;
  }): Promise<{ id: string }> {
    const position = await this.leadershipRepo.findPositionById(params.positionId);
    if (!position) {
      throw new NotFoundError('Leadership Position');
    }

    // Check if user exists
    const users = await query<any[]>('SELECT * FROM users WHERE id = :id LIMIT 1', { id: params.userId });
    if (!users || users.length === 0) {
      throw new NotFoundError('User');
    }

    const roleId = this.getRoleIdForPosition(position.code);

    // Find if there is an existing active assignment for this position
    const existing = await this.leadershipRepo.findAssignments({ positionId: params.positionId, status: 'active' });
    if (existing.length > 0) {
      // Mark current assignment as ended or replaced
      const prev = existing[0];
      await this.leadershipRepo.updateAssignment(prev.id, {
        status: 'ended',
        notes: `Replaced by ${users[0].full_name} (${params.assignmentType})`,
      });

      // Revoke the active role for previous holder
      if (prev.user_id && prev.user_id !== params.userId) {
        this.syncUserRoleForLeadership(prev.user_id, roleId, params.positionId, false);
      }
    }

    const id = await this.leadershipRepo.createAssignment({
      position_id: params.positionId,
      user_id: params.userId,
      assignment_type: params.assignmentType,
      academic_year: params.academicYear || '2025/2026',
      status: 'active',
      notes: params.notes || `Appointed as ${position.name} (${params.assignmentType})`,
    });

    // Grant constitutional RBAC role to new leader
    this.syncUserRoleForLeadership(params.userId, roleId, params.positionId, true);

    // Audit log
    if (memoryDb.tables.audit_logs) {
      memoryDb.tables.audit_logs.unshift({
        id: uuidv4(),
        user_id: params.userId,
        action: 'leadership.appointed',
        entity_type: 'leadership_assignment',
        entity_id: id,
        old_values: null,
        new_values: JSON.stringify({
          position: position.name,
          roleId,
          type: params.assignmentType,
          academicYear: params.academicYear || '2025/2026',
        }),
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      });
    }

    return { id };
  }

  async appointReplacement(positionId: string, params: {
    userId: string;
    assignmentType: 'permanent' | 'acting' | 'co-opted' | 'temporary';
    notes?: string;
  }): Promise<{ id: string }> {
    const position = await this.leadershipRepo.findPositionById(positionId);
    if (!position) {
      throw new NotFoundError('Leadership Position');
    }
    const roleId = this.getRoleIdForPosition(position.code);

    // Find vacant assignment for this position
    const vacantAssignments = await this.leadershipRepo.findAssignments({ positionId, status: 'vacant' });
    if (vacantAssignments.length > 0) {
      // Update this vacant assignment
      await this.leadershipRepo.updateAssignment(vacantAssignments[0].id, {
        user_id: params.userId,
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: params.notes || `Appointed replacement under Article 9 (${params.assignmentType})`,
      });

      this.syncUserRoleForLeadership(params.userId, roleId, positionId, true);
      return { id: vacantAssignments[0].id };
    }

    return this.assignLeader({
      positionId,
      userId: params.userId,
      assignmentType: params.assignmentType,
      notes: params.notes,
    });
  }

  async updateAssignment(id: string, data: Partial<LeadershipAssignment>): Promise<void> {
    const existing = await this.leadershipRepo.findAssignmentById(id);
    if (!existing) {
      throw new NotFoundError('Leadership Assignment');
    }
    await this.leadershipRepo.updateAssignment(id, data);
  }

  async revokeAssignment(id: string, reason?: string): Promise<void> {
    const existing = await this.leadershipRepo.findAssignmentById(id);
    if (!existing) {
      throw new NotFoundError('Leadership Assignment');
    }
    await this.leadershipRepo.updateAssignment(id, {
      status: 'vacant',
      user_id: null,
      vacancy_reason: reason || 'Relieved of responsibility / Vacancy declared pursuant to Constitution Article 9',
      vacancy_date: new Date().toISOString().split('T')[0],
    });

    if (existing.user_id && existing.position_id) {
      const position = await this.leadershipRepo.findPositionById(existing.position_id);
      if (position) {
        const roleId = this.getRoleIdForPosition(position.code);
        this.syncUserRoleForLeadership(existing.user_id, roleId, existing.position_id, false);
      }
    }
  }

  async getMyResponsibilities(userId: string): Promise<LeaderResponsibilitiesView> {
    const users = await query<any[]>('SELECT * FROM users WHERE id = :id LIMIT 1', { id: userId });
    const user = users[0] || {
      id: userId,
      full_name: 'CU Leader',
      email: '',
      phone_number: '',
      admission_number: '',
    };

    const assignments = await this.leadershipRepo.findAssignments({ userId, status: 'active' });

    // Collect all responsibilities, permissions, and constitutional restrictions
    const allDuties: string[] = [];
    const allPerms: string[] = [];
    const allRestrictions: string[] = [];

    for (const a of assignments) {
      if (a.responsibilities) allDuties.push(...a.responsibilities);
      if (a.permissions) allPerms.push(...a.permissions);
      if (a.constitutional_restrictions) allRestrictions.push(...a.constitutional_restrictions);
    }

    // Attention items
    const applications = await query<any[]>('SELECT * FROM membership_applications WHERE status IN (\'submitted\', \'under_review\')');
    const vacancies = await this.leadershipRepo.findAssignments({ status: 'vacant' });
    const meetings = await query<any[]>('SELECT * FROM meetings WHERE status = \'awaiting_minutes\'');
    const financeResolutions = await query<any[]>('SELECT * FROM finance_resolutions WHERE status = \'pending_signatures\'');

    return {
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone_number,
        admission_number: user.admission_number,
      },
      positions: assignments,
      all_responsibilities: Array.from(new Set(allDuties)),
      permissions: Array.from(new Set(allPerms)),
      constitutional_restrictions: Array.from(new Set(allRestrictions)),
      pending_attention: {
        membership_applications: applications.length,
        leadership_vacancies: vacancies.length,
        meetings_awaiting_minutes: meetings.length,
        finance_awaiting_action: financeResolutions.length,
      },
    };
  }

  async getOverview() {
    const counts = await this.leadershipRepo.getCounts();
    const positions = await this.leadershipRepo.findPositions();
    const vacancies = await this.leadershipRepo.findAssignments({ status: 'vacant' });
    return {
      ...counts,
      positions_count: positions.length,
      vacancies,
      tenure_academic_year: '2025/2026',
      completion_percentage: 78,
    };
  }
}

