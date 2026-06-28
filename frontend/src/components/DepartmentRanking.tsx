import React from 'react';
import { DepartmentUsageDto } from '../types';

interface DepartmentRankingProps {
  items: DepartmentUsageDto[];
  error?: string | null;
  onClose: () => void;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
  });
}

function getRankTone(index: number): string {
  if (index === 0) return 'gold';
  if (index === 1) return 'silver';
  if (index === 2) return 'bronze';
  return 'standard';
}

const DepartmentRanking: React.FC<DepartmentRankingProps> = ({ items, error, onClose }) => {
  const topItems = items.slice(0, 5);
  const max = Math.max(...topItems.map((item) => item.count), 1);

  return (
    <div className="ranking-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Ranking หน่วยงาน">
      <div className="usage-ranking" onClick={(event) => event.stopPropagation()}>
        <div className="usage-ranking__header">
          <div>
            <p className="usage-ranking__eyebrow">Top 5 หน่วยงาน</p>
            <h3 className="usage-ranking__title">ใช้งานเยอะที่สุด</h3>
          </div>
          <button
            className="usage-ranking__close"
            onClick={onClose}
            type="button"
            aria-label="ปิด Ranking"
          >
            ×
          </button>
        </div>
        <div className="usage-ranking__meta">
          <span className="usage-ranking__badge">30 วันล่าสุด</span>
          <span>เรียงตามจำนวนรายการจอง</span>
        </div>

        {error ? (
          <p className="usage-ranking__empty">{error}</p>
        ) : items.length === 0 ? (
          <p className="usage-ranking__empty">ยังไม่มีข้อมูลการใช้งาน</p>
        ) : (
          <ol className="usage-ranking__list">
            {topItems.map((item, index) => {
              const tone = getRankTone(index);
              return (
                <li className={`usage-ranking__item usage-ranking__item--${tone}`} key={item.department}>
                  <span className="usage-ranking__rank">{index + 1}</span>
                  <div className="usage-ranking__info">
                    <div className="usage-ranking__line">
                      <strong>{item.department}</strong>
                      <span className="usage-ranking__count">
                        <strong>{item.count}</strong>
                        ครั้ง
                      </span>
                    </div>
                    <div className="usage-ranking__meter" aria-hidden="true">
                      <span style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} />
                    </div>
                    <span className="usage-ranking__date">ล่าสุด {formatDate(item.lastUsedAt)}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};

export default DepartmentRanking;
