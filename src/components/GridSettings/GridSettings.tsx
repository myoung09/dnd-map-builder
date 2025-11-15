import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import {
  GridOn as GridIcon,
  GridOff as GridOffIcon,
  Straighten as RulerIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { GridConfig, Color } from '../../types/map';

interface GridSettingsProps {
  open: boolean;
  onClose: () => void;
  gridConfig: GridConfig;
  onGridConfigChange: (config: GridConfig) => void;
}

interface GridPreviewProps {
  config: GridConfig;
  size: number;
}

const GridPreview: React.FC<GridPreviewProps> = ({ config, size }) => {
  const cellCount = Math.floor(size / Math.max(config.cellSize * 0.5, 1));
  
  return (
    <Paper
      elevation={1}
      sx={{
        width: size,
        height: size,
        position: 'relative',
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      {config.showGrid && (
        <svg
          width={size}
          height={size}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {config.gridType === 'square' ? (
            <>
              {/* Vertical lines */}
              {Array.from({ length: cellCount + 1 }, (_, i) => {
                const x = (i * size) / cellCount;
                return (
                  <line
                    key={`v-${i}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={size}
                    stroke={`rgba(${config.gridColor.r}, ${config.gridColor.g}, ${config.gridColor.b}, ${config.gridColor.a || 1})`}
                    strokeWidth={1}
                  />
                );
              })}
              {/* Horizontal lines */}
              {Array.from({ length: cellCount + 1 }, (_, i) => {
                const y = (i * size) / cellCount;
                return (
                  <line
                    key={`h-${i}`}
                    x1={0}
                    y1={y}
                    x2={size}
                    y2={y}
                    stroke={`rgba(${config.gridColor.r}, ${config.gridColor.g}, ${config.gridColor.b}, ${config.gridColor.a || 1})`}
                    strokeWidth={1}
                  />
                );
              })}
            </>
          ) : (
            // Hexagonal grid (simplified representation)
            <>
              {Array.from({ length: Math.floor(cellCount / 2) + 1 }, (_, row) => {
                const y = (row * size * 0.75) / (cellCount / 2);
                return Array.from({ length: cellCount }, (_, col) => {
                  const x = ((col + (row % 2) * 0.5) * size) / cellCount;
                  const radius = size / (cellCount * 2);
                  
                  if (x > size || y > size) return null;
                  
                  return (
                    <polygon
                      key={`hex-${row}-${col}`}
                      points={[
                        [x + radius * Math.cos(0), y + radius * Math.sin(0)],
                        [x + radius * Math.cos(Math.PI / 3), y + radius * Math.sin(Math.PI / 3)],
                        [x + radius * Math.cos(2 * Math.PI / 3), y + radius * Math.sin(2 * Math.PI / 3)],
                        [x + radius * Math.cos(Math.PI), y + radius * Math.sin(Math.PI)],
                        [x + radius * Math.cos(4 * Math.PI / 3), y + radius * Math.sin(4 * Math.PI / 3)],
                        [x + radius * Math.cos(5 * Math.PI / 3), y + radius * Math.sin(5 * Math.PI / 3)],
                      ].map(([px, py]) => `${px},${py}`).join(' ')}
                      fill="transparent"
                      stroke={`rgba(${config.gridColor.r}, ${config.gridColor.g}, ${config.gridColor.b}, ${config.gridColor.a || 1})`}
                      strokeWidth={1}
                    />
                  );
                });
              })}
            </>
          )}
        </svg>
      )}
    </Paper>
  );
};

const GridSettings: React.FC<GridSettingsProps> = ({
  open,
  onClose,
  gridConfig,
  onGridConfigChange,
}) => {
  const [localConfig, setLocalConfig] = useState<GridConfig>(gridConfig);

  const handleConfigChange = useCallback((updates: Partial<GridConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const handleColorChange = useCallback((color: Partial<Color>) => {
    setLocalConfig(prev => ({
      ...prev,
      gridColor: { ...prev.gridColor, ...color }
    }));
  }, []);

  const handleSave = useCallback(() => {
    onGridConfigChange(localConfig);
    onClose();
  }, [localConfig, onGridConfigChange, onClose]);

  const handleReset = useCallback(() => {
    setLocalConfig(gridConfig);
  }, [gridConfig]);

  const presetSizes = [16, 20, 24, 32, 40, 48, 64, 80, 100];
  const presetColors = [
    { name: 'Light Gray', color: { r: 200, g: 200, b: 200, a: 0.5 } },
    { name: 'Dark Gray', color: { r: 100, g: 100, b: 100, a: 0.7 } },
    { name: 'Blue', color: { r: 100, g: 150, b: 255, a: 0.6 } },
    { name: 'Green', color: { r: 100, g: 255, b: 150, a: 0.6 } },
    { name: 'Red', color: { r: 255, g: 100, b: 100, a: 0.6 } },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 600 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GridIcon />
            <Typography variant="h6">Grid Settings</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Left Panel - Settings */}
          <Box sx={{ flex: '2 1 0' }}>
            {/* Basic Grid Settings */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Basic Settings
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.showGrid}
                    onChange={(e) => handleConfigChange({ showGrid: e.target.checked })}
                  />
                }
                label="Show Grid"
                sx={{ mb: 2, display: 'block' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.snapToGrid}
                    onChange={(e) => handleConfigChange({ snapToGrid: e.target.checked })}
                  />
                }
                label="Snap to Grid"
                sx={{ mb: 2, display: 'block' }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Grid Type */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Grid Type</InputLabel>
                <Select
                  value={localConfig.gridType}
                  label="Grid Type"
                  onChange={(e) => handleConfigChange({ gridType: e.target.value as 'square' | 'hexagonal' })}
                >
                  <MenuItem value="square">Square Grid</MenuItem>
                  <MenuItem value="hexagonal">Hexagonal Grid</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Cell Size */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Cell Size: {localConfig.cellSize}px
              </Typography>
              <Slider
                value={localConfig.cellSize}
                onChange={(_, value) => handleConfigChange({ cellSize: value as number })}
                min={8}
                max={120}
                step={2}
                marks={presetSizes.map(size => ({ value: size, label: `${size}px` }))}
                sx={{ mb: 2 }}
              />
              
              {/* Preset Size Buttons */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {presetSizes.map(size => (
                  <Button
                    key={size}
                    size="small"
                    variant={localConfig.cellSize === size ? 'contained' : 'outlined'}
                    onClick={() => handleConfigChange({ cellSize: size })}
                  >
                    {size}px
                  </Button>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Grid Color */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Grid Color & Opacity
              </Typography>
              
              {/* Color Presets */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {presetColors.map(preset => (
                  <Button
                    key={preset.name}
                    size="small"
                    variant="outlined"
                    onClick={() => handleColorChange(preset.color)}
                    sx={{
                      minWidth: 'auto',
                      width: 40,
                      height: 30,
                      backgroundColor: `rgba(${preset.color.r}, ${preset.color.g}, ${preset.color.b}, ${preset.color.a})`,
                      '&:hover': {
                        backgroundColor: `rgba(${preset.color.r}, ${preset.color.g}, ${preset.color.b}, ${Math.min((preset.color.a || 0.5) + 0.2, 1)})`,
                      }
                    }}
                  />
                ))}
              </Box>

              {/* RGB Sliders */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>Red: {localConfig.gridColor.r}</Typography>
                <Slider
                  value={localConfig.gridColor.r}
                  onChange={(_, value) => handleColorChange({ r: value as number })}
                  min={0}
                  max={255}
                  sx={{ color: 'red' }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>Green: {localConfig.gridColor.g}</Typography>
                <Slider
                  value={localConfig.gridColor.g}
                  onChange={(_, value) => handleColorChange({ g: value as number })}
                  min={0}
                  max={255}
                  sx={{ color: 'green' }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>Blue: {localConfig.gridColor.b}</Typography>
                <Slider
                  value={localConfig.gridColor.b}
                  onChange={(_, value) => handleColorChange({ b: value as number })}
                  min={0}
                  max={255}
                  sx={{ color: 'blue' }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Opacity: {Math.round((localConfig.gridColor.a || 0.5) * 100)}%
                </Typography>
                <Slider
                  value={localConfig.gridColor.a || 0.5}
                  onChange={(_, value) => handleColorChange({ a: value as number })}
                  min={0.1}
                  max={1}
                  step={0.1}
                />
              </Box>
            </Box>
          </Box>

          {/* Right Panel - Preview */}
          <Box sx={{ flex: '1 1 0', minWidth: 250 }}>
            <Box sx={{ position: 'sticky', top: 16 }}>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <GridPreview config={localConfig} size={200} />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Grid Information
                </Typography>
                <Typography variant="body2">
                  Type: {localConfig.gridType === 'square' ? 'Square' : 'Hexagonal'}
                </Typography>
                <Typography variant="body2">
                  Size: {localConfig.cellSize}px
                </Typography>
                <Typography variant="body2">
                  Visible: {localConfig.showGrid ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2">
                  Snap: {localConfig.snapToGrid ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>

              {/* Quick Actions */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    startIcon={localConfig.showGrid ? <GridOffIcon /> : <GridIcon />}
                    onClick={() => handleConfigChange({ showGrid: !localConfig.showGrid })}
                    size="small"
                  >
                    {localConfig.showGrid ? 'Hide Grid' : 'Show Grid'}
                  </Button>
                  <Button
                    startIcon={<RulerIcon />}
                    onClick={() => handleConfigChange({ snapToGrid: !localConfig.snapToGrid })}
                    size="small"
                  >
                    {localConfig.snapToGrid ? 'Disable Snap' : 'Enable Snap'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Apply Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GridSettings;