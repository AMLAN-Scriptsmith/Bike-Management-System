const express = require("express");
const { body, param } = require("express-validator");
const inventoryController = require("../controllers/inventory.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("Super Admin", "Manager"));

router.post(
  "/parts",
  [
    body("id").optional().isInt(),
    body("name").optional().isString(),
    body("stock").optional().isInt({ min: 0 }),
    body("price").optional().isFloat({ min: 0 }),
  ],
  validateRequest,
  inventoryController.upsertPart
);

router.get("/parts", inventoryController.listParts);

router.post(
  "/jobs/:jobId/allocate",
  [param("jobId").isInt(), body("partId").isInt(), body("quantity").isInt({ min: 1 })],
  validateRequest,
  inventoryController.allocatePartToJob
);

module.exports = router;
