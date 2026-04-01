const express = require("express");

const authRoutes = require("./auth.routes");
const customerRoutes = require("./customer.routes");
const jobRoutes = require("./job.routes");
const technicianRoutes = require("./technician.routes");
const inventoryRoutes = require("./inventory.routes");
const billingRoutes = require("./billing.routes");
const reportRoutes = require("./report.routes");
const serviceRoutes = require("./service.routes");
const adminRoutes = require("./admin.routes");
const receptionistRoutes = require("./receptionist.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/jobs", jobRoutes);
router.use("/technicians", technicianRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/billing", billingRoutes);
router.use("/reports", reportRoutes);
router.use("/services", serviceRoutes);
router.use("/admin", adminRoutes);
router.use("/receptionist", receptionistRoutes);

module.exports = router;
