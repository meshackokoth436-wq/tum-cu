import { Request, Response } from 'express';
import { MembershipService } from '../../membership/services/membership.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError, AuthorizationError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

const membershipService = new MembershipService();

export class AdminApplicationsController {
  /**
   * List pending / reviewed membership applications with full server-side logging
   * of the incoming user permissions, query parameters, and result count.
   */
  listApplications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    const username = req.user?.username;
    const permissions = Array.from(req.permissions ?? []);
    const { status, page, pageSize, search } = req.query as Record<string, string>;

    logger.info(
      {
        endpoint: req.originalUrl,
        method: req.method,
        userId,
        username,
        permissionsCount: permissions.length,
        hasReviewPerm: permissions.includes('membership.review') || permissions.includes('*'),
        hasApprovePerm: permissions.includes('membership.approve') || permissions.includes('*'),
        filters: { status, page, pageSize, search },
      },
      '[AdminApplications] Received request to list applications'
    );

    // Permission assertion
    const hasPermission =
      permissions.includes('membership.review') ||
      permissions.includes('membership.approve') ||
      permissions.includes('system.manage_roles') ||
      permissions.includes('*');

    if (!hasPermission) {
      logger.warn(
        { userId, permissions },
        '[AdminApplications] Blocked request: User lacks membership.review or membership.approve'
      );
      throw new AuthorizationError('Insufficient permissions to review membership applications');
    }

    const currentPage = Number(page) || 1;
    const currentPageSize = Number(pageSize) || 50;

    const result = await membershipService.listApplications(
      status,
      currentPage,
      currentPageSize
    );

    let rows: any[] = (result.rows as any[]) || [];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r: any) =>
        String(r.full_name || '').toLowerCase().includes(q) ||
        String(r.email || '').toLowerCase().includes(q) ||
        String(r.admission_number || '').toLowerCase().includes(q)
      );
    }

    logger.info(
      {
        totalRecords: result.total,
        returnedRows: rows.length,
        page: currentPage,
        statusFilter: status || 'all',
      },
      '[AdminApplications] Returning applicant records to dashboard'
    );

    return sendSuccess(res, rows, 'Membership applications retrieved successfully', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  });

  /**
   * Approve an application and admit the applicant as an official member
   */
  approve = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const applicationId = req.params.id;
    const reviewerId = req.user.sub;

    logger.info(
      { applicationId, reviewerId },
      '[AdminApplications] Processing application approval'
    );

    const membership = await membershipService.approveApplication(applicationId, reviewerId);

    logger.info(
      { applicationId, reviewerId, membershipNumber: membership?.membership_number },
      '[AdminApplications] Successfully approved applicant and generated membership number'
    );

    return sendSuccess(res, membership, 'Membership application approved successfully');
  });

  /**
   * Reject an application with explicit reason
   */
  reject = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const applicationId = req.params.id;
    const reviewerId = req.user.sub;
    const { rejectionReason } = req.body;

    logger.info(
      { applicationId, reviewerId, rejectionReason },
      '[AdminApplications] Processing application rejection'
    );

    const application = await membershipService.rejectApplication(
      applicationId,
      reviewerId,
      rejectionReason || 'Application details could not be constitutionally verified'
    );

    logger.info(
      { applicationId, reviewerId },
      '[AdminApplications] Successfully marked application as rejected'
    );

    return sendSuccess(res, application, 'Membership application rejected');
  });
}

export const adminApplicationsController = new AdminApplicationsController();
