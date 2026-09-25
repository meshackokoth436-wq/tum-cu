import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { HeartHandshake, ArrowLeft, Home, Globe, GraduationCap, CheckCircle2, Shield } from 'lucide-react';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { register as registerApi, type RegisterPayload } from '@/features/auth/auth.api';

const STEPS = ['Personal Details', 'Membership & Region', 'Faith Declaration', 'Review & Submit'];

const COUNTRIES = [
  'Kenya',
  'Uganda',
  'Tanzania',
  'Rwanda',
  'Burundi',
  'South Sudan',
  'Ethiopia',
  'Nigeria',
  'Ghana',
  'South Africa',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'India',
  'Other (International / Worldwide)',
];

const DECLARATION_TEXT =
  'In joining Technical University of Mombasa Christian Union (T.U.M.C.U.), I declare Jesus Christ as my personal Lord and Savior. It is my sincere desire, by the grace of God, to live a life worthy of my Christian calling. I also affirm my commitment to the doctrinal basis, Constitution, and global fellowship of the Christian Union as it seeks to glorify Christ and spread the Gospel.';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<RegisterPayload>>({
    membership_type: 'full',
    country: 'Kenya',
    year_of_study: 1,
    department: 'Department of Computing and Informatics',
  });
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFromVisitorCheckIn =
    searchParams.get('from') === 'checkin' ||
    !!searchParams.get('email') ||
    !!searchParams.get('fullName') ||
    !!searchParams.get('name');

  useEffect(() => {
    const fullName = searchParams.get('fullName') || searchParams.get('name');
    const email = searchParams.get('email');
    const phoneNumber = searchParams.get('phoneNumber') || searchParams.get('phone');

    if (fullName || email || phoneNumber) {
      setForm((prev) => ({
        ...prev,
        full_name: fullName || prev.full_name,
        email: email || prev.email,
        phone_number: phoneNumber || prev.phone_number,
      }));
    }
  }, [searchParams]);

  const mutation = useMutation({
    mutationFn: registerApi,
    onSuccess: () =>
      navigate('/login', {
        state: {
          justRegistered: true,
          notice:
            'Registration submitted successfully! Your application is now in the administrator review queue. Once approved by the executive committee, your account will be activated.',
        },
      }),
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration could not be completed. Please check your details and try again.';
      setError(message);
    },
  });

  function update<K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isTUMStudent = form.membership_type === 'full';
  const isAssociate = form.membership_type === 'associate';
  const isGlobalInternational = form.membership_type === 'special';

  function next() {
    setError(null);

    if (step === 0) {
      if (!form.full_name?.trim() || !form.email?.trim() || !form.password) {
        setError('Please complete your name, email and password before continuing.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (
        form.password.length < 10 ||
        !/[A-Z]/.test(form.password) ||
        !/[a-z]/.test(form.password) ||
        !/[0-9]/.test(form.password) ||
        !/[^A-Za-z0-9]/.test(form.password)
      ) {
        setError(
          'Password must be at least 10 characters and include uppercase, lowercase, number and symbol.'
        );
        return;
      }
    }

    if (step === 1) {
      if (isTUMStudent && !form.admission_number?.trim()) {
        setError('Please enter your university admission number (e.g. BENG/2026/045).');
        return;
      }
      if (!form.country) {
        setError('Please select your country of residence.');
        return;
      }
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    if (!declarationChecked) {
      setError('You must accept the faith and membership declaration to submit your application.');
      return;
    }

    const payload: RegisterPayload = {
      full_name: form.full_name?.trim() ?? '',
      email: form.email?.trim().toLowerCase() ?? '',
      phone_number: form.phone_number?.trim() || undefined,
      admission_number:
        form.admission_number?.trim() ||
        (isTUMStudent
          ? undefined
          : `GLOBAL-${(form.country || 'INTL').slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`),
      country: form.country || 'Kenya',
      location: form.location?.trim() || undefined,
      affiliation: form.affiliation?.trim() || undefined,
      department: form.department?.trim() || (isTUMStudent ? undefined : 'Global Outreach & Missions'),
      year_of_study: form.year_of_study ?? 1,
      password: form.password ?? '',
      membership_type: form.membership_type ?? 'full',
      declaration_accepted: true,
    };

    if (typeof payload.phone_number === 'string' && payload.phone_number.trim() === '') {
      delete payload.phone_number;
    }
    mutation.mutate(payload);
  }

  return (
    <div className="auth-photo-bg flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="mb-4 flex w-full max-w-xl items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/12 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-xl transition hover:bg-white/20 active:scale-95"
        >
          <ArrowLeft size={14} />
          <Home size={14} className="text-gold-300" />
          <span>Back to Home</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/12 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-xl">
          <Globe size={13} className="text-emerald-600" />
          <span>Worldwide Registration Open</span>
        </div>
      </div>

      <Card variant="glass" className="w-full max-w-xl border border-white/30 bg-white/16 p-6 shadow-2xl shadow-black/25 backdrop-blur-2xl sm:p-9">
        {isFromVisitorCheckIn && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary-100 bg-white/10 p-4 text-xs leading-5 text-white shadow-sm">
            <HeartHandshake className="shrink-0 text-gold-300" size={20} />
            <div>
              <p className="font-bold text-white">Welcome to the TUMCU Family!</p>
              <p className="mt-0.5 text-white/70">
                We loved hosting you. Register below to access Christian Union programs, resources,
                and ministerial networks from anywhere in the world.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                  i <= step ? 'bg-gold-500 text-primary-950 shadow-sm' : 'bg-white/15 text-white/60'
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 ${i < step ? 'bg-gold-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-300">
            Step {step + 1} of {STEPS.length}
          </span>
          <h2 className="text-xl font-black tracking-tight text-white">{STEPS[step]}</h2>
        </div>

        {step === 0 && (
          <div className="mt-4 flex flex-col gap-4">
            <Input
              label="Full legal name"
              placeholder="e.g. John Doe"
              value={form.full_name ?? ''}
              onChange={(e) => update('full_name', e.target.value)}
            />
            <Input
              label="Email address"
              type="email"
              placeholder="e.g. john.doe@example.com"
              value={form.email ?? ''}
              onChange={(e) => update('email', e.target.value)}
            />
            <Input
              label="Phone number (WhatsApp preferred)"
              placeholder="e.g. +254712345678 or +1234567890"
              value={form.phone_number ?? ''}
              onChange={(e) => update('phone_number', e.target.value)}
            />
            <Input
              label="Account Password"
              type="password"
              value={form.password ?? ''}
              onChange={(e) => update('password', e.target.value)}
              hint="Minimum 10 characters with uppercase, lowercase, number, and special symbol."
            />
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/80">
                Membership Category
              </label>
              <select
                className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-primary-600 focus:outline-none"
                value={form.membership_type}
                onChange={(e) =>
                  update('membership_type', e.target.value as RegisterPayload['membership_type'])
                }
              >
                <option value="full">🎓 Full Member (TUM Student on Campus)</option>
                <option value="associate">🤝 Associate Member (Alumni, Graduate, Staff, Patron)</option>
                <option value="special">🌍 International / Global Member (Worldwide Affiliate / Partner)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/80">
                  Country of Residence
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-primary-600 focus:outline-none"
                  value={form.country || 'Kenya'}
                  onChange={(e) => update('country', e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Input
                  label="City / Region"
                  placeholder="e.g. Mombasa, Nairobi, London, Dallas"
                  value={form.location ?? ''}
                  onChange={(e) => update('location', e.target.value)}
                />
              </div>
            </div>

            {isTUMStudent ? (
              <>
                <Input
                  label="University Admission Number *"
                  placeholder="e.g. BENG/2026/045 or BCOM/2025/112"
                  value={form.admission_number ?? ''}
                  onChange={(e) => update('admission_number', e.target.value)}
                  hint="Official Technical University of Mombasa registration number."
                />

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/80">
                    Academic Department / Faculty (TUM)
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                    value={form.department ?? 'Department of Computing and Informatics'}
                    onChange={(e) => update('department', e.target.value)}
                  >
                    <option value="Department of Computing and Informatics">
                      Department of Computing and Informatics
                    </option>
                    <option value="Department of Electrical and Electronic Engineering">
                      Department of Electrical and Electronic Engineering
                    </option>
                    <option value="Department of Mechanical and Automotive Engineering">
                      Department of Mechanical and Automotive Engineering
                    </option>
                    <option value="Department of Civil and Building Engineering">
                      Department of Civil and Building Engineering
                    </option>
                    <option value="Department of Mathematics and Physics">
                      Department of Mathematics and Physics
                    </option>
                    <option value="Department of Pure and Applied Sciences">
                      Department of Pure and Applied Sciences
                    </option>
                    <option value="Department of Business Administration">
                      Department of Business Administration
                    </option>
                    <option value="Department of Accounting and Finance">
                      Department of Accounting and Finance
                    </option>
                    <option value="Department of Hospitality and Tourism Management">
                      Department of Hospitality and Tourism Management
                    </option>
                    <option value="Department of Medical Sciences">Department of Medical Sciences</option>
                    <option value="Department of Environment and Health Sciences">
                      Department of Environment and Health Sciences
                    </option>
                    <option value="Department of Media and Graphic Design">
                      Department of Media and Graphic Design
                    </option>
                    <option value="Department of Humanities and Social Sciences">
                      Department of Humanities and Social Sciences
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/80">
                    Year of Study
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none"
                    value={form.year_of_study ?? 1}
                    onChange={(e) => update('year_of_study', Number(e.target.value))}
                  >
                    <option value={1}>Year 1 (Freshman / First Year)</option>
                    <option value={2}>Year 2 (Sophomore)</option>
                    <option value={3}>Year 3 (Junior)</option>
                    <option value={4}>Year 4 (Senior)</option>
                    <option value={5}>Year 5 (Architecture / Engineering)</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <Input
                  label="Affiliation / Church / Institution"
                  placeholder="e.g. TUMCU Alumni Chapter, Nairobi Chapel, Grace Fellowship"
                  value={form.affiliation ?? ''}
                  onChange={(e) => update('affiliation', e.target.value)}
                  hint="Your home congregation, previous university, or ministry organization."
                />
                <Input
                  label="Admission / Alumni / Reference ID (Optional)"
                  placeholder="e.g. ALUM-2023-45 or leave blank for auto-generated ID"
                  value={form.admission_number ?? ''}
                  onChange={(e) => update('admission_number', e.target.value)}
                  hint="If you have an existing TUMCU alumni or institution ID, enter it here."
                />
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-sm leading-relaxed text-slate-800 shadow-inner">
              <div className="mb-2 flex items-center gap-2 font-bold text-white">
                <Shield size={18} className="text-gold-300" />
                <span>TUMCU Doctrinal & Constitutional Declaration</span>
              </div>
              <p>{DECLARATION_TEXT}</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/20 bg-white/5 p-3 hover:bg-white/10 transition">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
              />
              <span className="text-xs font-medium text-white/80 leading-normal">
                I affirm and accept this Christian declaration of faith and submit my application for
                administrative approval.
              </span>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 space-y-3 rounded-2xl border border-white/20 bg-black/15 p-5 text-sm text-white/80 shadow-inner">
            <div className="flex justify-between border-b pb-2">
              <span className="text-white/65">Full Name:</span>
              <span className="font-bold text-white">{form.full_name}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-white/65">Email:</span>
              <span className="font-semibold text-white">{form.email}</span>
            </div>
            {form.phone_number && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-white/65">Phone:</span>
                <span className="font-semibold text-white">{form.phone_number}</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="text-white/65">Membership Category:</span>
              <span className="font-bold text-white">
                {isTUMStudent
                  ? 'Full Member (TUM Student)'
                  : isAssociate
                  ? 'Associate Member (Alumni / Patron)'
                  : 'International / Global Member'}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-white/65">Location:</span>
              <span className="font-semibold text-white">
                {form.location ? `${form.location}, ` : ''}
                {form.country || 'Kenya'}
              </span>
            </div>
            {isTUMStudent ? (
              <>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-white/65">Admission Number:</span>
                  <span className="font-bold text-white">{form.admission_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/65">Department:</span>
                  <span className="font-semibold text-white">{form.department}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-white/65">Affiliation:</span>
                <span className="font-semibold text-white">
                  {form.affiliation || 'Global Fellowship Supporter'}
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-300/30 bg-red-500/15 p-3 text-xs font-semibold text-red-100">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={submit} loading={mutation.isPending}>
              Submit Application
            </Button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/65">
          Already have an approved account?{' '}
          <Link to="/login" className="font-bold text-gold-300 hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
