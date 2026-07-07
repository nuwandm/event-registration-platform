import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';

import { eventFormSchema, type EventFormValues } from '@/schemas/event';
import { eventsApi } from '@/api/eventsApi';
import type { Event } from '@/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  event?: Event | null;
}

const toDatetimeLocal = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 16);
};

export function EventFormDialog({ open, onClose, event }: EventFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!event;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      status: 'draft',
      registrationFee: 0,
      bankDetails: { bankName: '', accountName: '', accountNumber: '', branch: '' },
    },
  });

  useEffect(() => {
    if (event) {
      reset({
        name: event.name,
        description: event.description,
        venue: event.venue,
        eventDate: toDatetimeLocal(event.eventDate),
        registrationOpenDate: toDatetimeLocal(event.registrationOpenDate),
        registrationCloseDate: toDatetimeLocal(event.registrationCloseDate),
        registrationFee: event.registrationFee,
        maxParticipants: event.maxParticipants ?? ('' as unknown as number),
        status: event.status,
        bankDetails: event.bankDetails,
      });
      setBannerPreview(event.bannerImage ?? null);
    } else {
      reset({
        status: 'draft',
        registrationFee: 0,
        bankDetails: { bankName: '', accountName: '', accountNumber: '', branch: '' },
      });
      setBannerPreview(null);
    }
    setBannerFile(null);
  }, [event, reset, open]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EventFormValues) => {
      const payload = {
        ...data,
        maxParticipants: data.maxParticipants || undefined,
        bankDetails: data.bankDetails,
      };
      if (isEditing) {
        return eventsApi.update(event!._id, payload as Record<string, unknown>, bannerFile ?? undefined);
      }
      return eventsApi.create(payload as Record<string, unknown>, bannerFile ?? undefined);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Event updated successfully' : 'Event created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Something went wrong';
      toast.error(msg ?? 'Something went wrong');
    },
  });

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const statusValue = watch('status');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'Create New Event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-5 px-6 pb-2">
          {/* Banner */}
          <div>
            <Label>Banner Image</Label>
            <div className="mt-1.5">
              {bannerPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200">
                  <img src={bannerPreview} alt="Banner preview" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-xs">Click to upload banner (JPG, PNG)</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={handleBannerChange} />
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Event Name *</Label>
              <Input id="name" {...register('name')} placeholder="e.g. Tech Conference 2026" className="mt-1" />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" {...register('description')} placeholder="Describe the event..." className="mt-1 h-24" />
              {errors.description && <p className="text-xs text-red-500 mt-0.5">{errors.description.message}</p>}
            </div>

            <div>
              <Label htmlFor="venue">Venue *</Label>
              <Input id="venue" {...register('venue')} placeholder="e.g. BMICH, Colombo" className="mt-1" />
              {errors.venue && <p className="text-xs text-red-500 mt-0.5">{errors.venue.message}</p>}
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input id="eventDate" type="datetime-local" {...register('eventDate')} className="mt-1" />
              {errors.eventDate && <p className="text-xs text-red-500 mt-0.5">{errors.eventDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="registrationFee">Registration Fee (LKR) *</Label>
              <Input id="registrationFee" type="number" min={0} step="0.01" {...register('registrationFee')} className="mt-1" />
              {errors.registrationFee && <p className="text-xs text-red-500 mt-0.5">{errors.registrationFee.message}</p>}
            </div>
            <div>
              <Label htmlFor="registrationOpenDate">Registration Opens *</Label>
              <Input id="registrationOpenDate" type="datetime-local" {...register('registrationOpenDate')} className="mt-1" />
              {errors.registrationOpenDate && <p className="text-xs text-red-500 mt-0.5">{errors.registrationOpenDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="registrationCloseDate">Registration Closes *</Label>
              <Input id="registrationCloseDate" type="datetime-local" {...register('registrationCloseDate')} className="mt-1" />
              {errors.registrationCloseDate && <p className="text-xs text-red-500 mt-0.5">{errors.registrationCloseDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="maxParticipants">Max Participants (optional)</Label>
              <Input id="maxParticipants" type="number" min={1} {...register('maxParticipants')} placeholder="Unlimited" className="mt-1" />
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={statusValue} onValueChange={(v) => setValue('status', v as EventFormValues['status'])}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Bank Details */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Bank Transfer Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input id="bankName" {...register('bankDetails.bankName')} placeholder="e.g. Bank of Ceylon" className="mt-1" />
                {errors.bankDetails?.bankName && <p className="text-xs text-red-500 mt-0.5">{errors.bankDetails.bankName.message}</p>}
              </div>
              <div>
                <Label htmlFor="accountName">Account Name *</Label>
                <Input id="accountName" {...register('bankDetails.accountName')} placeholder="e.g. EventHub Pvt Ltd" className="mt-1" />
                {errors.bankDetails?.accountName && <p className="text-xs text-red-500 mt-0.5">{errors.bankDetails.accountName.message}</p>}
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input id="accountNumber" {...register('bankDetails.accountNumber')} placeholder="e.g. 7654321" className="mt-1" />
                {errors.bankDetails?.accountNumber && <p className="text-xs text-red-500 mt-0.5">{errors.bankDetails.accountNumber.message}</p>}
              </div>
              <div>
                <Label htmlFor="branch">Branch *</Label>
                <Input id="branch" {...register('bankDetails.branch')} placeholder="e.g. Colombo Main" className="mt-1" />
                {errors.bankDetails?.branch && <p className="text-xs text-red-500 mt-0.5">{errors.bankDetails.branch.message}</p>}
              </div>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit((d) => mutate(d))} disabled={isPending}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isEditing ? 'Saving...' : 'Creating...'}
              </span>
            ) : isEditing ? 'Save Changes' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
