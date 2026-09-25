import { v4 as uuidv4 } from 'uuid';
import { query, pool } from '../../config/database';
import { BadRequestError, NotFoundError } from '../../utils/errors';

export interface LibraryResourceRecord {
  id: string;
  title: string;
  author: string;
  category: string;
  description?: string | null;
  cover_image_url?: string | null;
  file_url?: string | null;
  is_digital: number | boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface PhysicalLoanRecord {
  id: string;
  book_title: string;
  user_id: string;
  borrower_name: string;
  borrower_email?: string | null;
  borrower_phone?: string | null;
  borrower_admission_number?: string | null;
  borrowed_at: string;
  due_at: string;
  returned_at?: string | null;
  status: 'active' | 'returned';
  notes?: string | null;
  issued_by: string;
  returned_by?: string | null;
}

function decorateLoan(row: any) {
  if (!row) return row;
  const today = new Date();
  const due = new Date(`${String(row.due_at).slice(0, 10)}T23:59:59`);
  const status = row.status === 'returned'
    ? 'RETURNED'
    : due.getTime() < today.getTime()
      ? 'OVERDUE'
      : due.getTime() <= today.getTime() + 3 * 86400000
        ? 'DUE_SOON'
        : 'ACTIVE';
  return { ...row, display_status: status };
}

export class LibraryService {
  /** Only digital resources are catalogued in TECUMP. */
  async getResources(params: { type?: string; category?: string; search?: string }): Promise<LibraryResourceRecord[]> {
    let sql = `SELECT id, title, author, category, description, cover_image_url, file_url,
                      is_digital, created_at, updated_at
                 FROM library_resources
                WHERE (is_digital = 1 OR file_url IS NOT NULL)`;
    const queryParams: Record<string, any> = {};

    if (params.category && params.category !== 'all') {
      sql += ' AND category = :category';
      queryParams.category = params.category;
    }
    if (params.search?.trim()) {
      sql += ' AND (title LIKE :search OR author LIKE :search OR description LIKE :search)';
      queryParams.search = `%${params.search.trim()}%`;
    }
    sql += ' ORDER BY title ASC';
    const rows = await query<LibraryResourceRecord[]>(sql, queryParams);
    return rows || [];
  }

  async getResourceById(id: string): Promise<LibraryResourceRecord> {
    const rows = await query<LibraryResourceRecord[]>(
      `SELECT id, title, author, category, description, cover_image_url, file_url,
              is_digital, created_at, updated_at
         FROM library_resources
        WHERE id = :id AND (is_digital = 1 OR file_url IS NOT NULL)
        LIMIT 1`,
      { id }
    );
    if (!rows?.length) throw new NotFoundError('E-Library Resource');
    return rows[0];
  }

  async createResource(data: Partial<LibraryResourceRecord>): Promise<LibraryResourceRecord> {
    if (!data.title?.trim()) throw new BadRequestError('Resource title is required');
    if (!data.file_url?.trim()) throw new BadRequestError('A downloadable/viewable file URL is required for an E-Library resource');

    const id = `lib-${uuidv4().substring(0, 8)}`;
    await query(
      `INSERT INTO library_resources
        (id, title, author, category, description, cover_image_url, file_url, is_digital, created_at)
       VALUES
        (:id, :title, :author, :category, :description, :cover_image_url, :file_url, 1, :created_at)`,
      {
        id,
        title: data.title.trim(),
        author: data.author?.trim() || 'TUMCU Library',
        category: data.category?.trim() || 'General',
        description: data.description?.trim() || null,
        cover_image_url: data.cover_image_url || null,
        file_url: data.file_url.trim(),
        created_at: new Date().toISOString(),
      }
    );
    return this.getResourceById(id);
  }

  async updateResource(id: string, data: Partial<LibraryResourceRecord>): Promise<LibraryResourceRecord> {
    const existing = await this.getResourceById(id);
    await query(
      `UPDATE library_resources SET
         title = :title,
         author = :author,
         category = :category,
         description = :description,
         cover_image_url = :cover_image_url,
         file_url = :file_url,
         is_digital = 1,
         updated_at = :updated_at
       WHERE id = :id`,
      {
        id,
        title: data.title?.trim() || existing.title,
        author: data.author?.trim() || existing.author,
        category: data.category?.trim() || existing.category,
        description: data.description !== undefined ? data.description : existing.description,
        cover_image_url: data.cover_image_url !== undefined ? data.cover_image_url : existing.cover_image_url,
        file_url: data.file_url?.trim() || existing.file_url,
        updated_at: new Date().toISOString(),
      }
    );
    return this.getResourceById(id);
  }

  async deleteResource(id: string): Promise<void> {
    await this.getResourceById(id);
    await query('DELETE FROM library_resources WHERE id = :id', { id });
  }

  async searchBorrowers(search: string) {
    const term = search?.trim();
    if (!term || term.length < 2) return [];
    const rows = await query<any[]>(
      `SELECT id, full_name, email, phone_number, admission_number
         FROM users
        WHERE deleted_at IS NULL
          AND account_status = 'active'
          AND (
            full_name LIKE :term OR email LIKE :term OR phone_number LIKE :term OR admission_number LIKE :term
          )
        ORDER BY full_name ASC
        LIMIT 20`,
      { term: `%${term}%` }
    );
    return rows || [];
  }

  async getPhysicalBooks(search?: string) {
    const term = search?.trim();
    const rows = await query<any[]>(`SELECT id, title, author, category, total_copies, available_copies, is_active, created_at,
      (total_copies - available_copies) AS on_loan_copies
      FROM library_physical_books WHERE is_active = 1 ${term ? 'AND (title LIKE :term OR author LIKE :term OR category LIKE :term)' : ''}
      ORDER BY title ASC`, term ? { term: `%${term}%` } : {});
    return rows || [];
  }

  async createPhysicalBook(data: { title: string; author?: string; category?: string; total_copies: number; created_by: string }) {
    const title = data.title?.trim();
    const copies = Number(data.total_copies);
    if (!title) throw new BadRequestError('Book title is required');
    if (!Number.isInteger(copies) || copies < 1 || copies > 10000) throw new BadRequestError('Total copies must be a whole number between 1 and 10,000');
    const existing = await query<any[]>(`SELECT id FROM library_physical_books WHERE LOWER(title) = LOWER(:title) AND is_active = 1 LIMIT 1`, { title });
    if (existing?.length) throw new BadRequestError('This physical book is already in the catalogue. Edit its copy count instead.');
    const id = `pbook-${uuidv4().substring(0, 12)}`;
    await query(`INSERT INTO library_physical_books (id,title,author,category,total_copies,available_copies,created_by) VALUES (:id,:title,:author,:category,:total,:total,:created_by)`, { id, title, author: data.author?.trim() || null, category: data.category?.trim() || null, total: copies, created_by: data.created_by });
    const rows = await this.getPhysicalBooks(title);
    return rows.find((r:any) => r.id === id) || rows[0];
  }

  async updatePhysicalBook(id: string, data: { title?: string; author?: string; category?: string; total_copies: number }) {
    const rows = await query<any[]>(`SELECT id, title, author, category, total_copies, available_copies FROM library_physical_books WHERE id = :id AND is_active = 1 LIMIT 1`, { id });
    if (!rows?.length) throw new NotFoundError('Physical book');
    const current = rows[0];
    const total = Number(data.total_copies);
    const onLoan = Number(current.total_copies) - Number(current.available_copies);
    if (!Number.isInteger(total) || total < 1 || total > 10000) throw new BadRequestError('Total copies must be a whole number between 1 and 10,000');
    if (total < onLoan) throw new BadRequestError(`Cannot set total copies below the ${onLoan} copy/copies currently on loan.`);
    const available = total - onLoan;
    await query(`UPDATE library_physical_books SET title=:title, author=:author, category=:category, total_copies=:total, available_copies=:available WHERE id=:id`, {
      id, title: data.title?.trim() || current.title, author: data.author?.trim() || null, category: data.category?.trim() || null, total, available,
    });
    const updated = await this.getPhysicalBooks(data.title?.trim() || current.title);
    return updated.find((r:any) => r.id === id) || updated[0];
  }

  async createPhysicalLoan(params: {
    book_title: string;
    physical_book_id?: string;

    user_id: string;
    due_date: string;
    notes?: string;
    issued_by: string;
  }) {
    const title = params.book_title?.trim();
    if (!title) throw new BadRequestError('Book title is required');
    if (!params.due_date) throw new BadRequestError('Return date is required');

    const due = new Date(`${params.due_date}T23:59:59`);
    if (Number.isNaN(due.getTime())) throw new BadRequestError('Invalid return date');
    if (due.getTime() < Date.now()) throw new BadRequestError('Return date cannot be in the past');

    const users = await query<any[]>(
      `SELECT id, full_name, email, phone_number, admission_number
         FROM users
        WHERE id = :userId AND deleted_at IS NULL AND account_status = 'active'
        LIMIT 1`,
      { userId: params.user_id }
    );
    if (!users?.length) throw new NotFoundError('Approved member');
    const borrower = users[0];

    let physicalBookId = params.physical_book_id || null;
    const id = `loan-${uuidv4().substring(0, 12)}`;
    let catalogueConnection: any = null;
    try {
      if (physicalBookId) {
        catalogueConnection = await pool.getConnection();
        await catalogueConnection.beginTransaction();
        const [bookRows] = await catalogueConnection.query(`SELECT id, title, available_copies FROM library_physical_books WHERE id = :id AND is_active = 1 FOR UPDATE`, { id: physicalBookId });
        if (!(bookRows as any[])?.length) throw new NotFoundError('Physical book');
        if (Number((bookRows as any[])[0].available_copies) < 1) throw new BadRequestError('No available copies of this book.');
        await catalogueConnection.query(`UPDATE library_physical_books SET available_copies = available_copies - 1 WHERE id = :id AND is_active = 1 AND available_copies > 0`, { id: physicalBookId });
      }

      // A title not in the catalogue can still be issued; the lending register stores the typed title.
      if (!physicalBookId) physicalBookId = null;
    const now = new Date().toISOString();
    const insertParams = {
        id,
        physical_book_id: physicalBookId,
        book_title: title,
        user_id: borrower.id,
        borrower_name: borrower.full_name,
        borrower_email: borrower.email || null,
        borrower_phone: borrower.phone_number || null,
        borrower_admission_number: borrower.admission_number || null,
        borrowed_at: now,
        due_at: params.due_date,
        notes: params.notes?.trim() || null,
        issued_by: params.issued_by,
        created_at: now,
      };
      if (catalogueConnection) {
        await catalogueConnection.query(
          `INSERT INTO library_physical_loans
            (id, physical_book_id, book_title, user_id, borrower_name, borrower_email, borrower_phone,
             borrower_admission_number, borrowed_at, due_at, status, notes, issued_by, created_at)
           VALUES
            (:id, :physical_book_id, :book_title, :user_id, :borrower_name, :borrower_email, :borrower_phone,
             :borrower_admission_number, :borrowed_at, :due_at, 'active', :notes, :issued_by, :created_at)`,
          insertParams
        );
        await catalogueConnection.commit();
      } else {
        await query(
          `INSERT INTO library_physical_loans
            (id, physical_book_id, book_title, user_id, borrower_name, borrower_email, borrower_phone,
             borrower_admission_number, borrowed_at, due_at, status, notes, issued_by, created_at)
           VALUES
            (:id, :physical_book_id, :book_title, :user_id, :borrower_name, :borrower_email, :borrower_phone,
             :borrower_admission_number, :borrowed_at, :due_at, 'active', :notes, :issued_by, :created_at)`,
          insertParams
        );
      }
      return this.getPhysicalLoan(id);
    } catch (error) {
      if (catalogueConnection) {
        try { await catalogueConnection.rollback(); } catch {}
      }
      throw error;
    } finally {
      catalogueConnection?.release?.();
    }
  }

  async getPhysicalLoan(id: string) {
    const rows = await query<any[]>('SELECT * FROM library_physical_loans WHERE id = :id LIMIT 1', { id });
    if (!rows?.length) throw new NotFoundError('Physical borrowing record');
    return decorateLoan(rows[0]);
  }

  async getPhysicalLoans(params: { userId?: string; status?: string }) {
    let sql = 'SELECT * FROM library_physical_loans WHERE 1=1';
    const values: Record<string, any> = {};
    if (params.userId) {
      sql += ' AND user_id = :userId';
      values.userId = params.userId;
    }
    if (params.status === 'active' || params.status === 'returned') {
      sql += ' AND status = :status';
      values.status = params.status;
    }
    sql += ' ORDER BY borrowed_at DESC';
    const rows = await query<any[]>(sql, values);
    return (rows || []).map(decorateLoan);
  }

  async returnPhysicalLoan(id: string, returnedBy: string) {
    const loan = await this.getPhysicalLoan(id);
    if (loan.status === 'returned') throw new BadRequestError('This loan has already been returned.');
    const now = new Date().toISOString();
    await query(
      `UPDATE library_physical_loans
          SET status = 'returned', returned_at = :returned_at, returned_by = :returned_by, updated_at = :updated_at
        WHERE id = :id AND status = 'active'`,
      { id, returned_at: now, returned_by: returnedBy, updated_at: now }
    );
    if (loan.physical_book_id) {
      await query(`UPDATE library_physical_books SET available_copies = LEAST(total_copies, available_copies + 1) WHERE id = :id`, { id: loan.physical_book_id });
    }
    return this.getPhysicalLoan(id);
  }

  async getLibraryStats() {
    const [digitalRows, activeRows, overdueRows, dueSoonRows, returnedRows, physicalRows] = await Promise.all([
      query<any[]>(`SELECT COUNT(*) AS total_digital FROM library_resources WHERE is_digital = 1 OR file_url IS NOT NULL`),
      query<any[]>(`SELECT COUNT(*) AS count FROM library_physical_loans WHERE status = 'active'`),
      query<any[]>(`SELECT COUNT(*) AS count FROM library_physical_loans WHERE status = 'active' AND due_at < CURDATE()`),
      query<any[]>(`SELECT COUNT(*) AS count FROM library_physical_loans WHERE status = 'active' AND due_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)`),
      query<any[]>(`SELECT COUNT(*) AS count FROM library_physical_loans WHERE status = 'returned'`),
      query<any[]>(`SELECT COUNT(*) AS titles, COALESCE(SUM(total_copies),0) AS copies, COALESCE(SUM(available_copies),0) AS available FROM library_physical_books WHERE is_active = 1`),
    ]);
    return {
      totalDigitalResources: Number(digitalRows?.[0]?.total_digital || 0),
      activeLoans: Number(activeRows?.[0]?.count || 0),
      overdueLoans: Number(overdueRows?.[0]?.count || 0),
      dueSoonLoans: Number(dueSoonRows?.[0]?.count || 0),
      returnedLoans: Number(returnedRows?.[0]?.count || 0),
      totalPhysicalTitles: Number(physicalRows?.[0]?.titles || 0),
      totalPhysicalCopies: Number(physicalRows?.[0]?.copies || 0),
      availablePhysicalCopies: Number(physicalRows?.[0]?.available || 0),
    };
  }

}

export const libraryService = new LibraryService();
