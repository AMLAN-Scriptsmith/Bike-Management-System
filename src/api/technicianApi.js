import request from "./apiClient";

const safeRequest = async (executor) => {
  try {
    return await executor();
  } catch (error) {
    return { success: false, message: error.message || "Request failed" };
  }
};

const requestPaginationHelper = (items, page = 1, pageSize = 5) => {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const paged = items.slice(startIdx, startIdx + pageSize);
  return {
    data: paged,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
};

const mapAssignedJob = (job = {}) => ({
  jobCardId: String(job.id),
  customerName: job.bike?.owner?.name || "Customer",
  bikeLabel: `${job.bike?.brand || ""} ${job.bike?.model || ""} (${job.bike?.number_plate || "-"})`.trim(),
  problemDescription: (job.technician_updates || []).map((entry) => entry.note).filter(Boolean).join(" | ") || "Service request",
  status: job.status,
  createdAt: job.created_at,
});

export const technicianApi = {
  getAssignedJobs: async ({ status, page = 1, pageSize = 5 } = {}) => {
    return safeRequest(async () => {
      const response = await request("/technicians/jobs");
      let rows = (response.data?.jobs || []).map(mapAssignedJob);
      if (status && status !== "All") {
        rows = rows.filter((row) => row.status === status);
      }
      return { success: true, ...requestPaginationHelper(rows, page, pageSize) };
    });
  },

  getJobDetails: async (jobCardId) => {
    return safeRequest(async () => {
      const response = await request(`/jobs/${jobCardId}`);
      const job = response.data?.job || {};
      return {
        success: true,
        data: {
          jobCardId: String(job.id),
          customerName: job.bike?.owner?.name || "Customer",
          bikeLabel: `${job.bike?.brand || ""} ${job.bike?.model || ""} (${job.bike?.number_plate || "-"})`.trim(),
          problemDescription: (job.technician_updates || []).map((entry) => entry.note).filter(Boolean).join(" | ") || "Service request",
          status: job.status,
        },
      };
    });
  },

  updateJobStatus: async (jobCardId, newStatus) => {
    return safeRequest(async () => {
      await request(`/technicians/jobs/${jobCardId}/progress`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      return { success: true, message: "Job status updated successfully" };
    });
  },

  getAvailableParts: async () => {
    return safeRequest(async () => {
      const response = await request("/inventory/parts?limit=100");
      const parts = (response.data?.rows || []).map((item) => ({
        id: item.id,
        name: item.name,
        category: "Spare Parts",
        unitPrice: Number(item.price || 0),
        currentStock: Number(item.stock || 0),
        status: Number(item.stock || 0) > 5 ? "In Stock" : Number(item.stock || 0) > 0 ? "Low Stock" : "Critical",
      }));
      return { success: true, data: parts };
    });
  },

  requestParts: async (jobCardId, parts) => {
    return safeRequest(async () => {
      const requests = [];
      for (const entry of parts) {
        const response = await request(`/technicians/jobs/${jobCardId}/request-part`, {
          method: "POST",
          body: JSON.stringify({ partId: Number(entry.partId), quantity: Number(entry.quantity) }),
        });
        requests.push(response.data?.usage);
      }
      return { success: true, message: "Parts request submitted", data: requests };
    });
  },

  getPartsRequests: async ({ page = 1, pageSize = 5 } = {}) => {
    return safeRequest(async () => {
      const response = await request("/technicians/parts-requests");
      return { success: true, ...requestPaginationHelper(response.data?.rows || [], page, pageSize) };
    });
  },

  createWorkLog: async ({ jobCardId, notes }) => {
    return safeRequest(async () => {
      const response = await request(`/technicians/jobs/${jobCardId}/notes`, {
        method: "POST",
        body: JSON.stringify({ note: notes }),
      });
      return { success: true, message: "Work log entry recorded", data: response.data?.update };
    });
  },

  getWorkLogs: async ({ page = 1, pageSize = 5 } = {}) => {
    return safeRequest(async () => {
      const response = await request("/technicians/work-logs");
      return { success: true, ...requestPaginationHelper(response.data?.rows || [], page, pageSize) };
    });
  },

  getOverview: async () => {
    return safeRequest(async () => {
      const [jobsResp, partsResp] = await Promise.all([
        technicianApi.getAssignedJobs({ pageSize: 200 }),
        technicianApi.getPartsRequests({ pageSize: 200 }),
      ]);

      const jobs = jobsResp.data || [];
      const inProgress = jobs.filter((j) => j.status === "In Progress").length;
      const completed = jobs.filter((j) => j.status === "Completed").length;
      const partsRequested = (partsResp.data || []).length;

      return {
        success: true,
        data: {
          totalAssigned: jobs.length,
          inProgress,
          completed,
          partsRequested,
        },
      };
    });
  },

  uploadPhoto: async (file) => {
    return safeRequest(async () => {
      const formData = new FormData();
      formData.append("photo", file);
      const response = await request("/technicians/upload", {
        method: "POST",
        headers: {},
        body: formData,
      });
      return { success: true, data: { url: response.data?.url } };
    });
  },
};
