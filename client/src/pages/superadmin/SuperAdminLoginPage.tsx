import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';

import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormValues = z.infer<typeof schema>;

export function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const admin = useAuthStore((s) => s.admin);
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated && admin?.role === 'super_admin') {
    navigate('/superadmin', { replace: true });
  }

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: FormValues) => authApi.login(data),
    onSuccess: (res) => {
      const { token, admin: a } = res.data.data!;
      if (a.role !== 'super_admin') return;
      setAuth(token, a);
      navigate('/superadmin');
    },
  });

  const errorMessage =
    error && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/Event Hub.png" alt="EventHub" className="h-20 w-auto object-contain mx-auto brightness-0 invert" />
          <p className="text-amber-400 text-sm font-semibold mt-2">Super Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Platform sign in</h2>
          <p className="text-slate-500 text-sm mb-6">Super admin access only</p>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  {...register('password')}
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
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-white" disabled={isPending}>
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
      </div>
    </div>
  );
}
