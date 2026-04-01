const crypto = require("crypto");

const toPaise = (amount) => Math.round(Number(amount) * 100);

const captureRazorpayPayment = async ({ amount, gatewayPaymentId }) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are missing");
  }

  if (!gatewayPaymentId) {
    throw new Error("gatewayPaymentId is required for Razorpay capture");
  }

  const authToken = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/payments/${gatewayPaymentId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: toPaise(amount),
      currency: process.env.PAYMENT_CURRENCY || "INR",
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const description = payload?.error?.description || payload?.error?.reason || "Unknown Razorpay error";
    throw new Error(`Razorpay capture failed: ${description}`);
  }

  return {
    success: true,
    provider: "RAZORPAY",
    transactionId: payload.id,
    gatewayReference: payload.order_id || payload.acquirer_data?.rrn || payload.id,
    amount: Number(amount),
  };
};

// This service wraps payment processing so a real gateway can be swapped in later.
const processGatewayPayment = async ({ amount, method, invoiceId, gatewayPaymentId }) => {
  const provider = (process.env.PAYMENT_GATEWAY_PROVIDER || "MOCK").toUpperCase();

  // For now, we run a deterministic mock gateway that returns a unique transaction id.
  if (provider === "MOCK") {
    return {
      success: true,
      provider,
      transactionId: `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      gatewayReference: `INV-${invoiceId}-${method}`,
      amount: Number(amount),
    };
  }

  if (provider === "RAZORPAY") {
    return captureRazorpayPayment({ amount, gatewayPaymentId });
  }

  throw new Error(`Unsupported payment gateway provider: ${provider}`);
};

module.exports = {
  processGatewayPayment,
};
