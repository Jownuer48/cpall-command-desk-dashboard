import type { StatusFilter, ViewMode } from '../types';

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
  'Maintenance',
  'Reserved'
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
    <section className="control-panel" aria-label="Dashboard controls">
      <label className="search-field">
        <span>Search</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Seat, zone, computer, team"
          type="search"
        />
      </label>

      <label className="filter-field">
        <span>Status</span>
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as StatusFilter)
          }
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="view-toggle" aria-label="View toggle">
        <span>View</span>
        <div className="segmented-control">
          <button
            className={viewMode === 'layout' ? 'active' : ''}
            type="button"
            aria-pressed={viewMode === 'layout'}
            onClick={() => onViewModeChange('layout')}
          >
            Layout View
          </button>
          <button
            className={viewMode === 'table' ? 'active' : ''}
            type="button"
            aria-pressed={viewMode === 'table'}
            onClick={() => onViewModeChange('table')}
          >
            Table View
          </button>
        </div>
      </div>
    </section>
  );
}
