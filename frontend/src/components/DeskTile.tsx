import React from 'react';
import { DeskStatusDto } from '../types';
import { displayStatus } from '../utils';

interface DeskTileProps {
  desk: DeskStatusDto;
  onClick: (desk: DeskStatusDto) => void;
}

const statusMeta: Record<string, { helper: string; icon: string }> = {
  Available: {
    helper: 'พร้อมใช้งาน',
    icon: '✓',
  },
  Booked: {
    helper: 'กำลังใช้งาน',
    icon: 'X',
  },
  Maintenance: {
    helper: 'ปิดใช้งาน',
    icon: '!',
  },
};

function formatTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const DeskTile: React.FC<DeskTileProps> = ({ desk, onClick }) => {
  const label = displayStatus(desk.status);
  const meta = statusMeta[desk.status] ?? {
    helper: label,
    icon: '?',
  };

  const statusClass = `desk-tile desk-tile--${desk.status.toLowerCase()}`;
  const timeRange =
    desk.status === 'Booked'
      ? [formatTime(desk.startTime), formatTime(desk.endTime)].filter(Boolean).join(' - ')
      : '';

  return (
    <button
      className={statusClass}
      onClick={() => onClick(desk)}
      title={`${desk.seatId} - ${label}${desk.bookedBy ? ` (${desk.bookedBy})` : ''}`}
      aria-label={`โต๊ะ ${desk.seatId} สถานะ ${label}`}
      type="button"
    >
      <span className="desk-tile__status-bar" aria-hidden="true" />

      <span className="desk-tile__status">{label}</span>

      <span className="desk-tile__icon-wrap">
        <span className="desk-tile__icon" aria-hidden="true">
          {meta.icon}
        </span>
      </span>

      <span className="desk-tile__seat">{desk.seatId}</span>
      <span className="desk-tile__helper">{meta.helper}</span>

      {desk.status === 'Booked' && (
        <span className="desk-tile__booking">
          <span className="desk-tile__user">{desk.bookedBy || 'มีผู้จอง'}</span>
          {timeRange && <span className="desk-tile__time">{timeRange}</span>}
        </span>
      )}
    </button>
  );
};

export default DeskTile;
