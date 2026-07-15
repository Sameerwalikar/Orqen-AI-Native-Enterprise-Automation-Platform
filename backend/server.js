const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Initialize WebSocket service
const webSocketService = require('./services/websocket');
webSocketService.initialize(server);

// Import routes
const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agents');
const vectorRoutes = require('./routes/vectors');
const workflowRoutes = require('./routes/workflows');
const pipelineRoutes = require('./routes/pipelines');
const connectorRoutes = require('./routes/connectors');
const oauthRoutes = require('./routes/oauth');
const scheduleRoutes = require('./routes/schedules');
const webhookRoutes = require('./routes/webhooks');
const analyticsRoutes = require('./routes/analytics');
const organizationRoutes = require('./routes/organizations');

// CORS configuration
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Agent routes
app.use('/api/agents', agentRoutes);

// Vector routes
app.use('/api/vectors', vectorRoutes);

// Workflow routes
app.use('/api/workflows', workflowRoutes);

// Pipeline routes
app.use('/api/pipelines', pipelineRoutes);
// Connector routes
app.use('/api/connectors', connectorRoutes);
// OAuth routes
app.use('/api/oauth', oauthRoutes);
// Schedule routes
app.use('/api/schedules', scheduleRoutes);
// Webhook routes
app.use('/api/webhooks', webhookRoutes);
// Analytics routes
app.use('/api/analytics', analyticsRoutes);
// Organization routes
app.use('/api/organizations', organizationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
});
