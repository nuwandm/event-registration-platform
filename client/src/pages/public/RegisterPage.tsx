import { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays, MapPin, CreditCard, Building2, Upload, X, FileText,
  User, Mail, Phone, MapPin as MapPinIcon, Briefcase, ArrowLeft, CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

import { registrationSchema, type RegistrationFormValues } from '@/schemas/registration';
import { registrationsApi } from '@/api/registrationsApi';
import { eventsApi } from '@/api/eventsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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

// ── Main page ─────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading: eventLoading, isError } = useQuery({
    queryKey: ['public-event', slug],
    queryFn: () => eventsApi.getBySlug(slug!),
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

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegistrationFormValues) =>
      registrationsApi.submit(String(event!._id), {
        fullName: data.fullName,
        nic: data.nic,
        email: data.email,
        mobile: data.mobile,
        address: data.address,
        organization: data.organization || undefined,
        designation: data.designation || undefined,
        receipt: data.receipt,
      }),
    onSuccess: (res) => {
      const { registrationId } = res.data.data!;
      navigate(`/registration/success?id=${registrationId}`);
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
        <Button asChild variant="outline"><Link to="/">Back to events</Link></Button>
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
        <Button asChild variant="outline"><Link to="/">Browse Events</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/events/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to event
      </Link>

      {/* Google Forms style hero card */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-6">
        {/* Full-width banner */}
        <div className="relative w-full h-44 sm:h-56 bg-linear-to-br from-blue-500 to-indigo-700">
          {event.bannerImage ? (
            <img src={event.bannerImage} alt={event.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CalendarDays className="w-16 h-16 text-white/20" />
            </div>
          )}
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Event info below banner — blue left border like Google Forms */}
        <div className="bg-white border-t-4 border-blue-600 px-6 py-5">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Registration Form</p>
          <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-3">{event.name}</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              {format(new Date(event.eventDate), 'EEEE, MMM d, yyyy')} · {format(new Date(event.eventDate), 'h:mm a')}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-400" />
              {event.venue}
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-400" />
              {event.registrationFee === 0 ? 'Free Entry' : `LKR ${event.registrationFee.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => { setServerError(null); mutate(d); })} noValidate>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Section: Personal Information */}
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
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
              <Briefcase className="w-4 h-4 text-blue-500" />
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
                <Building2 className="w-4 h-4 text-amber-600" />
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
          <div className="px-6 py-5">
            <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-500" />
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
          <Button type="submit" size="lg" disabled={isPending} className="w-full sm:w-auto min-w-45">
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Registration'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
