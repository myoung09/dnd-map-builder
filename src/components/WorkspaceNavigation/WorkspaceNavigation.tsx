import React, { useState, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Badge
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Map as MapIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Label as TagIcon
} from '@mui/icons-material';
import { 
  Workspace, 
  WorkspaceFolder, 
  WorkspaceMap 
} from '../../types/workspace';
import workspaceService from '../../services/workspaceService';

interface WorkspaceNavigationProps {
  workspace: Workspace | null;
  selectedMapId: string | null;
  onMapSelected: (mapId: string) => void;
  onWorkspaceChanged: (workspace: Workspace) => void;
  open: boolean;
  onClose: () => void;
  width?: number;
}

interface FolderItemProps {
  folder: WorkspaceFolder;
  workspace: Workspace;
  selectedMapId: string | null;
  onMapSelected: (mapId: string) => void;
  onFolderToggle: (folderId: string) => void;
  onFolderAction: (folderId: string, action: string) => void;
  searchQuery: string;
}

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  workspace,
  selectedMapId,
  onMapSelected,
  onFolderToggle,
  onFolderAction,
  searchQuery
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const mapsInFolder = workspaceService.getMapsInFolder(folder.id);
  const filteredMaps = mapsInFolder.filter(map => 
    !searchQuery || 
    map.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    map.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action: string) => {
    onFolderAction(folder.id, action);
    handleMenuClose();
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton 
          onClick={() => onFolderToggle(folder.id)}
          sx={{ 
            pl: 3,
            borderLeft: folder.color ? `4px solid ${folder.color}` : 'none' 
          }}
        >
          <ListItemIcon>
            {folder.isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
          </ListItemIcon>
          <ListItemText 
            primary={folder.name}
            secondary={`${filteredMaps.length} maps`}
          />
          <ListItemSecondaryAction>
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItemButton>
      </ListItem>

      <Collapse in={folder.isExpanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {filteredMaps.map(map => (
            <MapItem 
              key={map.id}
              map={map}
              selected={selectedMapId === map.id}
              onMapSelected={onMapSelected}
              depth={1}
            />
          ))}
        </List>
      </Collapse>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuAction('rename')}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('delete')}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('color')}>
          <TagIcon fontSize="small" sx={{ mr: 1 }} />
          Set Color
        </MenuItem>
      </Menu>
    </>
  );
};

interface MapItemProps {
  map: WorkspaceMap;
  selected: boolean;
  onMapSelected: (mapId: string) => void;
  depth?: number;
}

const MapItem: React.FC<MapItemProps> = ({ map, selected, onMapSelected, depth = 0 }) => {
  const getCategoryColor = (category: WorkspaceMap['category']): string => {
    const colors: Record<WorkspaceMap['category'], string> = {
      'dungeon': '#8B4513',
      'overworld': '#228B22',
      'city': '#4682B4',
      'building': '#DAA520',
      'encounter': '#DC143C',
      'other': '#696969'
    };
    return colors[category] || colors.other;
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={selected}
        onClick={() => onMapSelected(map.id)}
        sx={{ 
          pl: 4 + depth * 2,
          opacity: map.isArchived ? 0.6 : 1
        }}
      >
        <ListItemIcon>
          <MapIcon sx={{ color: getCategoryColor(map.category) }} />
        </ListItemIcon>
        <ListItemText 
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {map.name}
              {map.isArchived && (
                <Chip 
                  label="Archived" 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="text.secondary">
                {map.description || 'No description'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip 
                  label={map.category} 
                  size="small"
                  sx={{ 
                    fontSize: '0.6rem',
                    height: '16px',
                    backgroundColor: getCategoryColor(map.category),
                    color: 'white'
                  }}
                />
                {map.tags.slice(0, 2).map(tag => (
                  <Chip 
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                ))}
                {map.tags.length > 2 && (
                  <Chip 
                    label={`+${map.tags.length - 2}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '16px' }}
                  />
                )}
              </Box>
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

const WorkspaceNavigation: React.FC<WorkspaceNavigationProps> = ({
  workspace,
  selectedMapId,
  onMapSelected,
  onWorkspaceChanged,
  open,
  onClose,
  width = 300
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WorkspaceMap['category'] | 'all'>('all');

  const handleFolderToggle = useCallback((folderId: string) => {
    if (!workspace) return;

    const folder = workspace.folders.find(f => f.id === folderId);
    if (folder) {
      folder.isExpanded = !folder.isExpanded;
      onWorkspaceChanged({ ...workspace });
    }
  }, [workspace, onWorkspaceChanged]);

  const handleFolderAction = useCallback((folderId: string, action: string) => {
    if (!workspace) return;

    switch (action) {
      case 'delete':
        workspaceService.deleteFolder(folderId, false);
        onWorkspaceChanged(workspaceService.getCurrentWorkspace()!);
        break;
      case 'rename':
        // TODO: Implement rename dialog
        break;
      case 'color':
        // TODO: Implement color picker
        break;
    }
  }, [workspace, onWorkspaceChanged]);

  if (!workspace) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        variant="temporary"
        sx={{
          width: width,
          '& .MuiDrawer-paper': {
            width: width,
            boxSizing: 'border-box'
          }
        }}
      >
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No Workspace Loaded
          </Typography>
        </Box>
      </Drawer>
    );
  }

  // Filter maps by search query and category
  const rootMaps = workspaceService.getMapsInFolder();
  const filteredRootMaps = rootMaps.filter(map => {
    const matchesSearch = !searchQuery || 
      map.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      map.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || map.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get category counts
  const categoryCounts = workspace.maps.reduce((acc, map) => {
    acc[map.category] = (acc[map.category] || 0) + 1;
    return acc;
  }, {} as Record<WorkspaceMap['category'], number>);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        width: width,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box'
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" noWrap>
            {workspace.metadata.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {workspace.metadata.mapCount} maps • {workspace.folders.length} folders
          </Typography>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search maps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Category Filter */}
        <Box sx={{ px: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label="All"
              size="small"
              variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
              onClick={() => setSelectedCategory('all')}
              clickable
            />
            {Object.entries(categoryCounts).map(([category, count]) => (
              <Chip
                key={category}
                label={
                  <Badge badgeContent={count} color="primary" max={99}>
                    {category}
                  </Badge>
                }
                size="small"
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                onClick={() => setSelectedCategory(category as WorkspaceMap['category'])}
                clickable
              />
            ))}
          </Box>
        </Box>

        {/* Maps List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List dense>
            {/* Folders */}
            {workspace.folders
              .filter(folder => !folder.parentId) // Root folders only
              .map(folder => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  workspace={workspace}
                  selectedMapId={selectedMapId}
                  onMapSelected={onMapSelected}
                  onFolderToggle={handleFolderToggle}
                  onFolderAction={handleFolderAction}
                  searchQuery={searchQuery}
                />
              ))
            }

            {/* Root level maps */}
            {filteredRootMaps.length > 0 && (
              <>
                {workspace.folders.length > 0 && <Divider />}
                {filteredRootMaps.map(map => (
                  <MapItem
                    key={map.id}
                    map={map}
                    selected={selectedMapId === map.id}
                    onMapSelected={onMapSelected}
                  />
                ))}
              </>
            )}

            {/* No results */}
            {workspace.maps.length === 0 && (
              <ListItem>
                <ListItemText 
                  primary="No maps in workspace"
                  secondary="Import or create your first map"
                  sx={{ textAlign: 'center', py: 4 }}
                />
              </ListItem>
            )}

            {searchQuery && filteredRootMaps.length === 0 && workspace.maps.length > 0 && (
              <ListItem>
                <ListItemText 
                  primary="No maps match your search"
                  secondary="Try a different search term"
                  sx={{ textAlign: 'center', py: 4 }}
                />
              </ListItem>
            )}
          </List>
        </Box>

        {/* Actions */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Tooltip title="Add new folder">
            <IconButton size="small">
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Archive selected">
            <IconButton size="small">
              <ArchiveIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Drawer>
  );
};

export default WorkspaceNavigation;