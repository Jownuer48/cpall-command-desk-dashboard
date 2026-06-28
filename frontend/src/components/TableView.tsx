import React, { useMemo, useState } from 'react';
import { DeskStatusDto, DeskStatusValue } from '../types';
import { displayStatus, displayStatusFilter, displayZone } from '../utils';

interface TableViewProps {
  desks: DeskStatusDto[];
  onRowClick: (desk: DeskStatusDto) => void;
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

const statuses: Array<'All' | DeskStatusValue> = [
  'All',
  'Available',
  'Booked',
  'Maintenance',
];

const TableView: React.FC<TableViewProps> = ({ desks, onRowClick }) => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | DeskStatusValue>('All');

  const filtered = useMemo(() => {
    const search = filter.trim().toLowerCase();

    return desks.filter((desk) => {
      const matchText =
        search === '' ||
        desk.seatId.toLowerCase().includes(search) ||
        displayZone(desk.zone).toLowerCase().includes(search) ||
        (desk.bookedBy ?? '').toLowerCase().includes(search) ||
        (desk.department ?? '').toLowerCase().includes(search);

      const matchStatus = statusFilter === 'All' || desk.status === statusFilter;
      return matchText && matchStatus;
    });
  }, [desks, filter, statusFilter]);

  return (
    <div className="table-view">
      <div className="table-view__controls">
        <div className="table-view__search-wrap">
          <span className="table-view__search-icon" aria-hidden="true">⌕</span>
          <input
            className="table-view__search"
            type="search"
            placeholder="ค้นหาโต๊ะ, โซน, ผู้จอง, แผนก..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="ค้นหาโต๊ะ"
          />
        </div>

        <select
          className="table-view__filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'All' | DeskStatusValue)}
          aria-label="กรองตามสถานะ"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {displayStatusFilter(status)}
            </option>
          ))}
        </select>

        <span className="table-view__count">
          แสดง <strong>{filtered.length}</strong> / {desks.length} โต๊ะ
        </span>
      </div>

      <div className="table-view__scroll">
        <table className="desk-table">
          <thead>
            <tr>
              <th>โต๊ะ</th>
              <th>โซน</th>
              <th>สถานะ</th>
              <th>ผู้จอง</th>
              <th>แผนก</th>
              <th>เวลาเริ่ม</th>
              <th>เวลาสิ้นสุด</th>
              <th>อัปเดตล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="desk-table__empty">
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              filtered.map((desk) => (
                <tr
                  key={desk.seatId}
                  className={`desk-table__row desk-table__row--${desk.status.toLowerCase()}`}
                  onClick={() => onRowClick(desk)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onRowClick(desk);
                  }}
                  role="button"
                  aria-label={`ดูรายละเอียดโต๊ะ ${desk.seatId}`}
                >
                  <td className="desk-table__seat">{desk.seatId}</td>
                  <td>{displayZone(desk.zone)}</td>
                  <td>
                    <span className={`status-pill status-pill--${desk.status.toLowerCase()}`}>
                      {displayStatus(desk.status)}
                    </span>
                  </td>
                  <td>{desk.bookedBy ?? '—'}</td>
                  <td>{desk.department ?? '—'}</td>
                  <td>{formatDateTime(desk.startTime)}</td>
                  <td>{formatDateTime(desk.endTime)}</td>
                  <td>{formatDateTime(desk.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
