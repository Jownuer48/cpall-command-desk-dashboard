import React from 'react';
import { DeskStatusDto } from '../types';
import DeskTile from './DeskTile';

interface ZoneGroupProps {
  zone: string;
  desks: DeskStatusDto[];
  onTileClick: (desk: DeskStatusDto) => void;
}

const ZoneGroup: React.FC<ZoneGroupProps> = ({ zone, desks, onTileClick }) => {
  return (
    <section className="zone-group" aria-label={`โซน ${zone}`}>
      <div className="zone-group__header">
        <div className="zone-group__title-block">
          <span className="zone-group__eyebrow">โซน</span>
          <h2 className="zone-group__name">{zone}</h2>
        </div>
      </div>

      <div className="zone-group__grid">
        {desks.map((desk) => (
          <DeskTile key={desk.seatId} desk={desk} onClick={onTileClick} />
        ))}
      </div>
    </section>
  );
};

export default ZoneGroup;
