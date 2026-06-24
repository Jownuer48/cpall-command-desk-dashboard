import type { DeskStatus } from '../types';
import { displayValue, formatDateTime, formatWindow } from '../utils';
import { StatusPill } from './StatusPill';

type StatusTableProps = {
  desks: DeskStatus[];
  onSelectDesk: (desk: DeskStatus) => void;
};

export function StatusTable({ desks, onSelectDesk }: StatusTableProps) {
  return (
    <section className="table-section" aria-label="Desk status table">
      <div className="section-heading">
        <h2>Table View</h2>
        <span>{desks.length} matching computers</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Seat</th>
              <th>Zone</th>
              <th>Computer</th>
              <th>Status</th>
              <th>Booked by</th>
              <th>Department</th>
              <th>Window</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {desks.map((desk) => (
              <tr key={desk.seatId} onClick={() => onSelectDesk(desk)}>
                <td>{desk.seatId}</td>
                <td>{desk.zone}</td>
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
