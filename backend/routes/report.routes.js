const express = require("express");
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("Super Admin", "Manager"));

router.get("/daily-jobs", reportController.dailyJobsReport);
router.get("/revenue", reportController.revenueReport);
router.get("/technician-performance", reportController.technicianPerformance);

module.exports = router;
