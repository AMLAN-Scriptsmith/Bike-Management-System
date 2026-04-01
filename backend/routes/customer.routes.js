const express = require("express");
const { body } = require("express-validator");
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("Customer"));

router.post(
  "/bikes",
  [
    body("model").notEmpty(),
    body("numberPlate").notEmpty(),
    body("brand").notEmpty(),
  ],
  validateRequest,
  customerController.registerBike
);

router.get("/service-history", customerController.serviceHistory);
router.get("/jobs/:jobId/status", customerController.trackJobStatus);

router.post(
  "/feedback",
  [
    body("jobId").isInt(),
    body("rating").isInt({ min: 1, max: 5 }),
    body("comment").optional().isString(),
  ],
  validateRequest,
  customerController.giveFeedback
);

module.exports = router;
