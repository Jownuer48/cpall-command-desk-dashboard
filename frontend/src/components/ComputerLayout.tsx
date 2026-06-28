import type { DeskGroup, DeskStatus } from '../types';
import { displayStatus, displayZone } from '../utils';
import { ComputerTile } from './ComputerTile';

type ComputerLayoutProps = {
  groups: DeskGroup[];
  onSelectDesk: (desk: DeskStatus) => void;
};

export function ComputerLayout({ groups, onSelectDesk }: ComputerLayoutProps) {
  return (
    <section className="layout-board" aria-label="แผนผังโต๊ะคอมพิวเตอร์">
      {groups.map((group) => (
        <section className="zone-panel" key={group.zone}>
          <div className="zone-heading">
            <div>
              <h2>แผนผังโต๊ะ</h2>
              <span>ภาพรวม A01-A12 | แสดง {group.desks.length} เครื่อง</span>
            </div>
            <div className="status-legend" aria-label="คำอธิบายสถานะ">
              <span className="legend-item available">{displayStatus('Available')}</span>
              <span className="legend-item booked">{displayStatus('Booked')}</span>
              <span className="legend-item maintenance">{displayStatus('Maintenance')}</span>
            </div>
          </div>

          {group.desks.length > 0 ? (
            <div className="desk-map">
              {group.desks.map((desk) => (
                <ComputerTile
                  desk={desk}
                  key={desk.seatId}
                  onSelect={() => onSelectDesk(desk)}
                />
              ))}
            </div>
          ) : (
            <p className="empty-zone">ไม่มีเครื่องที่ตรงกับตัวกรองปัจจุบันใน {displayZone(group.zone)}</p>
          )}
        </section>
      ))}
    </section>
  );
}
