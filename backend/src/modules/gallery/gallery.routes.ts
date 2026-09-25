import { Router } from 'express';
import { galleryController } from './gallery.controller';
import { authenticate, loadPermissions } from '../../middleware/auth.middleware';

const router = Router();

// Strictly authenticated members only (Section 13)
router.use(authenticate, loadPermissions);

// Member routes
router.get('/albums', galleryController.listAlbums);
router.get('/albums/:id', galleryController.getAlbum);

// Media Ministry Leader & Super Admin routes
router.post('/albums', galleryController.createAlbum);
router.put('/albums/:id', galleryController.updateAlbum);
router.delete('/albums/:id', galleryController.deleteAlbum);

export default router;
