const { validationResult } = require("express-validator");
const { failure } = require("../utils/apiResponse");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failure(res, "Validation error", 422, errors.array());
  }
  return next();
};

module.exports = validateRequest;
