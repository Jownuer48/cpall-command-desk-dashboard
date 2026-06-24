import { useEffect } from 'react';
import type { DeskStatus } from '../types';
import {
  displayValue,
  formatDateTime,
  formatTime,
  getStatusClass
} from '../utils';
import { StatusPill } from './StatusPill';

type DetailModalProps = {
  desk: DeskStatus | null;
  onClose: () => void;
};

export function DetailModal({ desk, onClose }: DetailModalProps) {
  useEffect(() => {
    if (!desk) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [desk, onClose]);

  if (!desk) {
    return null;
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        className="detail-modal"
        aria-modal="true"
        role="dialog"
        aria-labelledby="detail-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="modal-kicker">Desk detail</span>
            <h2 id="detail-modal-title">{desk.seatId}</h2>
          </div>
          <button
            className="modal-close"
            type="button"
            aria-label="Close desk detail"
            onClick={onClose}
          >
            X
          </button>
        </div>

        <div className={`modal-status-card ${getStatusClass(desk.status)}`}>
          <div>
            <span>Status</span>
            <StatusPill status={desk.status} />
          </div>
          <strong>{desk.computerName}</strong>
        </div>

        <dl className="detail-grid">
          <DetailItem label="Computer/Desk ID" value={desk.seatId} />
          <DetailItem label="Zone" value={desk.zone} />
          <DetailItem label="Booked by" value={displayValue(desk.bookedBy)} />
          <DetailItem label="Department" value={displayValue(desk.department)} />
          <DetailItem label="Start time" value={formatTime(desk.startTime)} />
          <DetailItem label="End time" value={formatTime(desk.endTime)} />
          <DetailItem label="Note" value={displayValue(desk.note ?? desk.purpose)} wide />
          <DetailItem label="Updated at" value={formatDateTime(desk.updatedAt)} wide />
        </dl>
      </section>
    </div>
  );
}

function DetailItem({
  label,
  value,
  wide = false
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'detail-item wide' : 'detail-item'}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
