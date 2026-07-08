import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, Upload } from 'lucide-react';

import { tenantApi } from '@/api/tenantApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const schema = z.object({
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  orgSlug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  contactEmail: z.string().email('Invalid email'),
  adminName: z.string().min(2, 'Name required'),
  adminEmail: z.string().email('Invalid admin email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { primaryColor: '#3b82f6' },
  });

  const slugValue = watch('orgSlug');

  useEffect(() => {
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    if (!slugValue || slugValue.length < 2) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await tenantApi.checkSlug(slugValue);
        setSlugStatus(res.data.data?.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 500);
  }, [slugValue]);

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: (data: FormValues) =>
      tenantApi.signup({
        ...data,
        primaryColor: data.primaryColor || undefined,
        logo: logoFile ?? undefined,
      }),
    onSuccess: () => {
      setTimeout(() => navigate('/'), 3000);
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const errorMessage =
    error && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : null;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Application submitted!</h2>
          <p className="text-slate-500 text-sm">
            Your organization has been registered and is pending approval. You'll receive an email once approved. Redirecting you to the home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 flex items-start justify-center pt-10">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <img src="/Event Hub.png" alt="EventHub" className="h-16 w-auto object-contain mx-auto brightness-0 invert" />
          <p className="text-slate-400 text-sm mt-2">Create your organization account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Register your organization</h2>
            <p className="text-slate-500 text-sm mt-1">Your account will be reviewed and activated by our team.</p>
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            {/* Organization section */}
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Organization</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input id="orgName" placeholder="Acme Corp" {...register('orgName')} />
                  {errors.orgName && <p className="text-xs text-red-500">{errors.orgName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="orgSlug">
                    URL slug
                    <span className="text-slate-400 font-normal ml-1 text-xs">(your public URL prefix)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="orgSlug"
                      placeholder="acme-corp"
                      {...register('orgSlug')}
                      className={slugStatus === 'taken' ? 'border-red-400 pr-8' : slugStatus === 'available' ? 'border-emerald-400 pr-8' : 'pr-8'}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {slugStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                      {slugStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {slugStatus === 'taken' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  {slugValue && (
                    <p className="text-xs text-slate-400">
                      Your events will be at: <span className="font-mono text-blue-600">eventhub.com/{slugValue}</span>
                    </p>
                  )}
                  {slugStatus === 'taken' && <p className="text-xs text-red-500">This slug is already taken</p>}
                  {errors.orgSlug && <p className="text-xs text-red-500">{errors.orgSlug.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Organization contact email</Label>
                  <Input id="contactEmail" type="email" placeholder="contact@acme.com" {...register('contactEmail')} />
                  {errors.contactEmail && <p className="text-xs text-red-500">{errors.contactEmail.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="primaryColor">Brand color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="primaryColorPicker"
                        defaultValue="#3b82f6"
                        onChange={(e) => {
                          const input = document.getElementById('primaryColor') as HTMLInputElement;
                          if (input) input.value = e.target.value;
                        }}
                        className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5"
                      />
                      <Input
                        id="primaryColor"
                        placeholder="#3b82f6"
                        className="font-mono text-sm"
                        {...register('primaryColor')}
                      />
                    </div>
                    {errors.primaryColor && <p className="text-xs text-red-500">{errors.primaryColor.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Logo (optional)</Label>
                    <div
                      className="border-2 border-dashed border-slate-200 rounded-lg h-9 flex items-center justify-center gap-2 text-xs text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="h-7 w-auto object-contain" />
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Upload logo
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Admin section */}
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Admin account</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="adminName">Your name</Label>
                  <Input id="adminName" placeholder="John Smith" {...register('adminName')} />
                  {errors.adminName && <p className="text-xs text-red-500">{errors.adminName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adminEmail">Admin email</Label>
                  <Input id="adminEmail" type="email" placeholder="admin@acme.com" {...register('adminEmail')} />
                  {errors.adminEmail && <p className="text-xs text-red-500">{errors.adminEmail.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adminPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      {...register('adminPassword')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.adminPassword && <p className="text-xs text-red-500">{errors.adminPassword.message}</p>}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={isPending || slugStatus === 'taken' || slugStatus === 'checking'}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit application'
              )}
            </Button>

            <p className="text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/" className="text-blue-600 hover:underline">Go to home</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
