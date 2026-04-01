const ROLES = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  RECEPTIONIST: "Receptionist",
  TECHNICIAN: "Technician",
  CUSTOMER: "Customer",
};

const JOB_STATUSES = [
  "Pending",
  "Assigned",
  "In Progress",
  "Waiting for Parts",
  "Completed",
];

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];
const PAYMENT_METHODS = ["UPI", "CARD", "NET_BANKING", "WALLET", "CASH"];

module.exports = {
  ROLES,
  JOB_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
};
