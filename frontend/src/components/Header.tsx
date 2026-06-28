import { formatDateTime } from '../utils';

type DashboardHeaderProps = {
  lastSynced: Date | null;
  isRefreshing: boolean;
};

export function DashboardHeader({
  lastSynced,
  isRefreshing
}: DashboardHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-block">
        <img className="brand-logo" src="/cpalllogo.png" alt="CPALL" />
        <div>
          <h1>CPALL COMMAND CENTER</h1>
          <p>แดชบอร์ดสถานะโต๊ะคอมพิวเตอร์</p>
        </div>
      </div>

      <div className="header-status" aria-live="polite" aria-label="สถานะระบบ">
        <div className="live-state">
          <span className={isRefreshing ? 'live-dot refreshing' : 'live-dot'} />
          <strong>{isRefreshing ? 'กำลังซิงก์' : 'แสดงผลสด'}</strong>
        </div>
        <div>
          <span>ซิงก์ล่าสุด</span>
          <strong>{lastSynced ? formatDateTime(lastSynced) : 'รอข้อมูล'}</strong>
        </div>
        <div>
          <span>รีเฟรชอัตโนมัติ</span>
          <strong>ทุก 10 วินาที</strong>
        </div>
      </div>
    </header>
  );
}
