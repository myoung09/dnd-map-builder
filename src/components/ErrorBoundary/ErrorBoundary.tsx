import React, { Component, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console and potentially to error reporting service
    console.error('Error Boundary Caught:', error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            backgroundColor: 'background.default',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <Box sx={{ mb: 3 }}>
              <ErrorIcon
                sx={{
                  fontSize: 64,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              <Typography variant="h4" gutterBottom>
                Oops! Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                The D&D Map Builder encountered an unexpected error. This is likely a temporary issue.
              </Typography>
            </Box>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Error:</strong> {this.state.error?.message || 'Unknown error occurred'}
              </Typography>
              {this.state.error?.stack && (
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {this.state.error.stack.split('\n')[1]?.trim()}
                </Typography>
              )}
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                color="primary"
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              💡 <strong>Quick fixes to try:</strong>
              <br />
              • Your work is auto-saved, so you won't lose progress
              <br />
              • Try refreshing the page or clearing your browser cache
              <br />
              • Check that you have a stable internet connection
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="error-details-content"
                  id="error-details-header"
                >
                  <Typography variant="body2" color="text.secondary">
                    Developer Info (Development Mode)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                      Error Stack:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        backgroundColor: 'action.hover',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 200,
                        border: 1,
                        borderColor: 'divider',
                      }}
                    >
                      {this.state.error.stack}
                    </Box>
                    
                    {this.state.errorInfo && (
                      <>
                        <Typography variant="body2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                          Component Stack:
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            backgroundColor: 'action.hover',
                            p: 2,
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: 200,
                            border: 1,
                            borderColor: 'divider',
                          }}
                        >
                          {this.state.errorInfo.componentStack}
                        </Box>
                      </>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;