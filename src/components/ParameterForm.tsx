// Parameter Form Component with Enhanced UX

import React from 'react';
import { TerrainType, GeneratorParameters } from '../types/generator';

interface ParameterFormProps {
  terrain: TerrainType;
  parameters: GeneratorParameters;
  onParameterChange: (params: GeneratorParameters) => void;
}

export const ParameterForm: React.FC<ParameterFormProps> = ({
  terrain,
  parameters,
  onParameterChange
}) => {
  const handleChange = (key: keyof GeneratorParameters, value: number) => {
    onParameterChange({
      ...parameters,
      [key]: value
    });
  };

  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    handleChange('seed', randomSeed);
  };

  return (
    <div className="parameter-form">
      <h3>Parameters</h3>
      
      {/* Common parameters */}
      <div className="parameter-group">
        <label title="Width of the map in grid cells">
          <strong>Width:</strong> <span className="param-value">{parameters.width}</span>
          <input
            type="range"
            min="30"
            max="200"
            value={parameters.width}
            onChange={(e) => handleChange('width', parseInt(e.target.value))}
            className="slider"
          />
        </label>
      </div>

      <div className="parameter-group">
        <label title="Height of the map in grid cells">
          <strong>Height:</strong> <span className="param-value">{parameters.height}</span>
          <input
            type="range"
            min="30"
            max="200"
            value={parameters.height}
            onChange={(e) => handleChange('height', parseInt(e.target.value))}
            className="slider"
          />
        </label>
      </div>

      <div className="parameter-group">
        <label title="Seed for reproducible random generation">
          <strong>Seed:</strong>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="number"
              value={parameters.seed || 0}
              onChange={(e) => handleChange('seed', parseInt(e.target.value) || 0)}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <button
              onClick={generateRandomSeed}
              title="Generate random seed"
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🎲 Random
            </button>
          </div>
        </label>
      </div>

      {/* House/Dungeon parameters */}
      {(terrain === TerrainType.House || terrain === TerrainType.Dungeon) && (
        <>
          <div className="parameter-group">
            <label title="Minimum room size (width/height in cells)">
              <strong>Min Room Size:</strong> <span className="param-value">{parameters.minRoomSize}</span>
              <input
                type="range"
                min="3"
                max="10"
                value={parameters.minRoomSize || 5}
                onChange={(e) => handleChange('minRoomSize', parseInt(e.target.value))}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Maximum room size (width/height in cells)">
              <strong>Max Room Size:</strong> <span className="param-value">{parameters.maxRoomSize}</span>
              <input
                type="range"
                min="6"
                max="20"
                value={parameters.maxRoomSize || 10}
                onChange={(e) => handleChange('maxRoomSize', parseInt(e.target.value))}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Target number of rooms to generate">
              <strong>Room Count:</strong> <span className="param-value">{parameters.roomCount}</span>
              <input
                type="range"
                min="3"
                max="20"
                value={parameters.roomCount || 8}
                onChange={(e) => handleChange('roomCount', parseInt(e.target.value))}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Width of corridors connecting rooms">
              <strong>Corridor Width:</strong> <span className="param-value">{parameters.corridorWidth}</span>
              <input
                type="range"
                min="1"
                max="3"
                value={parameters.corridorWidth || 1}
                onChange={(e) => handleChange('corridorWidth', parseInt(e.target.value))}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Grid alignment spacing for rooms">
              <strong>Grid Size:</strong> <span className="param-value">{parameters.gridSize}</span>
              <input
                type="range"
                min="1"
                max="8"
                value={parameters.gridSize || 4}
                onChange={(e) => handleChange('gridSize', parseInt(e.target.value))}
                className="slider"
              />
            </label>
          </div>
        </>
      )}

      {/* Dungeon-specific */}
      {terrain === TerrainType.Dungeon && (
        <>
          <div className="parameter-group">
            <label title="Organic variation in room shapes (0 = rectangular, higher = more irregular)">
              <strong>Organic Factor:</strong> <span className="param-value">{(parameters.organicFactor || 0.3).toFixed(2)}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={(parameters.organicFactor || 0.3) * 100}
                onChange={(e) => handleChange('organicFactor', parseInt(e.target.value) / 100)}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Additional corridor connections beyond minimum spanning tree">
              <strong>Connectivity:</strong> <span className="param-value">{(parameters.connectivityFactor || 0.15).toFixed(2)}</span>
              <input
                type="range"
                min="0"
                max="50"
                value={(parameters.connectivityFactor || 0.15) * 100}
                onChange={(e) => handleChange('connectivityFactor', parseInt(e.target.value) / 100)}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Corridor straightness (1 = very winding, 10 = straight)">
              <strong>Corridor Straightness:</strong> <span className="param-value">{parameters.walkSteps || 7}</span>
              <input
                type="range"
                min="1"
                max="10"
                value={parameters.walkSteps || 7}
                onChange={(e) => handleChange('walkSteps', parseInt(e.target.value))}
                className="slider"
              />
            </label>
          </div>
        </>
      )}

      {/* Forest parameters */}
      {terrain === TerrainType.Forest && (
        <>
          <div className="parameter-group">
            <label title="Density of trees (0 = sparse, 1 = dense)">
              <strong>Tree Density:</strong> <span className="param-value">{(parameters.treeDensity || 0.3).toFixed(2)}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={(parameters.treeDensity || 0.3) * 100}
                onChange={(e) => handleChange('treeDensity', parseInt(e.target.value) / 100)}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Minimum distance between tree centers (prevents overlapping)">
              <strong>Min Tree Distance:</strong> <span className="param-value">{parameters.minTreeDistance}</span>
              <input
                type="range"
                min="2"
                max="10"
                value={parameters.minTreeDistance || 3}
                onChange={(e) => handleChange('minTreeDistance', parseInt(e.target.value))}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Perlin noise frequency for organic tree clustering">
              <strong>Noise Scale:</strong> <span className="param-value">{(parameters.noiseScale || 0.05).toFixed(3)}</span>
              <input
                type="range"
                min="10"
                max="200"
                value={(parameters.noiseScale || 0.05) * 1000}
                onChange={(e) => handleChange('noiseScale', parseInt(e.target.value) / 1000)}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Radius of individual tree circles">
              <strong>Tree Radius:</strong> <span className="param-value">{(parameters.treeRadius || 1.5).toFixed(1)}</span>
              <input
                type="range"
                min="5"
                max="50"
                value={(parameters.treeRadius || 1.5) * 10}
                onChange={(e) => handleChange('treeRadius', parseInt(e.target.value) / 10)}
                className="slider"
              />
            </label>
          </div>
        </>
      )}

      {/* Cave parameters */}
      {terrain === TerrainType.Cave && (
        <>
          <div className="parameter-group">
            <label title="Initial probability of cell being a wall (higher = more walls)">
              <strong>Fill Probability:</strong> <span className="param-value">{(parameters.fillProbability || 0.45).toFixed(2)}</span>
              <input
                type="range"
                min="30"
                max="60"
                value={(parameters.fillProbability || 0.45) * 100}
                onChange={(e) => handleChange('fillProbability', parseInt(e.target.value) / 100)}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Number of cellular automata smoothing passes">
              <strong>Smooth Iterations:</strong> <span className="param-value">{parameters.smoothIterations}</span>
              <input
                type="range"
                min="1"
                max="8"
                value={parameters.smoothIterations || 4}
                onChange={(e) => handleChange('smoothIterations', parseInt(e.target.value))}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Minimum neighbor walls to become/stay a wall (4-8 recommended)">
              <strong>Wall Threshold:</strong> <span className="param-value">{parameters.wallThreshold}</span>
              <input
                type="range"
                min="3"
                max="7"
                value={parameters.wallThreshold || 5}
                onChange={(e) => handleChange('wallThreshold', parseInt(e.target.value))}
                className="slider"
              />
            </label>
          </div>

          <div className="parameter-group">
            <label title="Multiplier for cave roughness (0.5 = smooth, 2.0 = very rough)">
              <strong>Cave Roughness:</strong> <span className="param-value">{(parameters.caveRoughness || 1.0).toFixed(1)}</span>
              <input
                type="range"
                min="5"
                max="20"
                value={(parameters.caveRoughness || 1.0) * 10}
                onChange={(e) => handleChange('caveRoughness', parseInt(e.target.value) / 10)}
                className="slider"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
};
