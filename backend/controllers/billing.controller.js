const db = require("../models");
const { success, failure } = require("../utils/apiResponse");
const { calculateJobTotal, generateInvoiceForJob } = require("../services/invoiceService");
const { processGatewayPayment } = require("../services/paymentGatewayService");
const { PAYMENT_METHODS } = require("../utils/constants");

const generateInvoice = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await db.JobCard.findByPk(jobId);
    if (!job) {
      return failure(res, "Job not found", 404);
    }

    const payload = await generateInvoiceForJob(jobId);
    return success(res, "Invoice generated", payload);
  } catch (error) {
    return failure(res, "Could not generate invoice", 500, [error.message]);
  }
};

const calculateTotal = async (req, res) => {
  try {
    const { jobId } = req.params;
    const totals = await calculateJobTotal(jobId);

    return success(res, "Total calculated", totals);
  } catch (error) {
    return failure(res, "Could not calculate total", 500, [error.message]);
  }
};

const processPayment = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { invoiceId } = req.params;
    const { amount, method, gatewayPaymentId } = req.body;

    const normalizedMethod = String(method || "").toUpperCase();
    if (!PAYMENT_METHODS.includes(normalizedMethod)) {
      await transaction.rollback();
      return failure(res, "Invalid payment method", 400);
    }

    const invoice = await db.Invoice.findByPk(invoiceId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!invoice) {
      await transaction.rollback();
      return failure(res, "Invoice not found", 404);
    }

    if (invoice.payment_status === "Refunded") {
      await transaction.rollback();
      return failure(res, "Cannot collect payment for refunded invoice", 400);
    }

    const payments = await db.Payment.findAll({
      where: { invoice_id: invoice.id },
      attributes: ["amount"],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const paidAmount = payments.reduce((sum, paymentRow) => sum + Number(paymentRow.amount || 0), 0);
    const invoiceTotal = Number(invoice.total_amount || 0);
    const outstandingAmount = Math.max(invoiceTotal - paidAmount, 0);
    const paymentAmount = Number(amount);

    if (outstandingAmount <= 0) {
      await transaction.rollback();
      return failure(res, "Invoice is already fully paid", 409);
    }

    if (paymentAmount > outstandingAmount) {
      await transaction.rollback();
      return failure(res, `Payment exceeds outstanding amount (${outstandingAmount.toFixed(2)})`, 400);
    }

    const gatewayResult = await processGatewayPayment({
      amount: paymentAmount,
      method: normalizedMethod,
      invoiceId: invoice.id,
      gatewayPaymentId,
    });

    if (!gatewayResult.success) {
      await transaction.rollback();
      return failure(res, "Payment gateway rejected the transaction", 502);
    }

    const payment = await db.Payment.create({
      invoice_id: invoice.id,
      amount: paymentAmount,
      method: normalizedMethod,
      transaction_id: gatewayResult.transactionId,
    }, { transaction });

    const newPaidAmount = paidAmount + paymentAmount;
    const newOutstanding = Math.max(invoiceTotal - newPaidAmount, 0);

    if (newOutstanding <= 0) {
      invoice.payment_status = "Paid";
    } else {
      invoice.payment_status = "Pending";
    }
    invoice.payment_method = normalizedMethod;
    await invoice.save({ transaction });

    await transaction.commit();

    return success(res, "Payment processed", {
      payment,
      invoice,
      summary: {
        invoiceTotal,
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstanding,
      },
      gateway: {
        provider: gatewayResult.provider,
        gatewayReference: gatewayResult.gatewayReference,
        gatewayPaymentId: gatewayResult.transactionId,
      },
    });
  } catch (error) {
    await transaction.rollback();
    return failure(res, "Could not process payment", 500, [error.message]);
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentStatus } = req.body;

    const invoice = await db.Invoice.findByPk(invoiceId);
    if (!invoice) {
      return failure(res, "Invoice not found", 404);
    }

    invoice.payment_status = paymentStatus;
    await invoice.save();

    return success(res, "Payment status updated", { invoice });
  } catch (error) {
    return failure(res, "Could not update payment status", 500, [error.message]);
  }
};

module.exports = {
  generateInvoice,
  calculateTotal,
  processPayment,
  updatePaymentStatus,
};
