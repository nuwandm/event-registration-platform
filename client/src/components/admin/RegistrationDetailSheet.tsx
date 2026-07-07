import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, ExternalLink, Download, User, Mail, Phone,
  MapPin, Briefcase, Hash, CalendarDays, QrCode, Clock,
} from 'lucide-react';
import { format } from 'date-fns';

import { registrationsApi } from '@/api/registrationsApi';
import type { Registration } from '@/types';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATUS_BADGE: Record<string, 'pending' | 'success' | 'destructive'> = {
  pending: 'pending',
  approved: 'success',
  rejected: 'destructive',
};

interface RegistrationDetailSheetProps {
  registrationId: string | null;
  onClose: () => void;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm text-slate-700 font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

export function RegistrationDetailSheet({ registrationId, onClose }: RegistrationDetailSheetProps) {
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [approveRemarks, setApproveRemarks] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);

  const { data: registration, isLoading } = useQuery({
    queryKey: ['admin-registration', registrationId],
    queryFn: () => registrationsApi.getById(registrationId!),
    select: (res) => res.data.data?.registration,
    enabled: !!registrationId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
    queryClient.invalidateQueries({ queryKey: ['admin-registration', registrationId] });
  };

  const approveMutation = useMutation({
    mutationFn: () => registrationsApi.approve(registrationId!, approveRemarks || undefined),
    onSuccess: () => {
      toast.success('Registration approved — QR code generated');
      invalidate();
      setApproveOpen(false);
      setApproveRemarks('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Approval failed');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => registrationsApi.reject(registrationId!, remarks),
    onSuccess: () => {
      toast.success('Registration rejected');
      invalidate();
      setRejectOpen(false);
      setRemarks('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? 'Rejection failed');
    },
  });

  const event = registration?.eventId && typeof registration.eventId === 'object'
    ? registration.eventId as { name?: string; venue?: string; eventDate?: string }
    : null;

  return (
    <>
      <Sheet open={!!registrationId} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:w-[520px] flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 shrink-0">
            <SheetHeader>
              <SheetTitle>Registration Detail</SheetTitle>
              <SheetDescription>
                {isLoading ? 'Loading...' : registration ? `#${registration.registrationNumber}` : ''}
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !registration ? (
              <p className="text-slate-400 text-sm text-center py-8">Registration not found</p>
            ) : (
              <>
                {/* Status banner */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Status</p>
                    <Badge variant={STATUS_BADGE[registration.status]} className="capitalize text-xs">
                      {registration.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-0.5">Submitted</p>
                    <p className="text-xs font-medium text-slate-600">
                      {format(new Date(registration.createdAt), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </div>

                {/* Event info */}
                {event?.name && (
                  <div className="bg-blue-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-400 mb-1 font-medium uppercase tracking-wide">Event</p>
                    <p className="text-sm font-semibold text-blue-800">{event.name}</p>
                    {event.eventDate && (
                      <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(event.eventDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                )}

                {/* Personal info */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Personal Information</p>
                  <div className="bg-white rounded-xl border border-slate-100 px-4 divide-y divide-slate-50">
                    <InfoRow icon={User} label="Full Name" value={registration.fullName} />
                    <InfoRow icon={Hash} label="NIC / Passport" value={registration.nic} />
                    <InfoRow icon={Mail} label="Email" value={registration.email} />
                    <InfoRow icon={Phone} label="Mobile" value={registration.mobile} />
                    <InfoRow icon={MapPin} label="Address" value={registration.address} />
                    <InfoRow icon={Briefcase} label="Organization" value={registration.organization} />
                    <InfoRow icon={Briefcase} label="Designation" value={registration.designation} />
                  </div>
                </div>

                {/* Receipt */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Payment Receipt</p>
                  {registration.receiptUrl ? (
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      {registration.receiptUrl.toLowerCase().includes('.pdf') || registration.receiptUrl.includes('/raw/') ? (
                        <div className="flex items-center gap-3 p-4">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">PDF Receipt</p>
                            <a
                              href={registration.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              Open PDF <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <img
                            src={registration.receiptUrl}
                            alt="Payment receipt"
                            className="w-full max-h-64 object-contain bg-white"
                          />
                          <a
                            href={registration.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                          >
                            <span className="bg-white text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 shadow">
                              <ExternalLink className="w-3.5 h-3.5" /> View full size
                            </span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No receipt uploaded</p>
                  )}
                </div>

                {/* QR Code (if approved) */}
                {registration.status === 'approved' && registration.qrCodeUrl && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">QR Code</p>
                    <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4">
                      <img src={registration.qrCodeUrl} alt="QR Code" className="w-24 h-24 rounded-lg border border-slate-100" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-blue-500" /> QR Code Generated
                        </p>
                        <a
                          href={registration.qrCodeUrl}
                          download={`${registration.registrationNumber}-qr.png`}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                        >
                          <Download className="w-3 h-3" /> Download PNG
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attendance */}
                {registration.status === 'approved' && (
                  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                    registration.attendanceStatus === 'attended' ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
                  }`}>
                    {registration.attendanceStatus === 'attended' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-emerald-700">Attended</p>
                          {registration.attendanceTime && (
                            <p className="text-xs text-emerald-600">
                              Checked in: {format(new Date(registration.attendanceTime), 'MMM d, yyyy · h:mm a')}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                        <p className="text-sm text-slate-500">Not yet attended</p>
                      </>
                    )}
                  </div>
                )}

                {/* Admin remarks */}
                {registration.adminRemarks && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Remarks</p>
                    <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 border border-slate-100">
                      {registration.adminRemarks}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action footer — only show for pending */}
          {registration?.status === 'pending' && (
            <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setRejectOpen(true)}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setApproveOpen(true)}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Approve
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Approve dialog */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Approve Registration
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will approve <strong>{registration?.fullName}</strong> and generate a unique QR code for event entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2">
            <Label className="text-sm">Remarks (optional)</Label>
            <Textarea
              className="mt-1.5"
              placeholder="e.g. Payment verified — receipt matches"
              value={approveRemarks}
              onChange={(e) => setApproveRemarks(e.target.value)}
            />
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={(e) => { e.preventDefault(); approveMutation.mutate(); }}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve & Generate QR'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Reject Registration
            </AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejection. This will be visible on the registrant's status page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2">
            <Label className="text-sm">Reason for rejection <span className="text-red-500">*</span></Label>
            <Textarea
              className="mt-1.5"
              placeholder="e.g. Receipt is unclear. Please re-upload a legible copy."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                if (!remarks.trim()) { toast.error('Rejection reason is required'); return; }
                rejectMutation.mutate();
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Registration'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
