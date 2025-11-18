// Parameter Form Component

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

  return (
    <div className="parameter-form">
      <h3>Parameters</h3>
      
      {/* Common parameters */}
      <div className="parameter-group">
        <label>
          Width: {parameters.width}
          <input
            type="range"
            min="30"
            max="200"
            value={parameters.width}
            onChange={(e) => handleChange('width', parseInt(e.target.value))}
          />
        </label>
      </div>

      <div className="parameter-group">
        <label>
          Height: {parameters.height}
          <input
            type="range"
            min="30"
            max="200"
            value={parameters.height}
            onChange={(e) => handleChange('height', parseInt(e.target.value))}
          />
        </label>
      </div>

      <div className="parameter-group">
        <label>
          Seed:
          <input
            type="number"
            value={parameters.seed || 0}
            onChange={(e) => handleChange('seed', parseInt(e.target.value))}
          />
        </label>
      </div>

      {/* House/Dungeon parameters */}
      {(terrain === TerrainType.House || terrain === TerrainType.Dungeon) && (
        <>
          <div className="parameter-group">
            <label>
              Min Room Size: {parameters.minRoomSize}
              <input
                type="range"
                min="3"
                max="10"
                value={parameters.minRoomSize || 5}
                onChange={(e) => handleChange('minRoomSize', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className="parameter-group">
            <label>
              Max Room Size: {parameters.maxRoomSize}
              <input
                type="range"
                min="6"
                max="20"
                value={parameters.maxRoomSize || 10}
                onChange={(e) => handleChange('maxRoomSize', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className="parameter-group">
            <label>
              Room Count: {parameters.roomCount}
              <input
                type="range"
                min="3"
                max="20"
                value={parameters.roomCount || 8}
                onChange={(e) => handleChange('roomCount', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className="parameter-group">
            <label>
              Corridor Width: {parameters.corridorWidth}
              <input
                type="range"
                min="1"
                max="3"
                value={parameters.corridorWidth || 1}
                onChange={(e) => handleChange('corridorWidth', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className="parameter-group">
            <label>
              Grid Size: {parameters.gridSize}
              <input
                type="range"
                min="1"
                max="8"
                value={parameters.gridSize || 4}
                onChange={(e) => handleChange('gridSize', parseInt(e.target.value))}
              />
            </label>
          </div>
        </>
      )}

      {/* Dungeon-specific */}
      {terrain === TerrainType.Dungeon && (
        <>
          <div className="parameter-group">
            <label>
              Organic Factor: {(parameters.organicFactor || 0.3).toFixed(2)}
              <input
                type="range"
                min="0"
                max="100"
                value={(parameters.organicFactor || 0.3) * 100}
                onChange={(e) => handleChange('organicFactor', parseInt(e.target.value) / 100)}
              />
            </label>
          </div>

          <div className="parameter-group">
            <label>
              Connectivity: {(parameters.connectivityFactor || 0.15).toFixed(2)}
              <input
                type="range"
                min="0"
                max="50"
                value={(parameters.connectivityFactor || 0.15) * 100}
                onChange={(e) => handleChange('connectivityFactor', parseInt(e.target.value) / 100)}
              />
            </label>
          </div>
        </>
      )}

      {/* Forest parameters */}
      {terrain === TerrainType.Forest && (
        <>
          <div className="parameter-group">
            <label>
              Tree Density: {(parameters.treeDensity || 0.3).toFixed(2)}
              <input
                type="range"
                min="0"
                max="100"
                value={(parameters.treeDensity || 0.3) * 100}
                onChange={(e) => handleChange('treeDensity', parseInt(e.target.value) / 100)}
              />
            </label>
          </div>

          <div className="parameter-group">
            <label>
              Min Tree Distance: {parameters.minTreeDistance}
              <input
                type="range"
                min="2"
                max="10"
                value={parameters.minTreeDistance || 3}
                onChange={(e) => handleChange('minTreeDistance', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className="parameter-group">
            <label>
              Noise Scale: {(parameters.noiseScale || 0.05).toFixed(3)}
              <input
                type="range"
                min="10"
                max="200"
                value={(parameters.noiseScale || 0.05) * 1000}
                onChange={(e) => handleChange('noiseScale', parseInt(e.target.value) / 1000)}
              />
            </label>
          </div>

          <div className="parameter-group">
            <label>
              Tree Radius: {(parameters.treeRadius || 1.5).toFixed(1)}
              <input
                type="range"
                min="5"
                max="50"
                value={(parameters.treeRadius || 1.5) * 10}
                onChange={(e) => handleChange('treeRadius', parseInt(e.target.value) / 10)}
              />
            </label>
          </div>
        </>
      )}

      {/* Cave parameters */}
      {terrain === TerrainType.Cave && (
        <>
          <div className="parameter-group">
            <label>
              Fill Probability: {(parameters.fillProbability || 0.45).toFixed(2)}
              <input
                type="range"
                min="30"
                max="60"
                value={(parameters.fillProbability || 0.45) * 100}
                onChange={(e) => handleChange('fillProbability', parseInt(e.target.value) / 100)}
              />
            </label>
          </div>

          <div className="parameter-group">
            <label>
              Smooth Iterations: {parameters.smoothIterations}
              <input
                type="range"
                min="1"
                max="8"
                value={parameters.smoothIterations || 4}
                onChange={(e) => handleChange('smoothIterations', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className="parameter-group">
            <label>
              Wall Threshold: {parameters.wallThreshold}
              <input
                type="range"
                min="3"
                max="7"
                value={parameters.wallThreshold || 5}
                onChange={(e) => handleChange('wallThreshold', parseInt(e.target.value))}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
};
