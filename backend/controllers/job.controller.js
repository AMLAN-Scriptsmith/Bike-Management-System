const { Op } = require("sequelize");
const db = require("../models");
const { success, failure } = require("../utils/apiResponse");
const { getPagination, getPagingData } = require("../utils/pagination");
const { generateInvoiceForJob } = require("../services/invoiceService");
const { notifyCustomer } = require("../services/notificationService");
const { ROLES } = require("../utils/constants");

const allowedTransitions = {
  Pending: ["Assigned"],
  Assigned: ["In Progress", "Waiting for Parts"],
  "In Progress": ["Waiting for Parts", "Completed"],
  "Waiting for Parts": ["In Progress", "Completed"],
  Completed: [],
};

const createJobCard = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { bikeId, serviceCenterId, serviceIds = [] } = req.body;

    const bike = await db.Bike.findByPk(bikeId);
    if (!bike) {
      await transaction.rollback();
      return failure(res, "Bike not found", 404);
    }

    const serviceCenter = await db.ServiceCenter.findByPk(serviceCenterId);
    if (!serviceCenter) {
      await transaction.rollback();
      return failure(res, "Service center not found", 404);
    }

    if (serviceIds.length > 0) {
      const existingServices = await db.Service.findAll({
        where: { id: serviceIds },
        attributes: ["id"],
        transaction,
      });
      if (existingServices.length !== serviceIds.length) {
        await transaction.rollback();
        return failure(res, "One or more services are invalid", 400);
      }
    }

    const job = await db.JobCard.create(
      {
        bike_id: bikeId,
        service_center_id: serviceCenterId,
        status: "Pending",
      },
      { transaction }
    );

    if (serviceIds.length > 0) {
      const jobServicesPayload = serviceIds.map((serviceId) => ({
        job_id: job.id,
        service_id: serviceId,
        status: "Pending",
      }));

      await db.JobService.bulkCreate(jobServicesPayload, { transaction });
    }

    await transaction.commit();
    return success(res, "Job card created", { job }, 201);
  } catch (error) {
    await transaction.rollback();
    return failure(res, "Could not create job card", 500, [error.message]);
  }
};

const assignTechnician = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { technicianId } = req.body;

    const job = await db.JobCard.findByPk(jobId);
    if (!job) {
      return failure(res, "Job not found", 404);
    }

    const technician = await db.User.findOne({ where: { id: technicianId, role: ROLES.TECHNICIAN } });
    if (!technician) {
      return failure(res, "Technician not found", 404);
    }

    job.assigned_to = technicianId;
    if (job.status === "Pending") {
      job.status = "Assigned";
    }
    await job.save();

    return success(res, "Technician assigned", { job });
  } catch (error) {
    return failure(res, "Could not assign technician", 500, [error.message]);
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    const job = await db.JobCard.findByPk(jobId, {
      include: [{ model: db.Bike, as: "bike" }],
    });

    if (!job) {
      return failure(res, "Job not found", 404);
    }

    if (!allowedTransitions[job.status]?.includes(status)) {
      return failure(res, `Invalid status transition from ${job.status} to ${status}`, 400);
    }

    job.status = status;
    await job.save();

    if (status === "Completed") {
      await generateInvoiceForJob(job.id);
      await notifyCustomer({
        userId: job.bike.user_id,
        title: "Service Completed",
        message: `Your bike service job #${job.id} is completed. Invoice has been generated.`,
      });
    }

    const io = req.app.get("io");
    io.emit("job-status-updated", { jobId: job.id, status });

    return success(res, "Job status updated", { job });
  } catch (error) {
    return failure(res, "Could not update job status", 500, [error.message]);
  }
};

const getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await db.JobCard.findByPk(jobId, {
      include: [
        { model: db.Bike, as: "bike", include: [{ model: db.User, as: "owner", attributes: ["id", "name", "email", "phone"] }] },
        { model: db.ServiceCenter, as: "service_center" },
        { model: db.User, as: "technician", attributes: ["id", "name", "email"] },
        { model: db.JobService, as: "job_services", include: [{ model: db.Service, as: "service" }] },
        { model: db.PartsUsage, as: "parts_usage", include: [{ model: db.SparePart, as: "part" }] },
        { model: db.Invoice, as: "invoice" },
        { model: db.TechnicianUpdate, as: "technician_updates" },
      ],
    });

    if (!job) {
      return failure(res, "Job not found", 404);
    }

    return success(res, "Job details fetched", { job });
  } catch (error) {
    return failure(res, "Could not fetch job details", 500, [error.message]);
  }
};

const listJobs = async (req, res) => {
  try {
    const { status, search } = req.query;
    const { page, limit, offset } = getPagination(req.query);

    const where = {};
    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { "$bike.number_plate$": { [Op.like]: `%${search}%` } },
        { "$bike.owner.name$": { [Op.like]: `%${search}%` } },
      ];
    }

    const jobs = await db.JobCard.findAndCountAll({
      where,
      include: [
        {
          model: db.Bike,
          as: "bike",
          required: true,
          include: [
            {
              model: db.User,
              as: "owner",
              attributes: ["id", "name", "email", "phone"],
              required: false,
            },
          ],
        },
        { model: db.User, as: "technician", attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    return success(res, "Jobs fetched", getPagingData(jobs.count, jobs.rows, page, limit));
  } catch (error) {
    return failure(res, "Could not fetch jobs", 500, [error.message]);
  }
};

const availableTechnicians = async (req, res) => {
  try {
    const technicians = await db.User.findAll({
      where: { role: "Technician" },
      attributes: ["id", "name", "email", "phone"],
      order: [["name", "ASC"]],
    });

    return success(res, "Technicians fetched", { technicians });
  } catch (error) {
    return failure(res, "Could not fetch technicians", 500, [error.message]);
  }
};

module.exports = {
  createJobCard,
  assignTechnician,
  updateJobStatus,
  getJobDetails,
  listJobs,
  availableTechnicians,
};
