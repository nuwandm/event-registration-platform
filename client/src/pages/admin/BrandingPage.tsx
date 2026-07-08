import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Palette, Save } from 'lucide-react';

import { tenantApi } from '@/api/tenantApi';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function BrandingPage() {
  const { tenant } = useTenant();
  const admin = useAuthStore((s) => s.admin);
  const qc = useQueryClient();

  const [name, setName] = useState(tenant?.name ?? '');
  const [primaryColor, setPrimaryColor] = useState(tenant?.primaryColor ?? '#3b82f6');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logoUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOrgAdmin = admin?.role === 'org_admin';

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: () =>
      tenantApi.updateOwnBranding({ name: name || undefined, primaryColor, logo: logoFile ?? undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-public'] });
      toast.success('Branding updated');
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

  if (!isOrgAdmin) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Branding" description="Organization branding settings" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          Only organization admins can manage branding settings.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Branding" description="Customize your organization's appearance" />

      <div className="max-w-xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {isSuccess && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
            <AlertDescription>Branding updated successfully.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="brandName">Organization name</Label>
          <Input
            id="brandName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your organization name"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Brand color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-slate-200 p-0.5"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#3b82f6"
              className="font-mono w-36 text-sm"
            />
            <div className="w-8 h-8 rounded-lg border border-slate-200" style={{ background: primaryColor }} />
          </div>
          <p className="text-xs text-slate-400">This color is applied to buttons and accents on your public pages.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Logo</Label>
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-16 object-contain" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-400" />
                <p className="text-sm text-slate-400">Click to upload logo</p>
              </>
            )}
            <p className="text-xs text-slate-400">PNG, JPG, or SVG · Recommended 200×200px</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          {logoFile && <p className="text-xs text-slate-500">Selected: {logoFile.name}</p>}
        </div>

        <div className="pt-2 border-t">
          <Button onClick={() => mutate()} disabled={isPending} className="gap-2">
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="max-w-xl">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Palette className="w-3.5 h-3.5" /> Preview
        </p>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-3">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                {name?.[0] ?? 'O'}
              </div>
            )}
            <span className="font-semibold text-slate-800">{name || 'Your Organization'}</span>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: primaryColor }}
          >
            Register Now
          </button>
        </div>
      </div>
    </div>
  );
}
