import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Download, ExternalLink, Search, ShieldCheck, UserRound, Clock3 } from 'lucide-react';
import { fetchLibraryResources, fetchMyPhysicalLoans } from '@/features/library/library.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

const categories = ['all', 'Theology', 'Doctrine', 'Christian Living', 'Discipleship', 'Bible Study', 'Leadership', 'Evangelism & Missions', 'Apologetics', 'Prayer'];

export function LibraryPage() {
  const { isAuthenticated, user, hasRole, hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const isLibrarian = hasRole?.('librarian') || hasRole?.('super_admin') || hasPermission?.('library.edit') || hasPermission?.('library.checkout');
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['e-library', search, category],
    queryFn: () => fetchLibraryResources({ search, category }),
  });
  const { data: loans = [] } = useQuery({
    queryKey: ['my-physical-loans'],
    queryFn: fetchMyPhysicalLoans,
    enabled: isAuthenticated,
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <section className="border-b border-[#006633]/10 bg-gradient-to-b from-[#006633]/7 to-transparent py-12">
        <div className="page-shell">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#006633]/20 bg-white px-3 py-1 text-xs font-bold text-[#006633] shadow-sm">
                <BookOpen size={14} /> TUMCU E-Library
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Christian literature, in one simple place.</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">Read or download approved digital resources. Physical books remain in the actual CU/school library and are recorded by the Librarian only when borrowed.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isLibrarian && <Link to="/dashboard/librarian"><Button variant="primary" className="gap-2 bg-[#006633] text-white"><ShieldCheck size={15} /> Librarian Portal</Button></Link>}
              {isAuthenticated && <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"><UserRound size={14} /> {user?.full_name}</div>}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, author or topic…" className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none focus:border-[#006633] focus:ring-2 focus:ring-[#006633]/10" />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-xl border px-3.5 py-2 text-xs font-bold transition ${category === item ? 'border-[#006633] bg-[#006633] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#006633]/40'}`}>{item}</button>)}
            </div>
          </div>
        </div>
      </section>

      <main className="page-shell py-8">
        <div className="mb-5 flex items-center justify-between">
          <div><h2 className="text-lg font-black text-slate-900">E-Library collection</h2><p className="text-xs text-slate-500">Digital resources managed by the Librarian.</p></div>
          {isAuthenticated && <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm"><Clock3 size={14} /> {loans.filter((l) => l.status === 'active').length} active physical loan{loans.filter((l) => l.status === 'active').length === 1 ? '' : 's'}</div>}
        </div>

        {isLoading ? <div className="py-20 text-center text-sm text-slate-400">Loading the E-Library…</div> : resources.length === 0 ? <Card className="p-12 text-center"><BookOpen className="mx-auto text-slate-300" size={40} /><p className="mt-4 font-bold text-slate-700">No digital resources found</p><p className="mt-1 text-xs text-slate-500">Try another search or category.</p></Card> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resources.map((book) => (
              <Card key={book.id} className="group overflow-hidden border-slate-200 bg-white p-0 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  {book.cover_image_url ? <img src={book.cover_image_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-[#006633]/40"><BookOpen size={50} /></div>}
                </div>
                <div className="p-5">
                  <span className="rounded-full bg-[#006633]/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#006633]">{book.category}</span>
                  <h3 className="mt-3 line-clamp-2 text-base font-black text-slate-900">{book.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{book.author}</p>
                  {book.description && <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">{book.description}</p>}
                  <div className="mt-5 flex gap-2">
                    {book.file_url ? <a href={book.file_url} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#006633] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#005229]"><Download size={14} /> Read / Download</a> : <span className="flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-center text-xs font-bold text-slate-400">File unavailable</span>}
                    {book.file_url && <a href={book.file_url} target="_blank" rel="noreferrer" aria-label={`Open ${book.title}`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-500 hover:bg-slate-50"><ExternalLink size={14} /></a>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
