import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Church,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Layers,
  Sparkles,
  Users,
  AlertCircle,
  X,
  Camera,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { MinistryBackgroundModal } from '@/components/MinistryBackgroundModal';
import { getMinistryBackground, updateMinistry } from '@/features/ministries/ministries.api';
import { uploadLandingImage } from '@/features/landing-media/landing-media.api';

interface Ministry {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  meeting_day?: string;
  meeting_time?: string;
  meeting_venue?: string;
  leader_id?: string;
  leader_name?: string;
  active_members_count?: number;
  background_image_url?: string | null;
  landing_image_url?: string | null;
  landing_caption?: string | null;
}

const DEFAULT_CONSTITUTIONAL_MINISTRIES: Ministry[] = [
  {
    id: 'min-pw',
    name: 'Praise & Worship Ministry',
    code: 'min_worship',
    category: 'worship',
    description: 'Leading the congregation in vibrant, Spirit-filled praise, worship, and vocal ministry.',
    meeting_day: 'Friday & Saturday',
    meeting_time: '4:30 PM - 7:00 PM',
    meeting_venue: 'Main Sanctuary',
    active_members_count: 0,
  },
  {
    id: 'min-intercessory',
    name: 'Intercessory & Prayer Ministry',
    code: 'min_prayer',
    category: 'prayer',
    description: 'Standing in the gap for the Christian Union, the university administration, the nation, and revival.',
    meeting_day: 'Daily & Wednesday Kesha',
    meeting_time: '6:00 AM - 7:00 AM / 9:00 PM',
    meeting_venue: 'Upper Prayer Room',
    active_members_count: 0,
  },
  {
    id: 'min-media',
    name: 'Media, IT & Communications Ministry',
    code: 'min_media',
    category: 'media',
    description: 'Audio engineering, livestreaming, graphic design, social media ministry, and IT infrastructure.',
    meeting_day: 'Thursday',
    meeting_time: '5:00 PM - 6:30 PM',
    meeting_venue: 'Media Studio / AV Booth',
    active_members_count: 0,
  },
  {
    id: 'min-discipleship',
    name: 'Discipleship & Bible Study Ministry',
    code: 'min_discipleship',
    category: 'discipleship',
    description: 'Nurturing believers in foundational Christian doctrines, BEST classes, and weekly Bible studies.',
    meeting_day: 'Tuesday',
    meeting_time: '5:00 PM - 6:30 PM',
    meeting_venue: 'LH 01 & LH 02',
    active_members_count: 0,
  },
  {
    id: 'min-evangelism',
    name: 'Missions & Evangelism Ministry',
    code: 'min_evangelism',
    category: 'evangelism',
    description: 'Campus evangelism, door-to-door hospital outreach, annual mission trips, and street ministry.',
    meeting_day: 'Saturday & Sunday',
    meeting_time: '2:00 PM - 5:00 PM',
    meeting_venue: 'Assembly Point',
    active_members_count: 0,
  },
  {
    id: 'min-creative',
    name: 'Creative Arts & Drama Ministry',
    code: 'min_creative',
    category: 'creative',
    description: 'Presenting the Gospel through spoken word, choreography, skits, and theatrical presentations.',
    meeting_day: 'Wednesday',
    meeting_time: '4:30 PM - 6:30 PM',
    meeting_venue: 'Amphitheatre',
    active_members_count: 0,
  },
  {
    id: 'min-hospitality',
    name: 'Hospitality & Ushering Ministry',
    code: 'min_service',
    category: 'service',
    description: 'Warmly welcoming visitors, orderly sanctuary arrangement, and catering for fellowship events.',
    meeting_day: 'Saturday',
    meeting_time: '3:00 PM - 5:00 PM',
    meeting_venue: 'Main Sanctuary',
    active_members_count: 0,
  },
  {
    id: 'min-instruments',
    name: 'Instrumentalists & Sound Ministry',
    code: 'min_instruments',
    category: 'worship',
    description: 'Keyboardists, guitarists, drummers, and live acoustic management.',
    meeting_day: 'Friday',
    meeting_time: '4:00 PM - 7:00 PM',
    meeting_venue: 'Sanctuary Stage',
    active_members_count: 0,
  },
  {
    id: 'min-highschool',
    name: 'High School & Outreach Ministry',
    code: 'min_highschool',
    category: 'evangelism',
    description: 'Ministering in secondary schools across the Coast region for mentorship and Sunday services.',
    meeting_day: 'Sunday Afternoon',
    meeting_time: '1:30 PM - 5:30 PM',
    meeting_venue: 'CU Boardroom',
    active_members_count: 0,
  },
  {
    id: 'min-welfare',
    name: 'Welfare & Benevolence Ministry',
    code: 'min_welfare',
    category: 'service',
    description: 'Student benevolence, hospital visitation, food drives, and emergency welfare support.',
    meeting_day: 'Monday',
    meeting_time: '5:00 PM - 6:00 PM',
    meeting_venue: 'CU Office',
    active_members_count: 0,
  },
  {
    id: 'min-brothers',
    name: "Brothers' Fellowship (Men of Valor)",
    code: 'min_brothers',
    category: 'fellowship',
    description: 'Mentorship, godly brotherhood, accountability, and spiritual leadership for male students.',
    meeting_day: 'Every 2nd Saturday',
    meeting_time: '7:00 AM - 9:30 AM',
    meeting_venue: 'Dining Hall Rooftop',
    active_members_count: 0,
  },
  {
    id: 'min-sisters',
    name: "Sisters' Fellowship (Daughters of Zion)",
    code: 'min_sisters',
    category: 'fellowship',
    description: 'Virtuous womanhood, purity, spiritual empowerment, and peer counseling for female students.',
    meeting_day: 'Every 2nd Saturday',
    meeting_time: '7:00 AM - 9:30 AM',
    meeting_venue: 'Main Sanctuary',
    active_members_count: 0,
  },
];

export function AdminMinistriesPage() {
  const { user } = useAuthStore();
  const [ministries, setMinistries] = useState<Ministry[]>(DEFAULT_CONSTITUTIONAL_MINISTRIES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Edit / Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('worship');
  const [formDesc, setFormDesc] = useState('');
  const [formDay, setFormDay] = useState('Friday');
  const [formTime, setFormTime] = useState('4:30 PM - 7:00 PM');
  const [formVenue, setFormVenue] = useState('Main Sanctuary');
  const [formCaption, setFormCaption] = useState('');
  const [formLandingImage, setFormLandingImage] = useState('');
  const [formLandingFilename, setFormLandingFilename] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLandingImage, setUploadingLandingImage] = useState(false);

  // Assign Leader modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetMinistry, setTargetMinistry] = useState<Ministry | null>(null);
  const [leaderSearch, setLeaderSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([
    {
      id: 'usr-101',
      full_name: 'John K. Mwangi',
      email: 'john.mwangi@students.tum.ac.ke',
      admission_number: 'BENG/2023/044',
      year_of_study: 'Year 3',
      spiritual_standing: 'Active Full Member (Baptized)',
      is_eligible: true,
    },
    {
      id: 'usr-102',
      full_name: 'Esther Nekesa',
      email: 'esther.nekesa@students.tum.ac.ke',
      admission_number: 'CIT/2022/105',
      year_of_study: 'Year 4',
      spiritual_standing: 'Active Full Member (Baptized)',
      is_eligible: true,
    },
    {
      id: 'usr-103',
      full_name: 'Michael Otieno',
      email: 'michael.otieno@students.tum.ac.ke',
      admission_number: 'CIT/2025/012',
      year_of_study: 'Year 1',
      spiritual_standing: 'Probation / New Member',
      is_eligible: false,
      ineligibility_reason: 'Article 14.3 requires minimum Year 2 for Leadership',
    },
  ]);
  const [submittingLeader, setSubmittingLeader] = useState(false);
  const [bgModalMinistry, setBgModalMinistry] = useState<any>(null);

  useEffect(() => {
    fetchMinistries();
  }, []);

  async function fetchMinistries() {
    try {
      setLoading(true);
      const res = await api.get<any>('/ministries');
      if (res.data?.data && res.data.data.length > 0) {
        setMinistries(res.data.data);
      }
    } catch (err) {
      console.warn('Using default constitutional ministries list', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingMinistry(null);
    setFormName('');
    setFormCode('');
    setFormCategory('worship');
    setFormDesc('');
    setFormDay('Friday');
    setFormTime('4:30 PM - 7:00 PM');
    setFormVenue('Main Sanctuary');
    setFormCaption('');
    setFormLandingImage('');
    setFormLandingFilename('');
    setIsModalOpen(true);
  }

  function handleOpenEdit(m: Ministry) {
    setEditingMinistry(m);
    setFormName(m.name);
    setFormCode(m.code);
    setFormCategory(m.category);
    setFormDesc(m.description || '');
    setFormDay(m.meeting_day || 'Friday');
    setFormTime(m.meeting_time || '4:30 PM - 7:00 PM');
    setFormVenue(m.meeting_venue || 'Main Sanctuary');
    setFormCaption(m.landing_caption || '');
    setFormLandingImage(m.landing_image_url || '');
    setFormLandingFilename('');
    setIsModalOpen(true);
  }

  async function compressLandingImage(file: File): Promise<{ dataUrl: string; filename: string }> {
    if (!file.type.startsWith('image/')) throw new Error('Please select a valid image file.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Please choose an image smaller than 10MB.');

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not read the selected image.'));
      reader.readAsDataURL(file);
    });

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ dataUrl, filename: file.name });
        ctx.drawImage(img, 0, 0, width, height);
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.84),
          filename: file.name.replace(/\.[^.]+$/, '') + '.jpg',
        });
      };
      img.onerror = () => resolve({ dataUrl, filename: file.name });
      img.src = dataUrl;
    });
  }

  async function handleLandingImageChange(file: File | null) {
    if (!file) return;
    try {
      setUploadingLandingImage(true);
      const compressed = await compressLandingImage(file);
      const result = await uploadLandingImage(compressed.dataUrl, compressed.filename);
      setFormLandingImage(result.url);
      setFormLandingFilename(result.filename);
    } catch (err: any) {
      alert(err?.message || 'Failed to upload ministry profile image.');
    } finally {
      setUploadingLandingImage(false);
    }
  }

  async function handleSaveMinistry(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || uploadingLandingImage) return;
    setSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim(),
        code: formCode || formName.toLowerCase().replace(/\s+/g, '_'),
        category: formCategory,
        description: formDesc.trim(),
        meeting_day: formDay.trim(),
        meeting_time: formTime.trim(),
        meeting_venue: formVenue.trim(),
        landing_caption: formCaption.trim() || null,
      };
      if (formLandingImage) payload.landing_image_url = formLandingImage;

      if (editingMinistry) {
        await updateMinistry(editingMinistry.id, payload);
      } else {
        const res = await api.post<any>('/ministries', payload);
        if (!res.data?.data?.id) throw new Error('The ministry was not returned by the server.');
      }

      await fetchMinistries();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to save ministry.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignLeader(member: any) {
    if (!targetMinistry) return;
    if (!member.is_eligible) {
      alert(`Constitutional Ineligibility: ${member.ineligibility_reason}`);
      return;
    }
    setSubmittingLeader(true);
    try {
      setMinistries((prev) =>
        prev.map((m) =>
          m.id === targetMinistry.id ? { ...m, leader_name: member.full_name, leader_id: member.id } : m
        )
      );
      setIsAssignModalOpen(false);
    } catch (err) {
      alert('Failed to assign leader');
    } finally {
      setSubmittingLeader(false);
    }
  }

  const filtered = ministries.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      m.leader_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="mesh-hero-bg overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold-100 px-3 py-1 text-xs font-black text-gold-900 border border-gold-300">
              <Church size={14} /> TUMCU Constitution Article 16.1
            </div>
            <h1 className="mt-2 text-3xl font-black text-primary-950 sm:text-4xl">
              Constitutional Ministries Hub
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage the constitutional ministries and fellowships, edit their public profiles, verify leader qualifications under Article 14.3, and organize schedules.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleOpenCreate}
            className="gap-1.5 bg-primary-900 text-white font-bold shadow-lg"
          >
            <Plus size={16} /> Add Ministry / Fellowship
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md w-full">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search ministry name, leader, or calling..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:outline-none"
          />
        </div>
        <span className="text-xs font-bold text-slate-500">{filtered.length} Active Ministries</span>
      </div>

      {/* Ministries Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <Card key={m.id} className="p-5 border border-slate-200 bg-white shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-gold-950 border border-gold-300">
                  {m.category}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBgModalMinistry(m)}
                    title="Change Background Photo"
                    className="p-1 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition"
                  >
                    <Camera size={13} />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-1 rounded-lg text-slate-400 hover:text-primary-900 hover:bg-slate-50 transition"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-primary-950">{m.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              {/* Meeting Schedule */}
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-primary-800 shrink-0" />
                  <span>{m.meeting_day} ({m.meeting_time})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary-800 shrink-0" />
                  <span>{m.meeting_venue}</span>
                </div>
              </div>

              {/* Leader & Assignment */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Ministry Leader</div>
                  <div className="text-xs font-black text-primary-950">
                    {m.leader_name || <span className="text-amber-600 font-normal">Unassigned</span>}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTargetMinistry(m);
                    setIsAssignModalOpen(true);
                  }}
                  className="text-[11px] font-bold border-primary-200 text-primary-900 hover:bg-primary-50 py-1 px-2.5 h-auto"
                >
                  <UserCheck size={12} className="mr-1" /> Assign / Vet
                </Button>
              </div>

              {/* Background Photo Action Button */}
              <button
                type="button"
                onClick={() => setBgModalMinistry(m)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-amber-200/90 bg-amber-50/70 hover:bg-amber-100 text-amber-950 text-xs font-bold transition active:scale-98"
              >
                <Camera size={13} className="text-amber-700" />
                <span>Change Background Photo</span>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit / Create Ministry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-black text-primary-950">
                    {editingMinistry ? 'Edit Ministry Details' : 'Add Constitutional Ministry'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure TUMCU ministry details and schedule</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveMinistry} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ministry Name *</label>
                  <Input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Praise & Worship Ministry"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800"
                    >
                      <option value="worship">Worship & Music</option>
                      <option value="prayer">Intercessory & Prayer</option>
                      <option value="media">Media & IT</option>
                      <option value="discipleship">Discipleship & Nurture</option>
                      <option value="evangelism">Missions & Outreach</option>
                      <option value="creative">Creative & Drama</option>
                      <option value="service">Hospitality & Catering</option>
                      <option value="fellowship">Fellowship & Mentorship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Identifier Code</label>
                    <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="min_code" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mission & Purpose</label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Ministry description and spiritual objectives..."
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-3 rounded-2xl border border-primary-100 bg-primary-50/40 p-4">
                  <div>
                    <div className="text-sm font-black text-primary-950">Landing-page ministry profile</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">The image and caption below are saved to MySQL and displayed publicly on the landing page.</p>
                  </div>
                  {formLandingImage && (
                    <div className="overflow-hidden rounded-xl border border-white bg-white">
                      <img src={formLandingImage} alt="Ministry landing preview" className="h-40 w-full object-cover" />
                    </div>
                  )}
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Profile photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleLandingImageChange(e.target.files?.[0] || null)}
                      disabled={uploadingLandingImage}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-900 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                    />
                    {uploadingLandingImage && <span className="mt-1 block text-[11px] font-semibold text-primary-700">Uploading and saving image…</span>}
                    {formLandingFilename && !uploadingLandingImage && <span className="mt-1 block text-[11px] text-slate-400">Saved: {formLandingFilename}</span>}
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Landing caption</span>
                    <textarea
                      value={formCaption}
                      onChange={(e) => setFormCaption(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Short caption shown over the ministry profile…"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500"
                    />
                    <span className="mt-1 block text-right text-[10px] text-slate-400">{formCaption.length}/500</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Day</label>
                    <Input value={formDay} onChange={(e) => setFormDay(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                    <Input value={formTime} onChange={(e) => setFormTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Venue</label>
                    <Input value={formVenue} onChange={(e) => setFormVenue(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary-900 text-white font-bold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Leader Modal with Eligibility Checking */}
      <AnimatePresence>
        {isAssignModalOpen && targetMinistry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-black text-primary-950">
                    Assign Leader: {targetMinistry.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Constitutional vetting & eligibility validation (Article 14.3)
                  </p>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>

              {/* Constitutional Check Info Box */}
              <div className="rounded-2xl bg-gold-50 p-3 text-xs text-gold-950 border border-gold-200">
                <div className="font-black flex items-center gap-1 mb-1">
                  <Shield size={13} /> Article 14.3 Qualification Criteria:
                </div>
                <p>• Must be at least in Year 2 of undergraduate/diploma study.</p>
                <p>• Must be an active, baptized Full Member with exemplary Christian conduct.</p>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700">Eligible Member Candidates:</div>
                {searchResults.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-2xl p-3.5 border transition flex items-center justify-between gap-3 ${
                      m.is_eligible
                        ? 'bg-slate-50 border-slate-200 hover:border-primary-900'
                        : 'bg-red-50/50 border-red-200 opacity-80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-primary-950">{m.full_name}</span>
                        <span className="font-mono text-[10px] text-slate-500">({m.admission_number})</span>
                        {m.is_eligible ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                            Eligible
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-800">
                            Ineligible
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {m.year_of_study} • {m.spiritual_standing}
                      </div>
                      {!m.is_eligible && (
                        <div className="text-[10px] text-red-700 font-semibold">{m.ineligibility_reason}</div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      disabled={!m.is_eligible || submittingLeader}
                      onClick={() => handleAssignLeader(m)}
                      className="text-xs bg-primary-900 text-white font-bold shrink-0"
                    >
                      Assign as Leader
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Super Admin Ministry Background Customization Modal */}
      {bgModalMinistry && (
        <MinistryBackgroundModal
          isOpen={Boolean(bgModalMinistry)}
          onClose={() => setBgModalMinistry(null)}
          ministry={bgModalMinistry}
          onSaved={() => {
            fetchMinistries();
          }}
        />
      )}
    </div>
  );
}
