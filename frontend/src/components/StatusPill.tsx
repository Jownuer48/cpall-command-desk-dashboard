import type { DeskStatusValue } from '../types';
import { getStatusClass } from '../utils';

type StatusPillProps = {
  status: DeskStatusValue;
};

export function StatusPill({ status }: StatusPillProps) {
  return <span className={`status-pill ${getStatusClass(status)}`}>{status}</span>;
}
