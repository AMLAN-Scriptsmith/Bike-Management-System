const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 4 }).withMessage("Password must be at least 4 characters"),
    body("role").optional().isIn(["Super Admin", "Manager", "Receptionist", "Technician", "Customer"]),
  ],
  validateRequest,
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  authController.login
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 */
router.get("/profile", authMiddleware, authController.profile);

module.exports = router;
