import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  IconButton
} from '@mui/material';
import {
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Close as CloseIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { DnDMap } from '../../types/map';
import { imageExportService, ExportOptions } from '../../services/imageExportService';
import { EXPORT_SETTINGS } from '../../utils/constants';

interface ImageExportDialogProps {
  open: boolean;
  onClose: () => void;
  map: DnDMap;
}

const ImageExportDialog: React.FC<ImageExportDialogProps> = ({
  open,
  onClose,
  map
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    quality: EXPORT_SETTINGS.QUALITY.HIGH,
    dpi: EXPORT_SETTINGS.DEFAULT_DPI,
    includeGrid: true,
    scale: 1
  });
  
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update filename when map changes
  useEffect(() => {
    if (map) {
      const cleanName = map.metadata.name.replace(/[^a-z0-9]/gi, '_');
      setFilename(`${cleanName}.${options.format}`);
    }
  }, [map, options.format]);

  // Update estimated file size when options change
  useEffect(() => {
    if (map) {
      const size = imageExportService.getEstimatedFileSize(map, options);
      setEstimatedSize(size);
    }
  }, [map, options]);

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handlePreview = async () => {
    if (!map) return;
    
    setLoading(true);
    try {
      // Create a smaller preview
      const previewOptions = {
        ...options,
        scale: 0.25 // Quarter size for preview
      };
      
      const result = await imageExportService.exportMapToDataUrl(map, previewOptions);
      
      if (result.success && result.dataUrl) {
        setPreview(result.dataUrl);
        setMessage({ type: 'success', text: 'Preview generated' });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate preview' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!map) return;
    
    setLoading(true);
    try {
      const result = await imageExportService.downloadMapAsImage(map, filename, options);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // Auto-close after successful export
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Export failed' });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 0.9) return 'High';
    if (quality >= 0.7) return 'Medium';
    return 'Low';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ImageIcon />
        Export Map as Image
        <Box sx={{ ml: 'auto' }}>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Export Options */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Export Settings
            </Typography>
            
            {/* Filename */}
            <TextField
              fullWidth
              label="Filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Format */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Format</InputLabel>
              <Select
                value={options.format}
                onChange={(e) => handleOptionChange('format', e.target.value)}
                label="Format"
              >
                <MenuItem value="png">PNG (Lossless)</MenuItem>
                <MenuItem value="jpeg">JPEG (Compressed)</MenuItem>
                <MenuItem value="webp">WebP (Modern)</MenuItem>
              </Select>
            </FormControl>

            {/* Quality */}
            {(options.format === 'jpeg' || options.format === 'webp') && (
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>
                  Quality: {getQualityLabel(options.quality)} ({Math.round(options.quality * 100)}%)
                </Typography>
                <Slider
                  value={options.quality}
                  onChange={(_, value) => handleOptionChange('quality', value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  marks={[
                    { value: 0.6, label: 'Low' },
                    { value: 0.8, label: 'Med' },
                    { value: 1, label: 'High' }
                  ]}
                />
              </Box>
            )}

            {/* DPI */}
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                DPI: {options.dpi} (Scale: {((options.dpi / 96) * 100).toFixed(0)}%)
              </Typography>
              <Slider
                value={options.dpi}
                onChange={(_, value) => handleOptionChange('dpi', value)}
                min={72}
                max={EXPORT_SETTINGS.MAX_DPI}
                step={24}
                marks={[
                  { value: 72, label: '72' },
                  { value: 150, label: '150' },
                  { value: 300, label: '300' },
                  { value: 600, label: '600' }
                ]}
              />
            </Box>

            {/* Include Grid */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includeGrid}
                  onChange={(e) => handleOptionChange('includeGrid', e.target.checked)}
                />
              }
              label="Include Grid Lines"
              sx={{ mb: 2 }}
            />

            {/* File Size Info */}
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Estimated File Size
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={formatFileSize(estimatedSize)} 
                  color="primary" 
                  variant="outlined" 
                />
                <Typography variant="body2" color="text.secondary">
                  Dimensions: {map.dimensions.width * map.gridConfig.cellSize * (options.dpi / 96)} × {map.dimensions.height * map.gridConfig.cellSize * (options.dpi / 96)} px
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* Preview */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            
            <Box 
              sx={{ 
                width: '100%', 
                height: 300, 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                overflow: 'hidden'
              }}
            >
              {preview ? (
                <img 
                  src={preview} 
                  alt="Map preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }} 
                />
              ) : (
                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <ImageIcon sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2">
                    Click "Generate Preview" to see how your exported image will look
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              fullWidth
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Generate Preview
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={loading || !filename.trim()}
        >
          Export Image
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageExportDialog;