import { Router } from 'express';
import { programmesController } from '../controllers/programmes.controller';
import { authenticate, loadPermissions, requireAnyPermission } from '../../../middleware/auth.middleware';

const router = Router();

// Public: view all programmes and calendar download
router.get('/', programmesController.list);
router.get('/calendar.ics', programmesController.downloadIcs);
router.get('/download-ics', programmesController.downloadIcs);
router.get('/monday-forecast', programmesController.getMondayForecast);
router.get('/:id', programmesController.getById);

// Admin / Leader operations: create, update, delete
router.use(authenticate, loadPermissions);
router.post(
  '/',
  requireAnyPermission('events.create', 'events.edit', 'system.manage_roles'),
  programmesController.create
);
router.put(
  '/:id',
  requireAnyPermission('events.edit', 'events.create', 'system.manage_roles'),
  programmesController.update
);
router.delete(
  '/:id',
  requireAnyPermission('events.delete', 'events.edit', 'system.manage_roles'),
  programmesController.remove
);

export default router;
