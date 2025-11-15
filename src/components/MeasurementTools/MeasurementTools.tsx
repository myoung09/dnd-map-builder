import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Fade,
} from '@mui/material';
import {
  Straighten as RulerIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { Position, GridConfig } from '../../types/map';

interface MeasurementPoint {
  id: string;
  position: Position;
  label?: string;
}

interface MeasurementLine {
  id: string;
  startPoint: MeasurementPoint;
  endPoint: MeasurementPoint;
  distance: number;
  gridDistance: number;
}

interface MeasurementToolsProps {
  gridConfig: GridConfig;
  isActive: boolean;
  onToggle: () => void;
  viewportZoom: number;
  measurementPoints: MeasurementPoint[];
  measurementLines: MeasurementLine[];
  onAddPoint: (position: Position) => void;
  onClearMeasurements: () => void;
}

const MeasurementTools: React.FC<MeasurementToolsProps> = ({
  gridConfig,
  isActive,
  onToggle,
  viewportZoom,
  measurementPoints,
  measurementLines,
  onAddPoint,
  onClearMeasurements,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate total distance
  const totalDistance = measurementLines.reduce((sum, line) => sum + line.distance, 0);
  const totalGridDistance = measurementLines.reduce((sum, line) => sum + line.gridDistance, 0);

  // Convert pixels to grid units (assuming 5-foot squares in D&D)
  const pixelsToFeet = useCallback((pixels: number) => {
    return (pixels / gridConfig.cellSize) * 5;
  }, [gridConfig.cellSize]);

  const formatDistance = useCallback((pixels: number) => {
    const feet = pixelsToFeet(pixels);
    if (feet >= 5280) {
      return `${(feet / 5280).toFixed(2)} miles`;
    } else if (feet >= 1000) {
      return `${(feet / 1000).toFixed(1)}k ft`;
    } else {
      return `${Math.round(feet)} ft`;
    }
  }, [pixelsToFeet]);

  const handleToolToggle = useCallback(() => {
    onToggle();
    setIsExpanded(!isActive);
  }, [isActive, onToggle]);

  useEffect(() => {
    setIsExpanded(isActive);
  }, [isActive]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {/* Main Toggle Button */}
      <Tooltip title={isActive ? 'Exit Measurement Mode' : 'Measurement Tools'}>
        <IconButton
          onClick={handleToolToggle}
          sx={{
            backgroundColor: isActive ? 'primary.main' : 'background.paper',
            color: isActive ? 'primary.contrastText' : 'text.primary',
            '&:hover': {
              backgroundColor: isActive ? 'primary.dark' : 'action.hover',
            },
            boxShadow: 2,
          }}
        >
          <RulerIcon />
        </IconButton>
      </Tooltip>

      {/* Expanded Panel */}
      <Fade in={isExpanded}>
        <Paper
          elevation={4}
          sx={{
            p: 2,
            minWidth: 250,
            maxWidth: 350,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Measurements</Typography>
            <Box>
              <Tooltip title="Clear All Measurements">
                <IconButton
                  size="small"
                  onClick={onClearMeasurements}
                  disabled={measurementPoints.length === 0}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Instructions */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {measurementPoints.length === 0
              ? 'Click on the map to start measuring distances.'
              : measurementPoints.length === 1
              ? 'Click another point to measure distance.'
              : 'Click to add more measurement points.'}
          </Typography>

          {/* Current Measurements */}
          {measurementLines.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Distance Segments
              </Typography>
              {measurementLines.map((line, index) => (
                <Box
                  key={line.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                    borderBottom: index < measurementLines.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2">
                    Segment {index + 1}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={formatDistance(line.distance)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${line.gridDistance.toFixed(1)} squares`}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Total Distance */}
          {measurementLines.length > 1 && (
            <Box
              sx={{
                p: 1,
                backgroundColor: 'action.hover',
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Total Distance
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Chip
                  label={formatDistance(totalDistance)}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${totalGridDistance.toFixed(1)} squares`}
                  color="secondary"
                  size="small"
                />
              </Box>
            </Box>
          )}

          {/* Measurement Points */}
          {measurementPoints.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Points ({measurementPoints.length})
              </Typography>
              <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
                {measurementPoints.map((point, index) => (
                  <Box
                    key={point.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.5,
                      fontSize: '0.875rem',
                    }}
                  >
                    <Typography variant="body2">
                      Point {index + 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({Math.round(point.position.x)}, {Math.round(point.position.y)})
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Grid Information */}
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Grid: {gridConfig.cellSize}px = 5 feet
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Zoom: {Math.round(viewportZoom * 100)}%
            </Typography>
            {gridConfig.snapToGrid && (
              <Typography variant="caption" color="text.secondary" display="block">
                Snap to Grid: Enabled
              </Typography>
            )}
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};

export default MeasurementTools;