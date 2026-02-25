const { validationResult } = require('express-validator');

/**
 * Validation middleware
 * Checks validation errors and returns 422 if any
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
}

module.exports = validate;
