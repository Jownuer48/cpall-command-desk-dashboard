export type DeskStatusValue =
  | 'Available'
  | 'Booked'
  | 'Maintenance';

export interface DeskStatusDto {
  seatId: string;
  zone: string;
  computerName?: string | null;
  status: DeskStatusValue;
  isActive?: boolean;
  bookedBy?: string | null;
  department?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  purpose?: string | null;
  note?: string | null;
  updatedAt?: string | null;
}

export type DeskStatus = {
  seatId: string;
  zone: string;
  computerName: string;
  status: DeskStatusValue;
  isActive: boolean;
  startTime: string | null;
  endTime: string | null;
  bookedBy: string | null;
  department?: string | null;
  purpose: string | null;
  note?: string | null;
  updatedAt?: string | null;
};

export type StatusFilter = 'All' | DeskStatusValue;

export type ViewMode = 'layout' | 'table';

export type DeskGroup = {
  zone: string;
  desks: DeskStatus[];
};

export type DeskCounts = {
  total: number;
  available: number;
  booked: number;
  maintenance: number;
};
