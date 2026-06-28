import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import './dashboard.css';
import type { DepartmentUsageDto, DeskStatusDto, DeskStatusValue } from './types';
import { displayZone } from './utils';
import SummaryCards from './components/SummaryCards';
import ZoneGroup from './components/ZoneGroup';
import TableView from './components/TableView';
import DetailModal from './components/DetailModal';
import CalendarPopup from './components/CalendarPopup';
import DepartmentRanking from './components/DepartmentRanking';

type ViewMode = 'map' | 'table';
type ThemeMode = 'light' | 'dark';

type SeatDefinition = {
  seatId: string;
  zone: string;
  computerName: string;
  isActive: boolean;
};

type ImportedBooking = {
  seatId: string;
  bookingDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  fullName: string;
  department: string;
  objective: string;
  note: string;
  phone: string;
  status: string;
  bookingId: string;
  period: string;
  createdAt: Date | null;
};

const THEME_STORAGE_KEY = 'cpall-command-dashboard-theme';

const DEFAULT_SEATS: SeatDefinition[] = Array.from({ length: 12 }, (_, index) => {
  const seatNumber = String(index + 1).padStart(2, '0');

  return {
    seatId: `S${seatNumber}`,
    zone: 'Command Center',
    computerName: `โต๊ะบัญชาการ S${seatNumber}`,
    isActive: seatNumber !== '06' && seatNumber !== '12',
  };
});

const legendItems = [
  { key: 'available', label: 'ว่าง', description: 'พร้อมใช้งาน' },
  { key: 'booked', label: 'กำลังใช้งาน', description: 'มีผู้จองหรือกำลังใช้งาน' },
  { key: 'maintenance', label: 'ซ่อมบำรุง', description: 'ปิดปรับปรุงหรือซ่อมบำรุง' },
] as const;

function formatTime(value: Date | null): string {
  if (!value) return 'ยังไม่ได้ซิงก์';

  return value.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

function isSameDate(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function formatViewDate(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

function normalizeText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (value instanceof Date && isValidDate(value)) return value.toISOString();
  return '';
}

function normalizeSeatId(value: string): string {
  const text = value.trim().toUpperCase();
  const match = text.match(/^([A-Z]+)\s*0*([0-9]+)(.*)$/u);

  if (!match) {
    return text;
  }

  const [, prefix, digits, suffix] = match;
  return `${prefix}${digits.padStart(2, '0')}${suffix}`;
}

function excelSerialToDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

function parseFlexibleDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isValidDate(value) ? new Date(value) : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = excelSerialToDate(value);
    return isValidDate(date) ? date : null;
  }

  const text = normalizeText(value);
  if (!text) return null;

  const direct = new Date(text);
  if (isValidDate(direct)) return direct;

  const match = text.match(/(?<day>\d{1,2})[\/-](?<month>\d{1,2})[\/-](?<year>\d{2,4})(?:\s+(?<time>\d{1,2}:\d{2}(?::\d{2})?))?/u);
  if (!match?.groups) return null;

  const day = Number.parseInt(match.groups.day, 10);
  const month = Number.parseInt(match.groups.month, 10) - 1;
  let year = Number.parseInt(match.groups.year, 10);
  if (year > 2400) year -= 543;
  if (year < 100) year += 2000;

  const [hours = 0, minutes = 0, seconds = 0] = match.groups.time
    ? match.groups.time.split(':').map((part) => Number.parseInt(part, 10))
    : [0, 0, 0];

  const parsed = new Date(year, month, day, hours, minutes, seconds);
  return isValidDate(parsed) ? parsed : null;
}

function parseTimeOfDay(value: unknown): { hours: number; minutes: number } | null {
  if (value instanceof Date && isValidDate(value)) {
    return { hours: value.getHours(), minutes: value.getMinutes() };
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const totalMinutes = Math.round(value * 24 * 60);
    return { hours: Math.floor(totalMinutes / 60) % 24, minutes: totalMinutes % 60 };
  }

  const text = normalizeText(value);
  if (!text) return null;

  const match = text.match(/(?<hours>\d{1,2})[:.](?<minutes>\d{2})(?::(?<seconds>\d{2}))?/u);
  if (!match?.groups) return null;

  return {
    hours: Number.parseInt(match.groups.hours, 10),
    minutes: Number.parseInt(match.groups.minutes, 10),
  };
}

function combineDateAndTime(date: Date | null, time: { hours: number; minutes: number } | null): Date | null {
  if (!date || !time) return null;

  const combined = new Date(date);
  combined.setHours(time.hours, time.minutes, 0, 0);
  return combined;
}

function getValue(row: Record<string, unknown>, ...aliases: string[]): unknown {
  const keys = Object.keys(row);

  for (const alias of aliases) {
    const normalizedAlias = alias.replace(/\s+/g, '').toLowerCase();
    const matchKey = keys.find((key) => key.replace(/\s+/g, '').toLowerCase() === normalizedAlias);

    if (matchKey) {
      return row[matchKey];
    }
  }

  return undefined;
}

function parseImportedBooking(row: Record<string, unknown>): ImportedBooking | null {
  const seatIdValue = normalizeText(getValue(row, 'SeatID', 'SeatId', 'Seat', 'โต๊ะ', 'เลขโต๊ะ'));
  if (!seatIdValue) {
    return null;
  }

  const bookingDate = parseFlexibleDate(getValue(row, 'BookingDate', 'Booking Date', 'Date', 'วันที่', 'วันจอง'));
  const timeBeginValue = getValue(row, 'TimeBegin', 'StartTime', 'Begin', 'เวลาเริ่ม', 'เริ่ม');
  const timeEndValue = getValue(row, 'TimeEnd', 'EndTime', 'Finish', 'เวลาสิ้นสุด', 'สิ้นสุด');
  const periodText = normalizeText(getValue(row, 'Period', 'ช่วงเวลา'));

  const periodMatch = periodText.match(/(?<start>\d{1,2}[:.]\d{2})\s*[-–]\s*(?<end>\d{1,2}[:.]\d{2})/u);

  const parsedStart = parseFlexibleDate(timeBeginValue)
    ?? combineDateAndTime(bookingDate, parseTimeOfDay(timeBeginValue))
    ?? (periodMatch?.groups ? combineDateAndTime(bookingDate, parseTimeOfDay(periodMatch.groups.start)) : null);

  const parsedEnd = parseFlexibleDate(timeEndValue)
    ?? combineDateAndTime(bookingDate, parseTimeOfDay(timeEndValue))
    ?? (periodMatch?.groups ? combineDateAndTime(bookingDate, parseTimeOfDay(periodMatch.groups.end)) : null);

  const status = normalizeText(getValue(row, 'Status', 'สถานะ'));
  const statusLower = status.toLowerCase();
  if (statusLower.includes('cancel') || statusLower.includes('reject') || statusLower.includes('deny') || statusLower.includes('void')) {
    return null;
  }

  const createdAt = parseFlexibleDate(getValue(row, 'CreatedAt', 'Created At', 'Modified', 'UpdatedAt', 'อัปเดตล่าสุด'));

  return {
    seatId: normalizeSeatId(seatIdValue),
    bookingDate,
    startTime: parsedStart,
    endTime: parsedEnd,
    fullName: normalizeText(getValue(row, 'FullName', 'Name', 'ผู้จอง', 'ชื่อผู้จอง')) || 'ไม่ระบุผู้จอง',
    department: normalizeText(getValue(row, 'Department', 'Dept', 'แผนก', 'หน่วยงาน')) || 'ไม่ระบุหน่วยงาน',
    objective: normalizeText(getValue(row, 'Objective', 'Purpose', 'Subject', 'วัตถุประสงค์')) || 'ใช้งานศูนย์บัญชาการ',
    note: normalizeText(getValue(row, 'Note', 'Remark', 'Remarks', 'Description', 'หมายเหตุ')),
    phone: normalizeText(getValue(row, 'Phone', 'Tel', 'Mobile', 'เบอร์โทร')),
    status,
    bookingId: normalizeText(getValue(row, 'BookingID', 'Booking Id', 'ID')),
    period: periodText,
    createdAt,
  };
}

function mergeSeats(bookings: ImportedBooking[]): SeatDefinition[] {
  const seatMap = new Map(DEFAULT_SEATS.map((seat) => [seat.seatId, seat]));

  for (const booking of bookings) {
    if (seatMap.has(booking.seatId)) continue;

    seatMap.set(booking.seatId, {
      seatId: booking.seatId,
      zone: 'นำเข้า',
      computerName: `โต๊ะ ${booking.seatId}`,
      isActive: true,
    });
  }

  return [...seatMap.values()].sort((left, right) => left.seatId.localeCompare(right.seatId, 'en', { numeric: true }));
}

function selectBookingForSeat(
  bookings: ImportedBooking[],
  seatId: string,
  selectedDate: Date,
  now: Date,
): ImportedBooking | null {
  const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);

  const seatBookings = bookings.filter((booking) => booking.seatId === seatId);
  const matching = seatBookings.filter((booking) => {
    if (booking.startTime && booking.endTime) {
      return booking.startTime <= dayEnd && booking.endTime >= dayStart;
    }

    return booking.bookingDate ? isSameDate(booking.bookingDate, selectedDate) : false;
  });

  if (matching.length === 0) {
    return null;
  }

  if (isSameDate(selectedDate, now)) {
    const active = matching.find((booking) => booking.startTime && booking.endTime && now >= booking.startTime && now <= booking.endTime);
    if (active) {
      return active;
    }
  }

  return [...matching].sort((left, right) => {
    const leftTime = left.startTime?.getTime() ?? left.bookingDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightTime = right.startTime?.getTime() ?? right.bookingDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  })[0] ?? null;
}

function mapBookingToDeskStatus(seat: SeatDefinition, booking: ImportedBooking | null, now: Date): DeskStatusDto {
  if (!seat.isActive) {
    return {
      seatId: seat.seatId,
      zone: seat.zone,
      computerName: seat.computerName,
      status: 'Maintenance',
      isActive: false,
      startTime: null,
      endTime: null,
      bookedBy: null,
      department: null,
      purpose: null,
      note: 'เครื่องอยู่ระหว่างซ่อมบำรุงตามรอบ',
      updatedAt: now.toISOString(),
    };
  }

  if (!booking) {
    return {
      seatId: seat.seatId,
      zone: seat.zone,
      computerName: seat.computerName,
      status: 'Available',
      isActive: true,
      startTime: null,
      endTime: null,
      bookedBy: null,
      department: null,
      purpose: null,
      note: 'พร้อมใช้งานสำหรับงานศูนย์บัญชาการ',
      updatedAt: now.toISOString(),
    };
  }

  const status: DeskStatusValue = booking.status.toLowerCase().includes('maintenance') ? 'Maintenance' : 'Booked';

  return {
    seatId: seat.seatId,
    zone: seat.zone,
    computerName: seat.computerName,
    status,
    isActive: true,
    startTime: booking.startTime?.toISOString() ?? null,
    endTime: booking.endTime?.toISOString() ?? null,
    bookedBy: booking.fullName,
    department: booking.department,
    purpose: booking.objective,
    note: [booking.note, booking.phone ? `โทร ${booking.phone}` : ''].filter(Boolean).join(' · ') || null,
    updatedAt: (booking.createdAt ?? booking.endTime ?? booking.startTime ?? now).toISOString(),
  };
}

function groupByZone(desks: DeskStatusDto[]): Map<string, DeskStatusDto[]> {
  const map = new Map<string, DeskStatusDto[]>();

  for (const desk of desks) {
    const list = map.get(desk.zone) ?? [];
    list.push(desk);
    map.set(desk.zone, list);
  }

  return map;
}

function buildDepartmentRanking(bookings: ImportedBooking[], anchorDate: Date): DepartmentUsageDto[] {
  const windowStart = new Date(anchorDate);
  windowStart.setDate(windowStart.getDate() - 30);

  const rankingMap = new Map<string, { count: number; lastUsedAt: Date | null }>();

  for (const booking of bookings) {
    const bookingMoment = booking.startTime ?? booking.bookingDate ?? booking.createdAt;
    if (!bookingMoment || bookingMoment < windowStart || bookingMoment > anchorDate) {
      continue;
    }

    const current = rankingMap.get(booking.department) ?? { count: 0, lastUsedAt: null };
    current.count += 1;
    if (!current.lastUsedAt || bookingMoment > current.lastUsedAt) {
      current.lastUsedAt = bookingMoment;
    }
    rankingMap.set(booking.department, current);
  }

  return [...rankingMap.entries()]
    .map(([department, value]) => ({
      department,
      count: value.count,
      lastUsedAt: value.lastUsedAt?.toISOString() ?? null,
    }))
    .sort((left, right) => right.count - left.count || left.department.localeCompare(right.department, 'th'))
    .slice(0, 10);
}

const DashboardApp: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [view, setView] = useState<ViewMode>('map');
  const [selected, setSelected] = useState<DeskStatusDto | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [bookings, setBookings] = useState<ImportedBooking[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const now = new Date();
  const seats = useMemo(() => mergeSeats(bookings), [bookings]);
  const desks = useMemo(
    () => seats.map((seat) => mapBookingToDeskStatus(seat, selectBookingForSeat(bookings, seat.seatId, selectedDate, now), now)),
    [bookings, seats, selectedDate, now],
  );
  const zoneMap = useMemo(() => groupByZone(desks), [desks]);
  const departmentRanking = useMemo(() => buildDepartmentRanking(bookings, selectedDate), [bookings, selectedDate]);
  const today = new Date();
  const isViewingToday = isSameDate(selectedDate, today);

  const handleDateSelect = (date: Date) => {
    setSelected(null);
    setSelectedDate(date);
  };

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearImport = () => {
    setBookings([]);
    setSelected(null);
    setIsCalendarOpen(false);
    setIsRankingOpen(false);
    setImportFileName(null);
    setImportError(null);
    setLastUpdated(null);
    setView('map');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error('ไม่พบ worksheet ในไฟล์ Excel');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
      const imported = rows.map(parseImportedBooking).filter((booking): booking is ImportedBooking => booking !== null);

      setBookings(imported);
      setImportFileName(file.name);
      setLastUpdated(new Date());
      setSelected(null);
      setIsCalendarOpen(false);
      setIsRankingOpen(false);
      setView('map');
    } catch (error) {
      console.error('[CPALL Dashboard] Excel import error:', error);
      setImportError('นำเข้าไฟล์ Excel ไม่สำเร็จ');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="brand-block">
          <div className="brand-block__logo-card">
            <img src="/cpalllogo.png" alt="CPALL" className="brand-block__logo" />
          </div>

          <div className="brand-block__text">
            <p className="brand-block__eyebrow">ศูนย์บัญชาการ CPALL</p>
            <h1 className="brand-block__title">สถานะการใช้งานคอมพิวเตอร์</h1>
            <p className="brand-block__subtitle">
              หน้าจอแสดงสถานะโต๊ะคอมพิวเตอร์จากไฟล์ Excel ที่ผู้ใช้ import เข้ามา
            </p>
          </div>
        </div>

        <div className="dashboard__status-panel" aria-label="สถานะระบบ">
          <div className="import-badge-group" aria-label="นำเข้าข้อมูล Excel">
            <button className="import-button" type="button" onClick={handleImportClick} disabled={isImporting}>
              <span className="import-button__icon" aria-hidden="true">⤴</span>
              {isImporting ? 'กำลังนำเข้า...' : 'นำเข้า Excel'}
            </button>
            <button className="import-button import-button--ghost" type="button" onClick={handleClearImport} disabled={bookings.length === 0}>
              ล้างข้อมูล
            </button>
            <input ref={fileInputRef} className="dashboard__file-input" type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
          </div>

          <button
            id="themeToggle"
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'เปลี่ยนเป็นโหมดกลางวัน' : 'เปลี่ยนเป็นโหมดกลางคืน'}
            aria-pressed={theme === 'dark'}
            title="สลับโหมดกลางวัน/กลางคืน"
          >
            <span className="toggle-rail" aria-hidden="true">
              <span className="rail-icon sun" />
              <span className="rail-icon moon" />
              <span className="toggle-thumb">
                <span className="thumb-icon" />
              </span>
            </span>
          </button>

          <div className="live-badge">
            <span className="live-badge__dot" />
            ใช้ข้อมูลจากไฟล์
          </div>
          <div className="sync-card">
            <span className="sync-card__label">อัปเดตล่าสุด</span>
            <strong className="sync-card__time">{formatTime(lastUpdated)}</strong>
          </div>
          <div className="sync-card sync-card--source">
            <span className="sync-card__label">แหล่งข้อมูล</span>
            <strong className="sync-card__time">{importFileName ?? 'รอไฟล์ Excel'}</strong>
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="hero-panel" aria-label="ภาพรวมแดชบอร์ด">
          <div className="hero-panel__copy">
            <p className="hero-panel__eyebrow">ภาพรวมจากไฟล์นำเข้า</p>
            <h2 className="hero-panel__title">นำเข้า Excel แล้วแสดงโต๊ะและ Ranking จากข้อมูลในไฟล์</h2>
            <p className="hero-panel__desc">
              รองรับคอลัมน์ SeatID, BookingDate, TimeBegin, TimeEnd, FullName, Department, Objective, Status และ Note จากนั้นระบบจะคำนวณสถานะโต๊ะให้โดยอัตโนมัติ
            </p>
          </div>
        </section>

        <section className="workspace-panel">
          <div className="workspace-panel__header">
            <div>
              <p className="workspace-panel__eyebrow">แผนผังโต๊ะ</p>
              <p className="workspace-panel__hint">
                {view === 'map'
                  ? 'คลิกการ์ดโต๊ะเพื่อดูรายละเอียดจากข้อมูลในไฟล์ Excel'
                  : 'ค้นหาและกรองข้อมูลเพื่อดูรายละเอียดของแต่ละโต๊ะ'}
              </p>
              <p className="workspace-panel__date">
                <span>กำลังดูข้อมูลวันที่</span>
                <strong>{formatViewDate(selectedDate)}</strong>
                <span>{isViewingToday ? 'สดตามเวลาปัจจุบัน' : 'มุมมองทั้งวัน'}</span>
              </p>
              {importError && <p className="workspace-panel__error">{importError}</p>}
              {bookings.length === 0 && !importError && (
                <p className="workspace-panel__hint workspace-panel__hint--empty">ยังไม่ได้เลือกไฟล์ Excel กดปุ่มนำเข้าเพื่อเริ่มแสดงข้อมูล</p>
              )}
            </div>

            <div className="workspace-panel__actions">
              <SummaryCards desks={desks} />

              <div className="view-toggle" role="group" aria-label="โหมดการแสดงผล">
                <button
                  className={`view-toggle__btn${view === 'map' ? ' view-toggle__btn--active' : ''}`}
                  onClick={() => setView('map')}
                  aria-pressed={view === 'map'}
                  type="button"
                >
                  <span>▦</span>
                  แผนผัง
                </button>
                <button
                  className={`view-toggle__btn${view === 'table' ? ' view-toggle__btn--active' : ''}`}
                  onClick={() => setView('table')}
                  aria-pressed={view === 'table'}
                  type="button"
                >
                  <span>☰</span>
                  ตาราง
                </button>
                <button
                  className="view-toggle__btn view-toggle__btn--calendar"
                  onClick={() => setIsCalendarOpen(true)}
                  aria-label="เปิดปฏิทิน"
                  title="เปิดปฏิทิน"
                  type="button"
                >
                  <span className="calendar-icon" aria-hidden="true">
                    <span className="calendar-icon__rings" />
                    <span className="calendar-icon__body" />
                  </span>
                  <span>ปฏิทิน</span>
                </button>
                <button
                  className="view-toggle__btn view-toggle__btn--ranking"
                  onClick={() => setIsRankingOpen(true)}
                  aria-label="เปิด Ranking หน่วยงาน"
                  title="เปิด Ranking หน่วยงาน"
                  type="button"
                >
                  <span className="ranking-icon" aria-hidden="true">🏆</span>
                  <span>Ranking</span>
                </button>
              </div>

              <div className="dashboard__legend" aria-label="คำอธิบายสถานะ">
                {legendItems.map(({ key, label, description }) => (
                  <span key={key} className={`legend-item legend-item--${key}`} title={description}>
                    <span className="legend-item__dot" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="dashboard__state dashboard__state--empty">
              <span className="dashboard__state-icon">↑</span>
              <div>
                <strong>ยังไม่มีไฟล์ Excel</strong>
                <p>นำเข้าไฟล์ .xlsx หรือ .xls เพื่อเริ่มแสดงสถานะโต๊ะและ Ranking จากข้อมูลจริง</p>
              </div>
              <button className="retry-btn" onClick={handleImportClick} type="button">
                เลือกไฟล์
              </button>
            </div>
          ) : (
            <div className="workspace-panel__body">
              {view === 'map' ? (
                <div className="zone-list">
                  {[...zoneMap.entries()].map(([zone, zoneDesks]) => (
                    <ZoneGroup
                      key={zone}
                      zone={displayZone(zone)}
                      desks={zoneDesks}
                      onTileClick={setSelected}
                    />
                  ))}
                </div>
              ) : (
                <TableView desks={desks} onRowClick={setSelected} />
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="dashboard__footer">
        <span>© {new Date().getFullYear()} บริษัท ซีพี ออลล์ จำกัด (มหาชน)</span>
        <span className="dashboard__footer-sep">·</span>
        <span>แสดงผลจากไฟล์ Excel ที่นำเข้า · สามารถเลือกไฟล์ใหม่เพื่ออัปเดตข้อมูลได้ทันที</span>
      </footer>

      <DetailModal desk={selected} onClose={() => setSelected(null)} />
      {isCalendarOpen && (
        <CalendarPopup
          desks={desks}
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}
      {isRankingOpen && (
        <DepartmentRanking items={departmentRanking} onClose={() => setIsRankingOpen(false)} />
      )}
    </div>
  );
};

export default DashboardApp;
