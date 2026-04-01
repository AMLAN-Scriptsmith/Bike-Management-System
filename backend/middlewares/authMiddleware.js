const jwt = require("jsonwebtoken");
const db = require("../models");
const { failure } = require("../utils/apiResponse");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return failure(res, "Authorization token missing", 401);
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.User.findByPk(payload.userId, {
      attributes: ["id", "name", "email", "role", "phone"],
    });

    if (!user) {
      return failure(res, "Invalid token user", 401);
    }

    req.user = user;
    return next();
  } catch (error) {
    return failure(res, "Unauthorized", 401, [error.message]);
  }
};

module.exports = authMiddleware;
