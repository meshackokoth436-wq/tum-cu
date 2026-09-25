import { Router } from 'express';
import { ministriesController, ministryDetailsController } from '../controllers/ministries.controller';
import { authenticate, loadPermissions, requireAnyPermission } from '../../../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', ministriesController.list);
router.get('/leader-portal', authenticate, ministryDetailsController.getLeaderPortal);
router.get('/:id/details', ministryDetailsController.get);
router.get('/:id/members', authenticate, ministryDetailsController.getMembers);
router.get('/:id/sessions', authenticate, ministryDetailsController.getSessions);
router.get('/:id', ministriesController.getById);

// Ministry leader / Admin actions
router.post('/:id/sessions', authenticate, loadPermissions, requireAnyPermission('system.manage_roles', 'ministries.edit'), ministryDetailsController.createSession);
router.post('/:id/assign-leader', authenticate, loadPermissions, requireAnyPermission('system.manage_roles', 'leadership.assign'), ministryDetailsController.assignLeader);
router.put('/:id/background', authenticate, loadPermissions, requireAnyPermission('system.manage_roles', 'ministries.edit'), ministryDetailsController.updateBackground);

// Full CRUD for Super Admin / authorized leaders
router.post('/', authenticate, loadPermissions, requireAnyPermission('ministries.create', 'system.manage_roles'), ministriesController.create);
router.put('/:id', authenticate, loadPermissions, requireAnyPermission('ministries.edit', 'system.manage_roles'), ministriesController.update);
router.delete('/:id', authenticate, loadPermissions, requireAnyPermission('ministries.delete', 'system.manage_roles'), ministriesController.remove);

export default router;
