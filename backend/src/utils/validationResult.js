const { validationResult } = require('express-validator');

module.exports = function throwIfValidationFails(req, res) {
  const result = validationResult(req);
  if (result.isEmpty()) return null;

  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: result.array().map((item) => ({
      field: item.path,
      message: item.msg,
    })),
  });
};
