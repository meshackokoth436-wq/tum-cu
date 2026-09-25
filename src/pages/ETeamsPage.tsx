import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Flame,
  Globe,
  Bell,
  Image,
  FileText,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { fetchETeams, fetchETeam, type ETeam } from '@/features/e-teams/e-teams.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export function ETeamsPage() {
  const { user, roles, hasRole } = useAuthStore();

  const isEteamLeader =
    roles.some((role) => role.code === 'e_team_chairperson' && role.scope_type === 'e_team') ||
    hasRole?.('super_admin') ||
    user?.role === 'super_admin';

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['e-teams-list'],
    queryFn: fetchETeams,
  });

  const [selectedTeamCode, setSelectedTeamCode] = useState<string>('NET-TUM');
  const [activeTab, setActiveTab] = useState<'overview' | 'programmes' | 'announcements' | 'reports' | 'gallery'>('overview');

  const selectedTeamSummary = teams.find(
    (t) => t.code.toUpperCase() === selectedTeamCode.toUpperCase() || t.name.toUpperCase() === selectedTeamCode.toUpperCase()
  );

  const { data: teamDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['e-team-details', selectedTeamSummary?.id],
    queryFn: () => (selectedTeamSummary ? fetchETeam(selectedTeamSummary.id) : null),
    enabled: Boolean(selectedTeamSummary?.id),
  });

  const currentTeam: ETeam | undefined = teamDetails || selectedTeamSummary;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Top Banner */}
      <section className="border-b border-[#006633]/10 bg-gradient-to-b from-[#006633]/5 via-[#FDFBF7] to-[#FDFBF7] pt-12 pb-8">
        <div className="page-shell">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#006633]/20 bg-[#006633]/10 px-3.5 py-1 text-xs font-bold text-[#006633]">
                <Flame size={13} />
                <span>Regional Missions & Campus Evangelism</span>
              </div>
              <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl tracking-tight">
                Evangelism Teams: <span className="text-[#006633]">NET MINISTRIES TRUST TUM UNIT & NORET-SORET</span>
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
                TUMCU evangelism teams mobilize students for grassroots outreach, high school ministries, door-to-door gospel crusades, and cross-cultural missions across Kenya.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isEteamLeader && (
                <Link to="/dashboard/e-teams">
                  <Button variant="primary" className="bg-[#006633] hover:bg-[#005229] text-white font-bold gap-2 text-xs">
                    <ShieldCheck size={14} />
                    <span>Chairperson Portal</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Team Switcher Buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            {teams.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTeamCode(t.code);
                  setActiveTab('overview');
                }}
                className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs sm:text-sm font-black transition ${
                  selectedTeamCode.toUpperCase() === t.code.toUpperCase()
                    ? 'bg-[#006633] text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Compass size={16} />
                <span>{t.name}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white">
                  {t.code}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {isLoading || !currentTeam ? (
        <div className="py-24 text-center text-slate-400">Loading evangelism team data…</div>
      ) : (
        <div className="page-shell py-8 space-y-8">
          {/* Hero Card for Selected Team */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
            <div className="relative h-48 sm:h-64 overflow-hidden bg-slate-900">
              <img
                src={currentTeam.banner_image_url || '/community/community-5.jpg'}
                alt={currentTeam.name}
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="rounded-full bg-[#006633] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  {currentTeam.code}
                </span>
                <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">{currentTeam.name}</h2>
                <p className="mt-1 text-xs sm:text-sm text-emerald-100 italic">"{currentTeam.motto || 'Evangelism • Discipleship • Fellowship • Mission'}"</p>
              </div>
            </div>

            {/* Quick Metadata Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/60 p-4 text-xs">
              <div className="p-2">
                <p className="text-[10px] font-bold uppercase text-slate-400">Meeting Schedule</p>
                <p className="font-bold text-slate-800">{currentTeam.meeting_day || 'Set by team leadership'}</p>
                <p className="text-slate-500">{currentTeam.meeting_time || 'Set by team leadership'}</p>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-bold uppercase text-slate-400">Meeting Venue</p>
                <p className="font-bold text-slate-800">{currentTeam.meeting_venue || 'Set by team leadership'}</p>
                <p className="text-slate-500">Main Campus</p>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-bold uppercase text-slate-400">Appointed Chairperson</p>
                <p className="font-bold text-slate-800">{currentTeam.chairperson_name || 'Not yet appointed'}</p>
                <p className="text-slate-500">{currentTeam.chairperson_phone || '—'}</p>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-bold uppercase text-slate-400">Target Mission Area</p>
                <p className="font-bold text-emerald-800 line-clamp-1">{currentTeam.target_mission_area || 'To be configured'}</p>
                <p className="text-slate-500">{currentTeam.region}</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-t border-slate-200 px-6 gap-2 sm:gap-6 overflow-x-auto">
              {[
                { id: 'overview', label: 'Vision & Scripture', icon: BookOpen },
                { id: 'programmes', label: `Programmes (${currentTeam.programmes?.length || 0})`, icon: Calendar },
                { id: 'announcements', label: `Announcements (${currentTeam.announcements?.length || 0})`, icon: Bell },
                { id: 'reports', label: `Mission Reports (${currentTeam.reports?.length || 0})`, icon: FileText },
                { id: 'gallery', label: `Gallery (${currentTeam.gallery?.length || 0})`, icon: Image },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-[#006633] text-[#006633]'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2 p-6 border-slate-200 bg-white">
                <h3 className="text-base font-bold text-slate-900">About {currentTeam.name}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {currentTeam.description}
                </p>

                <div className="mt-6 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#006633]">
                    Guiding Scripture Verse
                  </p>
                  <blockquote className="mt-2 text-xs sm:text-sm font-semibold text-slate-800 italic">
                    "{currentTeam.scripture_verse || 'Romans 10:15 — How beautiful are the feet of those who bring good news!'}"
                  </blockquote>
                </div>
              </Card>

              <Card className="p-6 border-slate-200 bg-white space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Get Involved in {currentTeam.code}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Join fellow evangelism champions for weekly intercession, open-air preaching classes, high school visitations, and semester missions.
                </p>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-700">
                  <p className="font-bold">Next Fellowship:</p>
                  <p className="mt-0.5">{currentTeam.meeting_day} • {currentTeam.meeting_time}</p>
                  <p className="text-slate-500">{currentTeam.meeting_venue}</p>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-500">Contact Chairperson directly:</p>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{currentTeam.chairperson_name}</p>
                  <p className="font-mono text-xs text-[#006633]">{currentTeam.chairperson_phone}</p>
                </div>
              </Card>
            </div>
          )}

          {/* Tab 2: Programmes */}
          {activeTab === 'programmes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Upcoming Fellowship & Outreach Schedule
                </h3>
              </div>

              {(!currentTeam.programmes || currentTeam.programmes.length === 0) ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                  No upcoming programmes scheduled for {currentTeam.code} at the moment.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {currentTeam.programmes.map((prog) => (
                    <Card key={prog.id} className="p-5 border-slate-200 bg-white shadow-xs">
                      <div className="flex items-start justify-between">
                        <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          {new Date(prog.date).toLocaleDateString()}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">{prog.time}</span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-slate-900">{prog.title}</h4>
                      <p className="mt-1 text-xs text-slate-600">{prog.focus}</p>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Venue: <strong className="text-slate-700">{prog.venue}</strong></span>
                        <span>Leader: {prog.leader}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Announcements */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Team Announcements & Notices
              </h3>

              {(!currentTeam.announcements || currentTeam.announcements.length === 0) ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                  No recent announcements for {currentTeam.code}.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentTeam.announcements.map((ann) => (
                    <Card key={ann.id} className="p-5 border-slate-200 bg-white shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-slate-900">{ann.title}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(ann.posted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {ann.content}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Mission Reports */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Evangelism & Mission Impact Reports
              </h3>

              {(!currentTeam.reports || currentTeam.reports.length === 0) ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                  No mission reports recorded yet for {currentTeam.code}.
                </div>
              ) : (
                <div className="space-y-4">
                  {currentTeam.reports.map((rep) => (
                    <Card key={rep.id} className="p-6 border-slate-200 bg-white shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">{rep.title}</h4>
                          <p className="text-xs text-[#006633] font-semibold">Report by {rep.author}</p>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(rep.report_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mb-2">{rep.summary}</p>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {rep.content}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Gallery */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Missions & Fellowship Photo Gallery
              </h3>

              {(!currentTeam.gallery || currentTeam.gallery.length === 0) ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                  No photos uploaded for this team yet.
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {currentTeam.gallery.map((photo) => (
                    <Card key={photo.id} className="overflow-hidden border-slate-200 bg-white shadow-xs">
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                        <img
                          src={photo.image_url}
                          alt={photo.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="text-xs font-bold text-slate-900">{photo.title}</h4>
                        {photo.caption && (
                          <p className="mt-1 text-[11px] text-slate-500">{photo.caption}</p>
                        )}
                        {photo.google_photos_url && (
                          <a
                            href={photo.google_photos_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#006633] hover:underline"
                          >
                            <ExternalLink size={12} />
                            <span>View Full Album on Google Photos</span>
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
