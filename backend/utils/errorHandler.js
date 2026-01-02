const logger = require('./logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class DatabaseError extends AppError {
  constructor(message) {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

// Error response formatter
function formatErrorResponse(error) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      ...(isDevelopment && { stack: error.stack }),
    },
  };

  // Add additional error details in development
  if (isDevelopment && error.details) {
    response.error.details = error.details;
  }

  return response;
}

// Global error handling middleware
function errorHandler(err, req, res, next) {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const response = formatErrorResponse(err);

  res.status(statusCode).json(response);
}

// Async error wrapper (to catch errors in async route handlers)
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
};

