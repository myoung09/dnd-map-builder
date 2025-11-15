import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { fileService, SavedMapInfo } from '../../services/fileService';
import { DnDMap } from '../../types/map';

interface FileManagerProps {
  open: boolean;
  onClose: () => void;
  currentMap?: DnDMap;
  onLoadMap: (map: DnDMap) => void;
  onSaveMap: (map: DnDMap) => void;
}

const FileManager: React.FC<FileManagerProps> = ({
  open,
  onClose,
  currentMap,
  onLoadMap,
  onSaveMap
}) => {
  const [savedMaps, setSavedMaps] = useState<SavedMapInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 0, percentage: 0 });

  // Load saved maps when dialog opens
  useEffect(() => {
    if (open) {
      loadSavedMaps();
      updateStorageInfo();
    }
  }, [open]);

  const loadSavedMaps = () => {
    const maps = fileService.getSavedMapsList();
    setSavedMaps(maps.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    ));
  };

  const updateStorageInfo = () => {
    setStorageInfo(fileService.getStorageInfo());
  };

  const handleSaveMap = async () => {
    if (!currentMap) return;
    
    setLoading(true);
    try {
      const result = fileService.saveMapToStorage(currentMap);
      showMessage(result.success ? 'success' : 'error', result.message);
      
      if (result.success) {
        onSaveMap(currentMap);
        loadSavedMaps();
        updateStorageInfo();
      }
    } catch (error) {
      showMessage('error', 'Failed to save map');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMap = async (mapId: string) => {
    setLoading(true);
    try {
      const result = fileService.loadMapFromStorage(mapId);
      
      if (result.success && result.data) {
        onLoadMap(result.data);
        showMessage('success', result.message);
        onClose();
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to load map');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMap = async (mapId: string, mapName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${mapName}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const result = fileService.deleteMapFromStorage(mapId);
      showMessage(result.success ? 'success' : 'error', result.message);
      
      if (result.success) {
        loadSavedMaps();
        updateStorageInfo();
      }
    } catch (error) {
      showMessage('error', 'Failed to delete map');
    } finally {
      setLoading(false);
    }
  };

  const handleExportMap = async (mapId: string) => {
    setLoading(true);
    try {
      const loadResult = fileService.loadMapFromStorage(mapId);
      
      if (loadResult.success && loadResult.data) {
        const exportResult = fileService.exportMapToFile(loadResult.data);
        showMessage(exportResult.success ? 'success' : 'error', exportResult.message);
      } else {
        showMessage('error', 'Failed to load map for export');
      }
    } catch (error) {
      showMessage('error', 'Failed to export map');
    } finally {
      setLoading(false);
    }
  };

  const handleImportMap = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setLoading(true);
      try {
        const result = await fileService.importMapFromFile(file);
        
        if (result.success && result.data) {
          // Save the imported map
          const saveResult = fileService.saveMapToStorage(result.data);
          if (saveResult.success) {
            onLoadMap(result.data);
            showMessage('success', 'Map imported and loaded successfully');
            loadSavedMaps();
            updateStorageInfo();
            onClose();
          } else {
            showMessage('error', 'Map imported but failed to save');
          }
        } else {
          showMessage('error', result.message);
        }
      } catch (error) {
        showMessage('error', 'Failed to import map');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredMaps = savedMaps.filter(map =>
    map.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
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
        <FolderIcon />
        File Manager
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

        {/* Storage Info */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Storage Usage: {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.available)} ({storageInfo.percentage}%)
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={storageInfo.percentage} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Current Map Actions */}
        {currentMap && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Current Map: {currentMap.metadata.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={handleSaveMap}
                disabled={loading}
              >
                Save Map
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                variant="outlined"
                onClick={() => currentMap && fileService.exportMapToFile(currentMap)}
                disabled={loading}
              >
                Export Map
              </Button>
            </Box>
            <Divider />
          </Box>
        )}

        {/* Import Section */}
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<UploadIcon />}
            variant="outlined"
            onClick={handleImportMap}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            Import Map
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search maps..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        {/* Maps List */}
        <Typography variant="h6" gutterBottom>
          Saved Maps ({filteredMaps.length})
        </Typography>
        
        {filteredMaps.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No maps found matching your search.' : 'No saved maps found.'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredMaps.map((map) => (
              <ListItem
                key={map.id}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  mb: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{map.name}</Typography>
                      <Chip 
                        label={formatFileSize(map.size)} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      Last modified: {formatDate(map.lastModified)}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleLoadMap(map.id)}
                      disabled={loading}
                    >
                      Load
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleExportMap(map.id)}
                      disabled={loading}
                      title="Export"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteMap(map.id, map.name)}
                      disabled={loading}
                      color="error"
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileManager;