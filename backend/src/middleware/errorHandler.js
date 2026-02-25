/**
 * Global error handler middleware
 * Must be placed AFTER all routes
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }
  
  // Database errors
  if (err.code && err.code.startsWith('23')) {
    // PostgreSQL constraint errors
    let message = 'Database constraint violation';
    
    if (err.code === '23505') {
      message = 'Duplicate entry';
    } else if (err.code === '23503') {
      message = 'Referenced record not found';
    } else if (err.code === '23502') {
      message = 'Required field missing';
    }
    
    return res.status(400).json({
      success: false,
      message: message,
      detail: err.detail
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
