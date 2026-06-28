import type { StatusFilter, ViewMode } from '../types';
import { displayStatusFilter } from '../utils';

type ControlsProps = {
  search: string;
  statusFilter: StatusFilter;
  viewMode: ViewMode;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onViewModeChange: (value: ViewMode) => void;
};

const statusOptions: StatusFilter[] = [
  'All',
  'Available',
  'Booked',
  'Maintenance'
];

export function Controls({
  search,
  statusFilter,
  viewMode,
  onSearchChange,
  onStatusFilterChange,
  onViewModeChange
}: ControlsProps) {
  return (
    <section className="control-panel" aria-label="ตัวควบคุมแดชบอร์ด">
      <label className="search-field">
        <span>ค้นหา</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="โต๊ะ, โซน, เครื่อง, ทีม"
          type="search"
        />
      </label>

      <label className="filter-field">
        <span>สถานะ</span>
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as StatusFilter)
          }
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {displayStatusFilter(option)}
            </option>
          ))}
        </select>
      </label>

      <div className="view-toggle" aria-label="สลับมุมมอง">
        <span>มุมมอง</span>
        <div className="segmented-control">
          <button
            className={viewMode === 'layout' ? 'active' : ''}
            type="button"
            aria-pressed={viewMode === 'layout'}
            onClick={() => onViewModeChange('layout')}
          >
            แผนผัง
          </button>
          <button
            className={viewMode === 'table' ? 'active' : ''}
            type="button"
            aria-pressed={viewMode === 'table'}
            onClick={() => onViewModeChange('table')}
          >
            ตาราง
          </button>
        </div>
      </div>
    </section>
  );
}
