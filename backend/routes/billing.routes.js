const express = require("express");
const { body, param } = require("express-validator");
const billingController = require("../controllers/billing.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const { PAYMENT_METHODS } = require("../utils/constants");

const router = express.Router();

router.use(authMiddleware, allowRoles("Super Admin", "Manager", "Receptionist"));

router.post("/jobs/:jobId/invoice", [param("jobId").isInt()], validateRequest, billingController.generateInvoice);
router.get("/jobs/:jobId/calculate", [param("jobId").isInt()], validateRequest, billingController.calculateTotal);

router.post(
  "/invoices/:invoiceId/payment",
  [
    param("invoiceId").isInt(),
    body("amount").isFloat({ min: 1 }),
    body("method").custom((value) => PAYMENT_METHODS.includes(String(value).toUpperCase())),
    body("gatewayPaymentId").optional().isString(),
  ],
  validateRequest,
  billingController.processPayment
);

router.patch(
  "/invoices/:invoiceId/payment-status",
  [
    param("invoiceId").isInt(),
    body("paymentStatus").isIn(["Pending", "Paid", "Failed", "Refunded"]),
  ],
  validateRequest,
  billingController.updatePaymentStatus
);

module.exports = router;
