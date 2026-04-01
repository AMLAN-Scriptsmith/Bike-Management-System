const { failure } = require("../utils/apiResponse");

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return failure(res, "Unauthorized", 401);
    }

    if (!roles.includes(req.user.role)) {
      return failure(res, "Forbidden: insufficient permission", 403);
    }

    return next();
  };
};

module.exports = allowRoles;
