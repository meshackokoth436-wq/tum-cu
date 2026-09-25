import { Request, Response } from 'express';
import { landingMediaService } from './landing-media.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { ValidationError } from '../../utils/errors';

export const landingMediaController = {
  getMedia: asyncHandler(async (_req: Request, res: Response) => {
    const data = landingMediaService.getMedia();
    return sendSuccess(res, data, 'Landing media configuration retrieved');
  }),

  updateMedia: asyncHandler(async (req: Request, res: Response) => {
    const actorName = (req.user as any)?.username || (req.user as any)?.email || 'Administrator';
    const updated = await landingMediaService.updateMedia(req.body, actorName);
    return sendSuccess(res, updated, 'Landing media configuration updated globally');
  }),

  uploadImage: asyncHandler(async (req: Request, res: Response) => {
    const { image, base64, filename } = req.body || {};
    const rawData = image || base64;
    if (!rawData || typeof rawData !== 'string') {
      throw new ValidationError('Image data is required (dataUrl or base64 string)');
    }
    let result;
    try {
      result = landingMediaService.uploadImage(rawData, filename || 'media.jpg');
    } catch (error) {
      throw new ValidationError(error instanceof Error ? error.message : 'Invalid image upload');
    }
    return sendSuccess(res, result, 'Image uploaded successfully', 201);
  }),

  resetMedia: asyncHandler(async (req: Request, res: Response) => {
    const actorName = (req.user as any)?.username || (req.user as any)?.email || 'Administrator';
    const resetConfig = await landingMediaService.resetToDefault(actorName);
    return sendSuccess(res, resetConfig, 'Landing media restored to TUMCU defaults');
  }),
};
