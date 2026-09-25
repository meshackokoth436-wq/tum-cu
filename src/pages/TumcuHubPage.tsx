import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Church,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CalendarCheck2,
  ShieldCheck,
  BookOpen,
  HeartHandshake,
  Music2,
  Globe2,
  Camera,
  ExternalLink,
  ChevronRight,
  Info,
  X,
  Award,
  Download,
  RefreshCw,
  Edit3,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchMinistries,
  fetchMyMinistries,
  joinMinistry,
  leaveMinistry,
  getMinistryBackground,
  type Ministry,
} from '@/features/ministries/ministries.api';
import {
  fetchPublicEvents,
  fetchProgrammes,
  createProgramme,
  updateProgramme,
  deleteProgramme,
  downloadSemesterCalendarIcs,
  type PublicEvent,
  type WeeklyProgramme,
} from '@/features/events/events.api';
import { fetchRoleAssignments } from '@/features/admin/admin.api';
import { MinistryBackgroundModal } from '@/components/MinistryBackgroundModal';

// TUMCU Official Weekly Programme with canonical alternating schedule
const WEEKLY_PROGRAMME = [
  {
    day: 'Monday',
    title: 'E-Teams Fellowship & Door to Door Outreach',
    Icon: Globe2,
    iconColor: 'bg-emerald-50 text-[#006633] border-emerald-200',
    time: '5:00 PM – 7:00 PM',
    venue: 'Campus & Hostel Grounds / E-Team Centers',
    leader: 'Evangelism Teams (NET TUM UNIT & NORET-SORET)',
    description: 'Alternating weekly between E-Teams Regional Fellowship and Door-to-Door hostel evangelism.',
    alternating_enabled: 1,
  },
  {
    day: 'Tuesday',
    title: 'Bible Study (BEST)',
    Icon: BookOpen,
    iconColor: 'bg-amber-50 text-amber-800 border-amber-200',
    time: '5:00 PM – 7:00 PM',
    venue: 'Main Tuition Block Classrooms',
    leader: 'Bible Study Ministry',
    description: 'Deep verse-by-verse scripture study, interactive hermeneutics, and small group discipleship cohorts.',
  },
  {
    day: 'Wednesday',
    title: 'Discipleship & Nurture Classes',
    Icon: HeartHandshake,
    iconColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    time: '5:00 PM – 7:00 PM',
    venue: 'Assembly Hall / Designated Lecture Halls',
    leader: 'Discipleship & Nurture Ministry',
    description: 'Foundational Christian growth, spiritual mentorship, doctrine, and baptismal instruction.',
  },
  {
    day: 'Thursday',
    title: 'Empowerment Fellowship',
    Icon: Sparkles,
    iconColor: 'bg-teal-50 text-teal-800 border-teal-200',
    time: '5:00 PM – 7:00 PM',
    venue: 'Assembly Hall',
    leader: 'Executive Committee & Guest Speakers',
    description: 'Holistic growth spanning academic excellence, career readiness, relationships, and leadership.',
  },
  {
    day: 'Friday',
    title: 'Friday Main Service & Praise Night',
    Icon: Music2,
    iconColor: 'bg-purple-50 text-purple-800 border-purple-200',
    time: '6:00 PM – 8:30 PM',
    venue: 'Main Assembly Hall',
    leader: 'Executive Committee & Music Ministry',
    description: 'Heartfelt corporate worship, spirit-led prayers, powerful preaching, and impartation.',
  },
  {
    day: 'Sunday',
    title: 'Main Sunday Worship & Word Service',
    Icon: Church,
    iconColor: 'bg-emerald-100 text-[#006633] border-emerald-300',
    time: '8:00 AM – 12:30 PM',
    venue: 'Main Assembly Hall / Sanctuary',
    leader: 'TUMCU Leadership & Ministers',
    description: 'Weekly Lord’s Day celebration featuring praise, expository scripture preaching, and fellowship.',
    is_configurable: 1,
  },
];

export function TumcuHubPage() {
  const queryClient = useQueryClient();
  const { user, roles, permissions, isAuthenticated, accessToken, hasPermission } = useAuthStore();
  const isSuperAdminState = useAuthStore((s) => s.isSuperAdmin());

  const canQueryProtected = Boolean(isAuthenticated && accessToken);

  // Check if current user has Super Admin authority strictly from DB
  const isSuperAdmin =
    canQueryProtected &&
    (isSuperAdminState ||
      user?.role === 'super_admin' ||
      roles.some((r) => r.code === 'super_admin' || r.role_id === 'role-1') ||
      permissions.includes('*') ||
      permissions.includes('system.manage_roles'));

  const [activeTab, setActiveTab] = useState<'programme' | 'ministries' | 'events' | 'leadership'>('programme');
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [editingBackgroundMinistry, setEditingBackgroundMinistry] = useState<Ministry | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Weekly Programme Editing State
  const [editingProg, setEditingProg] = useState<any | null>(null);
  const [editDay, setEditDay] = useState('Monday');
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editLeader, setEditLeader] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingProg, setIsSavingProg] = useState(false);
  const [isDeletingProg, setIsDeletingProg] = useState(false);
  const [showMondaySchedule, setShowMondaySchedule] = useState(false);

  // Queries
  const { data: ministries = [], isLoading: ministriesLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: fetchMinistries,
  });

  const { data: myMinistries = [] } = useQuery({
    queryKey: ['my-ministries'],
    queryFn: fetchMyMinistries,
    enabled: canQueryProtected,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'public'],
    queryFn: fetchPublicEvents,
  });

  const { data: dynamicProgrammes = [], isLoading: programmesLoading } = useQuery({
    queryKey: ['programmes'],
    queryFn: fetchProgrammes,
  });

  const handleOpenEditProg = (prog: any) => {
    setEditingProg(prog);
    setEditDay(prog.day || 'Monday');
    setEditTitle(prog.title || '');
    setEditTime(prog.time || '');
    setEditVenue(prog.venue || '');
    setEditLeader(prog.leader || '');
    setEditDescription(prog.description || '');
  };

  const handleOpenNewProg = () => {
    setEditingProg({ id: 'new', day: 'Monday' });
    setEditDay('Monday');
    setEditTitle('');
    setEditTime('5:00 PM – 7:00 PM');
    setEditVenue('Main Hall / Assembly');
    setEditLeader('');
    setEditDescription('');
  };

  const handleDeleteProg = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this programme from the weekly spiritual rhythm?')) {
      return;
    }
    setIsDeletingProg(true);
    try {
      await deleteProgramme(id);
      await queryClient.invalidateQueries({ queryKey: ['programmes'] });
      setEditingProg(null);
      setActionFeedback('Programme removed from weekly schedule.');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to delete programme:', err);
      setActionFeedback('Failed to remove programme. Please try again.');
    } finally {
      setIsDeletingProg(false);
    }
  };

  const handleSaveProg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProg) return;
    setIsSavingProg(true);
    try {
      if (editingProg.id === 'new') {
        await createProgramme({
          day: editDay.trim(),
          title: editTitle.trim(),
          time: editTime.trim(),
          venue: editVenue.trim(),
          leader: editLeader.trim(),
          description: editDescription.trim(),
        });
        setActionFeedback(`Created ${editDay} programme successfully!`);
      } else {
        await updateProgramme(editingProg.id, {
          day: editDay.trim(),
          title: editTitle.trim(),
          time: editTime.trim(),
          venue: editVenue.trim(),
          leader: editLeader.trim(),
          description: editDescription.trim(),
        });
        setActionFeedback(`Updated ${editDay} programme schedule successfully!`);
      }
      await queryClient.invalidateQueries({ queryKey: ['programmes'] });
      setEditingProg(null);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      console.error('Failed to update programme:', err);
      setActionFeedback('Failed to update programme. Please try again.');
    } finally {
      setIsSavingProg(false);
    }
  };

  const isAdmin =
    canQueryProtected &&
    (isSuperAdmin ||
      user?.role === 'super_admin' ||
      hasPermission('events.create') ||
      hasPermission('ministries.create'));

  const { data: leadershipData = [] } = useQuery({
    queryKey: ['leadership-assignments'],
    queryFn: async () => {
      try {
        const res = await fetchRoleAssignments();
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: canQueryProtected && (isAdmin || isSuperAdmin),
  });

  // Join & Leave Mutations
  const joinMutation = useMutation({
    mutationFn: (ministryId: string) => joinMinistry(ministryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ministries'] });
      setActionFeedback('Ministry application approved! You have successfully joined this ministry.');
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (ministryId: string) => leaveMinistry(ministryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ministries'] });
      setActionFeedback('You have stepped down from this ministry.');
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  // Current leadership
  const currentLeaders = leadershipData.filter((l) => Boolean(l.is_current));

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Presidential TUMCU Fellowship Crest & Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        {/* Subtle decorative emerald accent border top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#006633] via-amber-400 to-[#006633]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF5EF] px-3 py-1 text-xs font-bold text-[#006633] border border-[#006633]/20">
              <Church size={13} className="text-[#006633]" />
              <span className="tracking-wide uppercase text-[10px] font-black">
                Technical University of Mombasa Christian Union
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#17201B] tracking-tight">
              TUMCU Fellowship Hub
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              "Growing together. Serving together. Living for Christ." — Explore weekly spiritual services, constitutional ministries, campus evangelism, and leadership directories.
            </p>

            <p className="text-[11px] font-serif italic text-amber-900/80 pt-0.5">
              “Behold, how good and how pleasant it is for brethren to dwell together in unity!” — Psalm 133:1
            </p>
          </div>

          {/* Quick Statistics or Super Admin Pill */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
            {isSuperAdmin && (
              <Link
                to="/dashboard/admin?tab=ministries"
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 text-xs font-bold text-amber-950 shadow-2xs transition active:scale-95"
              >
                <ShieldCheck size={15} className="text-amber-700" />
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase text-amber-800">Executive Console</div>
                  <span className="text-xs">Manage Ministry Media</span>
                </div>
              </Link>
            )}
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-xs text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">12 Ministries</span>
              <span>·</span>
              <span className="font-semibold text-slate-800">5 Weekly Services</span>
            </div>
          </div>
        </div>

        {/* Super Admin Quick Media Guidance Bar */}
        {isSuperAdmin && (
          <div className="mt-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-950 font-medium">
              <Camera size={15} className="text-amber-700 shrink-0" />
              <span>
                <strong>Super Admin Media Mode:</strong> You can update any ministry's background photograph directly using the camera button on its card below.
              </span>
            </div>
            <Link
              to="/dashboard/admin"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 underline shrink-0"
            >
              <span>Admin Center</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Navigation Tabs (Strictly Lucide Icons, Borders, No Emojis!) */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveTab('programme')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              activeTab === 'programme'
                ? 'bg-[#006633] text-white border-[#006633] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CalendarDays size={14} className={activeTab === 'programme' ? 'text-white' : 'text-[#006633]'} />
            <span>Weekly Programme</span>
          </button>

          <button
            onClick={() => setActiveTab('ministries')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              activeTab === 'ministries'
                ? 'bg-[#006633] text-white border-[#006633] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Church size={14} className={activeTab === 'ministries' ? 'text-white' : 'text-[#006633]'} />
            <span>Constitutional Ministries</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                activeTab === 'ministries' ? 'bg-white/25 text-white' : 'bg-[#EAF5EF] text-[#006633]'
              }`}
            >
              {ministries.length || 12}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              activeTab === 'events'
                ? 'bg-[#006633] text-white border-[#006633] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CalendarCheck2 size={14} className={activeTab === 'events' ? 'text-white' : 'text-[#006633]'} />
            <span>Events & Calendar</span>
            {events.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  activeTab === 'events' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {events.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('leadership')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              activeTab === 'leadership'
                ? 'bg-[#006633] text-white border-[#006633] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={14} className={activeTab === 'leadership' ? 'text-white' : 'text-[#006633]'} />
            <span>Leadership Roster</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Weekly Programme (Structured Cards with Dedicated Icons) */}
      {activeTab === 'programme' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Canonical Weekly Fellowship Rhythm
              </h2>
              <p className="text-xs text-slate-500">
                Scheduled spiritual gatherings for worship, doctrine, evangelism, and holistic empowerment
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <Button
                  onClick={handleOpenNewProg}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-emerald-600 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-2xs"
                >
                  <Plus size={13} />
                  <span>Add Programme</span>
                </Button>
              )}

              <Button
                onClick={downloadSemesterCalendarIcs}
                variant="primary"
                size="sm"
                className="gap-2 bg-[#006633] hover:bg-[#005229] text-white shadow-xs font-bold text-xs"
              >
                <Download size={13} />
                <span>Download Semester Calendar (.ics)</span>
              </Button>

              <span className="text-[11px] font-bold text-[#006633] bg-[#EAF5EF] px-2.5 py-1 rounded-full border border-[#006633]/20">
                Academic Year 2026
              </span>
            </div>
          </div>

          {/* Alternating Monday Highlight Notification */}
          <div className="rounded-2xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Globe2 size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                      Monday Alternating Schedule
                    </span>
                    <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-black text-emerald-900">
                      Automated Biweekly Rotation
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Mondays automatically alternate between <strong>Door to Door Evangelism</strong> and <strong>E-Teams Fellowship</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMondaySchedule(!showMondaySchedule)}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 border border-emerald-300/80 shadow-2xs hover:bg-emerald-50 transition"
              >
                <CalendarIcon size={13} className="text-emerald-700" />
                <span>{showMondaySchedule ? 'Hide Monday Forecast' : 'View 12-Week Rotation'}</span>
              </button>
            </div>

            {/* Expandable 12-Week Monday Rotation */}
            {showMondaySchedule && (
              <div className="mt-4 pt-4 border-t border-emerald-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {[
                  { date: 'Mon, 21 Sep 2026', title: 'E-Teams Fellowship', type: 'eteams' },
                  { date: 'Mon, 28 Sep 2026', title: 'Door to Door Evangelism', type: 'door' },
                  { date: 'Mon, 05 Oct 2026', title: 'E-Teams Fellowship', type: 'eteams' },
                  { date: 'Mon, 12 Oct 2026', title: 'Door to Door Evangelism', type: 'door' },
                  { date: 'Mon, 19 Oct 2026', title: 'E-Teams Fellowship', type: 'eteams' },
                  { date: 'Mon, 26 Oct 2026', title: 'Door to Door Evangelism', type: 'door' },
                  { date: 'Mon, 02 Nov 2026', title: 'E-Teams Fellowship', type: 'eteams' },
                  { date: 'Mon, 09 Nov 2026', title: 'Door to Door Evangelism', type: 'door' },
                  { date: 'Mon, 16 Nov 2026', title: 'E-Teams Fellowship', type: 'eteams' },
                  { date: 'Mon, 23 Nov 2026', title: 'Door to Door Evangelism', type: 'door' },
                  { date: 'Mon, 30 Nov 2026', title: 'E-Teams Fellowship', type: 'eteams' },
                  { date: 'Mon, 07 Dec 2026', title: 'Door to Door Evangelism', type: 'door' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-2.5 text-xs border ${
                      item.type === 'eteams'
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                        : 'bg-teal-100/70 border-teal-300 text-teal-950'
                    }`}
                  >
                    <div className="font-semibold text-[11px] opacity-80">{item.date}</div>
                    <div className="font-bold text-xs mt-0.5">{item.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3.5">
            {(dynamicProgrammes.length > 0 ? dynamicProgrammes : WEEKLY_PROGRAMME).map((prog: any) => {
              const ServiceIcon = prog.Icon || (prog.day === 'Monday' ? Globe2 : prog.day === 'Tuesday' ? BookOpen : prog.day === 'Wednesday' ? HeartHandshake : prog.day === 'Thursday' ? Sparkles : prog.day === 'Friday' ? Music2 : Church);
              const isMonday = prog.day?.toLowerCase() === 'monday';
              const isSunday = prog.day?.toLowerCase() === 'sunday';

              return (
                <div
                  key={prog.day}
                  className={`rounded-2xl border bg-white p-5 shadow-2xs hover:shadow-xs transition duration-150 ${
                    isMonday ? 'border-emerald-300/80 bg-gradient-to-r from-white via-emerald-50/20 to-white' : isSunday ? 'border-amber-200 bg-gradient-to-r from-white via-amber-50/20 to-white' : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${prog.iconColor || 'bg-emerald-50 text-[#006633] border-emerald-200'} shadow-2xs`}>
                        <ServiceIcon size={20} />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-lg bg-[#006633] px-2.5 py-0.5 text-xs font-black text-white shadow-2xs tracking-wide">
                            {prog.day}
                          </span>
                          <h3 className="text-base font-bold text-[#17201B] tracking-tight">
                            {prog.active_this_week_title ? `${prog.title} (This Week: ${prog.active_this_week_title})` : prog.title}
                          </h3>

                          {isMonday && (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                              Alternates Biweekly
                            </span>
                          )}

                          {isSunday && (
                            <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                              Sunday Main Service
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{prog.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1.5">
                          <span className="inline-flex items-center gap-1.5 font-bold text-[#006633] bg-[#EAF5EF] px-2.5 py-1 rounded-lg border border-[#006633]/15">
                            <Clock size={13} />
                            <span>{prog.time}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <MapPin size={13} className="text-slate-400" />
                            <span>{prog.venue}</span>
                          </span>
                          {prog.leader && (
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <Users size={13} className="text-slate-400" />
                              <span>{prog.leader}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Admin Action: Direct Edit Time & Venue */}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditProg(prog)}
                        className="shrink-0 gap-1.5 text-xs font-bold text-slate-700 hover:text-[#006633] border-slate-300 hover:border-[#006633]"
                      >
                        <Edit3 size={13} />
                        <span>Edit Time & Venue</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Admin Edit Modal */}
          {editingProg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={18} className="text-[#006633]" />
                    <h3 className="text-base font-bold text-slate-900">
                      {editingProg.id === 'new' ? 'Add New Weekly Programme' : `Edit ${editingProg.day} Programme Schedule`}
                    </h3>
                  </div>
                  <button
                    onClick={() => setEditingProg(null)}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveProg} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Day of Week
                      </label>
                      <select
                        value={editDay}
                        onChange={(e) => setEditDay(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#006633] focus:outline-none"
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Programme Title
                      </label>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="e.g. Midweek Fellowship"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Time (e.g. 5:00 PM – 7:00 PM)
                      </label>
                      <Input
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Venue
                      </label>
                      <Input
                        value={editVenue}
                        onChange={(e) => setEditVenue(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Leader / Ministry in Charge
                    </label>
                    <Input
                      value={editLeader}
                      onChange={(e) => setEditLeader(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Description / Focus
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#006633] focus:outline-none focus:ring-1 focus:ring-[#006633]"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {editingProg.id !== 'new' ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProg(editingProg.id)}
                        disabled={isDeletingProg}
                        className="gap-1 border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                      >
                        <Trash2 size={13} />
                        <span>{isDeletingProg ? 'Removing…' : 'Delete'}</span>
                      </Button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProg(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSavingProg}
                        className="bg-[#006633] hover:bg-[#005229] text-white font-bold"
                      >
                        {isSavingProg
                          ? 'Saving…'
                          : editingProg.id === 'new'
                          ? 'Create Programme'
                          : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: 12 Constitutional Ministries with Real Background Photographs & Admin Edit */}
      {activeTab === 'ministries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                12 Constitutional Ministries
              </h2>
              <p className="text-xs text-slate-500">
                Every member equipped for spiritual edification, evangelistic outreach, and campus worship.
              </p>
            </div>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                <Camera size={12} className="text-amber-700" /> Super Admin can customize tab pictures
              </span>
            )}
          </div>

          {ministriesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {ministries.map((min) => {
                const isEnrolled = myMinistries.some(
                  (m) => m.ministry_id === min.id || m.ministry_code === min.code
                );
                const bgImage = getMinistryBackground(min);

                return (
                  <div
                    key={min.id}
                    className={`group relative overflow-hidden rounded-3xl border transition duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
                      isEnrolled
                        ? 'border-emerald-400 ring-2 ring-emerald-300/60'
                        : 'border-slate-200/90 hover:border-[#006633]'
                    }`}
                  >
                    {/* Real Background Image with Cinematic Overlay */}
                    <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
                      <img
                        src={bgImage}
                        alt={min.name}
                        className="h-full w-full object-cover object-center group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-950/25" />

                      {/* Header overlay badges */}
                      <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between text-white">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/30 text-emerald-300">
                            {min.code}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isEnrolled && (
                              <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs">
                                ✓ Enrolled
                              </span>
                            )}
                            {/* Super Admin Camera Edit Button */}
                            {isSuperAdmin && (
                              <button
                                type="button"
                                title="Change Background Photo"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBackgroundMinistry(min);
                                }}
                                className="inline-flex items-center gap-1 rounded-xl bg-amber-400 text-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide hover:bg-amber-300 shadow-sm transition active:scale-95"
                              >
                                <Camera size={12} />
                                <span>Edit Photo</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title and description on image overlay */}
                        <div>
                          <h3 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-sm leading-snug">
                            {min.name}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-slate-200/90 line-clamp-2 mt-1 drop-shadow-xs font-normal">
                            {min.description ||
                              'Equipping university believers for consecrated Christian service, prayer, and campus revival.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action strip */}
                    <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>📍 {min.meeting_venue || 'Main Sanctuary'}</span>
                        <span>🗓️ {min.meeting_day || 'Weekly'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMinistry(min);
                          setActionFeedback(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-[#EAF5EF] hover:text-[#006633] px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                      >
                        <span>Details & Join</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Events & Missions */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Upcoming Fellowship Events & Campus Missions
              </h2>
              <p className="text-xs text-slate-500">Participate in revivals, weekend challenges, and community outreaches</p>
            </div>
            {isAdmin && (
              <Link to="/dashboard/admin?tab=events">
                <Button size="sm" variant="outline" className="text-xs font-bold gap-1 text-[#006633] border-[#006633]/30 hover:bg-[#EAF5EF]">
                  Edit Events
                </Button>
              </Link>
            )}
          </div>

          {eventsLoading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-10 text-center text-xs text-slate-500 shadow-2xs">
              <CalendarCheck2 size={36} className="mx-auto mb-2 text-slate-400" />
              No upcoming public events scheduled right now. Check back soon for the next fellowship challenge!
            </div>
          ) : (
            <div className="grid gap-3.5">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-[#006633]/40 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EAF5EF] text-[#006633] border border-[#006633]/20 shadow-2xs font-black text-center">
                        <div>
                          <div className="text-[10px] uppercase tracking-tighter">
                            {new Date(evt.start_at).toLocaleDateString(undefined, { month: 'short' })}
                          </div>
                          <div className="text-sm leading-none">
                            {new Date(evt.start_at).getDate()}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-bold text-[#006633]">
                            {evt.event_type}
                          </span>
                          <h3 className="font-bold text-[#17201B] text-base tracking-tight">{evt.title}</h3>
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{evt.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1.5">
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Clock size={13} className="text-[#006633]" />
                            {new Date(evt.start_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-slate-400" />
                            {evt.location || 'TUM Campus Sanctuary'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Executive Leadership Directory — Dignified, Presidential */}
      {activeTab === 'leadership' && (
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              TUMCU Executive Servant Leadership
            </h2>
            <p className="text-xs text-slate-500">
              Constitutional stewards dedicated to pastoral oversight, financial integrity, and campus discipleship.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {currentLeaders.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="font-bold text-slate-700 text-sm">No Leadership Appointments Yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Leadership positions and executive roles are currently empty. Appointed leaders will appear here once configured in the Admin Center.
                </p>
                {isAdmin && (
                  <Link to="/dashboard/admin?tab=leadership" className="inline-block mt-3">
                    <Button size="sm" variant="outline" className="text-xs font-bold gap-1.5 text-[#006633] border-[#006633]/40 hover:bg-[#EAF5EF]">
                      Appoint Leaders in Admin Center
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              currentLeaders.map((ldr) => (
                <div
                  key={ldr.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-xs transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#006633] text-white font-bold text-sm shadow-xs">
                      {ldr.full_name?.charAt(0) || 'L'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#17201B] text-sm truncate">{ldr.full_name}</h3>
                      <p className="text-xs font-semibold text-[#006633] truncate">{ldr.role_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {ldr.scope_name || 'Executive Committee'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Ministry Detail Modal */}
      <AnimatePresence>
        {selectedMinistry && (() => {
          const isEnrolled = myMinistries.some(
            (m) => m.ministry_id === selectedMinistry.id || m.ministry_code === selectedMinistry.code
          );
          const bgPhoto = getMinistryBackground(selectedMinistry);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-3xl bg-white overflow-hidden shadow-2xl border border-slate-200 my-auto"
              >
                {/* Photo Header */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                  <img
                    src={bgPhoto}
                    alt={selectedMinistry.name}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/30" />
                  
                  <button
                    onClick={() => {
                      setSelectedMinistry(null);
                      setActionFeedback(null);
                    }}
                    className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition"
                  >
                    <X size={16} />
                  </button>

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-300 bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">
                      {selectedMinistry.code}
                    </span>
                    <h3 className="text-lg font-black text-white drop-shadow-sm mt-1">
                      {selectedMinistry.name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {actionFeedback && (
                    <div className="rounded-2xl bg-emerald-50 p-3 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                      <span>{actionFeedback}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedMinistry.description ||
                      'Dedicated to equipping university students in sound Christian doctrine, worship, and faithful service.'}
                  </p>

                  <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs space-y-1 text-slate-700">
                    <div className="font-bold text-slate-900">Ministry Meetings & Location:</div>
                    <p>📍 Venue: {selectedMinistry.meeting_venue || 'Main Sanctuary'}</p>
                    <p>🗓️ Time: {selectedMinistry.meeting_day || 'Weekly Fellowship'}</p>
                  </div>

                  {/* Enrollment Action Box */}
                  {isEnrolled ? (
                    <div className="rounded-2xl bg-emerald-50/90 p-4 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                          <CheckCircle2 size={15} className="text-emerald-700" /> Active Ministry Member
                        </div>
                        <p className="text-emerald-800 text-[11px] mt-0.5">
                          You are registered with this fellowship group and receive scheduling updates.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="text-xs font-bold text-red-700 border-red-200 hover:bg-red-50 py-1.5 px-3 shrink-0"
                        loading={leaveMutation.isPending}
                        onClick={() => leaveMutation.mutate(selectedMinistry.id)}
                      >
                        Leave Ministry
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">Join {selectedMinistry.name}</div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Open to every active member of the Christian Union.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        className="text-xs font-bold gap-1.5 bg-[#006633] hover:bg-[#004D26] text-white shrink-0 shadow-xs"
                        loading={joinMutation.isPending}
                        onClick={() => joinMutation.mutate(selectedMinistry.id)}
                      >
                        <Church size={14} /> Apply & Join
                      </Button>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedMinistry(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Super Admin Ministry Background Customization Modal */}
      {editingBackgroundMinistry && (
        <MinistryBackgroundModal
          isOpen={Boolean(editingBackgroundMinistry)}
          onClose={() => setEditingBackgroundMinistry(null)}
          ministry={editingBackgroundMinistry}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['ministries'] });
          }}
        />
      )}
    </div>
  );
}
