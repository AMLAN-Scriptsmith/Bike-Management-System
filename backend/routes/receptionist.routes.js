const express = require("express");
const { body, param } = require("express-validator");
const controller = require("../controllers/receptionist.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("Receptionist", "Manager", "Super Admin"));

router.get("/overview", controller.getOverview);

router.get("/customers", controller.listCustomers);
router.post(
  "/customers",
  [
    body("name").notEmpty(),
    body("phone").notEmpty(),
    body("email").isEmail(),
    body("model").notEmpty(),
    body("brand").notEmpty(),
    body("numberPlate").notEmpty(),
  ],
  validateRequest,
  controller.registerCustomer
);
router.get("/customers/by-phone/:phone", [param("phone").notEmpty()], validateRequest, controller.findCustomerByPhone);

router.get("/job-cards", controller.listJobCards);
router.post(
  "/job-cards",
  [body("customerId").isInt(), body("bikeId").isInt(), body("serviceIds").isArray()],
  validateRequest,
  controller.createJobCard
);

router.get("/appointments", controller.listAppointments);
router.post(
  "/appointments",
  [body("customerName").notEmpty(), body("phone").notEmpty(), body("date").notEmpty(), body("slot").notEmpty()],
  validateRequest,
  controller.bookAppointment
);

router.get("/payments", controller.listPayments);

module.exports = router;
