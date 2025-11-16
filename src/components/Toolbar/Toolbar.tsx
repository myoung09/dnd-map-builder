import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  Typography
} from '@mui/material';
import {
  CropFree as SelectIcon,
  TextFields as TextIcon,
  AddBox as ObjectPlaceIcon,
  ZoomIn as ZoomIcon,
  PanTool as PanIcon
} from '@mui/icons-material';
import { ToolType, TerrainType, Color } from '../../types/map';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  selectedTerrainType: TerrainType;
  onTerrainTypeChange: (terrain: TerrainType) => void;
  selectedColor: Color;
  onColorChange: (color: Color) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolChange,
  selectedTerrainType,
  onTerrainTypeChange,
  selectedColor,
  onColorChange
}) => {
  // Only keep shape-based and object tools compatible with new system
  const toolButtons = [
    { tool: ToolType.SELECT, icon: SelectIcon, tooltip: 'Select Objects (V)' },
    { tool: ToolType.OBJECT_PLACE, icon: ObjectPlaceIcon, tooltip: 'Place Object (O)' },
    { tool: ToolType.TEXT, icon: TextIcon, tooltip: 'Add Text Label (T)' },
    { tool: ToolType.ZOOM, icon: ZoomIcon, tooltip: 'Zoom (Z)' },
    { tool: ToolType.PAN, icon: PanIcon, tooltip: 'Pan View (H)' }
  ];

  // Terrain types are now for reference only (maps are procedurally generated)
  // These represent the map environment types rather than paintable terrain
  const environmentTypes = [
    { type: TerrainType.WALL, name: 'House Interior', icon: '🏠', description: 'Organized rooms with furniture' },
    { type: TerrainType.GRASS, name: 'Forest', icon: '�', description: 'Organic clearings with nature' },
    { type: TerrainType.STONE, name: 'Cave System', icon: '🪨', description: 'Irregular caverns and tunnels' },
    { type: TerrainType.FLOOR, name: 'Town Square', icon: '🏘️', description: 'Streets and buildings' },
    { type: TerrainType.DIFFICULT_TERRAIN, name: 'Dungeon', icon: '⚔️', description: 'Adventure chambers' }
  ];



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

      {/* Environment Reference */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
        Map Types
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%', px: 0.5 }}>
        {environmentTypes.map(({ icon, name, description }) => (
          <Tooltip key={name} title={`${name}: ${description}`} placement="right">
            <Box
              sx={{
                width: 36,
                height: 36,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                backgroundColor: 'background.default',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {icon}
            </Box>
          </Tooltip>
        ))}
      </Box>

      <Divider sx={{ width: '80%', my: 1 }} />

      {/* Info Section */}
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          mb: 1, 
          textAlign: 'center',
          fontSize: '0.65rem',
          px: 1
        }}
      >
        Use "Generate Map" to create procedural maps
      </Typography>
    </Box>
  );
};

export default Toolbar;