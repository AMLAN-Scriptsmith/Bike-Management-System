import request from "./apiClient";

const toQuery = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (key === "status") {
        const statusMap = {
          "Pending Assignment": "Pending",
          "Pending Approval": "Pending",
        };
        params.append(key, statusMap[value] || value);
      } else if (key === "priority" || key === "serviceType" || key === "timeframe") {
        // Compatibility filter fields handled client-side below.
      } else {
        params.append(key, value);
      }
    }
  });
  return params.toString();
};

const fromBackendStatus = (status) => {
  const map = {
    Pending: "Pending Assignment",
    Assigned: "Assigned",
    "In Progress": "In Progress",
    "Waiting for Parts": "In Progress",
    Completed: "Completed",
  };
  return map[status] || status;
};

const toBackendStatus = (status) => {
  const map = {
    "Pending Assignment": "Pending",
    "Pending Approval": "Pending",
  };
  return map[status] || status;
};

const mapJob = (row = {}) => {
  const bike = row.bike || {};
  const owner = bike.owner || {};
  const services = row.job_services || [];
  const parts = row.parts_usage || [];

  return {
    id: row.id,
    customerId: owner.id || null,
    customerName: owner.name || "Walk-in Customer",
    customerPhone: owner.phone || "N/A",
    customerAddress: row.service_center?.location || "Service Center",
    serviceType: services[0]?.service?.name || "General Service",
    description: `Bike ${bike.brand || ""} ${bike.model || ""}`.trim() || "Service request",
    priority: row.status === "Pending" ? "High" : row.status === "Completed" ? "Low" : "Medium",
    status: fromBackendStatus(row.status),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    scheduledDate: row.updated_at || row.created_at || new Date().toISOString(),
    estimatedDuration: 120,
    parts: parts.map((p) => p.part?.name).filter(Boolean),
    assignedTechnician: row.assigned_to || row.technician?.id || null,
    technicianName: row.technician?.name || null,
  };
};

const mapTechnician = (tech = {}) => ({
  id: tech.id,
  name: tech.name,
  phone: tech.phone || "N/A",
  email: tech.email || "",
  specialization: "General Service, Oil Change, Brake Service, AC Repair, Refrigerator Service, Washing Machine, Dishwasher",
  status: "Available",
  currentJobs: 0,
  maxJobs: 5,
  location: "Main Workshop",
  rating: 4.6,
  reviewCount: 25,
  experience: 4,
  completedJobs: 20,
});

const safeRequest = async (executor) => {
  try {
    return await executor();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const jobApi = {
  getAllJobs: async (filters = {}) => {
    const query = toQuery(filters);
    return safeRequest(async () => {
      const response = await request(`/jobs${query ? `?${query}` : ""}`);
      const rows = response.data?.rows || [];
      let mapped = rows.map(mapJob);

      if (filters.priority) {
        mapped = mapped.filter((j) => j.priority === filters.priority);
      }
      if (filters.serviceType) {
        mapped = mapped.filter((j) => j.serviceType === filters.serviceType);
      }

      return {
        success: true,
        data: mapped,
        total: response.data?.meta?.total || mapped.length,
      };
    });
  },

  getJobById: async (jobId) => {
    return safeRequest(async () => {
      const response = await request(`/jobs/${jobId}`);
      return {
        success: true,
        data: mapJob(response.data?.job || {}),
      };
    });
  },

  getAvailableTechnicians: async () => {
    return safeRequest(async () => {
      const response = await request("/jobs/technicians/available");
      const technicians = (response.data?.technicians || []).map(mapTechnician);
      return { success: true, data: technicians };
    });
  },

  assignJob: async (jobId, technicianId) => {
    return safeRequest(() =>
      request(`/jobs/${jobId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ technicianId }),
      })
    );
  },

  updateJobStatus: async (jobId, status) => {
    return safeRequest(() =>
      request(`/jobs/${jobId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: toBackendStatus(status) }),
      })
    );
  },

  createJob: async (jobData) => {
    return safeRequest(() =>
      request("/jobs", {
        method: "POST",
        body: JSON.stringify(jobData),
      })
    );
  },

  approveJob: async (jobId) => {
    return safeRequest(() =>
      request(`/jobs/${jobId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Assigned" }),
      })
    );
  },

  completeJob: async (jobId) => {
    return safeRequest(() =>
      request(`/jobs/${jobId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Completed" }),
      })
    );
  },

  getTechnicians: async () => {
    return jobApi.getAvailableTechnicians();
  },

  updateJob: async (jobId, payload) => {
    return safeRequest(() =>
      request(`/jobs/${jobId}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    );
  },

  deleteJob: async () => {
    return { success: false, error: "Delete job endpoint is not implemented in backend yet" };
  },
};

export const getJobs = jobApi.getAllJobs;
export const createJob = jobApi.createJob;
export const updateJob = jobApi.updateJob;
export const deleteJob = jobApi.deleteJob;
export const getJobById = jobApi.getJobById;
export const assignJob = jobApi.assignJob;
export const approveJob = jobApi.approveJob;
export const completeJob = jobApi.completeJob;
export const getTechnicians = jobApi.getTechnicians;
export const getAvailableTechnicians = jobApi.getAvailableTechnicians;

export default jobApi;
