const { Op, fn, col, literal } = require("sequelize");
const db = require("../models");
const { success, failure } = require("../utils/apiResponse");

const dailyJobsReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const start = new Date(`${targetDate}T00:00:00`);
    const end = new Date(`${targetDate}T23:59:59`);

    const jobs = await db.JobCard.findAll({
      where: {
        created_at: {
          [Op.between]: [start, end],
        },
      },
      include: [{ model: db.Bike, as: "bike" }, { model: db.User, as: "technician", attributes: ["id", "name"] }],
      order: [["created_at", "DESC"]],
    });

    return success(res, "Daily jobs report generated", { date: targetDate, total: jobs.length, jobs });
  } catch (error) {
    return failure(res, "Could not generate daily jobs report", 500, [error.message]);
  }
};

const revenueReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {
      payment_status: "Paid",
    };

    if (from && to) {
      where.created_at = { [Op.between]: [new Date(from), new Date(to)] };
    }

    const invoices = await db.Invoice.findAll({ where });
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    return success(res, "Revenue report generated", {
      invoiceCount: invoices.length,
      totalRevenue,
      from: from || null,
      to: to || null,
    });
  } catch (error) {
    return failure(res, "Could not generate revenue report", 500, [error.message]);
  }
};

const technicianPerformance = async (req, res) => {
  try {
    const rows = await db.JobCard.findAll({
      attributes: [
        "assigned_to",
        [fn("COUNT", col("JobCard.id")), "totalJobs"],
        [literal(`SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END)`), "completedJobs"],
      ],
      where: {
        assigned_to: {
          [Op.ne]: null,
        },
      },
      include: [{ model: db.User, as: "technician", attributes: ["id", "name", "email"] }],
      group: ["assigned_to", "technician.id"],
      order: [[literal("completedJobs"), "DESC"]],
    });

    return success(res, "Technician performance report generated", { rows });
  } catch (error) {
    return failure(res, "Could not generate technician report", 500, [error.message]);
  }
};

module.exports = {
  dailyJobsReport,
  revenueReport,
  technicianPerformance,
};
