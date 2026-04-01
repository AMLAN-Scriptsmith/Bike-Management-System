const express = require("express");
const { body, param } = require("express-validator");
const technicianController = require("../controllers/technician.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("Technician"));

router.get("/jobs", technicianController.assignedJobs);
router.get("/parts-requests", technicianController.listPartsRequests);
router.get("/work-logs", technicianController.listWorkLogs);
router.post("/upload", upload.single("photo"), technicianController.uploadPhotoOnly);

router.patch(
  "/jobs/:jobId/progress",
  [param("jobId").isInt(), body("status").isIn(["In Progress", "Waiting for Parts", "Completed"])],
  validateRequest,
  technicianController.updateProgress
);

router.post(
  "/jobs/:jobId/request-part",
  [param("jobId").isInt(), body("partId").isInt(), body("quantity").isInt({ min: 1 })],
  validateRequest,
  technicianController.requestSpareParts
);

router.post(
  "/jobs/:jobId/notes",
  upload.single("photo"),
  [param("jobId").isInt(), body("note").notEmpty()],
  validateRequest,
  technicianController.uploadNotes
);

module.exports = router;
