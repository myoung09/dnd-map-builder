import React from 'react';
import { Tooltip, TooltipProps, Box, Typography, Chip } from '@mui/material';

interface TooltipEnhancedProps extends Omit<TooltipProps, 'title'> {
  title: string;
  shortcut?: string;
  description?: string;
  status?: 'active' | 'disabled' | 'warning' | 'info';
  delay?: number;
}

const TooltipEnhanced: React.FC<TooltipEnhancedProps> = ({
  title,
  shortcut,
  description,
  status,
  delay = 500,
  children,
  ...props
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'success.main';
      case 'disabled':
        return 'text.disabled';
      case 'warning':
        return 'warning.main';
      case 'info':
        return 'info.main';
      default:
        return 'text.primary';
    }
  };

  const tooltipContent = (
    <Box sx={{ maxWidth: 250 }}>
      <Typography 
        variant="body2" 
        sx={{ 
          fontWeight: 600,
          color: getStatusColor(),
          mb: shortcut || description ? 0.5 : 0
        }}
      >
        {title}
      </Typography>
      
      {description && (
        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
          {description}
        </Typography>
      )}
      
      {shortcut && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Shortcut:
          </Typography>
          <Chip
            label={shortcut}
            size="small"
            variant="outlined"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontFamily: 'monospace',
              '& .MuiChip-label': {
                px: 0.5
              }
            }}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Tooltip
      title={tooltipContent}
      placement="bottom"
      arrow
      enterDelay={delay}
      leaveDelay={200}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: 1,
            borderColor: 'divider',
            boxShadow: 2,
            '& .MuiTooltip-arrow': {
              color: 'background.paper',
            },
          },
        },
      }}
      {...props}
    >
      <Box component="span" sx={{ display: 'inline-block' }}>
        {children}
      </Box>
    </Tooltip>
  );
};

export default TooltipEnhanced;