import React, { useEffect, useRef } from 'react';
import { DeskStatusDto } from '../types';
import { displayStatus, displayValue, displayZone } from '../utils';

interface DetailModalProps {
  desk: DeskStatusDto | null;
  onClose: () => void;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusHelper: Record<string, string> = {
  Available: 'โต๊ะนี้พร้อมใช้งาน',
  Booked: 'โต๊ะนี้มีผู้จองหรือกำลังใช้งาน',
  Maintenance: 'โต๊ะนี้อยู่ระหว่างซ่อมบำรุงหรือปิดใช้งาน',
};

const DetailModal: React.FC<DetailModalProps> = ({ desk, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!desk) return undefined;

    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [desk, onClose]);

  if (!desk) return null;

  const rows: [string, string][] = [
    ['โซน', displayZone(desk.zone)],
    ['สถานะ', displayStatus(desk.status)],
    ['ชื่อเครื่อง', displayValue(desk.computerName)],
    ['ผู้จอง', displayValue(desk.bookedBy)],
    ['แผนก', displayValue(desk.department)],
    ['เวลาเริ่ม', formatDateTime(desk.startTime)],
    ['เวลาสิ้นสุด', formatDateTime(desk.endTime)],
    ['วัตถุประสงค์', displayValue(desk.purpose)],
    ['หมายเหตุ', displayValue(desk.note)],
    ['อัปเดตล่าสุด', formatDateTime(desk.updatedAt)],
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="รายละเอียดโต๊ะ">
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className={`modal__hero modal__hero--${desk.status.toLowerCase()}`}>
          <div>
            <p className="modal__eyebrow">รายละเอียดโต๊ะ</p>
            <h2 className="modal__title">{desk.seatId}</h2>
            <p className="modal__subtitle">{statusHelper[desk.status] ?? displayStatus(desk.status)}</p>
          </div>

          <span className={`modal__badge modal__badge--${desk.status.toLowerCase()}`}>
            {displayStatus(desk.status)}
          </span>
        </div>

        <div className="modal__body">
          <dl className="modal__details">
            {rows.map(([label, val]) => (
              <React.Fragment key={label}>
                <dt className="modal__dt">{label}</dt>
                <dd className="modal__dd">{val}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>

        <div className="modal__footer">
          <span className="modal__readonly">ข้อมูลสำหรับอ่านเท่านั้น</span>
          <button ref={closeRef} className="modal__close-btn" onClick={onClose} type="button">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
