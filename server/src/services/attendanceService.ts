import { registrationRepository } from '../repositories/registrationRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { AppError } from '../middleware/errorHandler';
import { IRegistration } from '../models/Registration';
import { IEvent } from '../models/Event';

export type ScanOutcome = 'success' | 'duplicate' | 'invalid';

export interface ScanResult {
  outcome: ScanOutcome;
  message: string;
  registration?: {
    id: string;
    registrationNumber: string;
    fullName: string;
    nic: string;
    email: string;
    organization?: string;
    attendanceTime?: Date;
    attendanceStatus: string;
  };
  event?: {
    id: string;
    name: string;
    venue?: string;
    eventDate?: Date;
  };
}

export const attendanceService = {
  async scanQR(
    qrData: string,
    adminId: string,
    tenantId: string,
    ipAddress?: string,
    restrictToEventId?: string
  ): Promise<ScanResult> {
    // 1. Parse QR payload
    let payload: { id: string; token: string };
    try {
      payload = JSON.parse(qrData);
      if (!payload.id || !payload.token) throw new Error('Invalid payload shape');
    } catch {
      return { outcome: 'invalid', message: 'Invalid QR code format' };
    }

    // 2. Find registration
    const registration = await registrationRepository.findById(payload.id);
    if (!registration) {
      return { outcome: 'invalid', message: 'Registration not found' };
    }

    // Verify registration belongs to this tenant
    if (String(registration.tenantId) !== tenantId) {
      return { outcome: 'invalid', message: 'Registration not found' };
    }

    const eventDoc = registration.eventId as unknown as IEvent;
    const eventId = String(eventDoc?._id ?? registration.eventId);

    // 3a. For staff: ensure the scanned QR belongs to their selected event
    if (restrictToEventId && eventId !== restrictToEventId) {
      return { outcome: 'invalid', message: 'This QR code does not belong to your assigned event' };
    }

    // 3b. Check admission is open for this event
    if (!eventDoc?.admissionOpen) {
      return { outcome: 'invalid', message: 'Admission has not been opened for this event yet' };
    }
    const regId = String(registration._id);

    // 3. Validate token — constant-time compare not needed here since token is a UUID
    if (registration.qrToken !== payload.token) {
      await attendanceRepository.createLog({ registrationId: regId, eventId, scannedBy: adminId, ipAddress, status: 'invalid' });
      return { outcome: 'invalid', message: 'QR code token is invalid or has been tampered with' };
    }

    // 4. Check approval status
    if (registration.status !== 'approved') {
      await attendanceRepository.createLog({ registrationId: regId, eventId, scannedBy: adminId, ipAddress, status: 'invalid' });
      return {
        outcome: 'invalid',
        message: `Registration is ${registration.status} — only approved registrations can enter`,
      };
    }

    // 5. Check duplicate scan
    if (registration.attendanceStatus === 'attended') {
      await attendanceRepository.createLog({ registrationId: regId, eventId, scannedBy: adminId, ipAddress, status: 'duplicate' });
      return {
        outcome: 'duplicate',
        message: 'Already checked in',
        registration: buildRegistrationSummary(registration),
        event: buildEventSummary(registration.eventId as unknown as IEvent),
      };
    }

    // 6. Mark attendance
    const attendanceTime = new Date();
    await registrationRepository.updateById(regId, {
      attendanceStatus: 'attended',
      attendanceTime,
    });

    // 7. Write success log
    await attendanceRepository.createLog({ registrationId: regId, eventId, scannedBy: adminId, ipAddress, status: 'success' });

    return {
      outcome: 'success',
      message: 'Check-in successful',
      registration: {
        ...buildRegistrationSummary(registration),
        attendanceStatus: 'attended',
        attendanceTime,
      },
      event: buildEventSummary(registration.eventId as unknown as IEvent),
    };
  },

  async getAttendanceList(eventId: string) {
    return attendanceRepository.findByEvent(eventId);
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildRegistrationSummary(reg: IRegistration) {
  return {
    id: String(reg._id),
    registrationNumber: reg.registrationNumber,
    fullName: reg.fullName,
    nic: reg.nic,
    email: reg.email,
    organization: reg.organization,
    attendanceTime: reg.attendanceTime,
    attendanceStatus: reg.attendanceStatus,
  };
}

function buildEventSummary(event: IEvent | null | undefined) {
  if (!event || typeof event !== 'object' || !('name' in event)) return undefined;
  return {
    id: String(event._id),
    name: event.name,
    venue: event.venue,
    eventDate: event.eventDate,
  };
}
