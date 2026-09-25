import { Router } from 'express';
import { libraryController } from './library.controller';
import { authenticate, loadPermissions, requireAnyPermission } from '../../middleware/auth.middleware';

const router = Router();

// E-Library is public to browse. Only digital resources are returned.
router.get('/physical-books', requireAnyPermission('library.view_reports', 'library.checkout', 'library.edit'), libraryController.listPhysicalBooks);
router.post('/physical-books', requireAnyPermission('library.edit'), libraryController.createPhysicalBook);
router.put('/physical-books/:id', requireAnyPermission('library.edit'), libraryController.updatePhysicalBook);
router.get('/resources', libraryController.listResources);
router.get('/resources/:id', libraryController.getResource);

router.use(authenticate);

// A member sees only their own physical borrowing history.
router.get('/my-physical-loans', libraryController.myPhysicalLoans);

router.use(loadPermissions);

// Librarian / authorised administrators manage E-Library resources.
router.post('/resources', requireAnyPermission('library.create', 'library.edit'), libraryController.createResource);
router.put('/resources/:id', requireAnyPermission('library.edit'), libraryController.updateResource);
router.delete('/resources/:id', requireAnyPermission('library.delete', 'library.edit'), libraryController.deleteResource);

// Physical catalogue is optional; unlisted titles can still be entered directly at lending time.
router.get('/borrowers', requireAnyPermission('library.checkout', 'library.edit'), libraryController.searchBorrowers);
router.post('/physical-loans', requireAnyPermission('library.checkout', 'library.edit'), libraryController.createPhysicalLoan);
router.get('/physical-loans', requireAnyPermission('library.view_reports', 'library.checkout', 'library.edit'), libraryController.listPhysicalLoans);
router.post('/physical-loans/:id/return', requireAnyPermission('library.return', 'library.checkout', 'library.edit'), libraryController.returnPhysicalLoan);
router.get('/reports/stats', requireAnyPermission('library.view_reports', 'library.checkout', 'library.edit'), libraryController.stats);

export default router;
