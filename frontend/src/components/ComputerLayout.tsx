import type { DeskGroup, DeskStatus } from '../types';
import { ComputerTile } from './ComputerTile';

type ComputerLayoutProps = {
  groups: DeskGroup[];
  onSelectDesk: (desk: DeskStatus) => void;
};

export function ComputerLayout({ groups, onSelectDesk }: ComputerLayoutProps) {
  return (
    <section className="layout-board" aria-label="Computer layout by zone">
      {groups.map((group) => (
        <section className="zone-panel" key={group.zone}>
          <div className="zone-heading">
            <div>
              <h2>{group.zone}</h2>
              <span>{group.desks.length} computers shown</span>
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
