import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Sparkles,
  Eye,
  Clock,
  Layers,
  Info,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  fetchLandingMedia,
  updateLandingMedia,
  uploadLandingImage,
  resetLandingMedia,
  type HeroSlide,
  type GalleryPhoto,
  type BackdropSlide,
  type LandingMediaConfig,
} from '@/features/landing-media/landing-media.api';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';

const DEFAULT_5_BACKDROPS: BackdropSlide[] = [
  { id: 'backdrop-1', src: '/tum-gate-monument.jpg', title: 'TUM Main Entrance Monument & Heritage', active: true, order: 1 },
  { id: 'backdrop-2', src: '/community/community-1.jpg', title: 'Student Intercession & Prayer Gathering', active: true, order: 2 },
  { id: 'backdrop-3', src: '/community/community-2.jpg', title: 'Joyful Praise & Worship in Unity', active: true, order: 3 },
  { id: 'backdrop-4', src: '/community/community-3.jpg', title: 'Christian Fellowship & Discipleship', active: true, order: 4 },
  { id: 'backdrop-5', src: '/community/community-5.jpg', title: 'Campus Evangelism & Servant Leadership', active: true, order: 5 },
];

export function LandingMediaAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const addAuditLog = useDashboardStore((s) => s.addAuditLog);

  const { data: serverMedia, isLoading } = useQuery({
    queryKey: ['landing-media'],
    queryFn: fetchLandingMedia,
  });

  // Local draft state for reactive editing before saving globally
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [rotateIntervalMs, setRotateIntervalMs] = useState<number>(4000);
  const [bgSrc, setBgSrc] = useState<string>('/tum-gate-monument.jpg');
  const [bgOpacity, setBgOpacity] = useState<number>(0.8);
  const [bgBlurPx, setBgBlurPx] = useState<number>(1);
  const [backdropSlides, setBackdropSlides] = useState<BackdropSlide[]>(DEFAULT_5_BACKDROPS);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);

  const [activeSubTab, setActiveSubTab] = useState<'slides' | 'background' | 'gallery'>('slides');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isUploadingNewSlide, setIsUploadingNewSlide] = useState(false);

  // New slide form state
  const [newSlideSrc, setNewSlideSrc] = useState('');
  const [newSlideCaption, setNewSlideCaption] = useState('');
  const [newSlideEyebrow, setNewSlideEyebrow] = useState('');
  const [showAddSlideModal, setShowAddSlideModal] = useState(false);

  // Sync draft state with server config on load
  useEffect(() => {
    if (serverMedia) {
      setSlides(serverMedia.heroCarousel || []);
      setRotateIntervalMs(serverMedia.rotateIntervalMs || 4000);
      setBgSrc(serverMedia.backgroundImage?.src || '/tum-gate-monument.jpg');
      setBgOpacity(serverMedia.backgroundImage?.opacity ?? 0.8);
      setBgBlurPx(serverMedia.backgroundImage?.blurPx ?? 1);
      setBackdropSlides(
        serverMedia.backdropSlides && serverMedia.backdropSlides.length > 0
          ? serverMedia.backdropSlides
          : DEFAULT_5_BACKDROPS
      );
      setGallery(serverMedia.galleryPhotos || []);
    }
  }, [serverMedia]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<LandingMediaConfig> = {
        heroCarousel: slides.map((s, idx) => ({ ...s, order: idx + 1 })),
        rotateIntervalMs,
        backgroundImage: {
          src: bgSrc,
          opacity: bgOpacity,
          blurPx: bgBlurPx,
          title: 'TUM Main Gate Archway Monument',
        },
        backdropSlides: backdropSlides.map((b, idx) => ({ ...b, order: idx + 1 })),
        galleryPhotos: gallery.map((g, idx) => ({ ...g, order: idx + 1 })),
      };
      return updateLandingMedia(payload);
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['landing-media'], updatedData);
      queryClient.invalidateQueries({ queryKey: ['landing-media'] });
      setSaveFeedback('Changes saved and deployed globally to all devices!');
      setTimeout(() => setSaveFeedback(null), 4000);

      addAuditLog({
        module: 'Dashboard',
        action: 'Updated Landing Media',
        details: `Updated hero carousel (${slides.length} slides) and landing backdrop globally`,
        actor: typeof user?.full_name === 'string' ? user.full_name : 'Administrator',
        role: 'CU Administration',
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'The server could not save the landing-page changes.';
      setSaveFeedback(`Save failed: ${message}`);
      setTimeout(() => setSaveFeedback(null), 6000);
    },
  });

  // Reset Mutation
  const resetMutation = useMutation({
    mutationFn: resetLandingMedia,
    onSuccess: (resetData) => {
      queryClient.setQueryData(['landing-media'], resetData);
      queryClient.invalidateQueries({ queryKey: ['landing-media'] });
      setSlides(resetData.heroCarousel);
      setRotateIntervalMs(resetData.rotateIntervalMs);
      setBgSrc(resetData.backgroundImage.src);
      setBgOpacity(resetData.backgroundImage.opacity);
      setBgBlurPx(resetData.backgroundImage.blurPx);
      setGallery(resetData.galleryPhotos);
      setSaveFeedback('Restored TUMCU canonical default media settings');
      setTimeout(() => setSaveFeedback(null), 4000);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'The server could not restore the landing media defaults.';
      setSaveFeedback(`Reset failed: ${message}`);
      setTimeout(() => setSaveFeedback(null), 6000);
    },
  });

  // File Upload Helper (converts to base64, sends to server, updates state)
  const handleFileUpload = async (
    file: File,
    onSuccess: (url: string) => void,
    setLoadingState: (loading: boolean) => void
  ) => {
    try {
      setLoadingState(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          const res = await uploadLandingImage(base64Data, file.name);
          onSuccess(res.url);
          setLoadingState(false);
        } catch (err) {
          console.error('Failed to upload image:', err);
          alert('Image upload failed. Please verify the file size or try again.');
          setLoadingState(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setLoadingState(false);
    }
  };

  // Reorder slides
  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setSlides(updated);
  };

  // Delete slide
  const deleteSlide = (id: string) => {
    if (slides.length <= 1) {
      alert('You must keep at least 1 hero slide.');
      return;
    }
    setSlides(slides.filter((s) => s.id !== id));
  };

  // Toggle slide active
  const toggleSlideActive = (id: string) => {
    setSlides(
      slides.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  // Add new slide
  const handleAddSlide = () => {
    if (!newSlideSrc.trim()) {
      alert('Please provide an image URL or upload an image.');
      return;
    }
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      src: newSlideSrc.trim(),
      caption: newSlideCaption.trim() || 'TUMCU Community Moment',
      eyebrow: newSlideEyebrow.trim() || 'A people who seek God',
      active: true,
      order: slides.length + 1,
    };
    setSlides([...slides, newSlide]);
    setNewSlideSrc('');
    setNewSlideCaption('');
    setNewSlideEyebrow('');
    setShowAddSlideModal(false);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-sm font-bold">Loading landing media settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Global Action Bar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-900 uppercase tracking-wider">
              <Camera size={13} className="text-indigo-700" /> Landing Media & Visual Engine
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Landing Page Pictures & Live Backdrop
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
              Customize the alternating hero carousel slides, the entrance monument backdrop, and community highlights. Any saved changes are deployed <strong>globally</strong> to every visitor and device.
            </p>
            {serverMedia?.lastUpdatedAt && (
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Clock size={12} /> Last published: {new Date(serverMedia.lastUpdatedAt).toLocaleString()} by {serverMedia.lastUpdatedBy || 'Administrator'}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('Reset all landing media to original TUMCU canonical defaults?')) {
                  resetMutation.mutate();
                }
              }}
              disabled={resetMutation.isPending}
              className="text-xs font-bold gap-1.5 text-slate-600 hover:text-slate-900 border-slate-200"
            >
              <RotateCcw size={14} /> Reset Defaults
            </Button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            >
              <ExternalLink size={14} /> View Live Home
            </a>

            <Button
              variant="primary"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="text-xs font-black gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 px-5"
            >
              {saveMutation.isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Publishing Globally...
                </>
              ) : (
                <>
                  <Save size={15} /> Save Changes Globally
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {saveFeedback && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            {saveFeedback}
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('slides')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'slides'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Camera size={14} />
            Alternating Hero Carousel ({slides.filter((s) => s.active).length}/{slides.length} active)
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('background')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'background'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ImageIcon size={14} />
            Landing Page Backdrop
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('gallery')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'gallery'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers size={14} />
            "Real People. Real Moments." ({gallery.length} photos)
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ALTERNATING HERO CAROUSEL SLIDES */}
      {activeSubTab === 'slides' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600">Slide Rotation Speed:</span>
              <select
                value={rotateIntervalMs}
                onChange={(e) => setRotateIntervalMs(Number(e.target.value))}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={2500}>Fast (2.5 seconds)</option>
                <option value={3500}>Normal (3.5 seconds)</option>
                <option value={4000}>Recommended (4.0 seconds)</option>
                <option value={5000}>Gentle (5.0 seconds)</option>
                <option value={6500}>Slow (6.5 seconds)</option>
                <option value={8000}>Scenic (8.0 seconds)</option>
              </select>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowAddSlideModal(true)}
              className="text-xs font-bold gap-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            >
              <Plus size={14} /> Add New Slide
            </Button>
          </div>

          {/* Slides List */}
          <div className="space-y-3">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`rounded-2xl border transition-all p-4 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  slide.active ? 'border-slate-200/90 shadow-2xs' : 'border-slate-200/50 opacity-60 bg-slate-50/50'
                }`}
              >
                {/* Thumbnail & Slide Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative h-20 w-28 sm:h-24 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-slate-950 border border-slate-200">
                    <img
                      src={slide.src}
                      alt={slide.caption}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/community/community-1.jpg';
                      }}
                    />
                    <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {slide.eyebrow}
                      </span>
                      {slide.active ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Active in rotation
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Disabled
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={slide.caption}
                      onChange={(e) => {
                        const updated = [...slides];
                        updated[index].caption = e.target.value;
                        setSlides(updated);
                      }}
                      className="w-full text-sm font-black text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none pb-0.5"
                      placeholder="Slide Caption..."
                    />

                    <input
                      type="text"
                      value={slide.eyebrow}
                      onChange={(e) => {
                        const updated = [...slides];
                        updated[index].eyebrow = e.target.value;
                        setSlides(updated);
                      }}
                      className="w-full text-xs font-semibold text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none pb-0.5"
                      placeholder="Eyebrow category tag..."
                    />

                    <div className="text-[11px] text-slate-400 truncate max-w-md">
                      Source: <span className="font-mono text-[10px] text-slate-600">{slide.src}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {/* Change Image Button / File Input */}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
                    <Upload size={13} />
                    {uploadingIndex === index ? 'Uploading...' : 'Replace Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(
                            file,
                            (newUrl) => {
                              const updated = [...slides];
                              updated[index].src = newUrl;
                              setSlides(updated);
                            },
                            (loading) => setUploadingIndex(loading ? index : null)
                          );
                        }
                      }}
                    />
                  </label>

                  {/* Toggle Active Switch */}
                  <button
                    type="button"
                    onClick={() => toggleSlideActive(slide.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                      slide.active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {slide.active ? 'Disable' : 'Enable'}
                  </button>

                  {/* Move Up / Down */}
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSlide(index, 'up')}
                      className="p-1.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={index === slides.length - 1}
                      onClick={() => moveSlide(index, 'down')}
                      className="p-1.5 hover:bg-slate-200 text-slate-600 border-l border-slate-200 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => deleteSlide(slide.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                    title="Delete slide"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LANDING BACKDROP SETTINGS (5 Alternating Pics) */}
      {activeSubTab === 'background' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 flex items-start gap-2.5">
            <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">5 Alternating Landing Page Backdrop Photos:</strong>{' '}
              The landing page hero continuously and softly transitions across these 5 backdrop pictures. You can replace photos by uploading from your device or entering image URLs, customize titles, and toggle which photos are active.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ImageIcon size={16} className="text-emerald-700" />
                    Configure 5 Alternating Backdrop Pictures
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    {backdropSlides.filter((b) => b.active).length} of {backdropSlides.length} active
                  </span>
                </div>

                <div className="space-y-3">
                  {backdropSlides.map((slide, idx) => (
                    <div
                      key={slide.id || `backdrop-${idx}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-emerald-700 text-white font-black text-[11px] grid place-items-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Backdrop Picture #{idx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slide.active}
                              onChange={(e) => {
                                const next = [...backdropSlides];
                                next[idx] = { ...slide, active: e.target.checked };
                                setBackdropSlides(next);
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Active
                          </label>

                          <button
                            type="button"
                            onClick={() => setBgSrc(slide.src)}
                            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-2xs"
                            title="Preview this backdrop on the live box"
                          >
                            Preview
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-3">
                          <div className="h-16 w-full rounded-lg overflow-hidden bg-slate-900 relative border border-slate-200">
                            <img
                              src={slide.src}
                              alt={slide.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/tum-gate-monument.jpg';
                              }}
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-9 space-y-2">
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => {
                              const next = [...backdropSlides];
                              next[idx] = { ...slide, title: e.target.value };
                              setBackdropSlides(next);
                            }}
                            placeholder="Backdrop Title or Description..."
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white outline-none focus:border-emerald-500"
                          />

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={slide.src}
                              onChange={(e) => {
                                const next = [...backdropSlides];
                                next[idx] = { ...slide, src: e.target.value };
                                setBackdropSlides(next);
                              }}
                              placeholder="/tum-gate-monument.jpg or https://..."
                              className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 bg-white outline-none focus:border-emerald-500 font-mono"
                            />

                            <label className="cursor-pointer shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition">
                              <Upload size={12} />
                              {uploadingIndex === idx ? 'Uploading...' : 'Upload'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setUploadingIndex(idx);
                                    handleFileUpload(
                                      file,
                                      (url) => {
                                        const next = [...backdropSlides];
                                        next[idx] = { ...slide, src: url };
                                        setBackdropSlides(next);
                                        setBgSrc(url);
                                        setUploadingIndex(null);
                                      },
                                      () => setUploadingIndex(null)
                                    );
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Opacity & Blur Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Backdrop Opacity:</span>
                      <span className="font-mono text-emerald-700">{Math.round(bgOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1.0"
                      step="0.05"
                      value={bgOpacity}
                      onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                      className="w-full cursor-pointer accent-emerald-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Backdrop Blur:</span>
                      <span className="font-mono text-emerald-700">{bgBlurPx}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="0.5"
                      value={bgBlurPx}
                      onChange={(e) => setBgBlurPx(parseFloat(e.target.value))}
                      className="w-full cursor-pointer accent-emerald-600"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Live Preview Panel */}
            <div className="lg:col-span-5">
              <Card className="p-6 space-y-4 bg-slate-900 text-white sticky top-20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                    <Eye size={13} /> Live Backdrop Rendering
                  </span>
                  <span className="text-[10px] text-slate-400">Real-time simulation</span>
                </div>

                <div className="relative h-72 w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                  {/* Backdrop Layer */}
                  <div
                    className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-500"
                    style={{
                      backgroundImage: `url(${bgSrc})`,
                      backgroundPosition: 'center 20%',
                      opacity: bgOpacity,
                      filter: `blur(${bgBlurPx}px)`,
                    }}
                  />

                  {/* Scrim Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/55 to-white/85" />

                  {/* Simulated Content Box */}
                  <div className="relative h-full p-4 flex flex-col justify-center items-center text-center">
                    <span className="bg-white/95 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full border border-slate-300 shadow-xs mb-2">
                      TECHNICAL UNIVERSITY OF MOMBASA CU
                    </span>
                    <h4 className="text-xl font-black text-slate-950 drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]">
                      A Community <span className="text-emerald-700">on Mission</span>
                    </h4>
                    <p className="text-xs text-slate-800 font-bold max-w-xs mt-1 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                      Welcoming all students to discover purpose and grow in Jesus Christ.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center">
                  {backdropSlides.map((b, i) => (
                    <button
                      key={b.id || i}
                      type="button"
                      onClick={() => setBgSrc(b.src)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition ${
                        bgSrc === b.src
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Pic #{i + 1}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <Info size={13} className="text-emerald-400 shrink-0" />
                  Students on the landing page see these 5 pictures smoothly crossfade in the background.
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: "REAL PEOPLE. REAL MOMENTS." GALLERY */}
      {activeSubTab === 'gallery' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <Info size={15} className="text-indigo-600 shrink-0" />
            Edit the 5 photographs in the "Real people. Real moments." landing page gallery section. Tile #1 is the large featured photo.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((item, idx) => (
              <Card key={item.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800">
                    Tile #{idx + 1} {idx === 0 && <span className="text-indigo-600 font-bold">(Featured 2x2)</span>}
                  </span>
                  <label className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <Upload size={12} /> Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(
                            file,
                            (url) => {
                              const updated = [...gallery];
                              updated[idx].src = url;
                              setGallery(updated);
                            },
                            () => {}
                          );
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/community/community-1.jpg';
                    }}
                  />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] font-bold text-white">
                      {item.caption}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Caption Overlay:</label>
                    <input
                      type="text"
                      value={item.caption || ''}
                      onChange={(e) => {
                        const updated = [...gallery];
                        updated[idx].caption = e.target.value;
                        setGallery(updated);
                      }}
                      placeholder="e.g. Fellowship & belonging"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Image URL:</label>
                    <input
                      type="text"
                      value={item.src}
                      onChange={(e) => {
                        const updated = [...gallery];
                        updated[idx].src = e.target.value;
                        setGallery(updated);
                      }}
                      className="w-full font-mono rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ADD NEW SLIDE MODAL */}
      {showAddSlideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-indigo-600" />
                Add New Hero Carousel Slide
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSlideModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slide Photograph:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSlideSrc}
                    onChange={(e) => setNewSlideSrc(e.target.value)}
                    placeholder="https://... or /uploads/..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                  <label className="cursor-pointer shrink-0 inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition">
                    <Upload size={13} />
                    {isUploadingNewSlide ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(
                            file,
                            (url) => setNewSlideSrc(url),
                            setIsUploadingNewSlide
                          );
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {newSlideSrc && (
                <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                  <img src={newSlideSrc} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slide Title / Caption:</label>
                <input
                  type="text"
                  value={newSlideCaption}
                  onChange={(e) => setNewSlideCaption(e.target.value)}
                  placeholder="e.g. Worship Night & Intercession"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Eyebrow Tag:</label>
                <input
                  type="text"
                  value={newSlideEyebrow}
                  onChange={(e) => setNewSlideEyebrow(e.target.value)}
                  placeholder="e.g. A people who seek God"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setShowAddSlideModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddSlide}
                className="text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Add Slide
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
