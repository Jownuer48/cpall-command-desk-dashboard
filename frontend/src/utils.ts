import type { DeskStatus, DeskStatusValue } from './types';

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(value instanceof Date ? value : new Date(value));
}

export function formatTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function formatWindow(desk: DeskStatus) {
  if (!desk.startTime || !desk.endTime) {
    return '-';
  }

  return `${formatTime(desk.startTime)} - ${formatTime(desk.endTime)}`;
}

export function displayValue(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : '-';
}

export function getStatusClass(status: DeskStatusValue) {
  return `status-${status.toLowerCase()}`;
}
