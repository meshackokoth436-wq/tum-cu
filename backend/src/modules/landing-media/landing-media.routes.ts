import { Router } from 'express';
import { landingMediaController } from './landing-media.controller';
import { authenticate, loadPermissions, requireAnyPermission } from '../../middleware/auth.middleware';

const router = Router();

// Publicly readable by all users and devices
router.get('/', landingMediaController.getMedia);

// Protected: only leaders and administrators can modify media globally
router.put(
  '/',
  authenticate,
  loadPermissions,
  requireAnyPermission('system.manage_roles', 'leadership.assign', 'events.approve', 'content.publish'),
  landingMediaController.updateMedia
);

router.post(
  '/upload',
  authenticate,
  loadPermissions,
  requireAnyPermission('system.manage_roles', 'leadership.assign', 'events.approve', 'content.publish', 'media.manage_ministries'),
  landingMediaController.uploadImage
);

router.post(
  '/reset',
  authenticate,
  loadPermissions,
  requireAnyPermission('system.manage_roles', 'leadership.assign', 'events.approve', 'content.publish'),
  landingMediaController.resetMedia
);

export default router;
