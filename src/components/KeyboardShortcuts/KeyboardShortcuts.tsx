import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Keyboard as KeyboardIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ open, onClose }) => {
  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'File Operations',
      shortcuts: [
        { keys: ['Ctrl', 'N'], description: 'New map' },
        { keys: ['Ctrl', 'O'], description: 'Open file manager' },
        { keys: ['Ctrl', 'S'], description: 'Save map' },
        { keys: ['Ctrl', 'E'], description: 'Export image' },
      ]
    },
    {
      title: 'Edit Operations',
      shortcuts: [
        { keys: ['Ctrl', 'Z'], description: 'Undo' },
        { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
        { keys: ['Ctrl', 'Y'], description: 'Redo (alternative)' },
      ]
    },
    {
      title: 'Tools',
      shortcuts: [
        { keys: ['B'], description: 'Brush tool' },
        { keys: ['E'], description: 'Eraser tool' },
        { keys: ['S'], description: 'Select tool' },
        { keys: ['R'], description: 'Rectangle tool' },
        { keys: ['C'], description: 'Circle tool' },
        { keys: ['O'], description: 'Object placement tool' },
      ]
    },
    {
      title: 'Panels & Dialogs',
      shortcuts: [
        { keys: ['Ctrl', 'L'], description: 'Layer panel' },
        { keys: ['Ctrl', 'A'], description: 'Asset browser' },
        { keys: ['Ctrl', 'G'], description: 'Grid settings' },
        { keys: ['Ctrl', 'I'], description: 'AI generation' },
        { keys: ['Escape'], description: 'Close all panels' },
      ]
    },
    {
      title: 'Grid & Measurement',
      shortcuts: [
        { keys: ['G'], description: 'Toggle grid visibility' },
        { keys: ['M'], description: 'Toggle measurement tools' },
      ]
    },
    {
      title: 'Brush Size',
      shortcuts: [
        { keys: ['1'], description: 'Brush size 1' },
        { keys: ['2'], description: 'Brush size 2' },
        { keys: ['3'], description: 'Brush size 3' },
        { keys: ['4'], description: 'Brush size 4' },
        { keys: ['5'], description: 'Brush size 5' },
        { keys: ['6'], description: 'Brush size 6' },
        { keys: ['7'], description: 'Brush size 7' },
        { keys: ['8'], description: 'Brush size 8' },
        { keys: ['9'], description: 'Brush size 9' },
      ]
    }
  ];

  const renderShortcutKey = (key: string) => (
    <Chip
      key={key}
      label={key}
      size="small"
      variant="outlined"
      sx={{
        minWidth: 'auto',
        height: 24,
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        backgroundColor: 'background.paper',
        borderColor: 'divider',
        '& .MuiChip-label': {
          px: 1
        }
      }}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <KeyboardIcon />
            <Typography variant="h6">Keyboard Shortcuts</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Use these keyboard shortcuts to work more efficiently with the D&D Map Builder.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {shortcutGroups.map((group, groupIndex) => (
            <Box key={group.title}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  color: 'primary.main',
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              >
                {group.title}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {group.shortcuts.map((shortcut, index) => (
                  <Box 
                    key={`${group.title}-${index}`}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      py: 0.5,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderRadius: 1,
                        px: 1,
                        mx: -1
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {shortcut.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={key}>
                          {keyIndex > 0 && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                mx: 0.5, 
                                color: 'text.secondary',
                                fontSize: '0.75rem'
                              }}
                            >
                              +
                            </Typography>
                          )}
                          {renderShortcutKey(key)}
                        </React.Fragment>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
              
              {groupIndex < shortcutGroups.length - 1 && (
                <Divider sx={{ mt: 3 }} />
              )}
            </Box>
          ))}
        </Box>

        <Box 
          sx={{ 
            mt: 4, 
            p: 2, 
            backgroundColor: 'action.hover', 
            borderRadius: 1,
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            💡 Pro Tips:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            • Keyboard shortcuts are disabled when typing in text fields
            <br />
            • Use number keys (1-9) to quickly change brush sizes
            <br />
            • Press ESC to close all open panels and dialogs
            <br />
            • Combine Ctrl+G to open grid settings or G alone to toggle grid visibility
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyboardShortcuts;