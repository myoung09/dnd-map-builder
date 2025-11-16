import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  Typography,
  Slider
} from '@mui/material';
import {
  CropFree as SelectIcon,
  Brush as BrushIcon,
  Clear as EraserIcon,
  CropSquare as RectangleIcon,
  RadioButtonUnchecked as CircleIcon,
  Timeline as LineIcon,
  TextFields as TextIcon,
  AddBox as ObjectPlaceIcon,
  Colorize as EyedropperIcon,
  ZoomIn as ZoomIcon,
  PanTool as PanIcon
} from '@mui/icons-material';
import { ToolType, TerrainType, Color } from '../../types/map';
import { DEFAULT_TERRAIN_COLORS } from '../../utils/mapUtils';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  selectedTerrainType: TerrainType;
  onTerrainTypeChange: (terrain: TerrainType) => void;
  selectedColor: Color;
  onColorChange: (color: Color) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  selectedTerrainType,
  onTerrainTypeChange,
  selectedColor,
  onColorChange
}) => {
  const toolButtons = [
    { tool: ToolType.SELECT, icon: SelectIcon, tooltip: 'Select (V)' },
    { tool: ToolType.BRUSH, icon: BrushIcon, tooltip: 'Brush (B)' },
    { tool: ToolType.ERASER, icon: EraserIcon, tooltip: 'Eraser (E)' },
    { tool: ToolType.RECTANGLE, icon: RectangleIcon, tooltip: 'Rectangle (R)' },
    { tool: ToolType.CIRCLE, icon: CircleIcon, tooltip: 'Circle (C)' },
    { tool: ToolType.LINE, icon: LineIcon, tooltip: 'Line (L)' },
    { tool: ToolType.TEXT, icon: TextIcon, tooltip: 'Text (T)' },
    { tool: ToolType.OBJECT_PLACE, icon: ObjectPlaceIcon, tooltip: 'Place Object (O)' },
    { tool: ToolType.EYEDROPPER, icon: EyedropperIcon, tooltip: 'Eyedropper (I)' },
    { tool: ToolType.ZOOM, icon: ZoomIcon, tooltip: 'Zoom (Z)' },
    { tool: ToolType.PAN, icon: PanIcon, tooltip: 'Pan (H)' }
  ];

  const terrainTypes = [
    { type: TerrainType.WALL, name: 'Wall', icon: '🧱' },
    { type: TerrainType.FLOOR, name: 'Floor', icon: '⬜' },
    { type: TerrainType.DOOR, name: 'Door', icon: '🚪' },
    { type: TerrainType.WATER, name: 'Water', icon: '💧' },
    { type: TerrainType.GRASS, name: 'Grass', icon: '🌱' },
    { type: TerrainType.STONE, name: 'Stone', icon: '🗿' },
    { type: TerrainType.DIRT, name: 'Dirt', icon: '🟤' },
    { type: TerrainType.SAND, name: 'Sand', icon: '🏜️' },
    { type: TerrainType.DIFFICULT_TERRAIN, name: 'Forest', icon: '🌲' },
    { type: TerrainType.TRAP, name: 'Trap', icon: '⚠️' }
  ];

  const handleTerrainSelect = (terrainType: TerrainType) => {
    onTerrainTypeChange(terrainType);
    // Also update the color to match the terrain
    const terrainColor = DEFAULT_TERRAIN_COLORS[terrainType];
    onColorChange(terrainColor);
  };

  return (
    <Box
      sx={{
        width: 80,
        backgroundColor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 1,
        gap: 1,
        maxHeight: '100vh',
        overflowY: 'auto'
      }}
    >
      {/* Tools Section */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
        Tools
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {toolButtons.map(({ tool, icon: Icon, tooltip }) => (
          <Tooltip key={tool} title={tooltip} placement="right">
            <IconButton
              size="medium"
              onClick={() => onToolChange(tool)}
              sx={{
                color: activeTool === tool ? 'primary.main' : 'text.secondary',
                backgroundColor: activeTool === tool ? 'primary.light' : 'transparent',
                '&:hover': {
                  backgroundColor: activeTool === tool ? 'primary.light' : 'action.hover'
                }
              }}
            >
              <Icon />
            </IconButton>
          </Tooltip>
        ))}
      </Box>

      <Divider sx={{ width: '80%', my: 1 }} />

      {/* Brush Size */}
      {(activeTool === ToolType.BRUSH || activeTool === ToolType.ERASER) && (
        <Box sx={{ width: '90%', px: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Size
          </Typography>
          <Slider
            value={brushSize}
            onChange={(_, value) => onBrushSizeChange(value as number)}
            min={1}
            max={10}
            step={1}
            orientation="vertical"
            sx={{ height: 80 }}
            valueLabelDisplay="auto"
          />
        </Box>
      )}

      <Divider sx={{ width: '80%', my: 1 }} />

      {/* Terrain Types */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
        Terrain
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%', px: 0.5 }}>
        {terrainTypes.map(({ type, name, icon }) => {
          const color = DEFAULT_TERRAIN_COLORS[type];
          return (
            <Tooltip key={type} title={name} placement="right">
              <Box
                onClick={() => handleTerrainSelect(type)}
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`,
                  border: selectedTerrainType === type ? 2 : 1,
                  borderColor: selectedTerrainType === type ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 1)`,
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {icon}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      <Divider sx={{ width: '80%', my: 1 }} />

      {/* Current Color Display */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
        Color
      </Typography>
      
      <Box
        sx={{
          width: 40,
          height: 40,
          backgroundColor: `rgba(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b}, ${selectedColor.a || 1})`,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1
        }}
      />
    </Box>
  );
};

export default Toolbar;