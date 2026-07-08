import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Pencil, Trash2, UserCog, CalendarDays, X, Eye, EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';

import { usersApi, type CreateUserPayload, type UpdateUserPayload } from '@/api/usersApi';
import { eventsApi } from '@/api/eventsApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { StaffUser, Event } from '@/types';

// ── Schemas ───────────────────────────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters'),
  assignedEvents: z.array(z.string()),
});

const editSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters').or(z.literal('')).optional(),
  assignedEvents: z.array(z.string()),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

// ── Event multi-select ─────────────────────────────────────────────────────────
function EventMultiSelect({
  events,
  value,
  onChange,
}: {
  events: Event[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="border border-slate-200 rounded-lg divide-y max-h-48 overflow-y-auto">
      {events.length === 0 && (
        <p className="text-xs text-slate-400 p-3">No events found</p>
      )}
      {events.map((ev) => (
        <label
          key={ev._id}
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
        >
          <input
            type="checkbox"
            className="rounded"
            checked={value.includes(ev._id)}
            onChange={() => toggle(ev._id)}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{ev.name}</p>
            <p className="text-xs text-slate-400">
              {ev.eventDate ? format(new Date(ev.eventDate), 'MMM d, yyyy') : ''}
            </p>
          </div>
          <Badge variant={ev.status === 'published' ? 'success' : 'secondary'} className="text-xs shrink-0">
            {ev.status}
          </Badge>
        </label>
      ))}
    </div>
  );
}

// ── Dialog ────────────────────────────────────────────────────────────────────
function UserDialog({
  mode,
  user,
  events,
  onClose,
}: {
  mode: 'create' | 'edit';
  user?: StaffUser;
  events: Event[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const isEdit = mode === 'edit';

  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: isEdit && user ? {
      name: user.name,
      email: user.email,
      password: '',
      assignedEvents: user.assignedEvents.map((e) => e._id),
    } : {
      name: '',
      email: '',
      password: '',
      assignedEvents: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserPayload) => usersApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff-users'] }); onClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserPayload) => usersApi.update(user!._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff-users'] }); onClose(); },
  });

  const onSubmit = (data: CreateForm | EditForm) => {
    if (isEdit) {
      const payload: UpdateUserPayload = {
        name: data.name,
        email: data.email,
        assignedEvents: data.assignedEvents,
      };
      if (data.password) payload.password = data.password;
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(data as CreateUserPayload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const apiError = (createMutation.error || updateMutation.error) as Error | null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Edit Staff User' : 'Create Staff User'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {apiError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {apiError.message}
            </p>
          )}

          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} placeholder="Full name" className="mt-1" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="staff@example.com" className="mt-1" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Min 8 characters'}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <Label>Assigned Events</Label>
            <p className="text-xs text-slate-400 mb-2 mt-0.5">Select events this staff user can scan (optional — can be assigned later from Events page)</p>
            <Controller
              name="assignedEvents"
              control={control}
              render={({ field }) => (
                <EventMultiSelect
                  events={events}
                  value={field.value as string[]}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.assignedEvents && (
              <p className="text-xs text-red-500 mt-1">{errors.assignedEvents.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function UsersPage() {
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit'; user?: StaffUser } | null>(null);
  const qc = useQueryClient();

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => usersApi.list(),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['all-events'],
    queryFn: () => eventsApi.getAll({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-users'] }),
  });

  const users = usersData?.data.data?.users ?? [];
  const events = eventsData?.data.data?.data ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="User Management"
        description="Create and manage staff users who can scan attendance for specific events"
        action={
          <Button onClick={() => setDialog({ mode: 'create' })}>
            <Plus className="w-4 h-4 mr-2" /> Add Staff User
          </Button>
        }
      />

      {usersLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <UserCog className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No staff users yet</p>
          <p className="text-slate-400 text-sm mt-1">Create a staff user to let them scan attendance for events</p>
          <Button className="mt-4" onClick={() => setDialog({ mode: 'create' })}>
            <Plus className="w-4 h-4 mr-2" /> Add First Staff User
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-start gap-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800">{user.name}</p>
                  <Badge variant="secondary" className="text-xs">Staff</Badge>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
                {user.assignedEvents.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {user.assignedEvents.map((ev) => (
                      <span
                        key={ev._id}
                        className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                      >
                        <CalendarDays className="w-3 h-3" />
                        {ev.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-500 mt-1">No events assigned</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDialog({ mode: 'edit', user })}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:text-red-600 hover:border-red-300"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete user "${user.name}"?`)) deleteMutation.mutate(user._id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog && (
        <UserDialog
          mode={dialog.mode}
          user={dialog.user}
          events={events}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
