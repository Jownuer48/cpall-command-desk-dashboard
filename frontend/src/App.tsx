import { useEffect, useMemo, useState } from 'react';
import './styles.css';

type DeskStatusValue = 'Available' | 'Booked' | 'Maintenance' | 'Reserved';

type DeskStatus = {
  seatId: string;
  zone: string;
  computerName: string;
  status: DeskStatusValue;
  isActive: boolean;
  startTime: string | null;
  endTime: string | null;
  bookedBy: string | null;
  purpose: string | null;
};

type StatusFilter = 'All' | DeskStatusValue;

const zoneOrder = ['Command Center'];

const statusOptions: StatusFilter[] = [
  'All',
  'Available',
  'Booked',
  'Maintenance',
  'Reserved'
];

const apiBaseUrl =
  import.meta.env.DEV
    ? import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    : '';

function App() {
  const [desks, setDesks] = useState<DeskStatus[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | undefined;

    const loadDeskStatus = async () => {
      try {
        if (desks.length === 0) {
          setIsLoading(true);
        }

        const response = await fetch(`${apiBaseUrl}/api/desk-status`);

        if (!response.ok) {
          throw new Error(`Desk status request failed with ${response.status}`);
        }

        const data = (await response.json()) as DeskStatus[];

        if (isMounted) {
          setDesks(data);
          setLastSynced(new Date());
          setError(null);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Unable to load desk status'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDeskStatus();
    intervalId = window.setInterval(loadDeskStatus, 10000);

    return () => {
      isMounted = false;

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [desks.length]);

  const counts = useMemo(() => {
    const summary = {
      total: desks.length,
      available: 0,
      booked: 0,
      maintenance: 0
    };

    for (const desk of desks) {
      if (desk.status === 'Available') {
        summary.available += 1;
      }

      if (desk.status === 'Booked') {
        summary.booked += 1;
      }

      if (desk.status === 'Maintenance') {
        summary.maintenance += 1;
      }
    }

    return summary;
  }, [desks]);

  const filteredDesks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return desks.filter((desk) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          desk.seatId,
          desk.zone,
          desk.computerName,
          desk.bookedBy ?? '',
          desk.purpose ?? ''
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'All' || desk.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [desks, search, statusFilter]);

  const groupedDesks = useMemo(() => {
    return zoneOrder.map((zone) => ({
      zone,
      desks: filteredDesks.filter((desk) => desk.zone === zone)
    }));
  }, [filteredDesks]);

  return (
    <main className="dashboard-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">Command desk status</p>
          <h1>CPALL Command Center Desk Status</h1>
          <p className="subtitle">Real-time computer desk booking status</p>
        </div>
        <div className="sync-panel" aria-live="polite">
          <span>Last synced</span>
          <strong>{lastSynced ? formatDateTime(lastSynced) : 'Waiting for data'}</strong>
        </div>
      </section>

      {error && (
        <section className="notice error" role="alert">
          <strong>Status feed unavailable</strong>
          <span>{error}</span>
        </section>
      )}

      {isLoading && desks.length === 0 ? (
        <section className="notice loading" aria-live="polite">
          Loading desk status...
        </section>
      ) : (
        <>
          <section className="summary-grid" aria-label="Desk summary">
            <MetricCard label="Total" value={counts.total} tone="total" />
            <MetricCard label="Available" value={counts.available} tone="available" />
            <MetricCard label="Booked" value={counts.booked} tone="booked" />
            <MetricCard label="Maintenance" value={counts.maintenance} tone="maintenance" />
          </section>

          <section className="toolbar" aria-label="Desk filters">
            <label className="search-field">
              <span>Search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Seat, zone, computer, team"
                type="search"
              />
            </label>

            <label className="filter-field">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="zones-section" aria-label="Desk grid grouped by zone">
            {groupedDesks.map(({ zone, desks: zoneDesks }) => (
              <section className="zone-band" key={zone}>
                <div className="zone-heading">
                  <h2>{zone}</h2>
                  <span>{zoneDesks.length} desks shown</span>
                </div>
                {zoneDesks.length > 0 ? (
                  <div className="desk-grid">
                    {zoneDesks.map((desk) => (
                      <DeskTile key={desk.seatId} desk={desk} />
                    ))}
                  </div>
                ) : (
                  <p className="empty-zone">No desks match the current filters.</p>
                )}
              </section>
            ))}
          </section>

          <section className="table-section" aria-label="Desk status table">
            <div className="section-heading">
              <h2>Table View</h2>
              <span>{filteredDesks.length} matching desks</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Seat</th>
                    <th>Zone</th>
                    <th>Computer</th>
                    <th>Status</th>
                    <th>Current booking</th>
                    <th>Window</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDesks.map((desk) => (
                    <tr key={desk.seatId}>
                      <td>{desk.seatId}</td>
                      <td>{desk.zone}</td>
                      <td>{desk.computerName}</td>
                      <td>
                        <StatusPill status={desk.status} />
                      </td>
                      <td>{desk.bookedBy ?? '-'}</td>
                      <td>{formatWindow(desk)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: 'total' | 'available' | 'booked' | 'maintenance';
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DeskTile({ desk }: { desk: DeskStatus }) {
  return (
    <article className={`desk-tile status-${desk.status.toLowerCase()}`}>
      <div className="desk-tile-top">
        <strong>{desk.seatId}</strong>
        <StatusPill status={desk.status} />
      </div>
      <span className="computer-name">{desk.computerName}</span>
      <span className="booking-line">{desk.bookedBy ?? 'Open for use'}</span>
      <span className="time-line">{formatWindow(desk)}</span>
    </article>
  );
}

function StatusPill({ status }: { status: DeskStatusValue }) {
  return <span className={`status-pill status-${status.toLowerCase()}`}>{status}</span>;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(value);
}

function formatWindow(desk: DeskStatus) {
  if (!desk.startTime || !desk.endTime) {
    return '-';
  }

  return `${formatTime(desk.startTime)} - ${formatTime(desk.endTime)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export default App;
