import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  HeartHandshake,
  Users,
  Sparkles,
  Clock,
  MapPin,
  CalendarDays,
  Download,
  Calendar,
  Phone,
  Mail,
  Megaphone,
  Copy,
  Check,
  RefreshCw,
  Award,
  ChevronRight,
  ChevronLeft,
  Share2,
  Bookmark,
  Shield,
  Star,
  Flame,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HeroCarousel } from '@/components/HeroCarousel';
import { PrayerArt } from '@/components/hero-art/PrayerArt';
import { BibleStudyArt } from '@/components/hero-art/BibleStudyArt';
import { CommunityArt } from '@/components/hero-art/CommunityArt';
import { fetchLandingMedia } from '@/features/landing-media/landing-media.api';
import {
  fetchProgrammes,
  fetchPublicEvents,
  downloadSemesterCalendarIcs,
  type PublicEvent,
  type WeeklyProgramme,
} from '@/features/events/events.api';
import {
  fetchPublicExecutives,
  type PublicExecutiveLeader,
} from '@/features/leadership/leadership.api';
import {
  fetchPublicAnnouncements,
  type PublicAnnouncement,
} from '@/features/broadcast-messages/broadcast-messages.api';
import { getDailyMidnightScripture } from '@/data/dailyScriptures';
import tumGateImage from '@/assets/tum-gate-monument.jpg';
import photo1 from '@/assets/community/community-1.jpg';
import photo2 from '@/assets/community/community-2.jpg';
import photo3 from '@/assets/community/community-3.jpg';
import photo4 from '@/assets/community/community-4.jpg';
import photo5 from '@/assets/community/community-5.jpg';

const stats = [
  { label: 'Active Ministries', value: '10', icon: Users },
  { label: 'Faith & Fellowship', value: '24/7', icon: HeartHandshake },
  { label: 'Word-Centred', value: '100%', icon: BookOpen },
];

const moments = [
  {
    title: 'Prayer that moves us',
    text: 'We gather to seek God, carry one another and intercede for our campus and nation.',
    Art: PrayerArt,
    tag: 'PRAYER',
  },
  {
    title: 'The Word that forms us',
    text: 'Bible study, discipleship, and grounded hermeneutics taking faith beyond Sunday into life.',
    Art: BibleStudyArt,
    tag: 'THE WORD',
  },
  {
    title: 'Community that sends us',
    text: 'We serve, evangelize, and build lifelong friendships that reflect the love of Christ.',
    Art: CommunityArt,
    tag: 'MISSION',
  },
];

export function HomePage() {
  // Query landing media (hero slides, 5 backdrop pictures, interval)
  const { data: media } = useQuery({
    queryKey: ['landing-media'],
    queryFn: fetchLandingMedia,
    staleTime: 30_000,
    refetchInterval: 25_000,
  });

  // Query weekly spiritual rhythm programs
  const { data: dynamicProgrammes = [] } = useQuery<WeeklyProgramme[]>({
    queryKey: ['programmes'],
    queryFn: fetchProgrammes,
    staleTime: 20_000,
  });

  // Query upcoming public events (with date, venue, category, preacher)
  const { data: publicEvents = [] } = useQuery<PublicEvent[]>({
    queryKey: ['public-events'],
    queryFn: fetchPublicEvents,
    staleTime: 20_000,
  });

  // Query executive leaders directory (public, fast non-blocking cached query)
  const { data: executiveLeaders = [] } = useQuery<PublicExecutiveLeader[]>({
    queryKey: ['public-executives'],
    queryFn: fetchPublicExecutives,
    staleTime: 60_000,
  });

  // Query announcements & notices
  const { data: announcements = [] } = useQuery<PublicAnnouncement[]>({
    queryKey: ['public-announcements'],
    queryFn: fetchPublicAnnouncements,
    staleTime: 30_000,
  });

  // ---------------------------------------------------------------------------
  // 5 ALTERNATING BACKDROP PICTURES (Rotates smoothly & configurable by admin)
  // ---------------------------------------------------------------------------
  const backdropSlides = useMemo(() => {
    if (media?.backdropSlides && media.backdropSlides.length > 0) {
      const activeOnly = media.backdropSlides.filter((b) => b.active);
      if (activeOnly.length > 0) return activeOnly;
    }
    return [
      { id: 'b-1', src: media?.backgroundImage?.src || tumGateImage, title: 'TUM Main Entrance Gate Monument', active: true, order: 1 },
      { id: 'b-2', src: photo1, title: 'Student Intercession & Prayer Gathering', active: true, order: 2 },
      { id: 'b-3', src: photo2, title: 'Joyful Praise & Worship in Unity', active: true, order: 3 },
      { id: 'b-4', src: photo3, title: 'Christian Fellowship & Discipleship', active: true, order: 4 },
      { id: 'b-5', src: photo5, title: 'Campus Evangelism & Servant Leadership', active: true, order: 5 },
    ];
  }, [media]);

  const [currentBackdropIdx, setCurrentBackdropIdx] = useState(0);

  useEffect(() => {
    setCurrentBackdropIdx((prev) => Math.min(prev, Math.max(0, backdropSlides.length - 1)));
    if (backdropSlides.length <= 1) return;
    const interval = Math.max(1500, Number(media?.rotateIntervalMs) || 4000);
    const timer = setInterval(() => {
      setCurrentBackdropIdx((prev) => (prev + 1) % backdropSlides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [backdropSlides.length, media?.rotateIntervalMs]);

  const bgOpacity = media?.backgroundImage?.opacity ?? 0.82;
  const bgBlurPx = media?.backgroundImage?.blurPx ?? 1;

  // ---------------------------------------------------------------------------
  // DAILY MIDNIGHT SCRIPTURE (Deterministic rotation after every 12:00 AM)
  // ---------------------------------------------------------------------------
  const [scriptureOffset, setScriptureOffset] = useState(0);
  const [copiedScripture, setCopiedScripture] = useState(false);
  const currentDailyScripture = useMemo(
    () => getDailyMidnightScripture(scriptureOffset),
    [scriptureOffset]
  );

  const handleCopyScripture = () => {
    const textToCopy = `${currentDailyScripture.scripture.text} — ${currentDailyScripture.scripture.reference} (TUMCU Daily Scripture)`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedScripture(true);
    setTimeout(() => setCopiedScripture(false), 2500);
  };

  // ---------------------------------------------------------------------------
  // LEADERSHIP DIRECTORY TABS / FILTER
  // ---------------------------------------------------------------------------
  const [leadershipCategory, setLeadershipCategory] = useState<'all' | 'executive' | 'coordinators'>('all');
  const filteredLeaders = useMemo(() => {
    if (leadershipCategory === 'executive') {
      return executiveLeaders.filter(
        (l) =>
          l.position_code.includes('chair') ||
          l.position_code.includes('secretary') ||
          l.position_code.includes('treasurer')
      );
    }
    if (leadershipCategory === 'coordinators') {
      return executiveLeaders.filter(
        (l) =>
          !l.position_code.includes('secretary') &&
          !l.position_code.includes('treasurer') &&
          l.position_code !== 'chairperson' &&
          l.position_code !== 'first_vice_chairperson' &&
          l.position_code !== 'second_vice_chairperson'
      );
    }
    return executiveLeaders;
  }, [executiveLeaders, leadershipCategory]);

  // ---------------------------------------------------------------------------
  // SPECIAL EVENTS & UPCOMING PROGRAMS
  // ---------------------------------------------------------------------------
  const [eventsTab, setEventsTab] = useState<'all' | 'special' | 'weekly'>('all');

  // Find featured special events (e.g. worship nights, agm, missions, or flagged)
  const specialEvents = useMemo(() => {
    return publicEvents.filter(
      (e) =>
        e.event_type !== 'regular' &&
        (e.title.toLowerCase().includes('worship') ||
          e.title.toLowerCase().includes('mission') ||
          e.title.toLowerCase().includes('retreat') ||
          e.title.toLowerCase().includes('conference') ||
          e.title.toLowerCase().includes('consecration') ||
          e.title.toLowerCase().includes('orientation') ||
          e.event_type === 'special' ||
          e.event_type === 'service')
    );
  }, [publicEvents]);

  // Featured flagship event for hero spotlight banner
  const featuredFlagshipEvent = specialEvents[0] || publicEvents[0];

  return (
    <div className="overflow-hidden">
      {/* ===================================================================== */}
      {/* HERO SECTION WITH 5 ALTERNATING BACKDROP PICTURES                    */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden min-h-[640px] lg:min-h-[720px] flex flex-col justify-between">
        {/* 5 Alternating Backdrop Layer: smooth crossfade transition */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {backdropSlides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 bg-cover bg-no-repeat transform-gpu transition-all duration-1000 ease-in-out ${
                idx === currentBackdropIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              style={{
                backgroundImage: `url(${slide.src})`,
                backgroundPosition: 'center 25%',
                filter: `blur(${bgBlurPx}px)`,
              }}
            />
          ))}
        </div>

        {/* Ambient Overlays & Scrim for perfect contrast and readability */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.58) 50%, rgba(248,251,249,0.95) 100%)',
            opacity: bgOpacity,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.8),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.7),transparent_60%)] pointer-events-none" />

        {/* Backdrop Switcher Indicator (Admin-configurable 5 pictures) */}
        <div className="relative z-10 pt-4 px-5 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1 text-[11px] font-bold text-slate-800 backdrop-blur-md border border-white/80 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>TUM Main Campus Fellowship</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-white text-[11px] font-medium border border-white/20 shadow-xs ml-auto">
            <span className="text-emerald-300 font-bold">Backdrop #{currentBackdropIdx + 1}/{backdropSlides.length}:</span>
            <span className="max-w-[160px] truncate">{backdropSlides[currentBackdropIdx]?.title}</span>
            <div className="flex gap-1 ml-1.5">
              {backdropSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentBackdropIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentBackdropIdx ? 'w-4 bg-emerald-400' : 'w-1.5 bg-white/50 hover:bg-white'
                  }`}
                  aria-label={`View backdrop photo ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Hero Main Content */}
        <section className="relative px-5 pb-16 pt-10 sm:px-6 lg:pt-16">
          <div className="page-shell relative grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
            <div className="relative z-10">
              <span className="eyebrow shadow-xs bg-white/95 backdrop-blur-md border border-primary-200">
                <Sparkles size={14} className="text-primary-700" /> A community on mission
              </span>
              <div className="mt-6 inline-block rounded-3xl bg-white/45 p-2 sm:p-3 -ml-2 sm:-ml-3 backdrop-blur-[2px]">
                <h1 className="max-w-3xl text-4xl font-black leading-[1.1] tracking-[-.035em] text-slate-950 sm:text-5xl lg:text-6xl drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]">
                  The Technical University of Mombasa <span className="text-primary-700 drop-shadow-xs">Christian Union</span>
                </h1>
              </div>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-900 font-bold sm:text-lg drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)]">
                Welcome to TUMCU — a Christ-centred community where students discover purpose, grow in the Word, find family and learn to serve.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register">
                  <Button variant="primary" className="px-6 py-3.5 text-sm font-bold shadow-lg shadow-primary-900/25 hover:shadow-xl transition">
                    Join the community <ArrowRight size={17} />
                  </Button>
                </Link>
                <Link to="/ministries">
                  <Button variant="outline" className="px-6 py-3.5 text-sm font-bold border-slate-400/80 bg-white/90 text-primary-950 hover:bg-white transition backdrop-blur-md shadow-xs">
                    Explore ministries
                  </Button>
                </Link>
                <a href="#leadership">
                  <Button variant="outline" className="px-6 py-3.5 text-sm font-bold border-emerald-300 bg-emerald-50/90 text-emerald-900 hover:bg-emerald-100 transition backdrop-blur-md shadow-xs">
                    Executive leaders
                  </Button>
                </a>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4 border-t border-slate-300/80 pt-8 sm:gap-6">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/70 p-3 sm:p-4 backdrop-blur-md border border-white/80 shadow-xs">
                    <div className="text-2xl font-black text-primary-950 sm:text-3xl drop-shadow-2xs">{s.value}</div>
                    <div className="mt-1 text-xs font-black uppercase tracking-[.14em] text-slate-800 flex items-center gap-1.5">
                      <s.icon size={13} className="text-primary-700 shrink-0" />
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:pl-6">
              <div className="absolute -right-4 top-10 h-28 w-28 rounded-full bg-gold-400/35 blur-3xl" />
              <div className="absolute -left-4 bottom-6 h-36 w-36 rounded-full bg-primary-500/25 blur-3xl" />
              <div className="relative rounded-[36px] p-3 shadow-2xl shadow-primary-950/20 bg-white/90 border border-white backdrop-blur-md">
                <div className="photo-frame rounded-[30px] bg-white/80 p-4 sm:p-6">
                  <HeroCarousel
                    slides={media?.heroCarousel}
                    rotateIntervalMs={media?.rotateIntervalMs}
                  />
                </div>
              </div>
              <div className="float-soft absolute -bottom-7 -left-2 hidden max-w-[220px] rounded-3xl p-4 sm:block bg-white/95 border border-white shadow-xl backdrop-blur-md">
                <div className="text-xs font-bold uppercase tracking-[.16em] text-gold-600">Today</div>
                <div className="mt-1 font-bold text-primary-950">Grow. Connect. Serve.</div>
                <div className="mt-1 text-xs leading-5 text-slate-800 font-bold">There is a place for you here.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Gentle transition blend into subsequent content */}
        <div className="h-10 bg-gradient-to-t from-[#f8fbf9] to-transparent pointer-events-none" />
      </div>

      {/* ===================================================================== */}
      {/* OFFICIAL ANNOUNCEMENTS TICKER / BANNER                                */}
      {/* ===================================================================== */}
      {announcements.length > 0 && (
        <section className="bg-amber-50/90 border-y border-amber-200/80 py-3.5 px-4 sm:px-6">
          <div className="page-shell flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-amber-500 text-white grid place-items-center shrink-0 shadow-xs">
                <Megaphone size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                    Official Announcement
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {announcements[0].title}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 max-w-3xl line-clamp-1">
                  {announcements[0].body}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              {announcements[0].venue && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white/80 px-2.5 py-1 rounded-full border border-amber-200">
                  <MapPin size={12} className="text-amber-600" />
                  {announcements[0].venue}
                </span>
              )}
              <Link
                to="/events"
                className="text-xs font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-1"
              >
                All notices <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* DAILY SCRIPTURE SECTION (Deterministically alternates at 12 midnight) */}
      {/* ===================================================================== */}
      <section className="page-shell py-8 sm:py-10">
        <div className="relative overflow-hidden rounded-[32px] border border-emerald-900/10 bg-gradient-to-br from-emerald-900 via-[#004d26] to-slate-950 p-6 sm:p-10 text-white shadow-xl">
          {/* Subtle decorative glowing background circles */}
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-gold-400/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/30 px-3 py-1 text-xs font-black uppercase tracking-wider">
                  <Sparkles size={13} /> Scripture of the Day
                </span>
                <span className="text-[11px] font-medium text-emerald-200/80 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Alternates daily after 12:00 midnight
                </span>
                <span className="text-[11px] font-semibold text-emerald-300">
                  • {currentDailyScripture.formattedDate}
                </span>
              </div>

              <div>
                <blockquote className="text-lg sm:text-2xl font-serif font-medium leading-relaxed sm:leading-snug text-white/95 drop-shadow-sm">
                  {currentDailyScripture.scripture.text}
                </blockquote>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-base sm:text-lg font-black tracking-wide text-gold-400">
                    — {currentDailyScripture.scripture.reference}
                  </span>
                  <span className="text-xs font-semibold text-emerald-200/70 bg-emerald-800/40 px-2.5 py-0.5 rounded-md border border-emerald-700/50">
                    {currentDailyScripture.scripture.theme}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed pt-2 border-t border-emerald-800/50">
                <strong className="text-gold-300 font-bold">Devotional Thought: </strong>
                {currentDailyScripture.scripture.reflection}
              </p>
            </div>

            {/* Actions: Copy verse, cycle, or explore library */}
            <div className="flex flex-row lg:flex-col gap-2.5 shrink-0 self-start lg:self-center border-t lg:border-t-0 lg:border-l border-emerald-800/60 pt-4 lg:pt-0 lg:pl-8">
              <button
                type="button"
                onClick={handleCopyScripture}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition backdrop-blur-sm cursor-pointer"
              >
                {copiedScripture ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span>Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy verse</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setScriptureOffset((prev) => prev + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 border border-emerald-700/80 px-4 py-2.5 text-xs font-bold text-emerald-100 transition cursor-pointer"
                title="View another biblical meditation"
              >
                <RefreshCw size={14} />
                <span>Next meditation</span>
              </button>

              <Link
                to="/library"
                className="inline-flex items-center gap-2 rounded-xl bg-gold-500 hover:bg-gold-400 px-4 py-2.5 text-xs font-black text-slate-950 transition shadow-sm"
              >
                <BookOpen size={14} />
                <span>Read e-books</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* UPCOMING PROGRAMS, EVENTS, SPECIAL SERVICES & GATHERINGS             */}
      {/* ===================================================================== */}
      <section className="page-shell py-12 sm:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 pb-6">
          <div className="max-w-2xl">
            <span className="eyebrow">
              <Calendar size={13} className="text-primary-700" /> Live Campus Schedules & Gatherings
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-primary-950">
              Upcoming Programs, Events & <span className="text-primary-600">Special Services</span>
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Official TUMCU calendar with live venues, times, and dates updated continuously by leadership.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadSemesterCalendarIcs}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#006633] hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
            >
              <Download size={13} />
              <span>Download Calendar (.ics)</span>
            </button>
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition"
            >
              <span>All Events</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Filter Pills: All, Special Events, Weekly Spiritual Rhythm */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEventsTab('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              eventsTab === 'all'
                ? 'bg-[#006633] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Gatherings & Programs ({publicEvents.length + dynamicProgrammes.length})
          </button>
          <button
            type="button"
            onClick={() => setEventsTab('special')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              eventsTab === 'special'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Flame size={13} className={eventsTab === 'special' ? 'text-white' : 'text-amber-500'} />
            Special Events & Worship Nights ({specialEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setEventsTab('weekly')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              eventsTab === 'weekly'
                ? 'bg-[#006633] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Weekly Spiritual Rhythm ({dynamicProgrammes.length})
          </button>
        </div>

        {/* Featured Special Event Spotlight Card */}
        {featuredFlagshipEvent && (eventsTab === 'all' || eventsTab === 'special') && (
          <div className="mt-6 rounded-3xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-emerald-500/10 p-5 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-600 text-white font-black text-[11px] px-2.5 py-0.5 uppercase tracking-wider flex items-center gap-1">
                    <Star size={11} fill="white" /> Special Event Spotlight
                  </span>
                  <span className="text-xs font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300/60">
                    Official TUMCU Assembly
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                  {featuredFlagshipEvent.title}
                </h3>
                {featuredFlagshipEvent.description && (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {featuredFlagshipEvent.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-800 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-emerald-900 font-bold bg-white/90 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <Calendar size={13} className="text-emerald-700" />
                    {featuredFlagshipEvent.start_at
                      ? new Date(featuredFlagshipEvent.start_at).toLocaleDateString('en-KE', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Upcoming'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-800 bg-white/90 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <Clock size={13} className="text-indigo-600" />
                    {featuredFlagshipEvent.start_at
                      ? new Date(featuredFlagshipEvent.start_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Time TBA'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-800 bg-white/90 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <MapPin size={13} className="text-rose-600" />
                    {featuredFlagshipEvent.venue || featuredFlagshipEvent.location || 'Main Assembly Hall'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full sm:w-auto">
                <Link to="/events" className="w-full sm:w-auto">
                  <Button variant="primary" className="w-full text-xs font-bold px-5 py-3">
                    View Event Details <ArrowRight size={14} />
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={downloadSemesterCalendarIcs}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition"
                >
                  <CalendarDays size={13} />
                  <span>Add to Calendar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Grid: Upcoming Events & Programs with Dates and Venues */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 1. Public Scheduled Events */}
          {(eventsTab === 'all' || eventsTab === 'special') &&
            publicEvents.slice(0, eventsTab === 'special' ? 12 : 6).map((evt) => {
              const eventDate = evt.start_at ? new Date(evt.start_at) : null;
              const formattedDate = eventDate
                ? eventDate.toLocaleDateString('en-KE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Upcoming';
              const formattedTime = eventDate
                ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'TBA';
              const isSpecial =
                evt.event_type !== 'regular' ||
                evt.title.toLowerCase().includes('worship') ||
                evt.title.toLowerCase().includes('kesha');

              return (
                <div
                  key={evt.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white ${
                    isSpecial ? 'border-amber-200 shadow-2xs' : 'border-slate-200/90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="rounded-md bg-emerald-800 text-white font-black text-[11px] px-2.5 py-0.5 uppercase tracking-wider">
                        {formattedDate}
                      </span>
                      {isSpecial ? (
                        <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold border border-amber-200">
                          Special Event
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold">
                          Service
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {evt.title}
                    </h4>

                    {evt.description && (
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                      <Clock size={12} className="text-emerald-600" />
                      {formattedTime}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <MapPin size={12} className="text-slate-400" />
                      {evt.venue || evt.location || 'Assembly Hall'}
                    </span>
                  </div>
                </div>
              );
            })}

          {/* 2. Weekly Programmes Rhythm */}
          {(eventsTab === 'all' || eventsTab === 'weekly') &&
            dynamicProgrammes.map((prog: any) => {
              const isMonday = prog.day?.toLowerCase() === 'monday';
              const isSunday = prog.day?.toLowerCase() === 'sunday';

              return (
                <div
                  key={prog.id || `${prog.day}-${prog.title}`}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isMonday
                      ? 'border-emerald-300/80 bg-gradient-to-br from-emerald-50/50 via-white to-white'
                      : isSunday
                      ? 'border-amber-200 bg-gradient-to-br from-amber-50/40 via-white to-white'
                      : 'border-slate-200/90 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-md bg-primary-900 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">
                        {prog.day}
                      </span>
                      {isMonday && (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                          Bi-Weekly Alternating
                        </span>
                      )}
                      {isSunday && (
                        <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                          Sunday Service
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-primary-950 leading-snug">
                      {prog.active_this_week_title ? `${prog.title} (${prog.active_this_week_title})` : prog.title}
                    </h4>
                    {prog.description && (
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {prog.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                      <Clock size={12} className="text-emerald-600" />
                      {prog.time}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <MapPin size={12} className="text-slate-400" />
                      {prog.venue}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* EXECUTIVE LEADERSHIP DIRECTORY TAB / SECTION                          */}
      {/* ===================================================================== */}
      <section id="leadership" className="bg-slate-50/80 border-t border-slate-200/80 py-16 sm:py-20 scroll-mt-16">
        <div className="page-shell">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="max-w-2xl">
              <span className="eyebrow bg-white border border-slate-200">
                <Shield size={13} className="text-emerald-700" /> Constitutional Governance & Ministry Oversight
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
                TUMCU <span className="text-emerald-700">Executive Leadership</span>
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Meet the servant leaders ordained and appointed to steer the Technical University of Mombasa Christian Union. All contact information and portfolios are verified.
              </p>
            </div>

            {/* Filter Tabs: All, Executive Board, Committee Coordinators */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLeadershipCategory('all')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  leadershipCategory === 'all'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Leaders ({executiveLeaders.length})
              </button>
              <button
                type="button"
                onClick={() => setLeadershipCategory('executive')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  leadershipCategory === 'executive'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Executive Board
              </button>
              <button
                type="button"
                onClick={() => setLeadershipCategory('coordinators')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  leadershipCategory === 'coordinators'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Committee Coordinators
              </button>
            </div>
          </div>

          {/* Leaders Grid */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLeaders.map((leader) => {
              const initials = leader.full_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'CU';

              return (
                <div
                  key={leader.id || leader.position_id}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-lg transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Header with Photo/Avatar and Position Badge */}
                    <div className="flex items-start gap-3.5 mb-4">
                      {leader.avatar_url ? (
                        <img
                          src={leader.avatar_url}
                          alt={leader.full_name}
                          className="h-16 w-16 rounded-2xl object-cover border-2 border-emerald-100 shadow-xs shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-800 to-primary-950 text-white font-black text-lg grid place-items-center shrink-0 shadow-xs border-2 border-emerald-100">
                          {initials}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <span className="inline-block rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-emerald-200/80 mb-1">
                          {leader.position_name}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base leading-snug truncate">
                          {leader.full_name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          Tenure: {leader.academic_year || '2025/2026'}
                        </p>
                      </div>
                    </div>

                    {/* Responsibilities summary */}
                    {leader.responsibilities && leader.responsibilities.length > 0 && (
                      <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                        <strong className="text-slate-800 block mb-0.5 font-bold">Portfolio:</strong>
                        <p className="line-clamp-2">{leader.responsibilities[0]}</p>
                      </div>
                    )}
                  </div>

                  {/* Contact Information & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <a
                        href={`tel:${leader.phone_number}`}
                        className="inline-flex items-center gap-1.5 text-slate-700 hover:text-emerald-800 font-semibold"
                        title="Call Leader"
                      >
                        <Phone size={13} className="text-emerald-600 shrink-0" />
                        <span className="truncate">{leader.phone_number}</span>
                      </a>
                      <a
                        href={`tel:${leader.phone_number}`}
                        className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100"
                      >
                        CALL
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <a
                        href={`mailto:${leader.email}`}
                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-800 font-medium truncate"
                        title="Send Email"
                      >
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{leader.email}</span>
                      </a>
                      <a
                        href={`mailto:${leader.email}`}
                        className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md hover:bg-slate-200"
                      >
                        EMAIL
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* THE TUMCU RHYTHM & CORE PILLARS                                      */}
      {/* ===================================================================== */}
      <section className="page-shell section-pad">
        <div className="max-w-2xl">
          <span className="eyebrow">The TUMCU rhythm</span>
          <h2 className="mt-5 text-4xl font-black tracking-tight text-primary-900 sm:text-5xl">
            More than a programme. <span className="text-primary-500">A way of life.</span>
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Different expressions. One family. Scroll through the moments that shape our community.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {moments.map((item) => (
            <Card key={item.title} className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative aspect-[16/10] overflow-hidden bg-primary-950">
                <item.Art />
                <div className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-gold-300 backdrop-blur-md">
                  {item.tag}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black text-primary-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* CALL TO ACTION                                                        */}
      {/* ===================================================================== */}
      <section className="page-shell section-pad">
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-primary-900 via-primary-950 to-slate-950 p-8 text-white sm:p-14">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[.2em] text-gold-300 backdrop-blur-md">
              Start your journey
            </div>
            <h2 className="mt-6 text-3xl font-black sm:text-4xl">
              Ready to be part of what God is doing at TUM?
            </h2>
            <p className="mt-4 text-base leading-7 text-white/80">
              Register as a member, find a ministry where your gifts can serve, and connect with fellow students pursuing Christ together.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register">
                <Button variant="secondary" className="px-6 py-3.5 text-sm font-bold">
                  Register for membership <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/ministries">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-6 py-3.5 text-sm font-bold">
                  See our ministries
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
