import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Registration } from '../models/Registration';
import { AttendanceLog } from '../models/AttendanceLog';
import { Event } from '../models/Event';
import { format } from 'date-fns';

export type ReportFormat = 'csv' | 'excel' | 'pdf';
export type ReportType = 'registrations' | 'attendance';

interface RegistrationRow {
  registrationNumber: string;
  fullName: string;
  nic: string;
  email: string;
  mobile: string;
  address: string;
  organization: string;
  designation: string;
  status: string;
  attendanceStatus: string;
  attendanceTime: string;
  submittedAt: string;
}

interface AttendanceRow {
  registrationNumber: string;
  fullName: string;
  email: string;
  nic: string;
  checkedInAt: string;
}

interface EventInfo {
  name: string;
  venue: string;
  eventDate: string;
  registrationFee: string;
}

// ── Event info fetcher ────────────────────────────────────────────────────────
const fetchEventInfo = async (eventId?: string): Promise<EventInfo | null> => {
  if (!eventId) return null;
  const ev = await Event.findById(eventId).lean();
  if (!ev) return null;
  return {
    name: ev.name,
    venue: ev.venue,
    eventDate: format(new Date(ev.eventDate), 'EEEE, MMMM d, yyyy · h:mm a'),
    registrationFee: ev.registrationFee === 0 ? 'Free' : `LKR ${ev.registrationFee.toLocaleString()}`,
  };
};

// ── Data fetchers ─────────────────────────────────────────────────────────────
const fetchRegistrations = async (eventId?: string, status?: string): Promise<RegistrationRow[]> => {
  const filter: Record<string, unknown> = {};
  if (eventId) filter.eventId = eventId;
  if (status && status !== 'all') filter.status = status;

  const docs = await Registration.find(filter).sort({ createdAt: -1 }).lean();

  return docs.map((r) => ({
    registrationNumber: r.registrationNumber ?? '',
    fullName: r.fullName,
    nic: r.nic,
    email: r.email,
    mobile: r.mobile,
    address: r.address,
    organization: r.organization ?? '',
    designation: r.designation ?? '',
    status: r.status,
    attendanceStatus: r.attendanceStatus,
    attendanceTime: r.attendanceTime ? format(new Date(r.attendanceTime), 'yyyy-MM-dd HH:mm') : '',
    submittedAt: format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm'),
  }));
};

const fetchAttendance = async (eventId?: string): Promise<AttendanceRow[]> => {
  const filter: Record<string, unknown> = { status: 'success' };
  if (eventId) filter.eventId = eventId;

  const docs = await AttendanceLog.find(filter)
    .sort({ scannedAt: -1 })
    .populate('registrationId', 'registrationNumber fullName email nic')
    .lean();

  return docs.map((log) => {
    const reg = log.registrationId as {
      registrationNumber?: string;
      fullName?: string;
      email?: string;
      nic?: string;
    } | null;
    return {
      registrationNumber: reg?.registrationNumber ?? '',
      fullName: reg?.fullName ?? '',
      email: reg?.email ?? '',
      nic: reg?.nic ?? '',
      checkedInAt: format(new Date(log.scannedAt), 'yyyy-MM-dd HH:mm'),
    };
  });
};

// ── CSV builder ───────────────────────────────────────────────────────────────
const toCSV = (title: string, headers: string[], rows: string[][], event: EventInfo | null): string => {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines: string[] = [];

  lines.push(escape(title));
  lines.push(escape(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`));
  if (event) {
    lines.push(escape(`Event: ${event.name}`));
    lines.push(escape(`Venue: ${event.venue}`));
    lines.push(escape(`Date: ${event.eventDate}`));
    lines.push(escape(`Fee: ${event.registrationFee}`));
  }
  lines.push('');
  lines.push(headers.map(escape).join(','));
  rows.forEach((r) => lines.push(r.map(escape).join(',')));
  return lines.join('\r\n');
};

// ── Excel builder ──────────────────────────────────────────────────────────────
const buildExcel = async (
  title: string,
  headers: string[],
  rows: string[][],
  event: EventInfo | null
): Promise<Buffer> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EventHub';
  const ws = wb.addWorksheet(title);

  const colCount = headers.length;

  // ── Event info block ──────────────────────────────────────────────────────
  const infoRows: [string, string][] = [
    ['Report', title],
    ['Generated', format(new Date(), 'yyyy-MM-dd HH:mm')],
  ];
  if (event) {
    infoRows.push(
      ['Event', event.name],
      ['Venue', event.venue],
      ['Date', event.eventDate],
      ['Fee', event.registrationFee],
    );
  }

  infoRows.forEach(([label, value]) => {
    const row = ws.addRow([label, value]);
    row.getCell(1).font = { bold: true, color: { argb: 'FF1E40AF' } };
    row.getCell(2).font = { color: { argb: 'FF0F172A' } };
    // Merge remaining cells for cleaner look
    if (colCount > 2) ws.mergeCells(row.number, 2, row.number, colCount);
  });

  // Blank separator row
  ws.addRow([]);

  // ── Header row ────────────────────────────────────────────────────────────
  const headerRowNum = ws.rowCount + 1;
  ws.addRow(headers);
  const headerRow = ws.getRow(headerRowNum);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  headerRow.alignment = { vertical: 'middle' };
  headerRow.height = 22;

  // Auto column widths
  headers.forEach((h, i) => {
    ws.getColumn(i + 1).width = Math.max(h.length + 4, 16);
  });

  // ── Data rows ─────────────────────────────────────────────────────────────
  rows.forEach((row, idx) => {
    const r = ws.addRow(row);
    if (idx % 2 === 0) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
};

// ── PDF builder ───────────────────────────────────────────────────────────────
const buildPDF = (
  title: string,
  headers: string[],
  rows: string[][],
  event: EventInfo | null
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Title ──────────────────────────────────────────────────────────────
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text(title, { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#64748b')
      .text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, { align: 'center' });
    doc.moveDown(0.4);

    // ── Event info box ─────────────────────────────────────────────────────
    if (event) {
      const boxX = 40;
      const boxW = doc.page.width - 80;
      const lineH = 16;
      const infoLines = [
        { label: 'Event', value: event.name },
        { label: 'Venue', value: event.venue },
        { label: 'Date', value: event.eventDate },
        { label: 'Fee', value: event.registrationFee },
      ];
      const boxH = infoLines.length * lineH + 16;
      const boxY = doc.y;

      // Box background
      doc.rect(boxX, boxY, boxW, boxH).fill('#eff6ff');
      // Box border
      doc.rect(boxX, boxY, boxW, boxH).stroke('#bfdbfe');
      // Left accent bar
      doc.rect(boxX, boxY, 4, boxH).fill('#1e40af');

      const labelX = boxX + 12;
      const valueX = boxX + 70;
      let lineY = boxY + 8;
      infoLines.forEach(({ label, value }) => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e40af')
          .text(label + ':', labelX, lineY, { width: 55, lineBreak: false });
        doc.font('Helvetica').fontSize(8).fillColor('#0f172a')
          .text(value, valueX, lineY, { width: boxW - valueX + boxX - 12, lineBreak: false });
        lineY += lineH;
      });

      doc.y = boxY + boxH + 10;
    }

    doc.moveDown(0.3);

    // ── Table ──────────────────────────────────────────────────────────────
    const colCount = headers.length;
    const pageWidth = doc.page.width - 80;
    const colW = Math.floor(pageWidth / colCount);
    const rowH = 18;
    let y = doc.y;

    const drawRow = (cells: string[], isHeader: boolean, shade: boolean) => {
      if (y + rowH > doc.page.height - 40) {
        doc.addPage();
        y = 40;
      }
      if (isHeader) {
        doc.rect(40, y, pageWidth, rowH).fill('#1e40af');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
      } else {
        if (shade) doc.rect(40, y, pageWidth, rowH).fill('#f8fafc');
        doc.fillColor('#0f172a').font('Helvetica').fontSize(7.5);
      }
      cells.forEach((cell, i) => {
        doc.text(cell.substring(0, 32), 44 + i * colW, y + 4, { width: colW - 4, ellipsis: true });
      });
      y += rowH;
    };

    drawRow(headers, true, false);
    rows.forEach((row, i) => drawRow(row, false, i % 2 === 0));

    doc.end();
  });
};

// ── Public API ─────────────────────────────────────────────────────────────────
export const reportService = {
  async generateRegistrationsReport(
    fmt: ReportFormat,
    eventId?: string,
    status?: string
  ): Promise<{ buffer: Buffer | string; contentType: string; filename: string }> {
    const [data, event] = await Promise.all([
      fetchRegistrations(eventId, status),
      fetchEventInfo(eventId),
    ]);

    const headers = [
      'Reg. Number', 'Full Name', 'NIC / Passport', 'Email', 'Mobile',
      'Address', 'Organization', 'Designation', 'Status',
      'Attendance', 'Attended At', 'Submitted At',
    ];
    const rows = data.map((r) => [
      r.registrationNumber, r.fullName, r.nic, r.email, r.mobile,
      r.address, r.organization, r.designation, r.status,
      r.attendanceStatus, r.attendanceTime, r.submittedAt,
    ]);
    const title = 'Registrations Report';
    const ts = format(new Date(), 'yyyyMMdd_HHmm');

    if (fmt === 'csv') {
      return { buffer: toCSV(title, headers, rows, event), contentType: 'text/csv', filename: `registrations_${ts}.csv` };
    }
    if (fmt === 'excel') {
      return { buffer: await buildExcel(title, headers, rows, event), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `registrations_${ts}.xlsx` };
    }
    return { buffer: await buildPDF(title, headers.slice(0, 8), rows.map((r) => r.slice(0, 8)), event), contentType: 'application/pdf', filename: `registrations_${ts}.pdf` };
  },

  async generateAttendanceReport(
    fmt: ReportFormat,
    eventId?: string
  ): Promise<{ buffer: Buffer | string; contentType: string; filename: string }> {
    const [data, event] = await Promise.all([
      fetchAttendance(eventId),
      fetchEventInfo(eventId),
    ]);

    const headers = ['Reg. Number', 'Full Name', 'NIC / Passport', 'Email', 'Checked In At'];
    const rows = data.map((r) => [r.registrationNumber, r.fullName, r.nic, r.email, r.checkedInAt]);
    const title = 'Attendance Report';
    const ts = format(new Date(), 'yyyyMMdd_HHmm');

    if (fmt === 'csv') {
      return { buffer: toCSV(title, headers, rows, event), contentType: 'text/csv', filename: `attendance_${ts}.csv` };
    }
    if (fmt === 'excel') {
      return { buffer: await buildExcel(title, headers, rows, event), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `attendance_${ts}.xlsx` };
    }
    return { buffer: await buildPDF(title, headers, rows, event), contentType: 'application/pdf', filename: `attendance_${ts}.pdf` };
  },
};
