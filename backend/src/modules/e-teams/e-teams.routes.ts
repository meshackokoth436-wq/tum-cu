import { Router } from 'express';
import { eteamsController } from './e-teams.controller';
import { authenticate, loadPermissions, requireAnyPermission } from '../../middleware/auth.middleware';

const router = Router();

// Public / Member Views
router.get('/', eteamsController.listTeams);
router.get('/:id', eteamsController.getTeam);

// Protected actions (Chairperson Portal & Admin)
router.use(authenticate, loadPermissions);

// Chairperson management routes (scoped within the service)
router.post('/:id/programmes', requireAnyPermission('eteams.manage_programmes', 'eteams.manage_team'), eteamsController.addProgramme);
router.put('/:id/programmes/:progId', requireAnyPermission('eteams.manage_programmes', 'eteams.manage_team'), eteamsController.updateProgramme);
router.delete('/:id/programmes/:progId', requireAnyPermission('eteams.manage_programmes', 'eteams.manage_team'), eteamsController.deleteProgramme);

router.post('/:id/announcements', requireAnyPermission('eteams.manage_announcements', 'eteams.manage_team'), eteamsController.addAnnouncement);
router.delete('/:id/announcements/:annId', requireAnyPermission('eteams.manage_announcements', 'eteams.manage_team'), eteamsController.deleteAnnouncement);

router.post('/:id/gallery', requireAnyPermission('eteams.manage_gallery', 'eteams.manage_team'), eteamsController.addPhoto);
router.delete('/:id/gallery/:photoId', requireAnyPermission('eteams.manage_gallery', 'eteams.manage_team'), eteamsController.deletePhoto);

router.post('/:id/reports', requireAnyPermission('eteams.manage_reports', 'eteams.manage_team'), eteamsController.addReport);

// Super Admin appointments
router.post('/:id/appoint-chairperson', requireAnyPermission('leadership.assign', 'system.manage_roles'), eteamsController.appointChairperson);

export default router;
