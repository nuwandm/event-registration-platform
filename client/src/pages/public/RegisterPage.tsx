import { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays, MapPin, CreditCard, Building2, Upload, X, FileText,
  User, Mail, Phone, MapPin as MapPinIcon, Briefcase, ArrowLeft, CheckCircle2,
  ListChecks,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { registrationSchema, type RegistrationFormValues } from '@/schemas/registration';
import { useTenant } from '@/context/TenantContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Question } from '@/types';

// ── Receipt upload zone ───────────────────────────────────────────────────────
interface ReceiptUploadProps {
  value?: File;
  onChange: (file: File | undefined) => void;
  error?: string;
}

function ReceiptUpload({ value, onChange, error }: ReceiptUploadProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const isPdf = value?.type === 'application/pdf';
  const previewUrl = value && !isPdf ? URL.createObjectURL(value) : null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  };

  return (
    <div>
      {value ? (
        <div className={cn('relative rounded-xl border-2 overflow-hidden', error ? 'border-red-300' : 'border-emerald-300 bg-emerald-50')}>
          {previewUrl ? (
            <img src={previewUrl} alt="Receipt" className="w-full max-h-56 object-contain bg-white" />
          ) : (
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700 text-sm">{value.name}</p>
                <p className="text-xs text-slate-400">{(value.size / 1024).toFixed(1)} KB · PDF</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => { onChange(undefined); if (ref.current) ref.current.value = ''; }}
            className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow text-slate-500 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/90 text-white text-xs text-center py-1.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> File selected — {value.name}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50',
            error ? 'border-red-300 bg-red-50' : ''
          )}
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600 mb-1">Click or drag &amp; drop your receipt</p>
          <p className="text-xs text-slate-400">JPG, PNG, or PDF · Max 10 MB</p>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/jpg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Question field renderer ───────────────────────────────────────────────────
interface QuestionFieldProps {
  question: Question;
  value: string | string[] | undefined;
  error?: string;
  onChange: (val: string | string[]) => void;
  brand: string;
}

function QuestionField({ question, value, error, onChange, brand }: QuestionFieldProps) {
  const strVal = typeof value === 'string' ? value : '';
  const arrVal = Array.isArray(value) ? value : [];

  const toggleCheckbox = (option: string) => {
    const next = arrVal.includes(option)
      ? arrVal.filter((v) => v !== option)
      : [...arrVal, option];
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {question.label}
        {question.required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>

      {question.type === 'text' && (
        <Input
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className={error ? 'border-red-400 focus-visible:ring-red-400' : ''}
        />
      )}

      {question.type === 'textarea' && (
        <Textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className={cn('resize-none min-h-20', error ? 'border-red-400 focus-visible:ring-red-400' : '')}
        />
      )}

      {question.type === 'radio' && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name={`question-${question._id}`}
                value={opt}
                checked={strVal === opt}
                onChange={() => onChange(opt)}
                className="w-4 h-4"
                style={{ accentColor: brand }}
              />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'checkbox' && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                value={opt}
                checked={arrVal.includes(opt)}
                onChange={() => toggleCheckbox(opt)}
                className="w-4 h-4 rounded"
                style={{ accentColor: brand }}
              />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'dropdown' && (
        <Select value={strVal} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className={error ? 'border-red-400 focus-visible:ring-red-400' : ''}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { api, orgSlug, tenant } = useTenant();
  const brand = tenant?.primaryColor ?? '#3b82f6';
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading: eventLoading, isError } = useQuery({
    queryKey: ['public-event', orgSlug, slug],
    queryFn: () => api.events.getBySlug(slug!),
    select: (res) => res.data.data?.event,
    enabled: !!slug,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({});

  const validateAnswers = (): boolean => {
    if (!event?.questions?.length) return true;
    const errs: Record<string, string> = {};
    for (const q of event.questions) {
      if (!q.required) continue;
      const val = answers[q._id];
      const empty =
        val === undefined ||
        val === '' ||
        (Array.isArray(val) && val.length === 0);
      if (empty) errs[q._id] = 'This field is required';
    }
    setAnswerErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegistrationFormValues) => {
      const answersPayload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      return api.registrations.submit(String(event!._id), {
        fullName: data.fullName,
        nic: data.nic,
        email: data.email,
        mobile: data.mobile,
        address: data.address,
        organization: data.organization || undefined,
        designation: data.designation || undefined,
        receipt: data.receipt,
        answers: answersPayload,
      });
    },
    onSuccess: (res) => {
      const { registrationId } = res.data.data!;
      navigate(`/${orgSlug}/registration/success?id=${registrationId}`);
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setServerError(msg ?? 'Something went wrong. Please try again.');
    },
  });

  if (eventLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 mb-4">Event not found or registration is closed.</p>
      </div>
    );
  }

  const isRegistrationOpen =
    new Date() >= new Date(event.registrationOpenDate) &&
    new Date() <= new Date(event.registrationCloseDate);

  if (!isRegistrationOpen) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-7 h-7 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Registration Not Available</h2>
        <p className="text-slate-500 mb-6">Registration for this event is currently not open.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/${orgSlug}/events/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to event
      </Link>

      {/* Hero card — tenant branded */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-6">
        {/* Banner */}
        <div className="relative w-full" style={{ background: `linear-gradient(135deg, ${brand}dd, ${brand}99)` }}>
          {event.bannerImage ? (
            <img
              src={event.bannerImage}
              alt={event.name}
              className="w-full h-auto block"
              style={event.bannerPosition ? { objectPosition: `${event.bannerPosition.x}% ${event.bannerPosition.y}%` } : undefined}
            />
          ) : (
            <div className="w-full h-44 sm:h-56 flex flex-col items-center justify-center gap-4">
              {tenant?.logoUrl ? (
                <img src={tenant.logoUrl} alt={tenant.name} className="h-20 w-auto object-contain drop-shadow-lg" />
              ) : (
                <CalendarDays className="w-16 h-16 text-white/40" />
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

          {/* Org badge top-left */}
          {tenant?.name && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
              {tenant.logoUrl && (
                <img src={tenant.logoUrl} alt={tenant.name} className="h-5 w-auto object-contain" />
              )}
              <span className="text-white text-xs font-semibold">{tenant.name}</span>
            </div>
          )}
        </div>

        {/* Event info — brand colored left border */}
        <div className="bg-white px-6 py-5" style={{ borderTop: `4px solid ${brand}` }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: brand }}>
            Registration Form
          </p>
          <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-3">{event.name}</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" style={{ color: brand }} />
              {format(new Date(event.eventDate), 'EEEE, MMM d, yyyy')} · {format(new Date(event.eventDate), 'h:mm a')}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" style={{ color: brand }} />
              {event.venue}
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" style={{ color: brand }} />
              {event.registrationFee === 0 ? 'Free Entry' : `LKR ${event.registrationFee.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((d) => {
          if (!validateAnswers()) {
            toast.error('Please answer all required questions');
            return;
          }
          setServerError(null);
          mutate(d);
        })}
        noValidate
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Section: Personal Information */}
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: brand }} />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Full Name" error={errors.fullName?.message} required>
                  <Input
                    {...register('fullName')}
                    placeholder="As per NIC / Passport"
                    className={errors.fullName ? 'border-red-400 focus-visible:ring-red-400' : ''}
                  />
                </Field>
              </div>
              <Field label="NIC / Passport Number" error={errors.nic?.message} required>
                <Input
                  {...register('nic')}
                  placeholder="e.g. 199012345678"
                  className={errors.nic ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
              </Field>
              <Field label="Email Address" error={errors.email?.message} required>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className={cn('pl-8', errors.email ? 'border-red-400 focus-visible:ring-red-400' : '')}
                  />
                </div>
              </Field>
              <Field label="Mobile Number" error={errors.mobile?.message} required>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    {...register('mobile')}
                    placeholder="+94 77 123 4567"
                    className={cn('pl-8', errors.mobile ? 'border-red-400 focus-visible:ring-red-400' : '')}
                  />
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address" error={errors.address?.message} required>
                  <div className="relative">
                    <MapPinIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                    <Textarea
                      {...register('address')}
                      placeholder="Your full address"
                      className={cn('pl-8 min-h-18', errors.address ? 'border-red-400 focus-visible:ring-red-400' : '')}
                    />
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* Section: Professional (optional) */}
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <Briefcase className="w-4 h-4" style={{ color: brand }} />
              Professional Details
              <span className="text-xs font-normal text-slate-400 ml-1">(Optional)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">These details help us tailor the event experience.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Organization" error={errors.organization?.message}>
                <Input {...register('organization')} placeholder="e.g. ABC Company Pvt Ltd" />
              </Field>
              <Field label="Designation" error={errors.designation?.message}>
                <Input {...register('designation')} placeholder="e.g. Senior Engineer" />
              </Field>
            </div>
          </div>

          {/* Section: Payment */}
          {event.registrationFee > 0 && (
            <div className="px-6 py-5 border-b border-slate-100 bg-amber-50/50">
              <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: brand }} />
                Payment Instructions
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Transfer <strong className="text-slate-700">LKR {event.registrationFee.toLocaleString()}</strong> to the account below and upload the receipt.
              </p>
              <div className="bg-white rounded-lg border border-amber-200 p-4 text-sm grid grid-cols-2 gap-2">
                <span className="text-slate-500">Bank</span>
                <span className="font-medium text-slate-700">{event.bankDetails.bankName}</span>
                <span className="text-slate-500">Account Name</span>
                <span className="font-medium text-slate-700">{event.bankDetails.accountName}</span>
                <span className="text-slate-500">Account No.</span>
                <span className="font-medium text-slate-700">{event.bankDetails.accountNumber}</span>
                <span className="text-slate-500">Branch</span>
                <span className="font-medium text-slate-700">{event.bankDetails.branch}</span>
              </div>
            </div>
          )}

          {/* Section: Receipt Upload */}
          <div className={cn('px-6 py-5', event.questions?.length > 0 ? 'border-b border-slate-100' : '')}>
            <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4" style={{ color: brand }} />
              Upload Payment Receipt
              <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {event.registrationFee === 0
                ? 'Upload any supporting document (optional for free events).'
                : 'Upload a clear photo or scan of your bank transfer receipt.'}
            </p>
            <Controller
              name="receipt"
              control={control}
              render={({ field }) => (
                <ReceiptUpload
                  value={field.value instanceof File ? field.value : undefined}
                  onChange={field.onChange}
                  error={errors.receipt?.message}
                />
              )}
            />
          </div>

          {/* Section: Additional Information (custom questions) */}
          {event.questions && event.questions.length > 0 && (
            <div className="px-6 py-5">
              <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                <ListChecks className="w-4 h-4" style={{ color: brand }} />
                Additional Information
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Please answer the following questions to complete your registration.
              </p>
              <div className="space-y-5">
                {event.questions.map((question: Question) => (
                  <QuestionField
                    key={question._id}
                    question={question}
                    value={answers[question._id]}
                    error={answerErrors[question._id]}
                    onChange={(val) => {
                      setAnswers((prev) => ({ ...prev, [question._id]: val }));
                      if (answerErrors[question._id]) {
                        setAnswerErrors((prev) => {
                          const next = { ...prev };
                          delete next[question._id];
                          return next;
                        });
                      }
                    }}
                    brand={brand}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Submit */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-xs text-slate-400">
            By registering you agree to our terms. Your data is used only for event management.
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto whitespace-nowrap inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: brand }}
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Registration'
            )}
          </button>
        </div>
      </form>

      {/* Floating WhatsApp button */}
      {event.whatsappNumber && (
        <a
          href={`https://wa.me/${event.whatsappNumber}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm"
          aria-label="Need help? Chat on WhatsApp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.528 5.852L.057 23.457a.5.5 0 0 0 .61.61l5.606-1.471A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.802 9.802 0 0 1-5.032-1.388l-.36-.214-3.733.979.997-3.648-.235-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z" />
          </svg>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[10px] font-normal opacity-80">Need help?</span>
            <span>Chat on WhatsApp</span>
          </span>
        </a>
      )}
    </div>
  );
}
