import type { DeskStatus } from '../types';
import { getStatusClass } from '../utils';

type ComputerTileProps = {
  desk: DeskStatus;
  onSelect: () => void;
};

export function ComputerTile({ desk, onSelect }: ComputerTileProps) {
  return (
    <button
      className={`computer-tile ${getStatusClass(desk.status)}`}
      type="button"
      onClick={onSelect}
      aria-label={`${desk.seatId} ${desk.status}`}
    >
      <span className="tile-status-dot" aria-hidden="true" />
      <strong>{desk.seatId}</strong>
      <span className="tile-status-label">{desk.status}</span>
    </button>
  );
}
