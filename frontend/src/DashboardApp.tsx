import { useEffect, useMemo, useState } from 'react';
import { Controls } from './components/Controls';
import { ComputerLayout } from './components/ComputerLayout';
import { DashboardHeader } from './components/Header';
import { DetailModal } from './components/DetailModal';
import { StatusTable } from './components/StatusTable';
import { SummaryCards } from './components/SummaryCards';
import type { DeskStatus, StatusFilter, ViewMode } from './types';

const zoneOrder = [
  'Command Center A',
  'Command Center B',
  'Monitoring Zone',
  'Supervisor Zone'
];

const apiBaseUrl =
  import.meta.env.DEV
    ? import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    : '';

export default function DashboardApp() {
  const [desks, setDesks] = useState<DeskStatus[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('layout');
  const [selectedDesk, setSelectedDesk] = useState<DeskStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDeskStatus = async () => {
      try {
        setIsRefreshing(true);

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
          setIsRefreshing(false);
        }
      }
    };

    void loadDeskStatus();
    const intervalId = window.setInterval(loadDeskStatus, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const counts = useMemo(() => {
    return desks.reduce(
      (summary, desk) => {
        summary.total += 1;

        if (desk.status === 'Available') {
          summary.available += 1;
        }

        if (desk.status === 'Booked') {
          summary.booked += 1;
        }

        if (desk.status === 'Maintenance') {
          summary.maintenance += 1;
        }

        if (desk.status === 'Reserved') {
          summary.reserved += 1;
        }

        return summary;
      },
      {
        total: 0,
        available: 0,
        booked: 0,
        maintenance: 0,
        reserved: 0
      }
    );
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
          desk.department ?? '',
          desk.purpose ?? '',
          desk.note ?? ''
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
    const knownZones = zoneOrder.map((zone) => ({
      zone,
      desks: filteredDesks.filter((desk) => desk.zone === zone)
    }));

    const extraZones = Array.from(
      new Set(
        filteredDesks
          .map((desk) => desk.zone)
          .filter((zone) => !zoneOrder.includes(zone))
      )
    ).map((zone) => ({
      zone,
      desks: filteredDesks.filter((desk) => desk.zone === zone)
    }));

    return [...knownZones, ...extraZones];
  }, [filteredDesks]);

  return (
    <main className="dashboard-shell">
      <DashboardHeader lastSynced={lastSynced} isRefreshing={isRefreshing} />

      {error && (
        <section className="notice error" role="alert">
          <strong>Status feed unavailable</strong>
          <span>{error}</span>
        </section>
      )}

      <SummaryCards counts={counts} />

      <Controls
        search={search}
        statusFilter={statusFilter}
        viewMode={viewMode}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onViewModeChange={setViewMode}
      />

      {isLoading && desks.length === 0 ? (
        <section className="notice loading" aria-live="polite">
          Loading desk status...
        </section>
      ) : viewMode === 'layout' ? (
        <ComputerLayout groups={groupedDesks} onSelectDesk={setSelectedDesk} />
      ) : (
        <StatusTable desks={filteredDesks} onSelectDesk={setSelectedDesk} />
      )}

      <DetailModal desk={selectedDesk} onClose={() => setSelectedDesk(null)} />
    </main>
  );
}
