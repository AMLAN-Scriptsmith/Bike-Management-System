const bcrypt = require("bcryptjs");
const db = require("../models");
const { success, failure } = require("../utils/apiResponse");
const { signToken } = require("../utils/token");
const { ROLES } = require("../utils/constants");

const register = async (req, res) => {
  try {
    const { name, email, password, role = ROLES.CUSTOMER, phone } = req.body;

    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      return failure(res, "Email already registered", 409);
    }

    // Public registration is customer-only. Elevated roles must be provisioned by admin flows.
    if (role !== ROLES.CUSTOMER) {
      return failure(res, "Only Customer role is allowed for self registration", 403);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    const token = signToken({ userId: user.id, role: user.role });

    return success(
      res,
      "User registered successfully",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
        token,
      },
      201
    );
  } catch (error) {
    return failure(res, "Registration failed", 500, [error.message]);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      return failure(res, "Invalid credentials", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return failure(res, "Invalid credentials", 401);
    }

    const token = signToken({ userId: user.id, role: user.role });
    return success(res, "Login successful", {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    return failure(res, "Login failed", 500, [error.message]);
  }
};

const profile = async (req, res) => {
  return success(res, "Profile fetched", { user: req.user });
};

module.exports = {
  register,
  login,
  profile,
};
