// Terrain Selector Component

import React from 'react';
import { TerrainType } from '../types/generator';

interface TerrainSelectorProps {
  selectedTerrain: TerrainType;
  onTerrainChange: (terrain: TerrainType) => void;
}

export const TerrainSelector: React.FC<TerrainSelectorProps> = ({
  selectedTerrain,
  onTerrainChange
}) => {
  return (
    <div className="terrain-selector">
      <label htmlFor="terrain-type">Terrain Type:</label>
      <select
        id="terrain-type"
        value={selectedTerrain}
        onChange={(e) => onTerrainChange(e.target.value as TerrainType)}
      >
        {Object.values(TerrainType).map((terrain) => (
          <option key={terrain} value={terrain}>
            {terrain}
          </option>
        ))}
      </select>
    </div>
  );
};
