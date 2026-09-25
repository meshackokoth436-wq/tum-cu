import { Request, Response } from 'express';
import { AuthService, RequestContext } from '../services/auth.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';
import { query } from '../../../config/database';
import { toPublicUser } from '../interfaces/user.interface';

const authService = new AuthService();
const REFRESH_COOKIE = 'tecump_refresh';
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: `${process.env.API_PREFIX || '/api/v1'}/auth`,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function readRefreshToken(req: Request): string | undefined {
  const cookie = req.headers.cookie || '';
  const match = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${REFRESH_COOKIE}=`));
  const cookieValue = match ? decodeURIComponent(match.slice(REFRESH_COOKIE.length + 1)) : undefined;
  return cookieValue;
}

function contextFrom(req: Request): RequestContext {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return sendSuccess(
      res,
      result,
      'Registration submitted. Your membership application is pending review.',
      201
    );
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, contextFrom(req));
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);
    return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 'Login successful');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = readRefreshToken(req);
    if (!refreshToken) throw new AuthenticationError('Invalid or expired refresh token');
    const result = await authService.refresh(refreshToken, contextFrom(req));
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);
    return sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = readRefreshToken(req);
    if (refreshToken) await authService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    return sendSuccess(res, null, 'Logged out successfully');
  }),

  logoutEverywhere: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    await authService.logoutEverywhere(req.user.sub);
    return sendSuccess(res, null, 'Logged out of all devices');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    let user = await authService.getUserById(req.user.sub);
    if (!user || user.deleted_at) {
      const email = String((req.user as any)?.email || '').toLowerCase().trim();
      if (email) {
        user = await authService.getUserById(email);
      }
    }
    if (!user || user.deleted_at) {
      throw new AuthenticationError('User no longer exists');
    }

    const roles = await query<{ code: string; name: string; category: string; scope_type: string; scope_id: string | null }[]>(
      `SELECT r.code, r.name, r.category, ur.scope_type, ur.scope_id
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId AND ur.is_current = TRUE
        ORDER BY r.category, r.name`,
      { userId: req.user.sub }
    );

    const publicUser = toPublicUser(user);
    const isProfileComplete = Boolean(user.admission_number && (user as any).declaration_accepted);
    return sendSuccess(
      res,
      {
        ...publicUser,
        user: publicUser,
        sub: user.id,
        username: user.username,
        profile_completed: isProfileComplete,
        declaration_accepted: Boolean((user as any).declaration_accepted),
        permissions: Array.from(req.permissions ?? []),
        roles,
      },
      'Current session'
    );
  }),

  completePersonalInfo: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const userId = req.user.sub;
    const {
      admission_number,
      full_name,
      phone_number,
      gender,
      course,
      department,
      school,
      year_of_study,
      campus_residence,
      date_of_salvation,
      baptism_status,
      evangelism_team,
      declaration_accepted,
      declaration_signature,
      membership_category,
    } = req.body || {};

    const isGlobalOrAssociate = membership_category === 'associate' || membership_category === 'special';
    const finalAdmission = admission_number && String(admission_number).trim()
      ? String(admission_number).trim().toUpperCase()
      : isGlobalOrAssociate
      ? ('GLB-' + String(userId).slice(0, 8).toUpperCase())
      : null;

    if (!finalAdmission) {
      return res.status(400).json({
        success: false,
        message: 'Admission number or Member Affiliation ID is required',
        data: null,
      });
    }

    if (!declaration_accepted) {
      return res.status(400).json({
        success: false,
        message: 'You must read and accept the TUMCU Doctrinal Basis and Constitutional Declaration to complete your profile',
        data: null,
      });
    }

    const result = await authService.completePersonalInfo(userId, {
      admission_number: finalAdmission,
      full_name: full_name?.trim(),
      phone_number: phone_number?.trim(),
      gender: gender || null,
      course: course?.trim() || null,
      department: department?.trim() || null,
      school: school?.trim() || null,
      year_of_study: year_of_study ? Number(year_of_study) : null,
      campus_residence: campus_residence?.trim() || null,
      date_of_salvation: date_of_salvation || null,
      baptism_status: baptism_status || 'not_baptized',
      evangelism_team: evangelism_team || null,
      declaration_accepted: true,
      declaration_signature: declaration_signature || full_name,
    });

    return sendSuccess(res, result, 'Personal information saved and declaration signed successfully');
  }),
};
