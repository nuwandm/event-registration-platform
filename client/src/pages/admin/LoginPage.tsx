import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';

import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) {
    navigate(`/${orgSlug}/admin`, { replace: true });
  }

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: FormValues) => authApi.login({ ...data, orgSlug }),
    onSuccess: (res) => {
      const { token, admin } = res.data.data!;
      setAuth(token, admin, orgSlug);
      navigate(`/${orgSlug}/admin`);
    },
  });

  const errorMessage =
    error && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/Event Hub.png"
            alt="EventHub"
            className="h-24 w-auto object-contain mx-auto brightness-0 invert drop-shadow-lg"
          />
          <p className="text-slate-400 text-sm mt-2">Admin Portal</p>
          {orgSlug && (
            <p className="text-blue-400 text-xs mt-1 font-mono">/{orgSlug}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-6">Enter your credentials to continue</p>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                {...register('email')}
                className={errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={cn('pr-10', errors.password ? 'border-red-400 focus-visible:ring-red-400' : '')}
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
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign in
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Event Registration & Attendance Management System
        </p>
      </div>
    </div>
  );
}
