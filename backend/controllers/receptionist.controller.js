const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const db = require("../models");
const { success, failure } = require("../utils/apiResponse");
const { getPagination, getPagingData } = require("../utils/pagination");

const defaultPasswordHash = async () => bcrypt.hash("1234", 10);

const toCustomerRow = (user) => {
  const bike = user.bikes?.[0] || null;
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    bike: bike
      ? {
          id: bike.id,
          model: bike.model,
          brand: bike.brand,
          numberPlate: bike.number_plate,
        }
      : null,
  };
};

const getOverview = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [todaysBookings, pendingJobs, completedJobs] = await Promise.all([
      db.JobCard.count({ where: { created_at: { [Op.gte]: new Date(`${today}T00:00:00`) } } }),
      db.JobCard.count({ where: { status: { [Op.in]: ["Pending", "Assigned", "In Progress", "Waiting for Parts"] } } }),
      db.JobCard.count({ where: { status: "Completed" } }),
    ]);

    return success(res, "Receptionist overview fetched", { todaysBookings, pendingJobs, completedJobs });
  } catch (error) {
    return failure(res, "Could not fetch overview", 500, [error.message]);
  }
};

const registerCustomer = async (req, res) => {
  try {
    const { name, phone, email, model, brand, numberPlate } = req.body;

    let user = await db.User.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
    if (!user) {
      user = await db.User.create({
        name,
        email,
        phone,
        role: "Customer",
        password: await defaultPasswordHash(),
      });
    }

    let bike = await db.Bike.findOne({ where: { number_plate: numberPlate } });
    if (!bike) {
      bike = await db.Bike.create({
        user_id: user.id,
        model,
        brand,
        number_plate: numberPlate,
      });
    }

    const created = await db.User.findByPk(user.id, {
      include: [{ model: db.Bike, as: "bikes", limit: 1 }],
    });

    return success(res, "Customer registered", toCustomerRow(created), 201);
  } catch (error) {
    return failure(res, "Could not register customer", 500, [error.message]);
  }
};

const findCustomerByPhone = async (req, res) => {
  try {
    const phone = String(req.params.phone || "").replace(/\D/g, "");
    const users = await db.User.findAll({
      where: { role: "Customer" },
      include: [{ model: db.Bike, as: "bikes", limit: 1 }],
      order: [["id", "DESC"]],
    });

    const customer = users.find((item) => String(item.phone || "").replace(/\D/g, "") === phone);
    if (!customer) return failure(res, "No customer found", 404);

    return success(res, "Customer fetched", toCustomerRow(customer));
  } catch (error) {
    return failure(res, "Could not fetch customer", 500, [error.message]);
  }
};

const listCustomers = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const { page, limit, offset } = getPagination({ ...req.query, limit: req.query.pageSize || req.query.limit });

    const where = { role: "Customer" };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const rows = await db.User.findAndCountAll({
      where,
      include: [{ model: db.Bike, as: "bikes", required: false }],
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    const data = getPagingData(rows.count, rows.rows.map(toCustomerRow), page, limit);
    return success(res, "Customers fetched", {
      rows: data.rows,
      pagination: {
        page: data.meta.page,
        pageSize: data.meta.limit,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
      },
    });
  } catch (error) {
    return failure(res, "Could not fetch customers", 500, [error.message]);
  }
};

const createJobCard = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { customerId, bikeId, serviceIds = [], problemDescription } = req.body;

    const bike = await db.Bike.findOne({ where: { id: bikeId, user_id: customerId }, transaction });
    if (!bike) {
      await transaction.rollback();
      return failure(res, "Customer bike not found", 404);
    }

    const center = await db.ServiceCenter.findOne({ order: [["id", "ASC"]], transaction });
    if (!center) {
      await transaction.rollback();
      return failure(res, "No service center configured", 400);
    }

    const job = await db.JobCard.create(
      {
        bike_id: bike.id,
        service_center_id: center.id,
        status: "Pending",
      },
      { transaction }
    );

    if (serviceIds.length > 0) {
      await db.JobService.bulkCreate(
        serviceIds.map((serviceId) => ({ job_id: job.id, service_id: Number(serviceId), status: "Pending" })),
        { transaction }
      );
    }

    if (problemDescription) {
      await db.TechnicianUpdate.create(
        {
          job_id: job.id,
          technician_id: req.user.id,
          note: `Reception Note: ${problemDescription}`,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return success(res, "Job card created", { jobCardId: job.id }, 201);
  } catch (error) {
    await transaction.rollback();
    return failure(res, "Could not create job card", 500, [error.message]);
  }
};

const listJobCards = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination({ ...req.query, limit: req.query.pageSize || req.query.limit });
    const rows = await db.JobCard.findAndCountAll({
      include: [
        { model: db.Bike, as: "bike", include: [{ model: db.User, as: "owner", attributes: ["id", "name", "phone"] }] },
        { model: db.JobService, as: "job_services", include: [{ model: db.Service, as: "service" }] },
      ],
      order: [["id", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const mapped = rows.rows.map((row) => ({
      id: row.id,
      jobCardId: row.id,
      customerName: row.bike?.owner?.name || "Customer",
      bikeLabel: `${row.bike?.brand || ""} ${row.bike?.model || ""} (${row.bike?.number_plate || "-"})`.trim(),
      services: (row.job_services || []).map((entry) => ({ id: entry.service_id, name: entry.service?.name || "Service" })),
      status: row.status,
      createdAt: row.created_at,
    }));

    return success(res, "Job cards fetched", {
      rows: mapped,
      pagination: {
        page,
        pageSize: limit,
        total: rows.count,
        totalPages: Math.max(1, Math.ceil(rows.count / limit)),
      },
    });
  } catch (error) {
    return failure(res, "Could not fetch job cards", 500, [error.message]);
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { customerName, phone, bikeLabel, date, slot, notes } = req.body;
    const appointment = await db.Appointment.create({
      customer_name: customerName,
      phone,
      bike_label: bikeLabel,
      date,
      slot,
      notes,
    });

    return success(res, "Appointment booked", {
      id: appointment.id,
      appointmentId: appointment.id,
      customerName: appointment.customer_name,
      phone: appointment.phone,
      bikeLabel: appointment.bike_label,
      date: appointment.date,
      slot: appointment.slot,
      notes: appointment.notes,
      createdAt: appointment.created_at,
    }, 201);
  } catch (error) {
    return failure(res, "Could not book appointment", 500, [error.message]);
  }
};

const listAppointments = async (req, res) => {
  try {
    const { date = "" } = req.query;
    const { page, limit, offset } = getPagination({ ...req.query, limit: req.query.pageSize || req.query.limit });

    const where = {};
    if (date) where.date = date;

    const rows = await db.Appointment.findAndCountAll({
      where,
      order: [["date", "ASC"], ["slot", "ASC"]],
      limit,
      offset,
    });

    return success(res, "Appointments fetched", {
      rows: rows.rows.map((row) => ({
        id: row.id,
        appointmentId: row.id,
        customerName: row.customer_name,
        phone: row.phone,
        bikeLabel: row.bike_label,
        date: row.date,
        slot: row.slot,
        notes: row.notes,
        createdAt: row.created_at,
      })),
      pagination: {
        page,
        pageSize: limit,
        total: rows.count,
        totalPages: Math.max(1, Math.ceil(rows.count / limit)),
      },
    });
  } catch (error) {
    return failure(res, "Could not fetch appointments", 500, [error.message]);
  }
};

const listPayments = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination({ ...req.query, limit: req.query.pageSize || req.query.limit });
    const rows = await db.Payment.findAndCountAll({
      include: [{ model: db.Invoice, as: "invoice", attributes: ["id", "job_id"] }],
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return success(res, "Payments fetched", {
      rows: rows.rows.map((entry) => ({
        id: entry.id,
        invoiceId: entry.invoice_id,
        jobCardId: entry.invoice?.job_id || null,
        amount: Number(entry.amount || 0),
        method: entry.method,
        notes: "",
        paidAt: entry.created_at,
      })),
      pagination: {
        page,
        pageSize: limit,
        total: rows.count,
        totalPages: Math.max(1, Math.ceil(rows.count / limit)),
      },
    });
  } catch (error) {
    return failure(res, "Could not fetch payments", 500, [error.message]);
  }
};

module.exports = {
  getOverview,
  registerCustomer,
  findCustomerByPhone,
  listCustomers,
  createJobCard,
  listJobCards,
  bookAppointment,
  listAppointments,
  listPayments,
};
