import { Request, Response } from 'express';
import { galleryService } from './gallery.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';

export const galleryController = {
  // Member: Get Albums (only published unless admin/leader)
  listAlbums: asyncHandler(async (req: Request, res: Response) => {
    const { category, include_unpublished } = req.query;
    const isLeader =
      req.permissions?.has('*') ||
      req.permissions?.has('gallery.manage') ||
      req.permissions?.has('media.manage');

    const includeUnpublished = isLeader && include_unpublished === 'true';
    const albums = await galleryService.getAlbums(category as string, includeUnpublished);
    return sendSuccess(res, albums, 'Member gallery albums retrieved');
  }),

  getAlbum: asyncHandler(async (req: Request, res: Response) => {
    const album = await galleryService.getAlbumById(req.params.id);
    return sendSuccess(res, album, 'Gallery album details');
  }),

  // Media Ministry Leader / Admin: Create Album
  createAlbum: asyncHandler(async (req: Request, res: Response) => {
    const album = await galleryService.createAlbum(req.body, req.user!.sub);
    return sendSuccess(res, album, 'Gallery album created successfully', 201);
  }),

  // Media Ministry Leader / Admin: Update Album
  updateAlbum: asyncHandler(async (req: Request, res: Response) => {
    const album = await galleryService.updateAlbum(req.params.id, req.body);
    return sendSuccess(res, album, 'Gallery album updated successfully');
  }),

  // Media Ministry Leader / Admin: Delete Album
  deleteAlbum: asyncHandler(async (req: Request, res: Response) => {
    await galleryService.deleteAlbum(req.params.id);
    return sendSuccess(res, null, 'Gallery album deleted');
  }),
};
