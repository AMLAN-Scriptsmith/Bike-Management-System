const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const db = require("../models");
const { success, failure } = require("../utils/apiResponse");
const { getPagination, getPagingData } = require("../utils/pagination");

const runtimeSettings = {
  taxPercentage: 18,
  discountRules: [],
};

const mapCenter = (center) => ({
  id: center.id,
  name: center.name,
  location: center.location,
  managerId: center.admin_id,
  managerName: center.admin?.name || "Unassigned",
  active: true,
});

const mapManager = (manager) => ({
  id: manager.id,
  name: manager.name,
  email: manager.email,
  phone: manager.phone,
  serviceCenterId: manager.managed_centers?.[0]?.id || null,
  serviceCenterName: manager.managed_centers?.[0]?.name || "Unassigned",
  active: true,
});

const getOverview = async (req, res) => {
  try {
    const [totalCenters, totalUsers, totalJobs, completedJobs, pendingJobs, paidInvoices, managers, technicians, customers] = await Promise.all([
      db.ServiceCenter.count(),
      db.User.count(),
      db.JobCard.count(),
      db.JobCard.count({ where: { status: "Completed" } }),
      db.JobCard.count({ where: { status: { [Op.ne]: "Completed" } } }),
      db.Invoice.findAll({ where: { payment_status: "Paid" }, attributes: ["total_amount"] }),
      db.User.count({ where: { role: "Manager" } }),
      db.User.count({ where: { role: "Technician" } }),
      db.User.count({ where: { role: "Customer" } }),
    ]);

    const monthlyRevenue = paidInvoices.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
    return success(res, "Admin overview fetched", {
      totalCenters,
      totalUsers,
      totalJobs,
      completedJobs,
      pendingJobs,
      monthlyRevenue,
      yearlyRevenue: monthlyRevenue * 12,
      usersBreakdown: {
        managers,
        technicians,
        customers,
      },
      monthlyTrend: [],
    });
  } catch (error) {
    return failure(res, "Could not fetch admin overview", 500, [error.message]);
  }
};

const listServiceCenters = async (req, res) => {
  try {
    const { search = "", managerId = "" } = req.query;
    const { page, limit, offset } = getPagination({ ...req.query, limit: req.query.pageSize || req.query.limit });

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }
    if (managerId) {
      where.admin_id = Number(managerId);
    }

    const rows = await db.ServiceCenter.findAndCountAll({
      where,
      include: [{ model: db.User, as: "admin", attributes: ["id", "name"] }],
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    const data = getPagingData(rows.count, rows.rows.map(mapCenter), page, limit);
    return success(res, "Service centers fetched", {
      rows: data.rows,
      pagination: {
        page: data.meta.page,
        pageSize: data.meta.limit,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
      },
    });
  } catch (error) {
    return failure(res, "Could not fetch service centers", 500, [error.message]);
  }
};

const createServiceCenter = async (req, res) => {
  try {
    const { name, location, managerId } = req.body;
    const manager = managerId
      ? await db.User.findOne({ where: { id: Number(managerId), role: "Manager" } })
      : await db.User.findOne({ where: { role: "Manager" }, order: [["id", "ASC"]] });

    if (!manager) {
      return failure(res, "At least one manager is required before creating a service center", 400);
    }

    const center = await db.ServiceCenter.create({
      name,
      location,
      admin_id: manager.id,
    });

    const withAdmin = await db.ServiceCenter.findByPk(center.id, {
      include: [{ model: db.User, as: "admin", attributes: ["id", "name"] }],
    });

    return success(res, "Service center created", mapCenter(withAdmin), 201);
  } catch (error) {
    return failure(res, "Could not create service center", 500, [error.message]);
  }
};

const updateServiceCenter = async (req, res) => {
  try {
    const center = await db.ServiceCenter.findByPk(req.params.centerId);
    if (!center) return failure(res, "Service center not found", 404);

    const { name, location, managerId } = req.body;
    if (name) center.name = name;
    if (location) center.location = location;

    if (managerId) {
      const manager = await db.User.findOne({ where: { id: Number(managerId), role: "Manager" } });
      if (!manager) return failure(res, "Manager not found", 404);
      center.admin_id = manager.id;
    }

    await center.save();

    const withAdmin = await db.ServiceCenter.findByPk(center.id, {
      include: [{ model: db.User, as: "admin", attributes: ["id", "name"] }],
    });

    return success(res, "Service center updated", mapCenter(withAdmin));
  } catch (error) {
    return failure(res, "Could not update service center", 500, [error.message]);
  }
};

const deleteServiceCenter = async (req, res) => {
  try {
    const center = await db.ServiceCenter.findByPk(req.params.centerId);
    if (!center) return failure(res, "Service center not found", 404);

    const jobCount = await db.JobCard.count({ where: { service_center_id: center.id } });
    if (jobCount > 0) {
      return failure(res, "Cannot delete center with existing job cards", 409);
    }

    await center.destroy();
    return success(res, "Service center deleted", {});
  } catch (error) {
    return failure(res, "Could not delete service center", 500, [error.message]);
  }
};

const listManagers = async (req, res) => {
  try {
    const { search = "", centerId = "" } = req.query;
    const { page, limit, offset } = getPagination({ ...req.query, limit: req.query.pageSize || req.query.limit });

    const where = { role: "Manager" };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const rows = await db.User.findAndCountAll({
      where,
      attributes: ["id", "name", "email", "phone", "role"],
      include: [{ model: db.ServiceCenter, as: "managed_centers", attributes: ["id", "name"], required: false }],
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    let mapped = rows.rows.map(mapManager);
    if (centerId) {
      mapped = mapped.filter((item) => String(item.serviceCenterId || "") === String(centerId));
    }

    return success(res, "Managers fetched", {
      rows: mapped,
      pagination: {
        page,
        pageSize: limit,
        total: rows.count,
        totalPages: Math.max(1, Math.ceil(rows.count / limit)),
      },
    });
  } catch (error) {
    return failure(res, "Could not fetch managers", 500, [error.message]);
  }
};

const createManager = async (req, res) => {
  try {
    const { name, email, phone, serviceCenterId } = req.body;
    const existing = await db.User.findOne({ where: { email } });
    if (existing) return failure(res, "Email already exists", 409);

    const password = await bcrypt.hash("1234", 10);
    const manager = await db.User.create({ name, email, phone, password, role: "Manager" });

    if (serviceCenterId) {
      const center = await db.ServiceCenter.findByPk(Number(serviceCenterId));
      if (center) {
        center.admin_id = manager.id;
        await center.save();
      }
    }

    const withCenter = await db.User.findByPk(manager.id, {
      attributes: ["id", "name", "email", "phone", "role"],
      include: [{ model: db.ServiceCenter, as: "managed_centers", attributes: ["id", "name"], required: false }],
    });

    return success(res, "Manager created", mapManager(withCenter), 201);
  } catch (error) {
    return failure(res, "Could not create manager", 500, [error.message]);
  }
};

const assignManagerToCenter = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { centerId } = req.body;

    const manager = await db.User.findOne({ where: { id: Number(managerId), role: "Manager" } });
    if (!manager) return failure(res, "Manager not found", 404);

    const center = await db.ServiceCenter.findByPk(Number(centerId));
    if (!center) return failure(res, "Service center not found", 404);

    center.admin_id = manager.id;
    await center.save();

    return success(res, "Manager assigned", { managerId: manager.id, centerId: center.id });
  } catch (error) {
    return failure(res, "Could not assign manager", 500, [error.message]);
  }
};

const toggleManagerStatus = async (req, res) => {
  return success(res, "Manager status updated", { active: Boolean(req.body.active) });
};

const centerReports = async (req, res) => {
  try {
    const { centerId = "" } = req.query;
    const { page, limit, offset } = getPagination({ ...req.query, limit: req.query.pageSize || req.query.limit });

    const where = {};
    if (centerId) where.id = Number(centerId);

    const centers = await db.ServiceCenter.findAndCountAll({ where, order: [["id", "ASC"]], limit, offset });

    const rows = await Promise.all(
      centers.rows.map(async (center) => {
        const jobsCompleted = await db.JobCard.count({ where: { service_center_id: center.id, status: "Completed" } });
        const jobsPending = await db.JobCard.count({ where: { service_center_id: center.id, status: { [Op.ne]: "Completed" } } });

        const invoices = await db.Invoice.findAll({
          include: [{ model: db.JobCard, as: "job", where: { service_center_id: center.id }, attributes: [] }],
          attributes: ["total_amount"],
        });

        const yearlyRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

        return {
          centerId: center.id,
          centerName: center.name,
          location: center.location,
          jobsCompleted,
          jobsPending,
          monthlyRevenue: yearlyRevenue,
          yearlyRevenue,
        };
      })
    );

    return success(res, "Center reports fetched", {
      rows,
      pagination: {
        page,
        pageSize: limit,
        total: centers.count,
        totalPages: Math.max(1, Math.ceil(centers.count / limit)),
      },
    });
  } catch (error) {
    return failure(res, "Could not fetch center reports", 500, [error.message]);
  }
};

const getSettings = async (req, res) => {
  try {
    const services = await db.Service.findAll({ attributes: ["name"], order: [["name", "ASC"]] });
    const categories = Array.from(new Set(services.map((item) => item.name).filter(Boolean)));

    return success(res, "Settings fetched", {
      taxPercentage: runtimeSettings.taxPercentage,
      discountRules: runtimeSettings.discountRules,
      serviceCategories: categories,
    });
  } catch (error) {
    return failure(res, "Could not fetch settings", 500, [error.message]);
  }
};

const updateTax = async (req, res) => {
  runtimeSettings.taxPercentage = Number(req.body.taxPercentage || runtimeSettings.taxPercentage);
  return success(res, "Tax updated", { taxPercentage: runtimeSettings.taxPercentage });
};

const addDiscountRule = async (req, res) => {
  const rule = {
    id: Date.now(),
    name: req.body.name,
    percentage: Number(req.body.percentage || 0),
    minAmount: Number(req.body.minAmount || 0),
  };
  runtimeSettings.discountRules = [rule, ...runtimeSettings.discountRules];
  return success(res, "Discount rule added", rule, 201);
};

const addServiceCategory = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return failure(res, "Category name is required", 400);

    const existing = await db.Service.findOne({ where: { name } });
    if (!existing) {
      await db.Service.create({ name, price: 0, description: "Service category" });
    }

    return success(res, "Service category added", { name }, 201);
  } catch (error) {
    return failure(res, "Could not add service category", 500, [error.message]);
  }
};

module.exports = {
  getOverview,
  listServiceCenters,
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
  listManagers,
  createManager,
  assignManagerToCenter,
  toggleManagerStatus,
  centerReports,
  getSettings,
  updateTax,
  addDiscountRule,
  addServiceCategory,
};
