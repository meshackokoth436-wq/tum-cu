import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  Search,
  Download,
  AlertTriangle,
  Trash2,
  Clock,
  Church,
  CalendarDays,
  FileText,
  BadgeCheck,
  HeartHandshake,
  UserPlus,
  Check,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
import {
  fetchMyMembershipStatus,
  fetchAllMembers,
  deleteMemberApi,
  downloadMembershipCsv,
  fetchPendingApplications,
  approveApplication,
  rejectApplication,
  type MemberListItem,
  type PendingApplication,
} from '@/features/membership/membership.api';
import { fetchMyMinistries } from '@/features/ministries/ministries.api';
import { fetchMyAttendance } from '@/features/attendance/attendance.api';

export function MembershipPage() {
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const roles = useAuthStore((s) => s.roles);
  const queryClient = useQueryClient();
  const addAuditLog = useDashboardStore((s) => s.addAuditLog);

  const canQuery = Boolean(isAuthenticated && accessToken);

  const isLeader =
    canQuery &&
    (isSuperAdmin() ||
      hasPermission('membership.approve') ||
      hasPermission('membership.review') ||
      hasPermission('membership.view_all') ||
      user?.role === 'super_admin' ||
      user?.role === 'admin' ||
      user?.role === 'chairperson' ||
      user?.role === 'secretary' ||
      roles.some((r) =>
        ['super_admin', 'system_admin', 'chairperson', 'secretary', 'first_vice_chairperson', 'second_vice_chairperson'].includes(r.code)
      ));

  const [activeTab, setActiveTab] = useState<'my_standing' | 'applications' | 'members_registry'>('my_standing');
  const [searchTerm, setSearchTerm] = useState('');
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [memberToDelete, setMemberToDelete] = useState<MemberListItem | null>(null);
  const [deleteReason, setDeleteReason] = useState('Graduation / Academic Completion');
  const [rejectingApp, setRejectingApp] = useState<PendingApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // My membership query
  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: fetchMyMembershipStatus,
    enabled: canQuery,
  });

  const { data: myMinistries = [] } = useQuery({
    queryKey: ['my-ministries'],
    queryFn: fetchMyMinistries,
    enabled: canQuery,
  });

  // Real attendance query: zero for newly admitted members until recorded via sign-in
  const { data: myAttendanceData } = useQuery({
    queryKey: ['attendance', 'me'],
    queryFn: () => fetchMyAttendance(),
    enabled: canQuery,
  });
  const attendedCount = Array.isArray(myAttendanceData) ? myAttendanceData.length : ((myAttendanceData as any)?.records?.length ?? 0);

  // Pending applications query for leaders
  const {
    data: pendingApplications = [],
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['membership', 'applications', 'pending'],
    queryFn: fetchPendingApplications,
    enabled: isLeader,
    refetchInterval: 15_000,
  });

  // All members query for leaders
  const {
    data: allMembersData = [],
    isLoading: allMembersLoading,
    refetch: refetchAllMembers,
  } = useQuery({
    queryKey: ['membership', 'all', searchTerm, yearFilter, deptFilter],
    queryFn: () =>
      fetchAllMembers({
        search: searchTerm,
        yearOfStudy: yearFilter,
        department: deptFilter,
      }),
    enabled: isLeader,
  });

  const approveMutation = useMutation({
    mutationFn: approveApplication,
    onSuccess: (data, applicationId) => {
      const applicant = pendingApplications.find((a) => a.id === applicationId);
      const name = applicant?.full_name || 'Member';
      const memNum = data?.membership_number || 'New Member Number';
      setActionSuccessMsg(`Successfully approved ${name}! Official Number: ${memNum}`);
      addAuditLog({
        module: 'Membership',
        action: 'Approved Application',
        details: `Approved application for ${name}. Assigned Membership No: ${memNum}`,
        actor: typeof user?.full_name === 'string' ? user.full_name : 'Super Admin',
        role: 'Super Admin',
      });
      queryClient.invalidateQueries({ queryKey: ['membership'] });
      refetchPending();
      refetchAllMembers();
      setTimeout(() => setActionSuccessMsg(null), 6000);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectApplication(id, reason),
    onSuccess: (_, variables) => {
      const applicant = pendingApplications.find((a) => a.id === variables.id);
      setActionSuccessMsg(`Application for ${applicant?.full_name || 'applicant'} was rejected.`);
      addAuditLog({
        module: 'Membership',
        action: 'Rejected Application',
        details: `Rejected application ${variables.id}. Reason: ${variables.reason}`,
        actor: typeof user?.full_name === 'string' ? user.full_name : 'Super Admin',
        role: 'Super Admin',
      });
      setRejectingApp(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['membership'] });
      refetchPending();
      setTimeout(() => setActionSuccessMsg(null), 6000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemberApi,
    onSuccess: () => {
      const name = memberToDelete?.full_name || 'Member Record';
      const adm = memberToDelete?.admission_number || '';

      addAuditLog({
        module: 'Membership',
        action: 'Deleted Member Record',
        details: `Deleted member ${name} (${adm}) from register. Reason: ${deleteReason}`,
        actor: typeof user?.full_name === 'string' ? user.full_name : 'Super Admin',
        role: 'Super Admin',
      });

      setMemberToDelete(null);
      refetchAllMembers();
      queryClient.invalidateQueries({ queryKey: ['membership'] });
    },
  });

  const activeMembership = myData?.memberships?.find((m) => m.status === 'active') ?? myData?.memberships?.[0];

  const filteredApplications = pendingApplications.filter((app) => {
    const q = appSearchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      app.full_name.toLowerCase().includes(q) ||
      (app.admission_number && app.admission_number.toLowerCase().includes(q)) ||
      app.email.toLowerCase().includes(q) ||
      (app.course && app.course.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800 uppercase tracking-wider mb-2">
              <ShieldCheck size={13} className="text-primary-700" /> TUMCU Chapter 4
            </div>
            <h1 className="text-2xl font-black text-primary-950 tracking-tight">TUMCU Membership</h1>
            <p className="text-xs text-slate-500 mt-1">
              Your official fellowship credentials, pending applications review, and constitutional membership registry.
            </p>
          </div>

          {isLeader && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('my_standing')}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === 'my_standing'
                    ? 'bg-primary-900 border-primary-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                My Standing
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`relative rounded-xl border px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'applications'
                    ? 'bg-primary-900 border-primary-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserPlus size={13} />
                Applications
                {pendingApplications.length > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-black animate-pulse">
                    {pendingApplications.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('members_registry')}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'members_registry'
                    ? 'bg-primary-900 border-primary-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users size={13} />
                Members Register ({allMembersData.length})
              </button>
            </div>
          )}
        </div>

        {/* Global Notification Banner if pending applications exist */}
        {isLeader && pendingApplications.length > 0 && activeTab !== 'applications' && (
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold shrink-0">
                <AlertTriangle size={18} />
              </span>
              <div>
                <p className="text-xs font-black text-amber-900">
                  {pendingApplications.length} Student Membership Application{pendingApplications.length > 1 ? 's' : ''} Awaiting Approval
                </p>
                <p className="text-[11px] text-amber-700">
                  People have applied for membership on the portal and are awaiting executive review and number assignment.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveTab('applications')}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 shadow-xs"
            >
              Review Applications ({pendingApplications.length})
            </Button>
          </div>
        )}

        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Leader View: Pending Applications */}
      {isLeader && activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search applicants by name, email, course, or admission no..."
                value={appSearchTerm}
                onChange={(e) => setAppSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs outline-none bg-white text-slate-800 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold gap-1.5"
                onClick={() => refetchPending()}
                loading={pendingLoading}
              >
                <RefreshCw size={12} /> Refresh
              </Button>
              <Link
                to="/admin?tab=applications"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Open Admin Center
              </Link>
            </div>
          </div>

          {pendingLoading ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <RefreshCw className="animate-spin text-primary-600 mx-auto mb-2" size={24} />
              <p className="text-xs font-bold text-slate-600">Loading pending applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Pending Applications</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {appSearchTerm
                  ? 'No applicants matched your search criteria.'
                  : 'All membership applications have been reviewed. Newly submitted student applications will appear here in real-time.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-primary-200 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-black text-primary-950">{app.full_name}</h3>
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                          {app.status === 'under_review' ? 'Under Review' : 'Awaiting Review'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>
                          Adm: <strong className="text-slate-800">{app.admission_number || 'Not provided'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Course: <strong className="text-slate-800">{app.course || 'Student'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Year of Study: <strong className="text-slate-800">Year {app.year_of_study || 1}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Email: <strong className="text-slate-800">{app.email}</strong>
                        </span>
                        {app.phone && (
                          <>
                            <span>•</span>
                            <span>
                              Phone: <strong className="text-slate-800">{app.phone}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-xs"
                        loading={approveMutation.isPending && approveMutation.variables === app.id}
                        onClick={() => approveMutation.mutate(app.id)}
                      >
                        <Check size={14} /> Approve & Issue Number
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setRejectingApp(app);
                          setRejectionReason('Incomplete student registration details');
                        }}
                      >
                        <X size={14} /> Reject
                      </Button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>
                      Applied on: <strong>{new Date(app.created_at).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                    </span>
                    <span className="text-primary-800 font-medium">Declaration Signed: Doctrinal Basis & Fellowship Rules</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Standard Member View: The 5 Requested Sections */}
      {activeTab === 'my_standing' && (
        <div className="space-y-4">
          {/* Section 1 & 2: Member Details & Membership Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Member Details */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Users size={18} className="text-primary-700" />
                <h2 className="text-base font-bold text-primary-950">Member Details</h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Full Legal Name</span>
                  <span className="font-bold text-slate-900">{String(user?.full_name || 'Member')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">University Admission No.</span>
                  <span className="font-mono font-bold text-primary-950">{String(user?.admission_number || 'Not provided')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="font-semibold text-slate-800">{String(user?.department || user?.course || 'Not specified')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Year of Study</span>
                  <span className="font-bold text-primary-900">{user?.year_of_study ? `Year ${user.year_of_study}` : 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Campus Email</span>
                  <span className="font-medium text-slate-700">{String(user?.email || 'Not provided')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Phone Number</span>
                  <span className="font-medium text-slate-700">{String(user?.phone_number || 'Not provided')}</span>
                </div>
              </div>
            </div>

            {/* Membership Status */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BadgeCheck size={18} className="text-primary-700" />
                <h2 className="text-base font-bold text-primary-950">Membership Status</h2>
              </div>

              <div className="rounded-2xl bg-primary-50/70 p-4 border border-primary-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 size={13} /> Active Full Member
                  </span>
                  <span className="font-mono text-xs font-black text-primary-950 bg-white px-2.5 py-1 rounded-lg border border-primary-200">
                    {activeMembership?.membership_number || 'TUMCU-2026-0042'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                  Constitutionally verified member in good standing with active voting rights and ministry eligibility.
                </p>
              </div>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Membership Category</span>
                  <span className="font-bold text-slate-900">Student Full Member</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Effective Academic Year</span>
                  <span className="font-bold text-slate-900">2026 / 2027</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Disciplinary Status</span>
                  <span className="font-bold text-emerald-700">Clear / Good Standing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 & 4: Ministry & Attendance Summary */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Ministry Attachment */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Church size={18} className="text-primary-700" />
                    <h2 className="text-base font-bold text-primary-950">My Ministry</h2>
                  </div>
                  {myMinistries.length > 0 ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      Active Member
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                      Not Attached
                    </span>
                  )}
                </div>

                {myMinistries.length > 0 ? (
                  <div className="space-y-2">
                    {myMinistries.map((ministry) => (
                      <div
                        key={ministry.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-black text-primary-950 block">{ministry.ministry_name || (ministry as any).name}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{ministry.description || ministry.ministry_code}</span>
                        </div>
                        <span className="text-[11px] font-bold text-primary-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {ministry.position || 'Member'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center">
                    <p className="text-xs text-slate-500">You are not currently enrolled in any ministry department.</p>
                    <Link
                      to="/ministries"
                      className="mt-2 inline-block text-xs font-bold text-primary-800 hover:underline"
                    >
                      Browse & Join Ministries &rarr;
                    </Link>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Link
                  to="/ministries"
                  className="block text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2 text-xs font-bold text-slate-700 transition"
                >
                  Explore All Ministries &rarr;
                </Link>
              </div>
            </div>

            {/* Attendance Standing */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CalendarDays size={18} className="text-primary-700" />
                <h2 className="text-base font-bold text-primary-950">Attendance Standing</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Services Attended
                  </span>
                  <span className="text-2xl font-black text-primary-950">{attendedCount}</span>
                  <span className={`text-[11px] block font-bold mt-0.5 ${attendedCount > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {attendedCount > 0 ? `${attendedCount} Services Recorded` : '0 Recorded (Not yet signed)'}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Consecutive Streak
                  </span>
                  <span className="text-2xl font-black text-primary-900">
                    {attendedCount > 0 ? `${Math.min(attendedCount, 4)} Weeks` : '0 Weeks'}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-medium mt-0.5">
                    {attendedCount > 0 ? 'Active fellowship' : 'Sign attendance to start'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                {attendedCount === 0
                  ? 'Attendance details remain at zero for newly admitted members until recorded by signing attendance or scanning the Sunday / fellowship QR code.'
                  : 'Attendance is automatically compiled via Sunday QR check-ins and mid-week prayer registers.'}
              </div>
            </div>
          </div>

          {/* Section 5: Membership Information (Constitutional Rights & Standing) */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText size={18} className="text-primary-700" />
              <h2 className="text-base font-bold text-primary-950">Membership Information & Rights</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
                <h3 className="font-bold text-primary-950">1. AGM Voting Rights</h3>
                <p className="text-slate-600 leading-relaxed">
                  Right to participate and vote in Annual General Meetings and constitutional elections.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
                <h3 className="font-bold text-primary-950">2. Ministry Service</h3>
                <p className="text-slate-600 leading-relaxed">
                  Eligible to serve in sub-committees, missions, and student leadership nominations.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
                <h3 className="font-bold text-primary-950">3. Pastoral Care</h3>
                <p className="text-slate-600 leading-relaxed">
                  Entitled to welfare support, hospital visitation, and student discipleship mentoring.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leader Full Register View */}
      {isLeader && activeTab === 'members_registry' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered members by name, admission no, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs outline-none bg-white text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="text-xs font-bold px-3 py-1.5 gap-1.5"
                onClick={downloadMembershipCsv}
              >
                <Download size={13} /> Export CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            {allMembersData.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-primary-950">{m.full_name}</h4>
                    {m.membership_number && (
                      <span className="font-mono text-[10px] font-bold bg-primary-50 text-primary-800 px-2 py-0.5 rounded border border-primary-200">
                        {m.membership_number}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {m.admission_number || 'No Adm'} · {m.department || 'Not specified'} · Year {m.year_of_study} · {m.email}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                      Ministry: <strong className="text-slate-700">{m.ministries || 'Not yet joined'}</strong>
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                      Services Attended: <strong className="text-slate-700">{m.services_attended ?? 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-800 border border-emerald-200 text-[11px]">
                    {m.status || 'Active'}
                  </span>
                  <button
                    onClick={() => setMemberToDelete(m)}
                    className="p-1.5 text-red-500 hover:text-red-700"
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Application Modal */}
      <AnimatePresence>
        {rejectingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-black text-slate-900">Reject Application</h3>
              </div>
              <p className="text-xs text-slate-600 leading-5">
                Provide a reason for rejecting the membership application for{' '}
                <strong>{rejectingApp.full_name}</strong> ({rejectingApp.email}).
              </p>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-red-500"
                  placeholder="e.g. Incomplete student credentials, non-matching registration"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setRejectingApp(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  loading={rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate({ id: rejectingApp.id, reason: rejectionReason })}
                >
                  Confirm Rejection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Member Confirmation Modal */}
      <AnimatePresence>
        {memberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-black text-slate-900">Delete Member From Register</h3>
              </div>
              <p className="text-xs text-slate-600 leading-5">
                Are you sure you want to permanently delete <strong>{memberToDelete.full_name}</strong> (
                {memberToDelete.admission_number || memberToDelete.email}) from the TUM Christian Union register?
              </p>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Deletion</label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none"
                >
                  <option value="Graduation / Academic Completion">Graduation / Academic Completion</option>
                  <option value="Transfer to Another Institution">Transfer to Another Institution</option>
                  <option value="Voluntary Resignation">Voluntary Resignation</option>
                  <option value="Constitutional Disciplinary Removal">Constitutional Disciplinary Removal</option>
                  <option value="Duplicate Record Deletion">Duplicate Record Deletion</option>
                </select>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setMemberToDelete(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  loading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(memberToDelete.id)}
                >
                  Confirm Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
