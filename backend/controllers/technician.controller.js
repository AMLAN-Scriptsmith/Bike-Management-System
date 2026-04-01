const db = require("../models");
const { success, failure } = require("../utils/apiResponse");
const { generateInvoiceForJob } = require("../services/invoiceService");
const { notifyCustomer } = require("../services/notificationService");

const allowedTransitions = {
  Pending: ["Assigned"],
  Assigned: ["In Progress", "Waiting for Parts"],
  "In Progress": ["Waiting for Parts", "Completed"],
  "Waiting for Parts": ["In Progress", "Completed"],
  Completed: [],
};

const assignedJobs = async (req, res) => {
  try {
    const jobs = await db.JobCard.findAll({
      where: { assigned_to: req.user.id },
      include: [{ model: db.Bike, as: "bike" }, { model: db.ServiceCenter, as: "service_center" }],
      order: [["updated_at", "DESC"]],
    });

    return success(res, "Assigned jobs fetched", { jobs });
  } catch (error) {
    return failure(res, "Could not fetch assigned jobs", 500, [error.message]);
  }
};

const updateProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["In Progress", "Waiting for Parts", "Completed"];
    if (!allowedStatuses.includes(status)) {
      return failure(res, "Invalid technician status update", 400);
    }

    const job = await db.JobCard.findOne({ where: { id: jobId, assigned_to: req.user.id } });
    if (!job) {
      return failure(res, "Assigned job not found", 404);
    }

    if (!allowedTransitions[job.status]?.includes(status)) {
      return failure(res, `Invalid status transition from ${job.status} to ${status}`, 400);
    }

    job.status = status;
    await job.save();

    if (status === "Completed") {
      const bike = await db.Bike.findByPk(job.bike_id, { attributes: ["user_id"] });
      await generateInvoiceForJob(job.id);
      if (bike) {
        await notifyCustomer({
          userId: bike.user_id,
          title: "Service Completed",
          message: `Your bike service job #${job.id} is completed. Invoice has been generated.`,
        });
      }
    }

    req.app.get("io").emit("job-status-updated", { jobId: job.id, status });

    return success(res, "Job progress updated", { job });
  } catch (error) {
    return failure(res, "Could not update progress", 500, [error.message]);
  }
};

const requestSpareParts = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { jobId } = req.params;
    const { partId, quantity } = req.body;

    const job = await db.JobCard.findOne({
      where: { id: jobId, assigned_to: req.user.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!job) {
      await transaction.rollback();
      return failure(res, "Assigned job not found", 404);
    }

    const part = await db.SparePart.findByPk(partId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!part) {
      await transaction.rollback();
      return failure(res, "Spare part not found", 404);
    }

    if (part.stock < quantity) {
      job.status = "Waiting for Parts";
      await job.save({ transaction });
      await transaction.commit();
      return failure(res, "Insufficient stock, job moved to Waiting for Parts", 400);
    }

    part.stock -= quantity;
    await part.save({ transaction });

    const usage = await db.PartsUsage.create(
      {
        job_id: job.id,
        part_id: part.id,
        quantity,
      },
      { transaction }
    );

    if (job.status === "Waiting for Parts") {
      job.status = "In Progress";
      await job.save({ transaction });
    }

    await transaction.commit();

    return success(res, "Spare parts allocated", { usage, remainingStock: part.stock });
  } catch (error) {
    await transaction.rollback();
    return failure(res, "Could not request spare parts", 500, [error.message]);
  }
};

const uploadNotes = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { note } = req.body;

    const job = await db.JobCard.findOne({ where: { id: jobId, assigned_to: req.user.id } });
    if (!job) {
      return failure(res, "Assigned job not found", 404);
    }

    const update = await db.TechnicianUpdate.create({
      job_id: job.id,
      technician_id: req.user.id,
      note,
      photo_url: req.file ? `/uploads/${req.file.filename}` : null,
    });

    return success(res, "Technician note uploaded", { update }, 201);
  } catch (error) {
    return failure(res, "Could not upload note", 500, [error.message]);
  }
};

const listPartsRequests = async (req, res) => {
  try {
    const usages = await db.PartsUsage.findAll({
      include: [
        { model: db.JobCard, as: "job", where: { assigned_to: req.user.id }, attributes: ["id"] },
        { model: db.SparePart, as: "part", attributes: ["id", "name", "price"] },
      ],
      order: [["created_at", "DESC"]],
    });

    const rows = usages.map((entry) => ({
      requestId: entry.id,
      jobCardId: entry.job_id,
      parts: [
        {
          partId: entry.part_id,
          partName: entry.part?.name || "Part",
          quantity: entry.quantity,
          unitPrice: Number(entry.part?.price || 0),
        },
      ],
      status: "Approved",
      requestedAt: entry.created_at,
    }));

    return success(res, "Parts requests fetched", { rows });
  } catch (error) {
    return failure(res, "Could not fetch parts requests", 500, [error.message]);
  }
};

const listWorkLogs = async (req, res) => {
  try {
    const logs = await db.TechnicianUpdate.findAll({
      where: { technician_id: req.user.id },
      order: [["created_at", "DESC"]],
    });

    const rows = logs.map((log) => ({
      logId: log.id,
      jobCardId: log.job_id,
      timeSpent: 1,
      notes: log.note,
      photos: log.photo_url ? [log.photo_url] : [],
      createdAt: log.created_at,
    }));

    return success(res, "Work logs fetched", { rows });
  } catch (error) {
    return failure(res, "Could not fetch work logs", 500, [error.message]);
  }
};

const uploadPhotoOnly = async (req, res) => {
  try {
    if (!req.file) {
      return failure(res, "Photo is required", 400);
    }

    return success(res, "Photo uploaded", {
      url: `/uploads/${req.file.filename}`,
    }, 201);
  } catch (error) {
    return failure(res, "Could not upload photo", 500, [error.message]);
  }
};

module.exports = {
  assignedJobs,
  updateProgress,
  requestSpareParts,
  uploadNotes,
  listPartsRequests,
  listWorkLogs,
  uploadPhotoOnly,
};
