const { Op } = require("sequelize");
const db = require("../models");

const calculateJobTotal = async (jobId) => {
  const jobServices = await db.JobService.findAll({
    where: { job_id: jobId },
    include: [{ model: db.Service, as: "service", attributes: ["price"] }],
  });

  const partsUsage = await db.PartsUsage.findAll({
    where: { job_id: jobId },
    include: [{ model: db.SparePart, as: "part", attributes: ["price"] }],
  });

  const serviceTotal = jobServices.reduce((sum, item) => {
    return sum + Number(item.service?.price || 0);
  }, 0);

  const partsTotal = partsUsage.reduce((sum, usage) => {
    const price = Number(usage.part?.price || 0);
    return sum + price * usage.quantity;
  }, 0);

  return {
    serviceTotal,
    partsTotal,
    grandTotal: serviceTotal + partsTotal,
  };
};

const generateInvoiceForJob = async (jobId, paymentMethod = null) => {
  const totals = await calculateJobTotal(jobId);
  const [invoice] = await db.Invoice.findOrCreate({
    where: { job_id: jobId },
    defaults: {
      total_amount: totals.grandTotal,
      payment_status: "Pending",
      payment_method: paymentMethod,
    },
  });

  if (invoice.total_amount !== totals.grandTotal || invoice.payment_method !== paymentMethod) {
    invoice.total_amount = totals.grandTotal;
    if (paymentMethod) {
      invoice.payment_method = paymentMethod;
    }
    await invoice.save();
  }

  return { invoice, totals };
};

module.exports = {
  calculateJobTotal,
  generateInvoiceForJob,
};
