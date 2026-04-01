const { Op } = require("sequelize");
const db = require("../models");
const { success, failure } = require("../utils/apiResponse");
const { getPagination, getPagingData } = require("../utils/pagination");

const registerBike = async (req, res) => {
  try {
    const { model, numberPlate, brand } = req.body;

    const exists = await db.Bike.findOne({ where: { number_plate: numberPlate } });
    if (exists) {
      return failure(res, "Bike with number plate already exists", 409);
    }

    const bike = await db.Bike.create({
      user_id: req.user.id,
      model,
      number_plate: numberPlate,
      brand,
    });

    return success(res, "Bike registered successfully", { bike }, 201);
  } catch (error) {
    return failure(res, "Could not register bike", 500, [error.message]);
  }
};

const serviceHistory = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const jobs = await db.JobCard.findAndCountAll({
      include: [
        {
          model: db.Bike,
          as: "bike",
          where: { user_id: req.user.id },
        },
        {
          model: db.ServiceCenter,
          as: "service_center",
          attributes: ["id", "name", "location"],
        },
        {
          model: db.Invoice,
          as: "invoice",
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return success(res, "Service history fetched", getPagingData(jobs.count, jobs.rows, page, limit));
  } catch (error) {
    return failure(res, "Could not fetch service history", 500, [error.message]);
  }
};

const trackJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await db.JobCard.findOne({
      where: { id: jobId },
      include: [
        {
          model: db.Bike,
          as: "bike",
          where: { user_id: req.user.id },
        },
        {
          model: db.TechnicianUpdate,
          as: "technician_updates",
          include: [{ model: db.User, as: "technician", attributes: ["id", "name"] }],
        },
      ],
    });

    if (!job) {
      return failure(res, "Job not found", 404);
    }

    return success(res, "Job status fetched", { job });
  } catch (error) {
    return failure(res, "Could not track job", 500, [error.message]);
  }
};

const giveFeedback = async (req, res) => {
  try {
    const { jobId, rating, comment } = req.body;

    const job = await db.JobCard.findOne({
      where: { id: jobId },
      include: [{ model: db.Bike, as: "bike", where: { user_id: req.user.id } }],
    });

    if (!job) {
      return failure(res, "Job not found for this customer", 404);
    }

    const feedback = await db.Feedback.create({
      user_id: req.user.id,
      job_id: jobId,
      rating,
      comment,
    });

    return success(res, "Feedback submitted", { feedback }, 201);
  } catch (error) {
    return failure(res, "Could not submit feedback", 500, [error.message]);
  }
};

module.exports = {
  registerBike,
  serviceHistory,
  trackJobStatus,
  giveFeedback,
};
