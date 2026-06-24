import type { DeskGroup, DeskStatus } from '../types';
import { ComputerTile } from './ComputerTile';

type ComputerLayoutProps = {
  groups: DeskGroup[];
  onSelectDesk: (desk: DeskStatus) => void;
};

export function ComputerLayout({ groups, onSelectDesk }: ComputerLayoutProps) {
  return (
    <section className="layout-board" aria-label="Computer layout">
      {groups.map((group) => (
        <section className="zone-panel" key={group.zone}>
          <div className="zone-heading">
            <div>
              <h2>Desk Layout</h2>
              <span>A01-A12 overview | {group.desks.length} computers shown</span>
            </div>
            <div className="status-legend" aria-label="Status legend">
              <span className="legend-item available">Available</span>
              <span className="legend-item booked">Booked</span>
              <span className="legend-item maintenance">Maintenance</span>
              <span className="legend-item reserved">Reserved</span>
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
            <p className="empty-zone">No computers match the current filters.</p>
          )}
        </section>
      ))}
    </section>
  );
}
