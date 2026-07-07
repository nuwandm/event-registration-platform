import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Registration } from '../models/Registration';
import { AttendanceLog } from '../models/AttendanceLog';
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
const toCSV = (headers: string[], rows: string[][]): string => {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  rows.forEach((r) => lines.push(r.map(escape).join(',')));
  return lines.join('\r\n');
};

// ── Excel builder ──────────────────────────────────────────────────────────────
const buildExcel = async (title: string, headers: string[], rows: string[][]): Promise<Buffer> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EventHub';
  const ws = wb.addWorksheet(title);

  // Style header row
  ws.addRow(headers);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  headerRow.alignment = { vertical: 'middle' };
  headerRow.height = 20;

  // Auto column widths
  headers.forEach((h, i) => {
    ws.getColumn(i + 1).width = Math.max(h.length + 4, 14);
  });

  // Data rows
  rows.forEach((row, idx) => {
    const r = ws.addRow(row);
    if (idx % 2 === 0) {
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
};

// ── PDF builder ───────────────────────────────────────────────────────────────
const buildPDF = (title: string, headers: string[], rows: string[][]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#64748b')
      .text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, { align: 'center' });
    doc.moveDown(0.5);

    // Table
    const colCount = headers.length;
    const pageWidth = doc.page.width - 80;
    const colW = Math.floor(pageWidth / colCount);
    const rowH = 18;
    let y = doc.y;

    const drawRow = (cells: string[], isHeader: boolean) => {
      if (y + rowH > doc.page.height - 40) {
        doc.addPage();
        y = 40;
      }
      if (isHeader) {
        doc.rect(40, y, pageWidth, rowH).fill('#1e40af');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
      } else {
        doc.fillColor('#0f172a').font('Helvetica').fontSize(7.5);
      }
      cells.forEach((cell, i) => {
        doc.text(cell.substring(0, 30), 44 + i * colW, y + 4, { width: colW - 4, ellipsis: true });
      });
      y += rowH;
    };

    drawRow(headers, true);
    rows.forEach((row, i) => {
      if (i % 2 === 0) {
        doc.rect(40, y, pageWidth, rowH).fill('#f8fafc');
      }
      drawRow(row, false);
    });

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
    const data = await fetchRegistrations(eventId, status);
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
      return { buffer: toCSV(headers, rows), contentType: 'text/csv', filename: `registrations_${ts}.csv` };
    }
    if (fmt === 'excel') {
      return { buffer: await buildExcel(title, headers, rows), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `registrations_${ts}.xlsx` };
    }
    return { buffer: await buildPDF(title, headers.slice(0, 8), rows.map((r) => r.slice(0, 8))), contentType: 'application/pdf', filename: `registrations_${ts}.pdf` };
  },

  async generateAttendanceReport(
    fmt: ReportFormat,
    eventId?: string
  ): Promise<{ buffer: Buffer | string; contentType: string; filename: string }> {
    const data = await fetchAttendance(eventId);
    const headers = ['Reg. Number', 'Full Name', 'NIC / Passport', 'Email', 'Checked In At'];
    const rows = data.map((r) => [r.registrationNumber, r.fullName, r.nic, r.email, r.checkedInAt]);
    const title = 'Attendance Report';
    const ts = format(new Date(), 'yyyyMMdd_HHmm');

    if (fmt === 'csv') {
      return { buffer: toCSV(headers, rows), contentType: 'text/csv', filename: `attendance_${ts}.csv` };
    }
    if (fmt === 'excel') {
      return { buffer: await buildExcel(title, headers, rows), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `attendance_${ts}.xlsx` };
    }
    return { buffer: await buildPDF(title, headers, rows), contentType: 'application/pdf', filename: `attendance_${ts}.pdf` };
  },
};
