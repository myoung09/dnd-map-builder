import React from 'react';
import {
  Box,
  Typography,
  Divider,
  IconButton,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Slider,
  Stack,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Casino as CasinoIcon,
  Terrain as TerrainIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { TerrainType, GeneratorParameters } from '../types/generator';
import { TerrainSelector } from './TerrainSelector';
import { PresetSelector } from './PresetSelector';
import { ParameterForm } from './ParameterForm';

interface ControlPanelProps {
  terrain: TerrainType;
  onTerrainChange: (terrain: TerrainType) => void;
  parameters: GeneratorParameters;
  onParameterChange: (params: GeneratorParameters) => void;
  onPresetLoad: (preset: any) => void;
  onGenerate: () => void;
  onRandomSeed: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showRooms: boolean;
  onToggleRooms: () => void;
  showCorridors: boolean;
  onToggleCorridors: () => void;
  showTrees: boolean;
  onToggleTrees: () => void;
  cellSize: number;
  onCellSizeChange: (size: number) => void;
  mapData: any;
  isGenerating: boolean;
  onClose?: () => void;
}

/**
 * ControlPanel - The content component for map generation controls
 * This is the content-only version without Drawer wrapper for use in tabbed layouts
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  terrain,
  onTerrainChange,
  parameters,
  onParameterChange,
  onPresetLoad,
  onGenerate,
  onRandomSeed,
  showGrid,
  onToggleGrid,
  showRooms,
  onToggleRooms,
  showCorridors,
  onToggleCorridors,
  showTrees,
  onToggleTrees,
  cellSize,
  onCellSizeChange,
  mapData,
  isGenerating,
  onClose,
}) => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon /> Map Controls
        </Typography>
        {onClose && (
          <IconButton onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />

      <Box sx={{ overflow: 'auto', p: 3 }}>
        {/* Terrain Selection */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TerrainIcon fontSize="small" /> Terrain Type
          </Typography>
          <TerrainSelector 
            selectedTerrain={terrain}
            onTerrainChange={onTerrainChange}
          />
        </Paper>

        {/* Preset Profiles */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Preset Profiles
          </Typography>
          <PresetSelector
            currentTerrain={terrain}
            onPresetSelect={onPresetLoad}
          />
        </Paper>

        {/* Parameters */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Parameters
          </Typography>
          <ParameterForm
            terrain={terrain}
            parameters={parameters}
            onParameterChange={onParameterChange}
          />
        </Paper>

        {/* Seed Control */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CasinoIcon fontSize="small" /> Seed
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={parameters.seed}
              onChange={(e) => onParameterChange({ ...parameters, seed: parseInt(e.target.value) || 0 })}
              InputProps={{
                inputProps: { min: 0 }
              }}
            />
            <Tooltip title="Generate random seed">
              <IconButton onClick={onRandomSeed} color="primary">
                <CasinoIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>

        {/* Display Options */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <VisibilityIcon fontSize="small" /> Display Options
          </Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={<Checkbox checked={showGrid} onChange={onToggleGrid} />}
              label="Show Grid"
            />
            <FormControlLabel
              control={<Checkbox checked={showRooms} onChange={onToggleRooms} />}
              label="Show Rooms"
            />
            <FormControlLabel
              control={<Checkbox checked={showCorridors} onChange={onToggleCorridors} />}
              label="Show Corridors"
            />
            <FormControlLabel
              control={<Checkbox checked={showTrees} onChange={onToggleTrees} />}
              label="Show Trees"
            />
          </Stack>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Cell Size: {cellSize}px
            </Typography>
            <Slider
              value={cellSize}
              onChange={(_, value) => onCellSizeChange(value as number)}
              min={4}
              max={20}
              step={1}
              marks={[
                { value: 4, label: '4' },
                { value: 12, label: '12' },
                { value: 20, label: '20' },
              ]}
            />
          </Box>
        </Paper>

        {/* Map Info */}
        {mapData && (
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <InfoIcon fontSize="small" /> Map Info
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Dimensions: <strong>{mapData.width} × {mapData.height}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Seed: <strong>{mapData.seed}</strong>
              </Typography>
              {mapData.rooms && (
                <Typography variant="body2" color="text.secondary">
                  Rooms: <strong>{mapData.rooms.length}</strong>
                </Typography>
              )}
              {mapData.corridors && (
                <Typography variant="body2" color="text.secondary">
                  Corridors: <strong>{mapData.corridors.length}</strong>
                </Typography>
              )}
              {mapData.trees && (
                <Typography variant="body2" color="text.secondary">
                  Trees: <strong>{mapData.trees.length}</strong>
                </Typography>
              )}
            </Stack>
          </Paper>
        )}

        {/* Generate Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={onGenerate}
          disabled={isGenerating}
          sx={{ mb: 2 }}
        >
          {isGenerating ? 'Generating...' : 'Generate Map'}
        </Button>
      </Box>
    </>
  );
};
