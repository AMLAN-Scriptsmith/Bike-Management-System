const sequelize = require("../config/database");

const User = require("./user.model")(sequelize);
const ServiceCenter = require("./serviceCenter.model")(sequelize);
const Bike = require("./bike.model")(sequelize);
const JobCard = require("./jobCard.model")(sequelize);
const Service = require("./service.model")(sequelize);
const JobService = require("./jobService.model")(sequelize);
const SparePart = require("./sparePart.model")(sequelize);
const PartsUsage = require("./partsUsage.model")(sequelize);
const Invoice = require("./invoice.model")(sequelize);
const Payment = require("./payment.model")(sequelize);
const Feedback = require("./feedback.model")(sequelize);
const TechnicianUpdate = require("./technicianUpdate.model")(sequelize);
const Appointment = require("./appointment.model")(sequelize);

User.hasMany(Bike, { foreignKey: "user_id", as: "bikes" });
Bike.belongsTo(User, { foreignKey: "user_id", as: "owner" });

User.hasMany(ServiceCenter, { foreignKey: "admin_id", as: "managed_centers" });
ServiceCenter.belongsTo(User, { foreignKey: "admin_id", as: "admin" });

Bike.hasMany(JobCard, { foreignKey: "bike_id", as: "jobs" });
JobCard.belongsTo(Bike, { foreignKey: "bike_id", as: "bike" });

ServiceCenter.hasMany(JobCard, { foreignKey: "service_center_id", as: "jobs" });
JobCard.belongsTo(ServiceCenter, { foreignKey: "service_center_id", as: "service_center" });

User.hasMany(JobCard, { foreignKey: "assigned_to", as: "assigned_jobs" });
JobCard.belongsTo(User, { foreignKey: "assigned_to", as: "technician" });

JobCard.belongsToMany(Service, { through: JobService, foreignKey: "job_id", otherKey: "service_id", as: "services" });
Service.belongsToMany(JobCard, { through: JobService, foreignKey: "service_id", otherKey: "job_id", as: "jobs" });

JobCard.hasMany(JobService, { foreignKey: "job_id", as: "job_services" });
JobService.belongsTo(JobCard, { foreignKey: "job_id", as: "job" });
Service.hasMany(JobService, { foreignKey: "service_id", as: "service_items" });
JobService.belongsTo(Service, { foreignKey: "service_id", as: "service" });

JobCard.hasMany(PartsUsage, { foreignKey: "job_id", as: "parts_usage" });
PartsUsage.belongsTo(JobCard, { foreignKey: "job_id", as: "job" });
SparePart.hasMany(PartsUsage, { foreignKey: "part_id", as: "usage_entries" });
PartsUsage.belongsTo(SparePart, { foreignKey: "part_id", as: "part" });

JobCard.hasOne(Invoice, { foreignKey: "job_id", as: "invoice" });
Invoice.belongsTo(JobCard, { foreignKey: "job_id", as: "job" });

Invoice.hasMany(Payment, { foreignKey: "invoice_id", as: "payments" });
Payment.belongsTo(Invoice, { foreignKey: "invoice_id", as: "invoice" });

User.hasMany(Feedback, { foreignKey: "user_id", as: "feedbacks" });
Feedback.belongsTo(User, { foreignKey: "user_id", as: "customer" });
JobCard.hasMany(Feedback, { foreignKey: "job_id", as: "feedback_entries" });
Feedback.belongsTo(JobCard, { foreignKey: "job_id", as: "job" });

JobCard.hasMany(TechnicianUpdate, { foreignKey: "job_id", as: "technician_updates" });
TechnicianUpdate.belongsTo(JobCard, { foreignKey: "job_id", as: "job" });
User.hasMany(TechnicianUpdate, { foreignKey: "technician_id", as: "work_updates" });
TechnicianUpdate.belongsTo(User, { foreignKey: "technician_id", as: "technician" });

const db = {
  sequelize,
  User,
  ServiceCenter,
  Bike,
  JobCard,
  Service,
  JobService,
  SparePart,
  PartsUsage,
  Invoice,
  Payment,
  Feedback,
  TechnicianUpdate,
  Appointment,
};

module.exports = db;
