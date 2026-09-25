import { Request, Response } from 'express';
import { libraryService } from './library.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { BadRequestError } from '../../utils/errors';

export const libraryController = {
  listResources: asyncHandler(async (req: Request, res: Response) => {
    const { category, search } = req.query;
    const resources = await libraryService.getResources({ category: category as string, search: search as string });
    return sendSuccess(res, resources, 'E-Library resources retrieved');
  }),

  listPhysicalBooks: async (req: Request, res: Response) => {
    return sendSuccess(res, await libraryService.getPhysicalBooks(String(req.query.search || '')), 'Physical books retrieved');
  },
  createPhysicalBook: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await libraryService.createPhysicalBook({ ...req.body, created_by: req.user!.sub }), 'Physical book added', 201);
  }),
  updatePhysicalBook: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await libraryService.updatePhysicalBook(req.params.id, req.body), 'Physical book updated');
  }),
  getResource: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await libraryService.getResourceById(req.params.id), 'E-Library resource details');
  }),

  createResource: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await libraryService.createResource(req.body), 'E-Library resource added', 201);
  }),

  updateResource: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await libraryService.updateResource(req.params.id, req.body), 'E-Library resource updated');
  }),

  deleteResource: asyncHandler(async (req: Request, res: Response) => {
    await libraryService.deleteResource(req.params.id);
    return sendSuccess(res, null, 'E-Library resource removed');
  }),

  searchBorrowers: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await libraryService.searchBorrowers(String(req.query.search || '')), 'Approved members found');
  }),

  createPhysicalLoan: asyncHandler(async (req: Request, res: Response) => {
    const { book_title, physical_book_id, user_id, due_date, notes } = req.body || {};
    if (!book_title || !user_id || !due_date) {
      throw new BadRequestError('Book title, borrower and return date are required');
    }
    return sendSuccess(
      res,
      await libraryService.createPhysicalLoan({
        book_title,
        physical_book_id,
        user_id,
        due_date,
        notes,
        issued_by: req.user!.sub,
      }),
      'Physical book loan recorded',
      201
    );
  }),

  listPhysicalLoans: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(
      res,
      await libraryService.getPhysicalLoans({ status: req.query.status as string }),
      'Physical borrowing register retrieved'
    );
  }),

  myPhysicalLoans: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await libraryService.getPhysicalLoans({ userId: req.user!.sub }), 'Your borrowing history');
  }),

  returnPhysicalLoan: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(
      res,
      await libraryService.returnPhysicalLoan(req.params.id, req.user!.sub),
      'Book return recorded'
    );
  }),

  stats: asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(res, await libraryService.getLibraryStats(), 'Library statistics retrieved');
  }),
};
