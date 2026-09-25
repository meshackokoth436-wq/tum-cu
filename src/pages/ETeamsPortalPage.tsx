import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Compass,
  Calendar,
  Bell,
  Image,
  FileText,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  X,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import {
  fetchETeams,
  fetchETeam,
  addETeamProgramme,
  updateETeamProgramme,
  deleteETeamProgramme,
  addETeamAnnouncement,
  deleteETeamAnnouncement,
  addETeamPhoto,
  deleteETeamPhoto,
  addETeamReport,
  appointETeamChairperson,
  type ETeam,
  type ETeamProgramme,
} from '@/features/e-teams/e-teams.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';

export function ETeamsPortalPage() {
  const queryClient = useQueryClient();
  const { user, roles, hasRole, hasPermission } = useAuthStore();

  const isSuperAdmin =
    user?.role === 'super_admin' ||
    hasRole?.('super_admin') ||
    hasPermission?.('*') ||
    hasPermission?.('system.manage_roles');

  const scopedETeamRoles = (roles || []).filter(
    (role) => role.code === 'e_team_chairperson' && role.scope_type === 'e_team' && role.scope_id
  );
  const allowedTeamIds = new Set(scopedETeamRoles.map((role) => role.scope_id as string));
  const [selectedTeamCode, setSelectedTeamCode] = useState<string>('NET-TUM');

  const [activeTab, setActiveTab] = useState<'programmes' | 'announcements' | 'gallery' | 'reports'>('programmes');

  // Modal states
  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<ETeamProgramme | null>(null);
  const [progForm, setProgForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '5:00 PM – 7:00 PM',
    venue: 'Hall 4',
    focus: 'Weekly Fellowship & Prayer Altar',
    leader: '',
  });

  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', content: '' });

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoForm, setPhotoForm] = useState({
    title: '',
    image_url: '/community/community-5.jpg',
    google_photos_url: '',
    caption: '',
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    report_date: new Date().toISOString().split('T')[0],
    summary: '',
    content: '',
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['e-teams-list'],
    queryFn: fetchETeams,
  });

  const selectedTeamSummary = teams.find(
    (t) => t.code.toUpperCase() === selectedTeamCode.toUpperCase() || t.name.toUpperCase() === selectedTeamCode.toUpperCase()
  );

  const { data: teamDetails, isLoading } = useQuery({
    queryKey: ['e-team-details', selectedTeamSummary?.id],
    queryFn: () => (selectedTeamSummary ? fetchETeam(selectedTeamSummary.id) : null),
    enabled: Boolean(selectedTeamSummary?.id),
  });

  const currentTeam: ETeam | undefined = teamDetails || selectedTeamSummary;

  // Mutations
  const progMutation = useMutation({
    mutationFn: (payload: any) => {
      if (!currentTeam) throw new Error('No team selected');
      if (editingProg) {
        return updateETeamProgramme(currentTeam.id, editingProg.id, payload);
      }
      return addETeamProgramme(currentTeam.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e-team-details', currentTeam?.id] });
      setIsProgModalOpen(false);
      setEditingProg(null);
    },
  });

  const deleteProgMutation = useMutation({
    mutationFn: (progId: string) => {
      if (!currentTeam) throw new Error('No team selected');
      return deleteETeamProgramme(currentTeam.id, progId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e-team-details', currentTeam?.id] });
    },
  });

  const annMutation = useMutation({
    mutationFn: (payload: any) => {
      if (!currentTeam) throw new Error('No team selected');
      return addETeamAnnouncement(currentTeam.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e-team-details', currentTeam?.id] });
      setIsAnnModalOpen(false);
      setAnnForm({ title: '', content: '' });
    },
  });

  const deleteAnnMutation = useMutation({
    mutationFn: (annId: string) => {
      if (!currentTeam) throw new Error('No team selected');
      return deleteETeamAnnouncement(currentTeam.id, annId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e-team-details', currentTeam?.id] });
    },
  });

  const photoMutation = useMutation({
    mutationFn: (payload: any) => {
      if (!currentTeam) throw new Error('No team selected');
      return addETeamPhoto(currentTeam.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e-team-details', currentTeam?.id] });
      setIsPhotoModalOpen(false);
      setPhotoForm({ title: '', image_url: '/community/community-5.jpg', google_photos_url: '', caption: '' });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => {
      if (!currentTeam) throw new Error('No team selected');
      return deleteETeamPhoto(currentTeam.id, photoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e-team-details', currentTeam?.id] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: (payload: any) => {
      if (!currentTeam) throw new Error('No team selected');
      return addETeamReport(currentTeam.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e-team-details', currentTeam?.id] });
      setIsReportModalOpen(false);
      setReportForm({
        title: '',
        report_date: new Date().toISOString().split('T')[0],
        summary: '',
        content: '',
      });
    },
  });

  // Check if current user is permitted to manage the currently selected team
  const canManageCurrentTeam =
    isSuperAdmin ||
    Boolean(currentTeam && allowedTeamIds.has(currentTeam.id)) ||
    currentTeam?.chairperson_id === user?.id;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <Compass size={13} />
            <span>Evangelism Teams Leadership Portal</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
            {currentTeam?.name || 'E-Teams Management'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Manage your team's weekly programmes, broadcast announcements, publish mission albums, and submit semester impact reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/e-teams">
            <Button variant="outline" size="sm" className="text-xs font-bold gap-2">
              <Compass size={14} />
              <span>Public Team View</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Team Scoped Switcher (Super Admin can switch, Chairpersons restricted to their appointed team) */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Managing:</span>
        {teams.map((t) => {
          const isUserTeam =
            isSuperAdmin ||
            allowedTeamIds.has(t.id) || t.chairperson_id === user?.id;

          return (
            <button
              key={t.id}
              disabled={!isUserTeam}
              onClick={() => setSelectedTeamCode(t.code)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                selectedTeamCode.toUpperCase() === t.code.toUpperCase()
                  ? 'bg-[#006633] text-white shadow-xs'
                  : isUserTeam
                  ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
              }`}
            >
              <span>{t.name}</span>
              {!isUserTeam && <span className="text-[10px]">(Restricted)</span>}
            </button>
          );
        })}
      </div>

      {!canManageCurrentTeam ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle size={36} className="mx-auto text-amber-600 mb-2" />
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">
            You are appointed as the Chairperson for your respective Evangelism Team. You cannot modify records for other teams.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-4">
            {[
              { id: 'programmes', label: `Programmes (${currentTeam?.programmes?.length || 0})`, icon: Calendar },
              { id: 'announcements', label: `Announcements (${currentTeam?.announcements?.length || 0})`, icon: Bell },
              { id: 'gallery', label: `Photo Gallery (${currentTeam?.gallery?.length || 0})`, icon: Image },
              { id: 'reports', label: `Activity Reports (${currentTeam?.reports?.length || 0})`, icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-[#006633] text-[#006633]'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Programmes Management */}
          {activeTab === 'programmes' && (
            <Card className="border-slate-200 bg-white p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Team Programme Schedule</h3>
                  <p className="text-xs text-slate-500">Plan Monday fellowships, prayer altars, and outreach missions.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingProg(null);
                    setProgForm({
                      title: '',
                      date: new Date().toISOString().split('T')[0],
                      time: '5:00 PM – 7:00 PM',
                      venue: currentTeam?.meeting_venue || 'Hall 4',
                      focus: 'Weekly Fellowship & Prayer Altar',
                      leader: currentTeam?.chairperson_name || '',
                    });
                    setIsProgModalOpen(true);
                  }}
                  className="bg-[#006633] hover:bg-[#005229] text-white font-bold text-xs gap-1.5"
                >
                  <Plus size={14} /> Add Programme
                </Button>
              </div>

              {(!currentTeam?.programmes || currentTeam.programmes.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-xs">No programmes created yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="pb-3">Programme Title</th>
                        <th className="pb-3">Date & Time</th>
                        <th className="pb-3">Venue</th>
                        <th className="pb-3">Focus / Details</th>
                        <th className="pb-3">Leader</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentTeam.programmes.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 pr-3 font-bold text-slate-900">{p.title}</td>
                          <td className="py-3.5 pr-3 font-mono text-[11px] text-slate-700">
                            {new Date(p.date).toLocaleDateString()} • {p.time}
                          </td>
                          <td className="py-3.5 pr-3 text-slate-700">{p.venue}</td>
                          <td className="py-3.5 pr-3 text-slate-600 max-w-xs truncate">{p.focus}</td>
                          <td className="py-3.5 pr-3 text-slate-700">{p.leader}</td>
                          <td className="py-3.5 text-right space-x-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingProg(p);
                                setProgForm({
                                  title: p.title,
                                  date: p.date,
                                  time: p.time,
                                  venue: p.venue,
                                  focus: p.focus || '',
                                  leader: p.leader || '',
                                });
                                setIsProgModalOpen(true);
                              }}
                              className="p-1.5 text-slate-700 text-[11px]"
                            >
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Delete "${p.title}"?`)) {
                                  deleteProgMutation.mutate(p.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 text-[11px]"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* Tab 2: Announcements */}
          {activeTab === 'announcements' && (
            <Card className="border-slate-200 bg-white p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Broadcast Announcements</h3>
                  <p className="text-xs text-slate-500">Post updates directly visible to all evangelism team members.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAnnModalOpen(true)}
                  className="bg-[#006633] hover:bg-[#005229] text-white font-bold text-xs gap-1.5"
                >
                  <Plus size={14} /> New Announcement
                </Button>
              </div>

              {(!currentTeam?.announcements || currentTeam.announcements.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-xs">No announcements posted yet.</div>
              ) : (
                <div className="space-y-3">
                  {currentTeam.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-900">{ann.title}</h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(ann.posted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                          {ann.content}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Delete this announcement?')) {
                            deleteAnnMutation.mutate(ann.id);
                          }
                        }}
                        className="text-red-600 hover:bg-red-50 p-2 shrink-0"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tab 3: Photo Gallery */}
          {activeTab === 'gallery' && (
            <Card className="border-slate-200 bg-white p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Missions & Outreach Gallery</h3>
                  <p className="text-xs text-slate-500">Upload cover photos and link Google Photos albums for {currentTeam?.name}.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="bg-[#006633] hover:bg-[#005229] text-white font-bold text-xs gap-1.5"
                >
                  <Plus size={14} /> Add Photo
                </Button>
              </div>

              {(!currentTeam?.gallery || currentTeam.gallery.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-xs">No gallery photos uploaded yet.</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {currentTeam.gallery.map((photo) => (
                    <div key={photo.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                        <img src={photo.image_url} alt={photo.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{photo.title}</h4>
                          <button
                            onClick={() => {
                              if (window.confirm('Remove photo?')) deletePhotoMutation.mutate(photo.id);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {photo.caption && <p className="mt-1 text-[11px] text-slate-500">{photo.caption}</p>}
                        {photo.google_photos_url && (
                          <a
                            href={photo.google_photos_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#006633] hover:underline"
                          >
                            <ExternalLink size={11} /> <span>Google Photos</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tab 4: Activity Reports */}
          {activeTab === 'reports' && (
            <Card className="border-slate-200 bg-white p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Evangelism Activity & Mission Reports</h3>
                  <p className="text-xs text-slate-500">Record converts, villages visited, schools ministered to, and financial stewardship.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsReportModalOpen(true)}
                  className="bg-[#006633] hover:bg-[#005229] text-white font-bold text-xs gap-1.5"
                >
                  <Plus size={14} /> Submit Report
                </Button>
              </div>

              {(!currentTeam?.reports || currentTeam.reports.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-xs">No reports recorded yet.</div>
              ) : (
                <div className="space-y-4">
                  {currentTeam.reports.map((rep) => (
                    <div key={rep.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{rep.title}</h4>
                          <p className="text-xs text-[#006633] font-semibold">Author: {rep.author}</p>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(rep.report_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mb-1">{rep.summary}</p>
                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{rep.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Programme Modal */}
      {isProgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProg ? 'Edit Programme' : 'Add Team Programme'}
              </h3>
              <button onClick={() => setIsProgModalOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                progMutation.mutate(progForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Programme Title
                </label>
                <Input
                  value={progForm.title}
                  onChange={(e) => setProgForm({ ...progForm, title: e.target.value })}
                  placeholder="e.g. Weekly Fellowship & Prayer Altar"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Date</label>
                  <Input
                    type="date"
                    value={progForm.date}
                    onChange={(e) => setProgForm({ ...progForm, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Time</label>
                  <Input
                    value={progForm.time}
                    onChange={(e) => setProgForm({ ...progForm, time: e.target.value })}
                    placeholder="5:00 PM – 7:00 PM"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Venue</label>
                  <Input
                    value={progForm.venue}
                    onChange={(e) => setProgForm({ ...progForm, venue: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Leader / Speaker</label>
                  <Input
                    value={progForm.leader}
                    onChange={(e) => setProgForm({ ...progForm, leader: e.target.value })}
                    placeholder="e.g. Bro. Emmanuel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Focus / Description</label>
                <textarea
                  value={progForm.focus}
                  onChange={(e) => setProgForm({ ...progForm, focus: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsProgModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={progMutation.isPending} className="bg-[#006633] hover:bg-[#005229] text-white font-bold">
                  {progMutation.isPending ? 'Saving…' : 'Save Programme'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Post Announcement</h3>
              <button onClick={() => setIsAnnModalOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                annMutation.mutate(annForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Title</label>
                <Input
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  placeholder="e.g. Mission Offering & Choir Practice"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Announcement Message</label>
                <textarea
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  rows={4}
                  placeholder="Write message details for the team…"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAnnModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={annMutation.isPending} className="bg-[#006633] hover:bg-[#005229] text-white font-bold">
                  {annMutation.isPending ? 'Posting…' : 'Publish Announcement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Photo to Gallery</h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                photoMutation.mutate(photoForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Photo Title</label>
                <Input
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                  placeholder="e.g. Northern Kenya Outreach Team"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Image URL</label>
                <Input
                  value={photoForm.image_url}
                  onChange={(e) => setPhotoForm({ ...photoForm, image_url: e.target.value })}
                  placeholder="/community/community-5.jpg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Google Photos Album Link (Optional)</label>
                <Input
                  type="url"
                  value={photoForm.google_photos_url}
                  onChange={(e) => setPhotoForm({ ...photoForm, google_photos_url: e.target.value })}
                  placeholder="https://photos.google.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Caption</label>
                <Input
                  value={photoForm.caption}
                  onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                  placeholder="Short description of the moment"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsPhotoModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={photoMutation.isPending} className="bg-[#006633] hover:bg-[#005229] text-white font-bold">
                  {photoMutation.isPending ? 'Saving…' : 'Add Photo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Submit Activity / Mission Report</h3>
              <button onClick={() => setIsReportModalOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                reportMutation.mutate(reportForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Report Title</label>
                <Input
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  placeholder="e.g. Coastal High Schools Mission Impact Report"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Report Date</label>
                <Input
                  type="date"
                  value={reportForm.report_date}
                  onChange={(e) => setReportForm({ ...reportForm, report_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Executive Summary</label>
                <textarea
                  value={reportForm.summary}
                  onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                  rows={2}
                  placeholder="Key outcomes (e.g. 5 schools visited, 120 students saved)…"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Full Report Content</label>
                <textarea
                  value={reportForm.content}
                  onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
                  rows={5}
                  placeholder="Detailed breakdown of activities, challenges, testimonies, and stewardship…"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsReportModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={reportMutation.isPending} className="bg-[#006633] hover:bg-[#005229] text-white font-bold">
                  {reportMutation.isPending ? 'Submitting…' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
