const express = require('express');
const cors = require('cors');
require('dotenv').config();

const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./utils/errorHandler');
const apiRoutes = require('./routes/api');
const botRoutes = require('./routes/bot');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());

// CRITICAL: Parse JSON for /api/messages and preserve raw body
// CloudAdapter validates JWT from Authorization header, not body
// But we preserve raw body just in case
app.use('/api/messages', express.json({ 
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Standard JSON parsing for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  // Detailed console logging for debugging
  if (req.path.includes('/api/messages')) {
    console.log('\n=== INCOMING REQUEST ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('IP:', req.ip);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body type:', req.body?.type);
    console.log('=======================\n');
  }
  
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    path: req.path,
  });
  next();
});

// Health check (before routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', apiRoutes);

// Bot routes (webhook endpoints)
app.use('/api', botRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;

