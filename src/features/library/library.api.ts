import { api, type ApiResponse } from '@/services/api';

export interface LibraryResource {
  id: string;
  title: string;
  author: string;
  category: string;
  description?: string | null;
  cover_image_url?: string | null;
  file_url?: string | null;
  is_digital: number | boolean;
  created_at: string;
}

export interface PhysicalBook {
  id: string;
  title: string;
  author?: string | null;
  category?: string | null;
  total_copies: number;
  available_copies: number;
  on_loan_copies: number;
  is_active: number | boolean;
  created_at: string;
}

export interface PhysicalLoan {
  id: string;
  book_title: string;
  physical_book_id?: string | null;
  user_id: string;
  borrower_name: string;
  borrower_email?: string | null;
  borrower_phone?: string | null;
  borrower_admission_number?: string | null;
  borrowed_at: string;
  due_at: string;
  returned_at?: string | null;
  status: 'active' | 'returned';
  display_status: 'ACTIVE' | 'DUE_SOON' | 'OVERDUE' | 'RETURNED';
  notes?: string | null;
}

export interface LibraryBorrower {
  id: string;
  full_name: string;
  email?: string | null;
  phone_number?: string | null;
  admission_number?: string | null;
}

export interface LibraryStats {
  totalDigitalResources: number;
  totalPhysicalTitles: number;
  totalPhysicalCopies: number;
  availablePhysicalCopies: number;
  activeLoans: number;
  overdueLoans: number;
  dueSoonLoans: number;
  returnedLoans: number;
}

export async function fetchLibraryResources(params?: { category?: string; search?: string }) {
  const { data } = await api.get<ApiResponse<LibraryResource[]>>('/library/resources', { params });
  return data.data;
}

export async function fetchLibraryResource(id: string) {
  const { data } = await api.get<ApiResponse<LibraryResource>>(`/library/resources/${id}`);
  return data.data;
}

export async function createLibraryResource(payload: Partial<LibraryResource>) {
  const { data } = await api.post<ApiResponse<LibraryResource>>('/library/resources', payload);
  return data.data;
}

export async function updateLibraryResource(id: string, payload: Partial<LibraryResource>) {
  const { data } = await api.put<ApiResponse<LibraryResource>>(`/library/resources/${id}`, payload);
  return data.data;
}

export async function deleteLibraryResource(id: string) {
  await api.delete(`/library/resources/${id}`);
}

export async function searchLibraryBorrowers(search: string) {
  const { data } = await api.get<ApiResponse<LibraryBorrower[]>>('/library/borrowers', { params: { search } });
  return data.data;
}


export async function fetchPhysicalBooks(search?: string) {
  const { data } = await api.get<ApiResponse<PhysicalBook[]>>('/library/physical-books', { params: { search } });
  return data.data;
}

export async function updatePhysicalBook(id: string, payload: { title?: string; author?: string; category?: string; total_copies: number }) {
  const { data } = await api.put<ApiResponse<PhysicalBook>>(`/library/physical-books/${id}`, payload);
  return data.data;
}

export async function createPhysicalBook(payload: { title: string; author?: string; category?: string; total_copies: number }) {
  const { data } = await api.post<ApiResponse<PhysicalBook>>('/library/physical-books', payload);
  return data.data;
}

export async function createPhysicalLoan(payload: { book_title: string; physical_book_id?: string; user_id: string; due_date: string; notes?: string }) {
  const { data } = await api.post<ApiResponse<PhysicalLoan>>('/library/physical-loans', payload);
  return data.data;
}

export async function fetchPhysicalLoans(status?: string) {
  const { data } = await api.get<ApiResponse<PhysicalLoan[]>>('/library/physical-loans', { params: { status } });
  return data.data;
}

export async function fetchMyPhysicalLoans() {
  const { data } = await api.get<ApiResponse<PhysicalLoan[]>>('/library/my-physical-loans');
  return data.data;
}

export async function returnPhysicalLoan(id: string) {
  const { data } = await api.post<ApiResponse<PhysicalLoan>>(`/library/physical-loans/${id}/return`);
  return data.data;
}

export async function fetchLibraryStats() {
  const { data } = await api.get<ApiResponse<LibraryStats>>('/library/reports/stats');
  return data.data;
}
