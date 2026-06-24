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
          <h1>CPALL Command Center</h1>
          <p>Computer Desk Status Dashboard</p>
        </div>
      </div>

      <div className="header-status" aria-live="polite">
        <div className="live-state">
          <span className={isRefreshing ? 'live-dot refreshing' : 'live-dot'} />
          <strong>{isRefreshing ? 'Syncing' : 'Live'}</strong>
        </div>
        <div>
          <span>Last synced</span>
          <strong>{lastSynced ? formatDateTime(lastSynced) : 'Waiting'}</strong>
        </div>
        <div>
          <span>Auto refresh</span>
          <strong>Every 10 sec</strong>
        </div>
      </div>
    </header>
  );
}
