import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { authAPI } from '@/lib/api/auth';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToResource: (resourceType: string, resourceId: string) => void;
  unsubscribeFromResource: (resourceType: string, resourceId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Get token from authAPI
    const token = authAPI.getToken();
    if (!token) {
      return;
    }

    // Initialize Socket.IO client
    const newSocket = io(API_BASE_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [user]);

  const subscribeToResource = (resourceType: string, resourceId: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe:resource', { resourceType, resourceId });
    }
  };

  const unsubscribeFromResource = (resourceType: string, resourceId: string) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe:resource', { resourceType, resourceId });
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        subscribeToResource,
        unsubscribeFromResource,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

