import type { DeskStatus } from '../types';
import { displayValue, displayZone, formatDateTime, formatWindow } from '../utils';
import { StatusPill } from './StatusPill';

type StatusTableProps = {
  desks: DeskStatus[];
  onSelectDesk: (desk: DeskStatus) => void;
};

export function StatusTable({ desks, onSelectDesk }: StatusTableProps) {
  return (
    <section className="table-section" aria-label="ตารางสถานะโต๊ะ">
      <div className="section-heading">
        <h2>มุมมองตาราง</h2>
        <span>พบ {desks.length} เครื่อง</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>โต๊ะ</th>
              <th>โซน</th>
              <th>เครื่อง</th>
              <th>สถานะ</th>
              <th>ผู้จอง</th>
              <th>แผนก</th>
              <th>ช่วงเวลา</th>
              <th>อัปเดตล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {desks.map((desk) => (
              <tr key={desk.seatId} onClick={() => onSelectDesk(desk)}>
                <td>{desk.seatId}</td>
                <td>{displayZone(desk.zone)}</td>
                <td>{desk.computerName}</td>
                <td>
                  <StatusPill status={desk.status} />
                </td>
                <td>{displayValue(desk.bookedBy)}</td>
                <td>{displayValue(desk.department)}</td>
                <td>{formatWindow(desk)}</td>
                <td>{formatDateTime(desk.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
