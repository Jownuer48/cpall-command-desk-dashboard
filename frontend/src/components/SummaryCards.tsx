import React from 'react';
import { DeskStatusDto } from '../types';

interface SummaryCardsProps {
  desks: DeskStatusDto[];
}

type CardMod =
  | 'total'
  | 'available'
  | 'booked'
  | 'maintenance';

interface SummaryCardItem {
  label: string;
  value: number;
  mod: CardMod;
  icon: string;
  hint: string;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ desks }) => {
  const total = desks.length;

  const countByStatus = (status: DeskStatusDto['status']) =>
    desks.filter((desk) => desk.status === status).length;

  const available = countByStatus('Available');
  const booked = countByStatus('Booked');
  const maintenance = countByStatus('Maintenance');

  const cards: SummaryCardItem[] = [
    {
      label: 'ทั้งหมด',
      value: total,
      mod: 'total',
      icon: '▦',
      hint: 'จำนวนโต๊ะทั้งหมด',
    },
    {
      label: 'ว่าง',
      value: available,
      mod: 'available',
      icon: '✓',
      hint: 'พร้อมใช้งาน',
    },
    {
      label: 'กำลังใช้งาน',
      value: booked,
      mod: 'booked',
      icon: '●',
      hint: 'มีผู้จองอยู่',
    },
    {
      label: 'ซ่อมบำรุง',
      value: maintenance,
      mod: 'maintenance',
      icon: '!',
      hint: 'ปิดใช้งานชั่วคราว',
    },
  ];

  return (
    <section className="summary-icons" aria-label="สรุปสถานะโต๊ะ">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`summary-icon summary-icon--${card.mod}`}
          aria-label={`${card.label} ${card.value}`}
          title={`${card.label}: ${card.value} (${card.hint})`}
        >
          <span className="summary-icon__glyph" aria-hidden="true">
            {card.icon}
          </span>
          <span className="summary-icon__label">{card.label}</span>
          <strong className="summary-icon__value">{card.value}</strong>
        </article>
      ))}
    </section>
  );
};

export default SummaryCards;
