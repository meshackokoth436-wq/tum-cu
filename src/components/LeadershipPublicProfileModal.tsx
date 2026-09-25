import { useEffect, useState } from 'react';
import { Camera, Loader2, Save, X, Eye, EyeOff } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { fetchLeadershipPublicProfile, saveLeadershipPublicProfile, type LeadershipAssignment } from '@/features/leadership/leadership.api';
import { uploadLandingImage } from '@/features/landing-media/landing-media.api';

export function LeadershipPublicProfileModal({ assignment, onClose }: { assignment: LeadershipAssignment | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ['leadership-public-profile', assignment?.id],
    queryFn: () => fetchLeadershipPublicProfile(assignment!.id),
    enabled: Boolean(assignment?.id),
  });
  const [form, setForm] = useState({ display_name: '', photo_url: '', public_email: '', public_phone: '', bio: '', display_order: 0, is_visible: true });

  useEffect(() => {
    if (!assignment) return;
    setForm({
      display_name: profile?.display_name ?? assignment.user_name ?? '',
      photo_url: profile?.photo_url ?? '',
      public_email: profile?.public_email ?? assignment.user_email ?? '',
      public_phone: profile?.public_phone ?? assignment.user_phone ?? '',
      bio: profile?.bio ?? '',
      display_order: profile?.display_order ?? 0,
      is_visible: profile?.is_visible !== false,
    });
  }, [assignment, profile]);

  const save = useMutation({
    mutationFn: () => saveLeadershipPublicProfile(assignment!.id, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['leadership-directory'] });
      await queryClient.invalidateQueries({ queryKey: ['leadership-public-profile', assignment?.id] });
      onClose();
    },
  });

  if (!assignment) return null;

  async function handlePhoto(file: File) {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await uploadLandingImage(String(reader.result), file.name);
        setForm(v => ({ ...v, photo_url: result.url }));
      } catch {
        // The existing uploader returns a validation error for unsupported/oversized images.
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div><p className="text-[10px] font-black uppercase tracking-wider text-[#006633]">Public Leadership Profile</p><h2 className="text-lg font-black text-slate-900">{assignment.position_name}</h2></div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="space-y-5 p-5">
          <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
            <div>
              <div className="aspect-square overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-slate-200">
                {form.photo_url ? <img src={form.photo_url} alt="Leader" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-4xl font-black text-[#006633]">{form.display_name.charAt(0) || 'L'}</div>}
              </div>
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <Camera size={14} /> Change photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
              </label>
              <p className="mt-1 text-center text-[10px] text-slate-400">JPG, PNG or WebP · max 5 MB</p>
            </div>
            <div className="space-y-3">
              <Input label="Display name" value={form.display_name} onChange={e => setForm(v => ({ ...v, display_name: e.target.value }))} />
              <Input label="Public email" type="email" value={form.public_email} onChange={e => setForm(v => ({ ...v, public_email: e.target.value }))} />
              <Input label="Public phone" value={form.public_phone} onChange={e => setForm(v => ({ ...v, public_phone: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Leadership bio</label>
            <textarea value={form.bio} onChange={e => setForm(v => ({ ...v, bio: e.target.value }))} rows={4} maxLength={1000} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#006633] focus:ring-2 focus:ring-emerald-100" placeholder="A short public description of this leader's service and responsibility." />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Display order" type="number" min={0} value={form.display_order} onChange={e => setForm(v => ({ ...v, display_order: Number(e.target.value) || 0 }))} />
            <button type="button" onClick={() => setForm(v => ({ ...v, is_visible: !v.is_visible }))} className="mt-auto flex h-11 items-center justify-between rounded-xl border border-slate-200 px-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <span>{form.is_visible ? 'Visible to members' : 'Hidden from members'}</span>
              {form.is_visible ? <Eye size={17} className="text-[#006633]" /> : <EyeOff size={17} className="text-slate-400" />}
            </button>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2 bg-[#006633] text-white hover:bg-[#00552a]">
              {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save profile
            </Button>
          </div>
          {save.isError && <p className="text-right text-xs font-semibold text-red-600">Could not save the public profile. Check the fields and try again.</p>}
        </div>
      </div>
    </div>
  );
}
