import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { KeyRound, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/authApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function ProfilePage() {
  const { admin } = useAuthStore();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      toast.success('Password changed successfully');
      reset();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to change password';
      toast.error(msg);
    },
  });

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="My Profile" description="Manage your account details" />

      {/* Profile info card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">{admin?.name}</p>
            <p className="text-sm text-slate-500">{admin?.email}</p>
            <span className="inline-block mt-1 text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
              {admin?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Change Password</h2>
            <p className="text-xs text-slate-400">Choose a strong password of at least 8 characters</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {/* Current password */}
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter current password"
                {...register('currentPassword')}
                className={errors.currentPassword ? 'border-red-400 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                placeholder="At least 8 characters"
                {...register('newPassword')}
                className={errors.newPassword ? 'border-red-400 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-500">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm new password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat new password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-400 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
              <ShieldCheck className="w-4 h-4 mr-2" />
              {mutation.isPending ? 'Changing…' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
