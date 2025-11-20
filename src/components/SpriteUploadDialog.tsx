import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Stack,
  Alert,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Upload as UploadIcon,
  GridOn as GridIcon,
} from '@mui/icons-material';
import { drawSpritesheetPreview } from '../utils/spriteUtils';

interface SpriteUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, spriteWidth: number, spriteHeight: number, name: string) => Promise<void>;
}

export const SpriteUploadDialog: React.FC<SpriteUploadDialogProps> = ({
  open,
  onClose,
  onUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [sheetName, setSheetName] = useState('');
  const [spriteWidth, setSpriteWidth] = useState(32);
  const [spriteHeight, setSpriteHeight] = useState(32);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);

  // Update preview when dimensions or image change
  useEffect(() => {
    if (previewUrl && canvasRef.current && previewImageRef.current) {
      const img = previewImageRef.current;
      if (img.complete && img.naturalWidth > 0) {
        drawSpritesheetPreview(canvasRef.current, img, spriteWidth, spriteHeight);
      }
    }
  }, [previewUrl, spriteWidth, spriteHeight]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setSelectedFile(file);
      setSheetName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setPreviewUrl(url);

        // Load image to draw preview
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            drawSpritesheetPreview(canvasRef.current, img, spriteWidth, spriteHeight);
          }
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (spriteWidth <= 0 || spriteHeight <= 0) {
      setError('Sprite dimensions must be greater than 0');
      return;
    }

    if (!sheetName.trim()) {
      setError('Please enter a name for the spritesheet');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await onUpload(selectedFile, spriteWidth, spriteHeight, sheetName);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload spritesheet');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setSheetName('');
    setSpriteWidth(32);
    setSpriteHeight(32);
    setError('');
    setIsUploading(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon />
          Upload Spritesheet
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* File Upload */}
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Select Spritesheet Image
            </Button>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
          </Paper>

          {/* Spritesheet Name */}
          <TextField
            label="Spritesheet Name"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            fullWidth
            disabled={isUploading}
            helperText="A descriptive name for this spritesheet"
          />

          {/* Sprite Dimensions */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GridIcon fontSize="small" />
              Sprite Dimensions (pixels)
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Width"
                type="number"
                value={spriteWidth}
                onChange={(e) => setSpriteWidth(Math.max(1, parseInt(e.target.value) || 1))}
                InputProps={{ inputProps: { min: 1, max: 512 } }}
                disabled={isUploading}
                fullWidth
              />
              <TextField
                label="Height"
                type="number"
                value={spriteHeight}
                onChange={(e) => setSpriteHeight(Math.max(1, parseInt(e.target.value) || 1))}
                InputProps={{ inputProps: { min: 1, max: 512 } }}
                disabled={isUploading}
                fullWidth
              />
            </Stack>
          </Box>

          {/* Preview */}
          {previewUrl && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Preview (grid overlay shows how sprites will be sliced)
              </Typography>
              <Box
                sx={{
                  maxHeight: '300px',
                  overflow: 'auto',
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    imageRendering: 'pixelated',
                  }}
                />
                <img
                  ref={previewImageRef}
                  src={previewUrl}
                  alt="Preview"
                  style={{ display: 'none' }}
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (canvasRef.current) {
                      drawSpritesheetPreview(canvasRef.current, img, spriteWidth, spriteHeight);
                    }
                  }}
                />
              </Box>
            </Paper>
          )}

          {isUploading && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Slicing spritesheet...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || isUploading}
        >
          Slice & Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};
