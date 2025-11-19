import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Card,
  Chip,
  Tooltip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Checkbox,
  Stack
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import { Workspace, WorkspaceMap } from '../types/workspace';

export interface WorkspaceViewProps {
  workspace: Workspace | null;
  onSelectMap: (mapId: string) => void;
  onRegenerateMap: (mapId: string) => void;
  onDeleteMap: (mapId: string) => void;
  onRenameWorkspace?: (newName: string) => void;
  onClearWorkspace?: () => void;
  onAddMap?: () => void;
  onClose?: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  workspace,
  onSelectMap,
  onRegenerateMap,
  onDeleteMap,
  onRenameWorkspace,
  onClearWorkspace,
  onAddMap,
  onClose
}) => {
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!workspace) {
    return (
      <Box p={4} textAlign="center">
        <MapIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No workspace loaded
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Use the Campaign Wizard to create a new workspace from your campaign write-up
        </Typography>
      </Box>
    );
  }

  // Filter and sort maps
  const filteredMaps = workspace.maps.filter(map => {
    if (filterCategory === 'all') return true;
    return map.category === filterCategory;
  });

  const sortedMaps = [...filteredMaps].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  const categories = Array.from(new Set(workspace.maps.map(m => m.category)));

  const handleSelectAll = () => {
    if (selectedMaps.length === sortedMaps.length) {
      setSelectedMaps([]);
    } else {
      setSelectedMaps(sortedMaps.map(m => m.id));
    }
  };

  const handleToggleSelect = (mapId: string) => {
    setSelectedMaps(prev =>
      prev.includes(mapId)
        ? prev.filter(id => id !== mapId)
        : [...prev, mapId]
    );
  };

  const handleDeleteSelected = () => {
    selectedMaps.forEach(mapId => onDeleteMap(mapId));
    setSelectedMaps([]);
    setDeleteConfirmOpen(false);
  };

  const handleRenameWorkspace = () => {
    if (newWorkspaceName.trim() && onRenameWorkspace) {
      onRenameWorkspace(newWorkspaceName.trim());
      setRenameDialogOpen(false);
      setNewWorkspaceName('');
    }
  };

  const openRenameDialog = () => {
    setNewWorkspaceName(workspace.metadata.name);
    setRenameDialogOpen(true);
    setMenuAnchor(null);
  };

  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Header with Actions */}
      <Box p={2} borderBottom={1} borderColor="divider">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1} flex={1}>
            <MapIcon color="primary" />
            <Typography variant="h6" noWrap sx={{ maxWidth: '300px' }}>
              {workspace.metadata.name}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Workspace Actions">
              <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
            {onClose && (
              <Tooltip title="Close Workspace">
                <IconButton size="small" onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {workspace.metadata.description && (
          <Typography variant="body2" color="text.secondary" mb={1}>
            {workspace.metadata.description}
          </Typography>
        )}

        {/* Stats */}
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          <Chip label={`${workspace.maps.length} maps`} size="small" color="primary" variant="outlined" />
          <Chip 
            label={`Created ${new Date(workspace.metadata.createdAt).toLocaleDateString()}`} 
            size="small" 
            variant="outlined" 
          />
          {workspace.metadata.author && (
            <Chip label={`By ${workspace.metadata.author}`} size="small" variant="outlined" />
          )}
        </Box>

        {/* Filters and Actions */}
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="date">Last Modified</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="category">Category</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              label="Category"
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {sortedMaps.length > 0 && (
            <Tooltip title={selectedMaps.length === sortedMaps.length ? "Deselect All" : "Select All"}>
              <IconButton size="small" onClick={handleSelectAll}>
                <SelectAllIcon />
              </IconButton>
            </Tooltip>
          )}

          {selectedMaps.length > 0 && (
            <Tooltip title={`Delete ${selectedMaps.length} selected`}>
              <IconButton size="small" color="error" onClick={() => setDeleteConfirmOpen(true)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {selectedMaps.length > 0 && (
          <Alert severity="info" sx={{ mt: 1 }}>
            {selectedMaps.length} map{selectedMaps.length !== 1 ? 's' : ''} selected
          </Alert>
        )}
      </Box>

      {/* Maps List */}
      <Box flex={1} overflow="auto" p={2}>
        {sortedMaps.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              {filterCategory === 'all' 
                ? 'No maps in workspace' 
                : `No maps in category "${filterCategory}"`}
            </Typography>
            {onAddMap && (
              <Button
                startIcon={<AddIcon />}
                onClick={onAddMap}
                sx={{ mt: 2 }}
              >
                Add Map
              </Button>
            )}
          </Box>
        ) : (
          <List>
            {sortedMaps.map((map: WorkspaceMap) => (
              <Card key={map.id} sx={{ mb: 1 }}>
                <ListItem
                  secondaryAction={
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="View Map">
                        <IconButton 
                          edge="end" 
                          onClick={() => onSelectMap(map.id)}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Regenerate Map">
                        <IconButton 
                          edge="end" 
                          onClick={() => onRegenerateMap(map.id)}
                          size="small"
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Map">
                        <IconButton 
                          edge="end" 
                          onClick={() => onDeleteMap(map.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <Checkbox
                    checked={selectedMaps.includes(map.id)}
                    onChange={() => handleToggleSelect(map.id)}
                    sx={{ mr: 1 }}
                  />
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6">{map.name}</Typography>
                        <Chip label={map.category} size="small" color="secondary" variant="outlined" />
                        {map.tags.filter(t => t).map((tag, idx) => (
                          <Chip key={idx} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {map.description || 'No description'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                          {(map.mapData as any).width}x{(map.mapData as any).height} | 
                          Terrain: {(map.mapData as any).terrainType} |
                          Modified: {new Date(map.lastModified).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </Card>
            ))}
          </List>
        )}
      </Box>

      {/* Workspace Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {onRenameWorkspace && (
          <MenuItem onClick={openRenameDialog}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Rename Workspace
          </MenuItem>
        )}
        {onAddMap && (
          <MenuItem onClick={() => { onAddMap(); setMenuAnchor(null); }}>
            <AddIcon sx={{ mr: 1 }} fontSize="small" />
            Add Map
          </MenuItem>
        )}
        <Divider />
        {onClearWorkspace && (
          <MenuItem onClick={() => { onClearWorkspace(); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
            <ClearIcon sx={{ mr: 1 }} fontSize="small" />
            Clear Workspace
          </MenuItem>
        )}
      </Menu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename Workspace</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Workspace Name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRenameWorkspace()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameWorkspace} variant="contained">Rename</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Selected Maps?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedMaps.length} map{selectedMaps.length !== 1 ? 's' : ''}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteSelected} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
