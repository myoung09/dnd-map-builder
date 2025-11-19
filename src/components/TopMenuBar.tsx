/**
 * TopMenuBar Component
 * Application menu with object placement controls
 */

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Divider,
  Tooltip
} from '@mui/material';
import {
  AddCircleOutline as AddObjectIcon,
  RemoveCircleOutline as RemoveObjectIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Layers as LayersIcon,
  LayersClear as LayersClearIcon,
  FileDownload as ExportIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { PlacementMode } from '../types/objects';

interface TopMenuBarProps {
  placementMode: PlacementMode;
  onPlacementModeChange: (mode: PlacementMode) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showObjectLayer: boolean;
  onToggleObjectLayer: () => void;
  showPalette: boolean;
  onTogglePalette: () => void;
  onExport: () => void;
  disabled?: boolean;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  placementMode,
  onPlacementModeChange,
  showGrid,
  onToggleGrid,
  showObjectLayer,
  onToggleObjectLayer,
  showPalette,
  onTogglePalette,
  onExport,
  disabled = false
}) => {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar variant="dense" sx={{ gap: 1 }}>
        {/* App Title */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 2 }}>
          DnD Map Builder
        </Typography>
        
        <Divider orientation="vertical" flexItem />
        
        {/* Object Placement Controls */}
        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
          <Tooltip title="Show/Hide Object Palette">
            <IconButton
              color={showPalette ? 'primary' : 'default'}
              onClick={onTogglePalette}
              disabled={disabled}
              size="small"
            >
              <PaletteIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Place Object (Click to place selected object)">
            <Button
              variant={placementMode === PlacementMode.Place ? 'contained' : 'outlined'}
              startIcon={<AddObjectIcon />}
              onClick={() => onPlacementModeChange(
                placementMode === PlacementMode.Place ? PlacementMode.None : PlacementMode.Place
              )}
              disabled={disabled}
              size="small"
            >
              Place
            </Button>
          </Tooltip>
          
          <Tooltip title="Delete Object (Click objects to remove)">
            <Button
              variant={placementMode === PlacementMode.Delete ? 'contained' : 'outlined'}
              startIcon={<RemoveObjectIcon />}
              onClick={() => onPlacementModeChange(
                placementMode === PlacementMode.Delete ? PlacementMode.None : PlacementMode.Delete
              )}
              disabled={disabled}
              size="small"
              color={placementMode === PlacementMode.Delete ? 'error' : 'primary'}
            >
              Delete
            </Button>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        {/* View Controls */}
        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
          <Tooltip title={showGrid ? 'Hide Grid' : 'Show Grid'}>
            <IconButton
              color={showGrid ? 'primary' : 'default'}
              onClick={onToggleGrid}
              disabled={disabled}
              size="small"
            >
              {showGrid ? <GridOnIcon /> : <GridOffIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title={showObjectLayer ? 'Hide Objects' : 'Show Objects'}>
            <IconButton
              color={showObjectLayer ? 'primary' : 'default'}
              onClick={onToggleObjectLayer}
              disabled={disabled}
              size="small"
            >
              {showObjectLayer ? <LayersIcon /> : <LayersClearIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem />
        
        {/* Export */}
        <Box sx={{ ml: 1 }}>
          <Tooltip title="Export Map">
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={onExport}
              disabled={disabled}
              size="small"
            >
              Export
            </Button>
          </Tooltip>
        </Box>
        
        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Status */}
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          Mode: {placementMode === PlacementMode.None ? 'View' : 
                 placementMode === PlacementMode.Place ? 'Place Object' :
                 placementMode === PlacementMode.Delete ? 'Delete Object' :
                 placementMode === PlacementMode.Move ? 'Move Object' : 'Select'}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default TopMenuBar;
