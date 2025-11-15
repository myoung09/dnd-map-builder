import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileCopy as ExportIcon
} from '@mui/icons-material';
import { 
  Workspace, 
  WorkspaceMetadata, 
  WorkspaceImportResult 
} from '../../types/workspace';
import workspaceService from '../../services/workspaceService';

interface WorkspaceManagerProps {
  open: boolean;
  onClose: () => void;
  onWorkspaceSelected: (workspace: Workspace) => void;
  currentWorkspace: Workspace | null;
}

interface CreateWorkspaceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, author: string, description: string) => void;
}

const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  open,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), author.trim(), description.trim());
      setName('');
      setAuthor('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Workspace</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Workspace Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            placeholder="My D&D Campaign"
          />
          <TextField
            label="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            fullWidth
            placeholder="Your Name"
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="A collection of maps for my campaign..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleCreate} 
          variant="contained"
          disabled={!name.trim()}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  open,
  onClose,
  onWorkspaceSelected,
  currentWorkspace
}) => {
  const [recentWorkspaces, setRecentWorkspaces] = useState<WorkspaceMetadata[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<WorkspaceImportResult | null>(null);
  const [dragOverlay, setDragOverlay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateWorkspace = useCallback((name: string, author: string, description: string) => {
    const workspace = workspaceService.createWorkspace(name, author, description);
    onWorkspaceSelected(workspace);
    onClose();
  }, [onWorkspaceSelected, onClose]);

  const handleExportWorkspace = useCallback(() => {
    if (!currentWorkspace) return;
    
    try {
      const exportData = workspaceService.exportWorkspace();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const workspaceName = currentWorkspace.metadata?.name || 'workspace';
      a.download = `${workspaceName.replace(/[^a-z0-9]/gi, '_')}_workspace.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export workspace:', error);
    }
  }, [currentWorkspace]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setImportResult(null);

    const processFiles = async () => {
      const fileArray: any[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const content = await file.text();
          fileArray.push({
            name: file.name,
            path: file.name,
            type: file.type,
            size: file.size,
            content: content
          });
        } catch (error) {
          console.error(`Failed to read file ${file.name}:`, error);
        }
      }

      try {
        const result = await workspaceService.importFromFiles(fileArray);
        setImportResult(result);
        
        if (result.success && result.workspace) {
          onWorkspaceSelected(result.workspace);
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (error) {
        setImportResult({
          success: false,
          errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
          mapsImported: 0,
          assetsImported: 0
        });
      }
      
      setIsLoading(false);
    };

    processFiles();
  }, [onWorkspaceSelected, onClose]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverlay(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverlay(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverlay(false);

    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  }, [handleFileUpload]);

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderIcon />
          Workspace Manager
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Current Workspace */}
            {currentWorkspace && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Current Workspace
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">{currentWorkspace.metadata.name}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      by {currentWorkspace.metadata.author}
                    </Typography>
                    <Typography variant="body2">
                      {currentWorkspace.metadata.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={`${currentWorkspace.metadata.mapCount} maps`} 
                        size="small" 
                      />
                      <Chip 
                        label={`Created ${currentWorkspace.metadata.createdAt.toLocaleDateString()}`} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      startIcon={<ExportIcon />}
                      onClick={handleExportWorkspace}
                      size="small"
                    >
                      Export
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            )}

            {/* Import/Upload Area */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Import Workspace
              </Typography>
              
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: dragOverlay ? 'primary.main' : 'divider',
                  backgroundColor: dragOverlay ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {isLoading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress />
                    <Typography>Importing workspace...</Typography>
                  </Box>
                ) : (
                  <>
                    <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Drop workspace files here or click to browse
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supports .json workspace files or folder structures
                    </Typography>
                  </>
                )}
              </Paper>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".json,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
            </Box>

            {/* Import Results */}
            {importResult && (
              <Box>
                {importResult.success ? (
                  <Alert severity="success">
                    Workspace imported successfully! 
                    {importResult.mapsImported > 0 && ` ${importResult.mapsImported} maps imported.`}
                    {importResult.assetsImported > 0 && ` ${importResult.assetsImported} assets imported.`}
                  </Alert>
                ) : (
                  <Alert severity="error">
                    Import failed:
                    <ul>
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
                
                {importResult.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Warnings:
                    <ul>
                      {importResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
              </Box>
            )}

            {/* Create New Workspace */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Create New Workspace
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDialog(true)}
                fullWidth
                size="large"
              >
                New Campaign Workspace
              </Button>
            </Box>

            {/* Recent Workspaces */}
            {recentWorkspaces.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Recent Workspaces
                </Typography>
                <List>
                  {recentWorkspaces.map((workspace, index) => (
                    <React.Fragment key={workspace.id}>
                      <ListItem>
                        <ListItemText
                          primary={workspace.name}
                          secondary={`by ${workspace.author} • ${workspace.mapCount} maps`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end">
                            <FolderOpenIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < recentWorkspaces.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>

        {/* Drag Overlay */}
        {dragOverlay && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              border: '3px dashed',
              borderColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <UploadIcon sx={{ fontSize: 64, color: 'primary.main' }} />
              <Typography variant="h5" color="primary">
                Drop files to import workspace
              </Typography>
            </Box>
          </Box>
        )}
      </Dialog>

      <CreateWorkspaceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateWorkspace}
      />
    </>
  );
};

export default WorkspaceManager;