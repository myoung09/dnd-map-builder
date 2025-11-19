/**
 * TopMenuBar Component
 * Application menu with object placement controls and drawer toggle
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
  Menu as MenuIcon,
  AddCircleOutline as AddObjectIcon,
  RemoveCircleOutline as RemoveObjectIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Layers as LayersIcon,
  LayersClear as LayersClearIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Palette as PaletteIcon,
  Map as MapIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as ResetViewIcon,
  AutoAwesome as CampaignWizardIcon,
  Save as SaveWorkspaceIcon,
} from '@mui/icons-material';
import { PlacementMode } from '../types/objects';

interface TopMenuBarProps {
  onOpenDrawer: () => void;
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
  // Zoom and pan controls
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  // Campaign workspace controls
  onOpenCampaignWizard?: () => void;
  onViewWorkspace?: () => void;
  onExportWorkspace?: () => void;
  onImportWorkspace?: () => void;
  hasWorkspace?: boolean;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onOpenDrawer,
  placementMode,
  onPlacementModeChange,
  showGrid,
  onToggleGrid,
  showObjectLayer,
  onToggleObjectLayer,
  showPalette,
  onTogglePalette,
  onExport,
  disabled = false,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onResetView,
  onOpenCampaignWizard,
  onViewWorkspace,
  onExportWorkspace,
  onImportWorkspace,
  hasWorkspace = false
}) => {
  return (
    <AppBar position="static" elevation={2}>
      <Toolbar sx={{ gap: 1 }}>
        {/* Hamburger Menu */}
        <Tooltip title="Open Controls">
          <IconButton
            color="inherit"
            onClick={onOpenDrawer}
            edge="start"
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
        
        {/* App Title */}
        <MapIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DnD Map Builder
        </Typography>
        
        {/* Object Placement Controls */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Show/Hide Object Palette">
            <IconButton
              color={showPalette ? 'primary' : 'inherit'}
              onClick={onTogglePalette}
              disabled={disabled}
            >
              <PaletteIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Place Object">
            <Button
              variant={placementMode === PlacementMode.Place ? 'contained' : 'outlined'}
              startIcon={<AddObjectIcon />}
              onClick={() => onPlacementModeChange(
                placementMode === PlacementMode.Place ? PlacementMode.None : PlacementMode.Place
              )}
              disabled={disabled}
              size="small"
              color="inherit"
            >
              Place
            </Button>
          </Tooltip>
          
          <Tooltip title="Delete Object">
            <Button
              variant={placementMode === PlacementMode.Delete ? 'contained' : 'outlined'}
              startIcon={<RemoveObjectIcon />}
              onClick={() => onPlacementModeChange(
                placementMode === PlacementMode.Delete ? PlacementMode.None : PlacementMode.Delete
              )}
              disabled={disabled}
              size="small"
              color={placementMode === PlacementMode.Delete ? 'error' : 'inherit'}
            >
              Delete
            </Button>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        {/* View Controls */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={showGrid ? 'Hide Grid' : 'Show Grid'}>
            <IconButton
              color={showGrid ? 'primary' : 'inherit'}
              onClick={onToggleGrid}
              disabled={disabled}
            >
              {showGrid ? <GridOnIcon /> : <GridOffIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title={showObjectLayer ? 'Hide Objects' : 'Show Objects'}>
            <IconButton
              color={showObjectLayer ? 'primary' : 'inherit'}
              onClick={onToggleObjectLayer}
              disabled={disabled}
            >
              {showObjectLayer ? <LayersIcon /> : <LayersClearIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        {/* Zoom Controls */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip title="Zoom Out (-)">
            <IconButton
              color="inherit"
              onClick={onZoomOut}
              disabled={disabled || !onZoomOut}
              size="small"
            >
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Typography variant="body2" sx={{ minWidth: '45px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </Typography>
          
          <Tooltip title="Zoom In (+)">
            <IconButton
              color="inherit"
              onClick={onZoomIn}
              disabled={disabled || !onZoomIn}
              size="small"
            >
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Reset View (0)">
            <IconButton
              color="inherit"
              onClick={onResetView}
              disabled={disabled || !onResetView}
              size="small"
            >
              <ResetViewIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        {/* Campaign Workspace Controls */}
        {onOpenCampaignWizard && (
          <>
            <Tooltip title="Campaign Wizard">
              <Button
                variant="outlined"
                startIcon={<CampaignWizardIcon />}
                onClick={onOpenCampaignWizard}
                size="small"
                color="inherit"
              >
                Campaign
              </Button>
            </Tooltip>
          </>
        )}
        
        {onViewWorkspace && hasWorkspace && (
          <Tooltip title="View Workspace">
            <Button
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={onViewWorkspace}
              size="small"
              color="primary"
            >
              Workspace
            </Button>
          </Tooltip>
        )}
        
        {onExportWorkspace && hasWorkspace && (
          <Tooltip title="Export Workspace">
            <IconButton
              color="inherit"
              onClick={onExportWorkspace}
              size="small"
            >
              <SaveWorkspaceIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {onImportWorkspace && (
          <Tooltip title="Import Workspace">
            <IconButton
              color="inherit"
              onClick={onImportWorkspace}
              size="small"
            >
              <ImportIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        {/* Export */}
        <Tooltip title="Export Map">
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={onExport}
            disabled={disabled}
            size="small"
            color="inherit"
          >
            Export
          </Button>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default TopMenuBar;
