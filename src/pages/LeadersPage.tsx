import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, UserRound, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchLeadershipDirectory, type PublicLeader } from '@/features/leadership/leadership.api';

export function LeadersPage() {
  const { data: leaders = [], isLoading, isError } = useQuery({
    queryKey: ['leadership-directory'],
    queryFn: fetchLeadershipDirectory,
  });
  const [selected, setSelected] = useState<PublicLeader | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-[#006633] to-[#0b7a43] p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">TUMCU Leadership</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Our Leaders</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Meet the current TUMCU leaders and find the appropriate contact for each responsibility.
            </p>
          </div>
        </div>
      </div>

      {isLoading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-100" />)}</div>}
      {isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">The leadership directory could not be loaded. Please try again.</div>}

      {!isLoading && !isError && leaders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <UserRound className="mx-auto h-9 w-9 text-slate-400" />
          <p className="mt-3 font-bold text-slate-700">No public leaders have been configured yet.</p>
          <p className="mt-1 text-xs text-slate-500">The directory will update automatically when administrators publish leadership profiles.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leaders.map((leader) => (
          <motion.button
            key={leader.assignment_id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSelected(leader)}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="relative h-52 overflow-hidden bg-emerald-50">
              {leader.photo_url ? (
                <img src={leader.photo_url} alt={leader.display_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#006633] to-emerald-700 text-5xl font-black text-white">
                  {leader.display_name?.charAt(0) || 'L'}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
                <p className="text-lg font-black">{leader.display_name}</p>
                <p className="text-xs font-bold text-emerald-100">{leader.position_name}</p>
              </div>
            </div>
            <div className="space-y-2 p-4">
              <p className="line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{leader.bio || `Serving as ${leader.position_name} within TUMCU.`}</p>
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#006633]">View leadership profile →</div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }} onClick={e => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="relative h-64 bg-emerald-50">
                {selected.photo_url ? <img src={selected.photo_url} alt={selected.display_name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-[#006633] to-emerald-700 text-7xl font-black text-white">{selected.display_name.charAt(0)}</div>}
                <button aria-label="Close" onClick={() => setSelected(null)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"><X size={18} /></button>
              </div>
              <div className="p-6">
                <p className="text-xs font-black uppercase tracking-wider text-[#006633]">{selected.position_name}</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">{selected.display_name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{selected.bio || `Serving TUMCU as ${selected.position_name}.`}</p>
                <div className="mt-5 space-y-2">
                  {selected.phone && <a href={`tel:${selected.phone}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Phone size={16} className="text-[#006633]" />{selected.phone}</a>}
                  {selected.email && <a href={`mailto:${selected.email}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 break-all"><Mail size={16} className="text-[#006633]" />{selected.email}</a>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
