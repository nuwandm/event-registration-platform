import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm, Controller, useFieldArray, type Resolver, type Control, type UseFormRegister, type UseFormWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ImagePlus, X, CalendarDays, CreditCard, Move, ListPlus, Trash2, Plus } from 'lucide-react';

import { eventFormSchema, type EventFormValues, type QuestionFormValue } from '@/schemas/event';
import { useTenant } from '@/context/TenantContext';
import type { Event } from '@/types';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DateTimePicker } from '@/components/ui/date-time-picker';

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  event?: Event | null;
}

const toDatetimeLocal = (dateStr?: string) => {
  if (!dateStr) return '';
  // Return full ISO string — DateTimePicker parses it as a Date object
  // which automatically applies local timezone for display
  return new Date(dateStr).toISOString();
};

function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </div>
  );
}

// ── Question type labels ──────────────────────────────────────────────────────
const QUESTION_TYPE_LABELS: Record<QuestionFormValue['type'], string> = {
  text: 'Short Text',
  textarea: 'Long Text',
  radio: 'Multiple Choice',
  checkbox: 'Checkboxes',
  dropdown: 'Dropdown',
};

const OPTION_TYPES: QuestionFormValue['type'][] = ['radio', 'checkbox', 'dropdown'];

// ── QuestionBuilderItem ───────────────────────────────────────────────────────
interface QuestionBuilderItemProps {
  index: number;
  control: Control<EventFormValues>;
  register: UseFormRegister<EventFormValues>;
  watch: UseFormWatch<EventFormValues>;
  onRemove: () => void;
}

function QuestionBuilderItem({ index, control, register, watch, onRemove }: QuestionBuilderItemProps) {
  const questionType = watch(`questions.${index}.type`);
  const needsOptions = OPTION_TYPES.includes(questionType);

  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-3">
          {/* Label */}
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Question Label *</Label>
            <Input
              {...register(`questions.${index}.label`)}
              placeholder="e.g. What is your dietary preference?"
              className="bg-white"
            />
          </div>

          {/* Type */}
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Answer Type</Label>
            <Controller
              control={control}
              name={`questions.${index}.type`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v as QuestionFormValue['type'])}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(QUESTION_TYPE_LABELS) as QuestionFormValue['type'][]).map((t) => (
                      <SelectItem key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Options (for radio/checkbox/dropdown) */}
          {needsOptions && (
            <Controller
              control={control}
              name={`questions.${index}.options`}
              render={({ field }) => {
                const opts: string[] = field.value ?? [];
                const setOpts = (next: string[]) => field.onChange(next);
                return (
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Options</Label>
                    <div className="space-y-2">
                      {opts.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          {/* Visual indicator matching the question type */}
                          {questionType === 'radio' && (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                          )}
                          {questionType === 'checkbox' && (
                            <div className="w-4 h-4 rounded border-2 border-slate-300 shrink-0" />
                          )}
                          {questionType === 'dropdown' && (
                            <span className="text-xs text-slate-400 shrink-0 w-4 text-center font-medium">
                              {optIdx + 1}.
                            </span>
                          )}
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const next = [...opts];
                              next[optIdx] = e.target.value;
                              setOpts(next);
                            }}
                            placeholder={`Option ${optIdx + 1}`}
                            className="bg-white flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setOpts(opts.filter((_, i) => i !== optIdx))}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setOpts([...opts, ''])}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-3 h-3" /> Add option
                      </button>
                      {opts.filter(Boolean).length === 0 && (
                        <p className="text-xs text-amber-500">Add at least one option</p>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          )}

          {/* Required toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Controller
              control={control}
              name={`questions.${index}.required`}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              )}
            />
            <span className="text-xs text-slate-600 font-medium">Required</span>
          </label>
        </div>

        {/* Delete question */}
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded mt-0.5 shrink-0"
          title="Remove question"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function EventFormDialog({ open, onClose, event }: EventFormDialogProps) {
  const { api } = useTenant();
  const queryClient = useQueryClient();
  const isEditing = !!event;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerPos, setBannerPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const isDragging = useRef(false);
  const dragImgRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema) as unknown as Resolver<EventFormValues>,
    defaultValues: {
      status: 'draft',
      registrationFee: 0,
      bankDetails: { bankName: '', accountName: '', accountNumber: '', branch: '' },
      questions: [],
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
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
        questions: (event.questions ?? []).map((q) => ({
          _id: q._id,
          label: q.label,
          type: q.type,
          options: q.options ?? [],
          required: q.required ?? false,
        })),
      });
      setBannerPreview(event.bannerImage ?? null);
      setBannerPos(event.bannerPosition ?? { x: 50, y: 50 });
    } else {
      reset({
        status: 'draft',
        registrationFee: 0,
        bankDetails: { bankName: '', accountName: '', accountNumber: '', branch: '' },
        questions: [],
      });
      setBannerPreview(null);
      setBannerPos({ x: 50, y: 50 });
    }
    setBannerFile(null);
  }, [event, reset, open]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EventFormValues) => {
      const payload = {
        ...data,
        maxParticipants: data.maxParticipants || undefined,
        bannerPosition: bannerPos,
        questions: data.questions ?? [],
      };
      if (isEditing) return api.events.update(event!._id, payload as Record<string, unknown>, bannerFile ?? undefined);
      return api.events.create(payload as Record<string, unknown>, bannerFile ?? undefined);
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
    setBannerPos({ x: 50, y: 50 });
  };

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    isDragging.current = true;
    e.preventDefault();
  }, []);

  const calcPos = useCallback((clientX: number, clientY: number) => {
    const el = dragImgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, Math.round(((clientX - rect.left) / rect.width) * 100)));
    const y = Math.min(100, Math.max(0, Math.round(((clientY - rect.top) / rect.height) * 100)));
    setBannerPos({ x, y });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    calcPos(e.clientX, e.clientY);
  }, [calcPos]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || !e.touches[0]) return;
    calcPos(e.touches[0].clientX, e.touches[0].clientY);
  }, [calcPos]);

  const handleDragEnd = useCallback(() => { isDragging.current = false; }, []);

  const statusValue = watch('status');

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-slate-100 shrink-0">
          <SheetTitle className="text-lg font-semibold">
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </SheetTitle>
          <p className="text-sm text-slate-400 mt-0.5">
            {isEditing ? 'Update the event details below' : 'Fill in the details to create a new event'}
          </p>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Banner */}
          <div>
            <Label className="mb-1.5 block">Banner Image</Label>
            {bannerPreview ? (
              <div className="space-y-2">
                {/* Drag area */}
                <div
                  ref={dragImgRef}
                  className="relative rounded-xl overflow-hidden border border-slate-200 h-40 cursor-crosshair select-none"
                  onMouseDown={handleDragStart}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={handleDragStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleDragEnd}
                >
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover pointer-events-none"
                    style={{ objectPosition: `${bannerPos.x}% ${bannerPos.y}%` }}
                    draggable={false}
                  />
                  {/* Focal point crosshair */}
                  <div
                    className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${bannerPos.x}%`, top: `${bannerPos.y}%` }}
                  >
                    <div className="absolute inset-0 rounded-full border-2 border-white shadow-md" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/80 -translate-x-1/2" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/80 -translate-y-1/2" />
                  </div>
                  {/* Drag hint overlay */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none">
                    <Move className="w-3 h-3" />
                    Drag to reposition
                  </div>
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Position readout + change button */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Position: {bannerPos.x}% / {bannerPos.y}%
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Change image
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors bg-slate-50 hover:bg-blue-50/30"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs font-medium">Click to upload banner (JPG, PNG)</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={handleBannerChange} />
          </div>

          <Separator />

          {/* Basic Info */}
          <div>
            <SectionHeading icon={CalendarDays} label="Event Details" />
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Event Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g. Tech Conference 2026" className="mt-1" />
                {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" {...register('description')} placeholder="Describe the event..." className="mt-1 h-24 resize-none" />
                {errors.description && <p className="text-xs text-red-500 mt-0.5">{errors.description.message}</p>}
              </div>
              <div>
                <Label htmlFor="venue">Venue *</Label>
                <Input id="venue" {...register('venue')} placeholder="e.g. BMICH, Colombo" className="mt-1" />
                {errors.venue && <p className="text-xs text-red-500 mt-0.5">{errors.venue.message}</p>}
              </div>
            </div>
          </div>

          <Separator />

          {/* Dates & Settings */}
          <div>
            <SectionHeading icon={CalendarDays} label="Dates & Settings" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Event Date *</Label>
                <div className="mt-1">
                  <Controller
                    name="eventDate"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker value={field.value} onChange={field.onChange} placeholder="Pick event date & time" />
                    )}
                  />
                </div>
                {errors.eventDate && <p className="text-xs text-red-500 mt-0.5">{errors.eventDate.message}</p>}
              </div>
              <div>
                <Label>Registration Opens *</Label>
                <div className="mt-1">
                  <Controller
                    name="registrationOpenDate"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker value={field.value} onChange={field.onChange} placeholder="Open date & time" />
                    )}
                  />
                </div>
                {errors.registrationOpenDate && <p className="text-xs text-red-500 mt-0.5">{errors.registrationOpenDate.message}</p>}
              </div>
              <div>
                <Label>Registration Closes *</Label>
                <div className="mt-1">
                  <Controller
                    name="registrationCloseDate"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker value={field.value} onChange={field.onChange} placeholder="Close date & time" />
                    )}
                  />
                </div>
                {errors.registrationCloseDate && <p className="text-xs text-red-500 mt-0.5">{errors.registrationCloseDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="registrationFee">Registration Fee (LKR) *</Label>
                <Input id="registrationFee" type="number" min={0} step="0.01" {...register('registrationFee')} className="mt-1" />
                {errors.registrationFee && <p className="text-xs text-red-500 mt-0.5">{errors.registrationFee.message}</p>}
              </div>
              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input id="maxParticipants" type="number" min={1} {...register('maxParticipants')} placeholder="Unlimited" className="mt-1" />
              </div>
              <div className="sm:col-span-2">
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
          </div>

          <Separator />

          {/* Bank Details */}
          <div>
            <SectionHeading icon={CreditCard} label="Bank Transfer Details" />
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

          <Separator />

          {/* Custom Questions */}
          <div>
            <SectionHeading icon={ListPlus} label="Custom Questions" />
            <p className="text-xs text-slate-400 mb-3">
              Add custom questions that registrants must answer when signing up for this event.
            </p>

            <div className="space-y-4">
              {questionFields.map((field, index) => (
                <QuestionBuilderItem
                  key={field.id}
                  index={index}
                  control={control}
                  register={register}
                  watch={watch}
                  onRemove={() => removeQuestion(index)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                appendQuestion({
                  _id: Date.now().toString(),
                  label: '',
                  type: 'text',
                  options: [],
                  required: false,
                } as QuestionFormValue)
              }
              className="mt-3 w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          {/* Bottom spacing */}
          <div className="h-2" />
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-slate-100 px-6 py-4 flex gap-3 bg-white">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit((d) => mutate(d))} disabled={isPending}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isEditing ? 'Saving...' : 'Creating...'}
              </span>
            ) : isEditing ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
