/**
 * WebSocket Service
 * Handles real-time communication for analytics updates
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId[]
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(server) {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

    this.io = new Server(server, {
      cors: {
        origin: FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.userId = decoded.userId;
        socket.organizationId = decoded.organizationId;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket) => {
      const userId = socket.userId;
      const organizationId = socket.organizationId;

      console.log(`WebSocket: User ${userId} connected (socket: ${socket.id})`);

      // Track connected user
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, []);
      }
      this.connectedUsers.get(userId).push(socket.id);

      // Join organization room for organization-level updates
      if (organizationId) {
        socket.join(`org:${organizationId}`);
      }

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`WebSocket: User ${userId} disconnected (socket: ${socket.id})`);
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          const index = userSockets.indexOf(socket.id);
          if (index > -1) {
            userSockets.splice(index, 1);
          }
          if (userSockets.length === 0) {
            this.connectedUsers.delete(userId);
          }
        }
      });

      // Handle subscription to specific resource
      socket.on('subscribe:resource', (data) => {
        const { resourceType, resourceId } = data;
        if (resourceType && resourceId) {
          socket.join(`resource:${resourceType}:${resourceId}`);
          console.log(`WebSocket: User ${userId} subscribed to ${resourceType}:${resourceId}`);
        }
      });

      // Handle unsubscription
      socket.on('unsubscribe:resource', (data) => {
        const { resourceType, resourceId } = data;
        if (resourceType && resourceId) {
          socket.leave(`resource:${resourceType}:${resourceId}`);
          console.log(`WebSocket: User ${userId} unsubscribed from ${resourceType}:${resourceId}`);
        }
      });
    });

    console.log('WebSocket service initialized');
  }

  /**
   * Emit metric update to relevant users
   */
  emitMetricUpdate(metricData) {
    if (!this.io) return;

    const { userId, organizationId, resourceType, resourceId } = metricData;

    // Emit to user
    this.io.to(`user:${userId}`).emit('metric:update', metricData);

    // Emit to organization
    if (organizationId) {
      this.io.to(`org:${organizationId}`).emit('metric:update', metricData);
    }

    // Emit to specific resource subscribers
    if (resourceType && resourceId) {
      this.io.to(`resource:${resourceType}:${resourceId}`).emit('metric:update', metricData);
    }

    // Emit to analytics dashboard subscribers
    this.io.emit('analytics:update', metricData);
  }

  /**
   * Emit execution status update
   */
  emitExecutionUpdate(executionData) {
    if (!this.io) return;

    const { userId, organizationId, resourceType, resourceId, status } = executionData;

    // Emit to user
    this.io.to(`user:${userId}`).emit('execution:update', executionData);

    // Emit to organization
    if (organizationId) {
      this.io.to(`org:${organizationId}`).emit('execution:update', executionData);
    }

    // Emit to specific resource subscribers
    if (resourceType && resourceId) {
      this.io.to(`resource:${resourceType}:${resourceId}`).emit('execution:update', executionData);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService;

