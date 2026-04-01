const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpaySdk = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpayCheckout = async ({ keyId, amount, currency = "INR", name, description, prefill, notes }) => {
  const loaded = await loadRazorpaySdk();
  if (!loaded || !window.Razorpay) {
    throw new Error("Unable to load Razorpay SDK");
  }

  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay({
      key: keyId,
      amount: Math.round(Number(amount) * 100),
      currency,
      name,
      description,
      prefill,
      notes,
      theme: { color: "#1f7a8c" },
      handler: (response) => {
        resolve({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id || null,
          signature: response.razorpay_signature || null,
        });
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    });

    razorpay.open();
  });
};

export const isRazorpayEnabled = () => {
  return (process.env.REACT_APP_PAYMENT_GATEWAY_PROVIDER || "MOCK").toUpperCase() === "RAZORPAY";
};
