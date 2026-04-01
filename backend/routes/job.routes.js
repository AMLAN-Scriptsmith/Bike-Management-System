const express = require("express");
const { body, param } = require("express-validator");
const jobController = require("../controllers/job.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("Super Admin", "Manager", "Receptionist"));

router.post(
  "/",
  [
    body("bikeId").isInt(),
    body("serviceCenterId").isInt(),
    body("serviceIds").optional().isArray(),
  ],
  validateRequest,
  jobController.createJobCard
);

router.patch(
  "/:jobId/assign",
  [param("jobId").isInt(), body("technicianId").isInt()],
  validateRequest,
  jobController.assignTechnician
);

router.patch(
  "/:jobId/status",
  [
    param("jobId").isInt(),
    body("status").isIn(["Pending", "Assigned", "In Progress", "Waiting for Parts", "Completed"]),
  ],
  validateRequest,
  jobController.updateJobStatus
);

router.get("/technicians/available", jobController.availableTechnicians);
router.get("/:jobId", [param("jobId").isInt()], validateRequest, jobController.getJobDetails);
router.get("/", jobController.listJobs);

module.exports = router;
