import { useEffect, useMemo, useState } from 'react';
import './styles.css';

type DeskStatusValue = 'Available' | 'Booked' | 'Maintenance';

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
  'Maintenance'
];

const apiBaseUrl =
  import.meta.env.DEV
    ? import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    : '';

const statusLabels: Record<DeskStatusValue, string> = {
  Available: 'ว่าง',
  Booked: 'กำลังใช้งาน',
  Maintenance: 'ซ่อมบำรุง'
};

function displayStatus(status: DeskStatusValue) {
  return statusLabels[status];
}

function displayStatusFilter(status: StatusFilter) {
  return status === 'All' ? 'ทุกสถานะ' : displayStatus(status);
}

function displayZone(zone: string) {
  return zone === 'Command Center' ? 'ศูนย์บัญชาการ' : zone;
}

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
          throw new Error(`โหลดสถานะโต๊ะไม่สำเร็จ (${response.status})`);
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
              : 'ไม่สามารถโหลดสถานะโต๊ะได้'
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
          <p className="eyebrow">CPALL COMMAND CENTER</p>
          <h1>สถานะโต๊ะคอมพิวเตอร์ CPALL COMMAND CENTER</h1>
          <p className="subtitle">สถานะการจองโต๊ะคอมพิวเตอร์แบบเรียลไทม์</p>
        </div>
        <div className="sync-panel" aria-live="polite">
          <span>ซิงก์ล่าสุด</span>
          <strong>{lastSynced ? formatDateTime(lastSynced) : 'รอข้อมูล'}</strong>
        </div>
      </section>

      {error && (
        <section className="notice error" role="alert">
          <strong>ไม่สามารถโหลดข้อมูลสถานะได้</strong>
          <span>{error}</span>
        </section>
      )}

      {isLoading && desks.length === 0 ? (
        <section className="notice loading" aria-live="polite">
          กำลังโหลดสถานะโต๊ะ...
        </section>
      ) : (
        <>
          <section className="summary-grid" aria-label="สรุปสถานะโต๊ะ">
            <MetricCard label="ทั้งหมด" value={counts.total} tone="total" />
            <MetricCard label="ว่าง" value={counts.available} tone="available" />
            <MetricCard label="กำลังใช้งาน" value={counts.booked} tone="booked" />
            <MetricCard label="ซ่อมบำรุง" value={counts.maintenance} tone="maintenance" />
          </section>

          <section className="toolbar" aria-label="ตัวกรองโต๊ะ">
            <label className="search-field">
              <span>ค้นหา</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="โต๊ะ, โซน, เครื่อง, ทีม"
                type="search"
              />
            </label>

            <label className="filter-field">
              <span>สถานะ</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {displayStatusFilter(option)}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="zones-section" aria-label="แผนผังโต๊ะแยกตามโซน">
            {groupedDesks.map(({ zone, desks: zoneDesks }) => (
              <section className="zone-band" key={zone}>
                <div className="zone-heading">
                  <h2>{displayZone(zone)}</h2>
                  <span>แสดง {zoneDesks.length} โต๊ะ</span>
                </div>
                {zoneDesks.length > 0 ? (
                  <div className="desk-grid">
                    {zoneDesks.map((desk) => (
                      <DeskTile key={desk.seatId} desk={desk} />
                    ))}
                  </div>
                ) : (
                  <p className="empty-zone">ไม่มีโต๊ะที่ตรงกับตัวกรองปัจจุบัน</p>
                )}
              </section>
            ))}
          </section>

          <section className="table-section" aria-label="ตารางสถานะโต๊ะ">
            <div className="section-heading">
              <h2>มุมมองตาราง</h2>
              <span>พบ {filteredDesks.length} โต๊ะ</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>โต๊ะ</th>
                    <th>โซน</th>
                    <th>เครื่อง</th>
                    <th>สถานะ</th>
                    <th>ผู้จองปัจจุบัน</th>
                    <th>ช่วงเวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDesks.map((desk) => (
                    <tr key={desk.seatId}>
                      <td>{desk.seatId}</td>
                      <td>{displayZone(desk.zone)}</td>
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
      <span className="booking-line">{desk.bookedBy ?? 'พร้อมใช้งาน'}</span>
      <span className="time-line">{formatWindow(desk)}</span>
    </article>
  );
}

function StatusPill({ status }: { status: DeskStatusValue }) {
  return <span className={`status-pill status-${status.toLowerCase()}`}>{displayStatus(status)}</span>;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('th-TH', {
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
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export default App;
