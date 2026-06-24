import type { DeskCounts } from '../types';

type SummaryCardsProps = {
  counts: DeskCounts;
};

const summaryItems = [
  {
    key: 'total',
    label: 'Total computers',
    tone: 'total',
    marker: 'T'
  },
  {
    key: 'available',
    label: 'Available',
    tone: 'available',
    marker: 'A'
  },
  {
    key: 'booked',
    label: 'Booked',
    tone: 'booked',
    marker: 'B'
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    tone: 'maintenance',
    marker: 'M'
  },
  {
    key: 'reserved',
    label: 'Reserved',
    tone: 'reserved',
    marker: 'R'
  }
] as const;

export function SummaryCards({ counts }: SummaryCardsProps) {
  return (
    <section className="summary-grid" aria-label="Desk summary">
      {summaryItems
        .filter((item) => item.key !== 'reserved' || counts.reserved > 0)
        .map((item) => (
          <article className={`summary-card ${item.tone}`} key={item.key}>
            <div className="summary-icon" aria-hidden="true">
              {item.marker}
            </div>
            <div>
              <span>{item.label}</span>
              <strong>{counts[item.key]}</strong>
            </div>
          </article>
        ))}
    </section>
  );
}
