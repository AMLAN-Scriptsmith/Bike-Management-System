import request from "./apiClient";
const runSafe = async (runner) => {
  try {
    return await runner();
  } catch (error) {
    return { success: false, message: error.message || "Request failed" };
  }
};

const normalizePaging = (payload, page = 1, pageSize = 5) => {
  return payload?.pagination || { page, pageSize, total: 0, totalPages: 1 };
};

export const receptionistApi = {
  getServices: async () => {
    return runSafe(async () => {
      const response = await request("/services");
      const services = (response.data?.rows || response.data || []).map((service, idx) => ({
        id: service.id || idx + 1,
        name: service.name || "Service",
        charge: Number(service.charge || service.price || 0),
      }));
      return { success: true, data: services };
    });
  },

  getOverview: async () => {
    return runSafe(async () => request("/receptionist/overview"));
  },

  registerCustomer: async (payload) => {
    return runSafe(async () =>
      request("/receptionist/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  },

  findCustomerByPhone: async (phone) => {
    return runSafe(async () => request(`/receptionist/customers/by-phone/${encodeURIComponent(phone)}`));
  },

  getCustomers: async ({ search = "", page = 1, pageSize = 5 } = {}) => {
    return runSafe(async () => {
      const query = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) });
      const response = await request(`/receptionist/customers?${query.toString()}`);
      return {
        success: true,
        data: response.data?.rows || [],
        pagination: normalizePaging(response.data, page, pageSize),
      };
    });
  },

  createJobCard: async (payload) => {
    return runSafe(async () =>
      request("/receptionist/job-cards", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  },

  getJobCards: async ({ page = 1, pageSize = 5 } = {}) => {
    return runSafe(async () => {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const response = await request(`/receptionist/job-cards?${query.toString()}`);
      return {
        success: true,
        data: response.data?.rows || [],
        pagination: normalizePaging(response.data, page, pageSize),
      };
    });
  },

  bookAppointment: async (payload) => {
    return runSafe(async () =>
      request("/receptionist/appointments", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  },

  getAppointments: async ({ date = "", page = 1, pageSize = 5 } = {}) => {
    return runSafe(async () => {
      const query = new URLSearchParams({ date, page: String(page), pageSize: String(pageSize) });
      const response = await request(`/receptionist/appointments?${query.toString()}`);
      return {
        success: true,
        data: response.data?.rows || [],
        pagination: normalizePaging(response.data, page, pageSize),
      };
    });
  },

  generateInvoice: async ({ jobId, serviceCharge, spareParts }) => {
    return runSafe(async () => {
      const response = await request(`/billing/jobs/${jobId}/invoice`, { method: "POST" });
      const invoice = response.data?.invoice;
      return {
        success: true,
        message: "Invoice generated",
        data: {
          invoiceId: invoice?.id,
          subTotal: Number(response.data?.totals?.subTotal || serviceCharge + spareParts),
          taxAmount: Number(response.data?.totals?.tax || 0),
          totalAmount: Number(response.data?.totals?.grandTotal || serviceCharge + spareParts),
        },
      };
    });
  },

  processPayment: async ({ invoiceId, amount, method, notes, jobCardId, gatewayPaymentId }) => {
    return runSafe(async () =>
      request(`/billing/invoices/${invoiceId}/payment`, {
        method: "POST",
        body: JSON.stringify({ amount, method, gatewayPaymentId, notes, jobCardId }),
      })
    );
  },

  getPayments: async ({ page = 1, pageSize = 5 } = {}) => {
    return runSafe(async () => {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const response = await request(`/receptionist/payments?${query.toString()}`);
      return {
        success: true,
        data: response.data?.rows || [],
        pagination: normalizePaging(response.data, page, pageSize),
      };
    });
  },
};

export default receptionistApi;
