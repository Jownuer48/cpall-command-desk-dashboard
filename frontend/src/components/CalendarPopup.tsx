import React, { useMemo, useState } from 'react';
import { DeskStatusDto } from '../types';

interface CalendarPopupProps {
  desks: DeskStatusDto[];
  onClose: () => void;
}

const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());
  const today = new Date();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      key: dateKey(date),
      inMonth: date.getMonth() === month,
      isToday: dateKey(date) === dateKey(today),
    };
  });
}

function formatMonth(date: Date) {
  return date.toLocaleDateString('th-TH', {
    month: 'long',
    year: 'numeric',
  });
}

function formatSelectedDate(date: Date) {
  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const CalendarPopup: React.FC<CalendarPopupProps> = ({ desks, onClose }) => {
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const total = desks.length;
  const booked = desks.filter((desk) => desk.status === 'Booked').length;
  const occupancyPct = total > 0 ? Math.round((booked / total) * 100) : 0;
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const selectedKey = dateKey(selectedDate);

  const changeMonth = (offset: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  return (
    <div className="calendar-overlay" role="dialog" aria-modal="true" aria-label="ปฏิทินอัตราใช้งาน" onClick={onClose}>
      <div className="calendar-popup" onClick={(event) => event.stopPropagation()}>
        <div className="calendar-popup__header">
          <div>
            <p className="calendar-popup__eyebrow">ปฏิทิน</p>
            <h2 className="calendar-popup__title">อัตราใช้งาน</h2>
          </div>
          <button className="calendar-popup__close" type="button" onClick={onClose} aria-label="ปิดปฏิทิน">
            ×
          </button>
        </div>

        <div className="calendar-popup__toolbar">
          <button type="button" className="calendar-popup__nav" onClick={() => changeMonth(-1)} aria-label="เดือนก่อนหน้า">
            ‹
          </button>
          <strong>{formatMonth(calendarMonth)}</strong>
          <button type="button" className="calendar-popup__nav" onClick={() => changeMonth(1)} aria-label="เดือนถัดไป">
            ›
          </button>
        </div>

        <div className="calendar-grid" aria-label="ปฏิทินรายเดือน">
          {weekDays.map((day) => (
            <span key={day} className="calendar-grid__weekday">
              {day}
            </span>
          ))}

          {calendarDays.map(({ date, key, inMonth, isToday }) => (
            <button
              key={key}
              type="button"
              className={[
                'calendar-grid__day',
                inMonth ? '' : 'calendar-grid__day--outside',
                isToday ? 'calendar-grid__day--today' : '',
                key === selectedKey ? 'calendar-grid__day--selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => selectDate(date)}
            >
              {date.getDate()}
            </button>
          ))}
        </div>

        <div className="calendar-popup__summary">
          <span>{formatSelectedDate(selectedDate)}</span>
          <strong>{occupancyPct}%</strong>
          <span>{booked} / {total} โต๊ะกำลังใช้งาน</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarPopup;
