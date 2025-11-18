// Preset Selector Component

import React from 'react';
import { TerrainType } from '../types/generator';
import { getPresetsByTerrain } from '../utils/presets';

interface PresetSelectorProps {
  currentTerrain: TerrainType;
  onPresetSelect: (presetName: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentTerrain,
  onPresetSelect
}) => {
  const availablePresets = getPresetsByTerrain(currentTerrain);

  return (
    <div className="preset-selector">
      <label>
        <strong>Preset Profiles:</strong>
        <select 
          onChange={(e) => {
            if (e.target.value) {
              onPresetSelect(e.target.value);
            }
          }}
          defaultValue=""
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '4px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="">-- Select a Preset --</option>
          {availablePresets.map(preset => (
            <option key={preset.name} value={preset.name}>
              {preset.name}
            </option>
          ))}
        </select>
      </label>
      
      <div style={{
        marginTop: '8px',
        padding: '8px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }}>
        <strong>Available Presets:</strong>
        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
          {availablePresets.map(preset => (
            <li key={preset.name} style={{ marginBottom: '2px' }}>
              {preset.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
