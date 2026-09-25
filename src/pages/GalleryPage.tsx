import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  ExternalLink,
  Plus,
  Image,
  Calendar,
  Filter,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  fetchGalleryAlbums,
  createGalleryAlbum,
  updateGalleryAlbum,
  deleteGalleryAlbum,
  type GalleryAlbum,
} from '@/features/gallery/gallery.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';

export function GalleryPage() {
  const queryClient = useQueryClient();
  const { user, hasRole, hasPermission } = useAuthStore();

  const isMediaLeader =
    hasRole?.('media_leader') ||
    hasRole?.('super_admin') ||
    user?.role === 'super_admin' ||
    hasPermission?.('gallery.manage') ||
    hasPermission?.('media.manage') ||
    hasPermission?.('*');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<GalleryAlbum | null>(null);

  const [form, setForm] = useState<Partial<GalleryAlbum>>({
    title: '',
    category: 'Sunday Services',
    event_type: 'service',
    event_date: new Date().toISOString().split('T')[0],
    description: '',
    cover_image_url: '',
    google_photos_url: '',
    photo_count: 50,
    is_published: 1,
  });

  const { data: albums = [], isLoading } = useQuery({
    queryKey: ['gallery-albums', selectedCategory, isMediaLeader],
    queryFn: () =>
      fetchGalleryAlbums({
        category: selectedCategory,
        include_unpublished: isMediaLeader,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<GalleryAlbum>) => {
      if (editingAlbum) {
        return updateGalleryAlbum(editingAlbum.id, payload);
      }
      return createGalleryAlbum(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
      setIsModalOpen(false);
      setEditingAlbum(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGalleryAlbum(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
    },
  });

  const handleOpenAdd = () => {
    setEditingAlbum(null);
    setForm({
      title: '',
      category: 'Sunday Services',
      event_type: 'service',
      event_date: new Date().toISOString().split('T')[0],
      description: '',
      cover_image_url: '/community/community-1.jpg',
      google_photos_url: 'https://photos.google.com/',
      photo_count: 50,
      is_published: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (album: GalleryAlbum) => {
    setEditingAlbum(album);
    setForm({
      title: album.title,
      category: album.category,
      event_type: album.event_type || 'service',
      event_date: album.event_date,
      description: album.description || '',
      cover_image_url: album.cover_image_url,
      google_photos_url: album.google_photos_url || '',
      photo_count: album.photo_count,
      is_published: album.is_published ? 1 : 0,
    });
    setIsModalOpen(true);
  };

  const categories = [
    'all',
    'Sunday Services',
    'Worship Services',
    'Prayer Meetings',
    'Conferences',
    'Retreats',
    'Evangelism',
    'Missions',
    'Fellowships',
    'Special Events',
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <section className="border-b border-[#006633]/10 bg-gradient-to-b from-[#006633]/5 via-[#FDFBF7] to-[#FDFBF7] pt-12 pb-8">
        <div className="page-shell">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#006633]/20 bg-[#006633]/10 px-3.5 py-1 text-xs font-bold text-[#006633]">
                <Camera size={13} />
                <span>Protected Member Gallery</span>
              </div>
              <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl tracking-tight">
                Moments of Grace & <span className="text-[#006633]">Fellowship.</span>
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
                Relive memories from Sunday services, retreats, evangelism missions, and fellowship nights. High-resolution photo collections are hosted on Google Photos.
              </p>
            </div>

            {isMediaLeader && (
              <Button
                variant="primary"
                onClick={handleOpenAdd}
                className="bg-[#006633] hover:bg-[#005229] text-white font-bold gap-2 text-xs shrink-0"
              >
                <Plus size={14} />
                <span>Create New Album</span>
              </Button>
            )}
          </div>

          {/* Categories Bar */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
            <Filter size={14} className="text-slate-400 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-[#006633] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Moments' : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Albums Grid */}
      <div className="page-shell py-8">
        {isLoading ? (
          <div className="py-24 text-center text-slate-400">Loading albums…</div>
        ) : albums.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            No albums found in this category.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <Card
                key={album.id}
                className="group flex flex-col justify-between overflow-hidden border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={album.cover_image_url}
                      alt={album.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                        {album.category}
                      </span>
                    </div>

                    {isMediaLeader && !album.is_published && (
                      <div className="absolute top-3 right-3 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 backdrop-blur-xs">
                        <EyeOff size={11} />
                        <span>Unpublished</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs flex items-center gap-1">
                      <Image size={11} />
                      <span>{album.photo_count} Photos</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mb-1">
                      <Calendar size={12} className="text-[#006633]" />
                      <span>{new Date(album.event_date).toLocaleDateString()}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#006633] transition line-clamp-1">
                      {album.title}
                    </h3>

                    {album.description && (
                      <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {album.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                  <div className="flex items-center justify-between gap-2 pt-3">
                    {album.google_photos_url ? (
                      <a
                        href={album.google_photos_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#006633] hover:bg-[#005229] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition"
                      >
                        <ExternalLink size={13} />
                        <span>View Album on Google Photos</span>
                      </a>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="w-full text-xs">
                        Photos Uploading Soon
                      </Button>
                    )}

                    {isMediaLeader && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(album)}
                          className="p-2 text-slate-700 hover:bg-slate-100"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Delete "${album.title}" album?`)) {
                              deleteMutation.mutate(album.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Album Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-[#006633]" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingAlbum ? 'Edit Gallery Album' : 'Create Google Photos Album'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(form);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Album Title
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Nyali Beach Retreat & Team Building"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800"
                  >
                    {categories.filter((c) => c !== 'all').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Event Date
                  </label>
                  <Input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Google Photos Album Link
                </label>
                <Input
                  type="url"
                  value={form.google_photos_url}
                  onChange={(e) => setForm({ ...form, google_photos_url: e.target.value })}
                  placeholder="https://photos.google.com/share/..."
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Paste the public share link from Google Photos for members to view the full resolution gallery.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cover Image URL
                  </label>
                  <Input
                    value={form.cover_image_url}
                    onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                    placeholder="/community/community-1.jpg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Approximate Photo Count
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={form.photo_count}
                    onChange={(e) => setForm({ ...form, photo_count: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Memory Notes
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Summary of what happened during this service or retreat…"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={Boolean(form.is_published)}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked ? 1 : 0 })}
                  className="h-4 w-4 rounded-sm border-slate-300 text-[#006633]"
                />
                <label htmlFor="is_published" className="text-xs font-semibold text-slate-700">
                  Publish immediately (visible to all members)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saveMutation.isPending}
                  className="bg-[#006633] hover:bg-[#005229] text-white font-bold"
                >
                  {saveMutation.isPending ? 'Saving…' : editingAlbum ? 'Save Changes' : 'Create Album'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
