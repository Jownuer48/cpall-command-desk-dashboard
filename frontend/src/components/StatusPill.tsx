import type { DeskStatusValue } from '../types';
import { displayStatus, getStatusClass } from '../utils';

type StatusPillProps = {
  status: DeskStatusValue;
};

export function StatusPill({ status }: StatusPillProps) {
  return <span className={`status-pill ${getStatusClass(status)}`}>{displayStatus(status)}</span>;
}
