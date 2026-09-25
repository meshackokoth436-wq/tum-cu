import { Request, Response } from 'express';
import { BaseController } from '../../../core/base.controller';
import { Leadership } from '../interfaces/leadership.interface';
import { LeadershipService } from '../services/leadership.service';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { AuthenticationError, ValidationError } from '../../../utils/errors';
import { LeadershipPublicService } from '../services/leadership.public.service';

const service = new LeadershipService();
const base = new BaseController<Leadership>(service, 'Leadership');
const publicService = new LeadershipPublicService();

export const leadershipController = {
  list: base.list,
  getById: base.getById,
  create: base.create,
  update: base.update,
  remove: base.remove,

  listPositions: asyncHandler(async (_req: Request, res: Response) => {
    const positions = await service.listPositions();
    return sendSuccess(res, positions, 'Constitutional leadership positions retrieved');
  }),

  listAssignments: asyncHandler(async (req: Request, res: Response) => {
    const { status, positionId, userId } = req.query as Record<string, string>;
    const assignments = await service.listAssignments({ status, positionId, userId });
    return sendSuccess(res, assignments, 'Leadership assignments retrieved');
  }),

  assignLeader: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const result = await service.assignLeader(req.body);
    return sendSuccess(res, result, 'Leader assigned successfully', 201);
  }),

  appointReplacement: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const { positionId } = req.params;
    const result = await service.appointReplacement(positionId, req.body);
    return sendSuccess(res, result, 'Replacement appointed successfully', 200);
  }),

  updateAssignment: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    await service.updateAssignment(req.params.id, req.body);
    return sendSuccess(res, null, 'Leadership assignment updated');
  }),

  revokeAssignment: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const { reason } = req.body || {};
    await service.revokeAssignment(req.params.id, reason);
    return sendSuccess(res, null, 'Leadership assignment revoked');
  }),

  getMyResponsibilities: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const responsibilities = await service.getMyResponsibilities(req.user.sub);
    return sendSuccess(res, responsibilities, 'Leader responsibilities retrieved');
  }),

  listDirectory: asyncHandler(async (_req: Request, res: Response) => {
    const leaders = await publicService.listVisible();
    return sendSuccess(res, leaders, 'Leadership directory retrieved');
  }),

  getPublicProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await publicService.getProfile(req.params.assignmentId);
    return sendSuccess(res, profile, 'Leadership profile retrieved');
  }),

  upsertPublicProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const body = req.body || {};
    if (body.public_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.public_email)) {
      throw new ValidationError('A valid public email is required');
    }
    if (body.photo_url && typeof body.photo_url !== 'string') {
      throw new ValidationError('Invalid profile photo URL');
    }
    await publicService.upsertProfile(req.params.assignmentId, body);
    return sendSuccess(res, null, 'Leadership public profile saved');
  }),

  getOverview: asyncHandler(async (_req: Request, res: Response) => {
    const overview = await service.getOverview();
    return sendSuccess(res, overview, 'Leadership overview retrieved');
  }),
};

