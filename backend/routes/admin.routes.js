const express = require("express");
const { body, param } = require("express-validator");
const controller = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("Super Admin"));

router.get("/overview", controller.getOverview);

router.get("/service-centers", controller.listServiceCenters);
router.post(
  "/service-centers",
  [body("name").notEmpty(), body("location").notEmpty(), body("managerId").optional().isInt()],
  validateRequest,
  controller.createServiceCenter
);
router.put(
  "/service-centers/:centerId",
  [param("centerId").isInt(), body("managerId").optional().isInt()],
  validateRequest,
  controller.updateServiceCenter
);
router.delete("/service-centers/:centerId", [param("centerId").isInt()], validateRequest, controller.deleteServiceCenter);

router.get("/managers", controller.listManagers);
router.post(
  "/managers",
  [body("name").notEmpty(), body("email").isEmail(), body("phone").optional().isString(), body("serviceCenterId").optional().isInt()],
  validateRequest,
  controller.createManager
);
router.patch(
  "/managers/:managerId/assign-center",
  [param("managerId").isInt(), body("centerId").isInt()],
  validateRequest,
  controller.assignManagerToCenter
);
router.patch(
  "/managers/:managerId/status",
  [param("managerId").isInt(), body("active").isBoolean()],
  validateRequest,
  controller.toggleManagerStatus
);

router.get("/reports/centers", controller.centerReports);

router.get("/settings", controller.getSettings);
router.patch("/settings/tax", [body("taxPercentage").isFloat({ min: 0, max: 100 })], validateRequest, controller.updateTax);
router.post("/settings/discount-rules", [body("name").notEmpty()], validateRequest, controller.addDiscountRule);
router.post("/settings/service-categories", [body("name").notEmpty()], validateRequest, controller.addServiceCategory);

module.exports = router;
