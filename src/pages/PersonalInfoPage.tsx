import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  UserCheck,
  Shield,
  FileCheck2,
  BookOpen,
  Church,
  Compass,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Scroll,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { fetchCurrentSession } from '@/features/auth/auth.api';

const SCHOOLS_AND_FACULTIES = [
  'School of Computing and Informatics',
  'School of Engineering and Technology',
  'School of Applied and Health Sciences',
  'School of Business',
  'School of Humanities and Social Sciences',
  'Institute of Computing & Informatics',
  'Other / Postgraduate Studies',
];

const RESIDENCES = [
  'Internal Campus Hall / Hostels',
  'Tudor (Off-Campus)',
  'Bamburi (Off-Campus)',
  'Kisauni (Off-Campus)',
  'Buxton / Makande (Off-Campus)',
  'Nyali / Kongowea (Off-Campus)',
  'Likoni (Off-Campus)',
  'Town / CBD / Ganjoni',
  'Non-Resident / Commuter',
];

export function PersonalInfoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setPermissions = useAuthStore((s) => s.setPermissions);
  const setRoles = useAuthStore((s) => s.setRoles);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Form State
  const [membershipCategory, setMembershipCategory] = useState<string>(
    (user as any)?.membership_type || 'full'
  );
  const [admissionNumber, setAdmissionNumber] = useState(
    (user?.admission_number as string) || ''
  );
  const [fullName, setFullName] = useState(
    (user?.full_name as string) || ''
  );
  const [phoneNumber, setPhoneNumber] = useState(
    (user?.phone_number as string) || ''
  );
  const [gender, setGender] = useState<'male' | 'female' | ''>(
    (user?.gender as 'male' | 'female') || ''
  );
  const [school, setSchool] = useState(
    (user?.school as string) || SCHOOLS_AND_FACULTIES[0]
  );
  const [course, setCourse] = useState(
    (user?.course as string) || ''
  );
  const [yearOfStudy, setYearOfStudy] = useState<number>(
    (user?.year_of_study as number) || 1
  );
  const [campusResidence, setCampusResidence] = useState(
    (user?.campus_residence as string) || RESIDENCES[0]
  );
  const [dateOfSalvation, setDateOfSalvation] = useState(
    (user?.date_of_salvation as string) || ''
  );
  const [baptismStatus, setBaptismStatus] = useState<'baptized' | 'not_baptized'>(
    (user?.baptism_status as 'baptized' | 'not_baptized') || 'baptized'
  );
  const [evangelismTeam, setEvangelismTeam] = useState<string>(
    (user?.evangelism_team as string) || 'none'
  );

  // Declaration State
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [declarationSignature, setDeclarationSignature] = useState(
    (user?.full_name as string) || ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If user already completed their profile, allow direct transition to dashboard
    if (user?.admission_number && (user as any)?.declaration_accepted) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const isGlobalOrAssociate = membershipCategory === 'associate' || membershipCategory === 'special';
    let cleanAdmission = admissionNumber.trim().toUpperCase();
    if (!cleanAdmission) {
      if (isGlobalOrAssociate) {
        cleanAdmission = `GLB-${user?.id ? String(user.id).slice(0, 8).toUpperCase() : Date.now().toString().slice(-6)}`;
      } else {
        setError('Please provide your university Admission / Registration Number.');
        return;
      }
    } else if (!isGlobalOrAssociate && !cleanAdmission.includes('/')) {
      setError('Please enter a valid university admission number format, e.g., BSCS/2024/0123 or BENG/2023/1044.');
      return;
    }
    if (!fullName.trim()) {
      setError('Please provide your full legal name.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please provide your active mobile / WhatsApp phone number.');
      return;
    }
    if (!gender) {
      setError('Please select your gender.');
      return;
    }
    const finalCourse = course.trim() || (isGlobalOrAssociate ? 'Christian Ministry & Global Outreach' : '');
    if (!finalCourse) {
      setError('Please state your degree or diploma programme.');
      return;
    }
    if (!declarationAccepted) {
      setError('You must read and check the Doctrinal Basis & Constitutional Declaration to complete your enrollment.');
      return;
    }
    if (!declarationSignature.trim()) {
      setError('Please type your full name in the digital signature field to confirm your acceptance.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        admission_number: cleanAdmission,
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        gender,
        school,
        department: school,
        course: finalCourse,
        year_of_study: Number(yearOfStudy),
        campus_residence: campusResidence,
        date_of_salvation: dateOfSalvation.trim() || null,
        baptism_status: baptismStatus,
        evangelism_team: evangelismTeam,
        declaration_accepted: true,
        declaration_signature: declarationSignature.trim(),
        membership_category: membershipCategory,
      };

      const response = await api.post('/auth/complete-personal-info', payload);
      const data = response.data;

      // Update auth store with refreshed user
      if (data?.data?.user) {
        setUser(data.data.user);
      } else {
        setUser({
          ...(user || {}),
          ...payload,
          account_status: 'active',
          profile_completed: true,
          declaration_accepted: true,
        } as any);
      }

      // Refresh permissions & roles
      try {
        const session = await fetchCurrentSession();
        setPermissions((session.permissions as string[]) ?? []);
        setRoles((session.roles as Parameters<typeof setRoles>[0]) ?? []);
      } catch {
        // Non-fatal
      }

      setSuccess(true);

      setTimeout(() => {
        const destination = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(destination, { replace: true });
      }, 1200);
    } catch (err: any) {
      console.error('Failed to complete personal info:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save personal information. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8faf9] via-[#edf3f0] to-[#e5ece8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-300/60 bg-primary-100/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-900 shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-primary-700 animate-pulse" />
            TUMCU Member Registration & Profile Activation
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl font-serif">
            Personal Information & Doctrinal Declaration
          </h1>
          <p className="mt-2 text-sm text-neutral-600 max-w-xl mx-auto">
            Welcome to the Technical University of Mombasa Christian Union family! Please provide your university admission and student records, then read and subscribe to our constitutional declaration.
          </p>
        </div>

        {/* Form Container */}
        <Card className="border-neutral-200/80 shadow-2xl backdrop-blur-xl bg-white/95 overflow-hidden">
          {/* Progress / Step Banner */}
          <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700/80 border border-primary-500/30 text-gold-400 font-bold">
                1
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-primary-200 font-medium">Step 1 of 1</p>
                <p className="text-sm font-semibold text-white">Student Verification & Declaration</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary-200 bg-primary-800/60 px-3 py-1 rounded-full border border-primary-700">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Verified Session: {user?.email || 'Authenticated'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700 flex items-start gap-3 shadow-sm">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Validation Notice</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/95 p-4 text-sm text-emerald-800 flex items-center gap-3 shadow-sm animate-in fade-in">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-950">Declaration Accepted & Profile Seeded!</p>
                  <p className="text-emerald-700">Redirecting to your Christian Union dashboard…</p>
                </div>
              </div>
            )}

            {/* SECTION 1: Academic & University Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-200">
                <GraduationCap className="h-5 w-5 text-primary-700" />
                <h2 className="text-base font-bold text-neutral-900">
                  1. University & Academic Identity
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Admission / Registration Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. BSCS/2024/0123 or BENG/2023/4521"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                    required
                    className="font-mono text-base font-semibold tracking-wide border-primary-200 focus:border-primary-600 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Your official Technical University of Mombasa admission or student registration number.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    School / Faculty <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  >
                    {SCHOOLS_AND_FACULTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Year of Study <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  >
                    <option value={1}>1st Year (Freshman)</option>
                    <option value={2}>2nd Year (Sophomore)</option>
                    <option value={3}>3rd Year (Junior)</option>
                    <option value={4}>4th Year (Senior / Finalist)</option>
                    <option value={5}>5th Year (Engineering Finalist)</option>
                    <option value={6}>Postgraduate / Masters</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Degree / Diploma Programme <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Bachelor of Science in Computer Science"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Personal & Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-200">
                <UserCheck className="h-5 w-5 text-primary-700" />
                <h2 className="text-base font-bold text-neutral-900">
                  2. Personal & Contact Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Grace Wanjiku Mwangi"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (!declarationSignature || declarationSignature === fullName) {
                        setDeclarationSignature(e.target.value);
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Phone / WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. +254 712 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`py-2 px-3 text-sm font-semibold rounded-lg border text-center transition-all ${
                        gender === 'male'
                          ? 'border-primary-700 bg-primary-50 text-primary-900 shadow-sm ring-1 ring-primary-600'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      Brother (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`py-2 px-3 text-sm font-semibold rounded-lg border text-center transition-all ${
                        gender === 'female'
                          ? 'border-primary-700 bg-primary-50 text-primary-900 shadow-sm ring-1 ring-primary-600'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      Sister (Female)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Campus Residence Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={campusResidence}
                    onChange={(e) => setCampusResidence(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  >
                    {RESIDENCES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: Spiritual Life & Regional E-Teams */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-200">
                <Church className="h-5 w-5 text-primary-700" />
                <h2 className="text-base font-bold text-neutral-900">
                  3. Spiritual Journey & Evangelism Team (E-Team)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Water Baptism Status
                  </label>
                  <select
                    value={baptismStatus}
                    onChange={(e) => setBaptismStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  >
                    <option value="baptized">Baptized by Immersion</option>
                    <option value="not_baptized">Not Yet Baptized (Interested in Baptism Class)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Evangelism Team (E-Team) Preference
                  </label>
                  <select
                    value={evangelismTeam}
                    onChange={(e) => setEvangelismTeam(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  >
                    <option value="none">General Member / Undecided</option>
                    <option value="NET-TUM">NET MINISTRIES TRUST TUM UNIT</option>
                    <option value="NORET-SORET">NORET-SORET — North Rift & South Rift</option>
                  </select>
                  <p className="mt-1 text-xs text-neutral-500">
                    E-Teams meet every alternating Monday for regional fellowship and missions outreach.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: Doctrinal Basis & Constitutional Declaration */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-200">
                <Scroll className="h-5 w-5 text-amber-700" />
                <h2 className="text-base font-bold text-neutral-900">
                  4. TUMCU Doctrinal Basis & Constitutional Declaration
                </h2>
              </div>

              {/* Declaration Document Scroll */}
              <div className="relative rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-800" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Technical University of Mombasa Christian Union (T.U.M.C.U.)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300/50">
                    Constitution 2024 • Doctrinal Basis
                  </span>
                </div>

                <blockquote className="font-serif italic text-neutral-800 text-sm sm:text-base leading-relaxed pl-3 border-l-4 border-amber-600 py-1">
                  “In joining Technical University of Mombasa Christian Union, (T.U.M.C.U.), I declare Jesus Christ as my Lord and Savior and it is my desire, by the grace of God, to live a life worthy of my Christian calling. I am also determined to follow the Constitution and support the C.U as it seeks to fulfill its aims.”
                </blockquote>

                <div className="mt-4 pt-3 border-t border-amber-200/50 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                  <span className="font-semibold">Semester Spiritual Theme:</span>
                  <span className="italic">“Manifesting the Light of Christ” — Matthew 5:16</span>
                </div>
              </div>

              {/* Acceptance Checkbox */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    required
                  />
                  <div className="text-sm">
                    <span className="font-bold text-neutral-900">
                      I solemnly accept and subscribe to the TUMCU Doctrinal Declaration
                    </span>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      By checking this box, I affirm my confession of Jesus Christ as Lord and Savior and commit to abide by the Constitution and doctrinal standards of TUMCU.
                    </p>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Digital Signature (Type your Full Name to sign) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Type your full legal name"
                    value={declarationSignature}
                    onChange={(e) => setDeclarationSignature(e.target.value)}
                    required
                    className="font-serif italic font-semibold text-neutral-800 border-neutral-300"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-neutral-500 text-center sm:text-left">
                All details will be securely registered in the TUMCU Membership Ledger.
              </p>

              <Button
                type="submit"
                disabled={loading || !declarationAccepted}
                className="w-full sm:w-auto min-w-[260px] py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registering & Signing…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Complete Details & Log In</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
export default PersonalInfoPage;
