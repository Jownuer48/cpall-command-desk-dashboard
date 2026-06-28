import React, { useCallback, useEffect, useState } from 'react';
import './dashboard.css';
import { DeskStatusDto } from './types';
import { displayZone } from './utils';
import SummaryCards from './components/SummaryCards';
import ZoneGroup from './components/ZoneGroup';
import TableView from './components/TableView';
import DetailModal from './components/DetailModal';
import CalendarPopup from './components/CalendarPopup';

type ViewMode = 'map' | 'table';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const API_URL = `${API_BASE}/api/desk-status`;
const REFRESH_MS = 30_000;

const legendItems = [
  { key: 'available', label: 'ว่าง', description: 'พร้อมใช้งาน' },
  { key: 'booked', label: 'กำลังใช้งาน', description: 'มีผู้จองหรือกำลังใช้งาน' },
  { key: 'maintenance', label: 'ซ่อมบำรุง', description: 'ปิดปรับปรุงหรือซ่อมบำรุง' },
];

function groupByZone(desks: DeskStatusDto[]): Map<string, DeskStatusDto[]> {
  const map = new Map<string, DeskStatusDto[]>();

  for (const desk of desks) {
    const list = map.get(desk.zone) ?? [];
    list.push(desk);
    map.set(desk.zone, list);
  }

  return map;
}

function formatTime(value: Date | null): string {
  if (!value) return 'ยังไม่ได้ซิงก์';

  return value.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const DashboardApp: React.FC = () => {
  const [desks, setDesks] = useState<DeskStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DeskStatusDto | null>(null);
  const [view, setView] = useState<ViewMode>('map');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: DeskStatusDto[] = await res.json();
      setDesks(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('ไม่สามารถโหลดสถานะโต๊ะได้ ระบบจะลองใหม่อัตโนมัติ');
      console.error('[CPALL Dashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const timer = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchData]);

  const zoneMap = groupByZone(desks);

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="brand-block">
          <div className="brand-block__logo-card">
            <img src="/cpalllogo.png" alt="CPALL" className="brand-block__logo" />
          </div>

          <div className="brand-block__text">
            <p className="brand-block__eyebrow">ศูนย์บัญชาการ CPALL</p>
            <h1 className="brand-block__title">สถานะการใช้งานคอมพิวเตอร์</h1>
            <p className="brand-block__subtitle">
              หน้าจอแสดงสถานะโต๊ะคอมพิวเตอร์แบบอ่านอย่างเดียว สำหรับทีม CPALL COMMAND CENTER 
            </p>
          </div>
        </div>

        <div className="dashboard__status-panel" aria-label="สถานะระบบ">
          <div className="live-badge">
            <span className="live-badge__dot" />
            แสดงผลสด
          </div>
          <div className="sync-card">
            <span className="sync-card__label">ซิงก์ล่าสุด</span>
            <strong className="sync-card__time">{formatTime(lastUpdated)}</strong>
          </div>
          <div className="sync-card">
            <span className="sync-card__label">รีเฟรชอัตโนมัติ</span>
            <strong className="sync-card__time">ทุก {REFRESH_MS / 1000} วินาที</strong>
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="hero-panel" aria-label="ภาพรวมแดชบอร์ด">
          <div className="hero-panel__copy">
            <p className="hero-panel__eyebrow">ภาพรวมแบบเรียลไทม์</p>
            <h2 className="hero-panel__title">ดูโต๊ะว่างและโต๊ะที่กำลังใช้งานได้ในหน้าเดียว</h2>
            <p className="hero-panel__desc">
              ใช้สีและป้ายสถานะช่วยให้ทีมเห็นภาพรวมได้เร็วขึ้น กดที่การ์ดโต๊ะเพื่อดูรายละเอียดเท่านั้น
            </p>
          </div>
        </section>

        <section className="workspace-panel">
          <div className="workspace-panel__header">
            <div>
              <p className="workspace-panel__eyebrow">แผนผังโต๊ะ</p>
              <p className="workspace-panel__hint">
                {view === 'map'
                  ? 'ตำแหน่งโต๊ะเรียงตามข้อมูลปัจจุบัน คลิกที่การ์ดเพื่อดูรายละเอียด'
                  : 'ค้นหาและกรองข้อมูลเพื่อดูรายละเอียดของแต่ละโต๊ะ'}
              </p>
            </div>

            <div className="workspace-panel__actions">
              {!loading && !error && <SummaryCards desks={desks} />}

              <div className="view-toggle" role="group" aria-label="โหมดการแสดงผล">
                <button
                  className={`view-toggle__btn${view === 'map' ? ' view-toggle__btn--active' : ''}`}
                  onClick={() => setView('map')}
                  aria-pressed={view === 'map'}
                  type="button"
                >
                  <span>▦</span>
                  แผนผัง
                </button>
                <button
                  className={`view-toggle__btn${view === 'table' ? ' view-toggle__btn--active' : ''}`}
                  onClick={() => setView('table')}
                  aria-pressed={view === 'table'}
                  type="button"
                >
                  <span>☰</span>
                  ตาราง
                </button>
                <button
                  className="view-toggle__btn view-toggle__btn--calendar"
                  onClick={() => setIsCalendarOpen(true)}
                  aria-label="เปิดปฏิทิน"
                  title="เปิดปฏิทิน"
                  type="button"
                >
                  <span className="calendar-icon" aria-hidden="true">
                    <span className="calendar-icon__rings" />
                    <span className="calendar-icon__body" />
                  </span>
                  <span>ปฏิทิน</span>
                </button>
              </div>

              <div className="dashboard__legend" aria-label="คำอธิบายสถานะ">
                {legendItems.map(({ key, label, description }) => (
                  <span key={key} className={`legend-item legend-item--${key}`} title={description}>
                    <span className="legend-item__dot" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {loading && (
            <div className="dashboard__state">
              <div className="spinner" aria-label="กำลังโหลด" />
              <p>กำลังโหลดสถานะโต๊ะ...</p>
            </div>
          )}

          {error && !loading && (
            <div className="dashboard__state dashboard__state--error">
              <span className="dashboard__state-icon">!</span>
              <div>
                <strong>โหลดข้อมูลไม่สำเร็จ</strong>
                <p>{error}</p>
              </div>
              <button className="retry-btn" onClick={fetchData} type="button">
                ลองโหลดใหม่
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="workspace-panel__body">
              {view === 'map' ? (
                <div className="zone-list">
                  {[...zoneMap.entries()].map(([zone, zoneDesks]) => (
                    <ZoneGroup
                      key={zone}
                      zone={displayZone(zone)}
                      desks={zoneDesks}
                      onTileClick={setSelected}
                    />
                  ))}
                </div>
              ) : (
                <TableView desks={desks} onRowClick={setSelected} />
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="dashboard__footer">
        <span>© {new Date().getFullYear()} บริษัท ซีพี ออลล์ จำกัด (มหาชน)</span>
        <span className="dashboard__footer-sep">·</span>
        <span>แสดงผลแบบอ่านอย่างเดียว · รีเฟรชอัตโนมัติทุก {REFRESH_MS / 1000} วินาที เป็นผลงานของนักศึกษาฝึกงานของ นาย พิตรพิบูล น้อมในธรรม ห้ามแก้ไข,ดัดแปลงก่อนได้รับอนุญาต</span>
      </footer>

      <DetailModal desk={selected} onClose={() => setSelected(null)} />
      {isCalendarOpen && (
        <CalendarPopup desks={desks} onClose={() => setIsCalendarOpen(false)} />
      )}
    </div>
  );
};

export default DashboardApp;
