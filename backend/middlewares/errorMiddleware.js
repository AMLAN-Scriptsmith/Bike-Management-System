const { failure } = require("../utils/apiResponse");

const notFoundHandler = (req, res) => {
  return failure(res, `Route not found: ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
  return failure(res, "Internal server error", err.status || 500, [err.message]);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
