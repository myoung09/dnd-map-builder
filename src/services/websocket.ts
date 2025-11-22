// WebSocket service for DM/Player synchronization

import { WSEvent, WSEventType, WSConnectionState } from '../types/dm';

type EventListener = (event: WSEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<WSEventType | 'ALL', Set<EventListener>> = new Map();
  private connectionState: WSConnectionState = {
    connected: false,
    sessionId: null,
    role: null,
    error: null,
  };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(sessionId: string, role: 'dm' | 'player'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // For development, use localhost:7000. In production, use environment variable
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:7000';
        this.ws = new WebSocket(`${wsUrl}?sessionId=${sessionId}&role=${role}`);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected', { sessionId, role });
          this.connectionState = {
            connected: true,
            sessionId,
            role,
            error: null,
          };
          this.reconnectAttempts = 0;
          this.notifyConnectionChange();
          resolve();
        };

        this.ws.onmessage = async (event) => {
          try {
            let data = event.data;
            
            // Handle Blob data (happens with large messages)
            if (data instanceof Blob) {
              console.log('[WebSocket] Received Blob, converting to text...');
              data = await data.text();
            }
            
            const wsEvent: WSEvent = JSON.parse(data);
            console.log('[WebSocket] Received event:', wsEvent.type);
            this.handleEvent(wsEvent);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error, 'Data:', event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.connectionState.error = 'Connection error';
          this.notifyConnectionChange();
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.connectionState.connected = false;
          this.notifyConnectionChange();
          this.attemptReconnect(sessionId, role);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = {
      connected: false,
      sessionId: null,
      role: null,
      error: null,
    };
    this.notifyConnectionChange();
  }

  send(event: WSEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send event, not connected');
      return;
    }

    try {
      const message = JSON.stringify(event);
      const sizeKB = (new Blob([message]).size / 1024).toFixed(2);
      console.log(`[WebSocket] Sending event: ${event.type} (${sizeKB} KB)`);
      
      // Warn if message is very large
      if (parseFloat(sizeKB) > 1000) {
        console.warn('[WebSocket] Large message detected, may cause performance issues');
      }
      
      this.ws.send(message);
    } catch (error) {
      console.error('[WebSocket] Failed to send event:', error);
    }
  }

  on(eventType: WSEventType | 'ALL', listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  private handleEvent(event: WSEvent): void {
    // Notify specific event listeners
    const specificListeners = this.listeners.get(event.type);
    if (specificListeners) {
      specificListeners.forEach((listener) => listener(event));
    }

    // Notify wildcard listeners
    const allListeners = this.listeners.get('ALL');
    if (allListeners) {
      allListeners.forEach((listener) => listener(event));
    }
  }

  private notifyConnectionChange(): void {
    // Emit a connection state change event to all listeners
    console.log('[WebSocket] Connection state changed:', this.connectionState);
  }

  private attemptReconnect(sessionId: string, role: 'dm' | 'player'): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      this.connectionState.error = 'Failed to reconnect';
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect(sessionId, role).catch((error) => {
        console.error('[WebSocket] Reconnect failed:', error);
      });
    }, delay);
  }

  getConnectionState(): WSConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.connectionState.connected;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
