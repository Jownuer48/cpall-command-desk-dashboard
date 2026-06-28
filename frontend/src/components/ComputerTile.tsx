import type { DeskStatus } from '../types';
import { displayStatus, getStatusClass } from '../utils';

type ComputerTileProps = {
  desk: DeskStatus;
  onSelect: () => void;
};

export function ComputerTile({ desk, onSelect }: ComputerTileProps) {
  const label = displayStatus(desk.status);

  return (
    <button
      className={`computer-tile ${getStatusClass(desk.status)}`}
      type="button"
      onClick={onSelect}
      aria-label={`โต๊ะ ${desk.seatId} สถานะ ${label}`}
    >
      <span className="tile-status-dot" aria-hidden="true" />
      <strong>{desk.seatId}</strong>
      <span className="tile-status-label">{label}</span>
    </button>
  );
}
