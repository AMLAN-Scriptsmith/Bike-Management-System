const bcrypt = require("bcryptjs");
const db = require("../models");
const { success, failure } = require("../utils/apiResponse");
const { signToken } = require("../utils/token");
const { ROLES } = require("../utils/constants");

const formatPhoneForOtp = (phone) => {
  const normalized = `${phone || ""}`.trim().replace(/\s+/g, "");
  if (!normalized) return null;
  if (normalized.startsWith("+")) return normalized;
  if (/^\d{10}$/.test(normalized)) return `+91${normalized}`;
  return null;
};

const getTwilioVerifyService = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!sid || !authToken || !verifyServiceSid) {
    return null;
  }

  const twilio = require("twilio");
  const client = twilio(sid, authToken);
  return { client, verifyServiceSid };
};

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

const sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const to = formatPhoneForOtp(phone);
    if (!to) {
      return failure(res, "Phone must be a valid 10-digit number or E.164 format", 400);
    }

    const service = getTwilioVerifyService();
    if (!service) {
      return failure(res, "OTP provider is not configured on server", 503);
    }

    await service.client.verify.v2
      .services(service.verifyServiceSid)
      .verifications.create({ to, channel: "sms" });

    return success(res, "OTP sent successfully", { phone: to });
  } catch (error) {
    return failure(res, "Failed to send OTP", 500, [error.message]);
  }
};

const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    const to = formatPhoneForOtp(phone);
    if (!to) {
      return failure(res, "Phone must be a valid 10-digit number or E.164 format", 400);
    }
    if (!code || !/^\d{4,8}$/.test(code)) {
      return failure(res, "OTP code is invalid", 400);
    }

    const service = getTwilioVerifyService();
    if (!service) {
      return failure(res, "OTP provider is not configured on server", 503);
    }

    const check = await service.client.verify.v2
      .services(service.verifyServiceSid)
      .verificationChecks.create({ to, code });

    if (check.status !== "approved") {
      return failure(res, "OTP verification failed", 401);
    }

    return success(res, "OTP verified", { verified: true });
  } catch (error) {
    return failure(res, "Failed to verify OTP", 500, [error.message]);
  }
};

const profile = async (req, res) => {
  return success(res, "Profile fetched", { user: req.user });
};

module.exports = {
  register,
  login,
  sendPhoneOtp,
  verifyPhoneOtp,
  profile,
};
