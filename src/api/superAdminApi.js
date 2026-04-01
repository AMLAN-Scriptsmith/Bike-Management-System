import request from "./apiClient";
import { reportApi } from "./reportApi";

const CENTER_KEY = "sa_service_centers";
const MANAGER_KEY = "sa_managers";
const SETTINGS_KEY = "sa_settings";

const DEMO_CENTERS = [
  { id: 1, name: "Central Bike Hub", location: "Kolkata", managerId: 1, managerName: "Amit Roy", active: true },
  { id: 2, name: "North Service Point", location: "Howrah", managerId: 2, managerName: "Priya Das", active: true },
  { id: 3, name: "South Workshop", location: "Salt Lake", managerId: null, managerName: "Unassigned", active: true },
  { id: 4, name: "Express Care Center", location: "Dum Dum", managerId: 4, managerName: "Rahul Sen", active: false },
];

const DEMO_MANAGERS = [
  { id: 1, name: "Amit Roy", email: "amit.manager@test.com", phone: "+91-900000001", serviceCenterId: 1, serviceCenterName: "Central Bike Hub", active: true },
  { id: 2, name: "Priya Das", email: "priya.manager@test.com", phone: "+91-900000002", serviceCenterId: 2, serviceCenterName: "North Service Point", active: true },
  { id: 3, name: "Neha Singh", email: "neha.manager@test.com", phone: "+91-900000003", serviceCenterId: null, serviceCenterName: "Unassigned", active: true },
  { id: 4, name: "Rahul Sen", email: "rahul.manager@test.com", phone: "+91-900000004", serviceCenterId: 4, serviceCenterName: "Express Care Center", active: false },
];

const DEMO_SETTINGS = {
  taxPercentage: 18,
  discountRules: [
    { id: 1, name: "Festival Offer", percentage: 10, minAmount: 2000 },
    { id: 2, name: "Premium Customer", percentage: 8, minAmount: 1500 },
  ],
  serviceCategories: ["General Service", "Engine Repair", "Brake Service", "Electrical", "Detailing"],
};

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const ensureSeedData = () => {
  if (!localStorage.getItem(CENTER_KEY)) writeJson(CENTER_KEY, DEMO_CENTERS);
  if (!localStorage.getItem(MANAGER_KEY)) writeJson(MANAGER_KEY, DEMO_MANAGERS);
  if (!localStorage.getItem(SETTINGS_KEY)) writeJson(SETTINGS_KEY, DEMO_SETTINGS);
};

const paginate = (rows, page = 1, pageSize = 5) => {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const data = rows.slice(start, start + pageSize);
  return { data, pagination: { page: safePage, pageSize, total, totalPages } };
};

const buildCenterRevenueRows = (centers) => {
  return centers.map((center, idx) => {
    const jobsCompleted = 60 + idx * 14;
    const jobsPending = 12 + idx * 4;
    const monthlyRevenue = 120000 + idx * 35000;
    return {
      centerId: center.id,
      centerName: center.name,
      location: center.location,
      jobsCompleted,
      jobsPending,
      monthlyRevenue,
      yearlyRevenue: monthlyRevenue * 12,
    };
  });
};

const tryFetch = async (executor, fallback) => {
  try {
    return await executor();
  } catch (error) {
    return {
      success: false,
      message: error.message || "Request failed",
      data: [],
      pagination: { page: 1, pageSize: 5, total: 0, totalPages: 1 },
    };
  }
};

const getLocalCenters = () => readJson(CENTER_KEY, DEMO_CENTERS);
const setLocalCenters = (rows) => writeJson(CENTER_KEY, rows);

const getLocalManagers = () => readJson(MANAGER_KEY, DEMO_MANAGERS);
const setLocalManagers = (rows) => writeJson(MANAGER_KEY, rows);

const getLocalSettings = () => readJson(SETTINGS_KEY, DEMO_SETTINGS);
const setLocalSettings = (rows) => writeJson(SETTINGS_KEY, rows);

ensureSeedData();

export const superAdminApi = {
  getOverview: async () => {
    return tryFetch(
      async () => {
        const [overview, reportData] = await Promise.all([
          request("/admin/overview"),
          reportApi.getDashboardReport(),
        ]);

        return {
          success: true,
          data: {
            totalCenters: overview.data?.totalCenters || 0,
            totalUsers: overview.data?.totalUsers || 0,
            totalJobs: overview.data?.totalJobs || reportData.data?.jobStats?.total || 0,
            completedJobs: overview.data?.completedJobs || reportData.data?.jobStats?.completed || 0,
            pendingJobs: overview.data?.pendingJobs || reportData.data?.jobStats?.pending || 0,
            monthlyRevenue: Number(overview.data?.monthlyRevenue || reportData.data?.revenueStats?.thisMonth || 0),
            yearlyRevenue: Number(overview.data?.yearlyRevenue || (reportData.data?.revenueStats?.thisMonth || 0) * 12),
            usersBreakdown: overview.data?.usersBreakdown || { managers: 0, technicians: 0, customers: 0 },
            monthlyTrend: overview.data?.monthlyTrend || [],
          },
        };
      },
      async () => {
        const [centers, managers, reportData] = await Promise.all([
          superAdminApi.getServiceCenters({ page: 1, pageSize: 1000 }),
          superAdminApi.getManagers({ page: 1, pageSize: 1000 }),
          reportApi.getDashboardReport(),
        ]);

        const jobStats = reportData.data?.jobStats || {};
        const technicians = reportData.data?.technicianStats?.totalTechnicians || 18;
        const customers = Math.max((jobStats.total || 0) * 2, 120);
        const monthlyRevenue = Number(reportData.data?.revenueStats?.thisMonth || 0);

        const monthlyTrend = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun"
        ].map((m, idx) => ({ month: m, revenue: Math.max(40000, monthlyRevenue - (5 - idx) * 7000) }));

        return {
          success: true,
          data: {
            totalCenters: centers.pagination.total,
            totalUsers: managers.pagination.total + technicians + customers,
            totalJobs: jobStats.total || 0,
            completedJobs: jobStats.completed || 0,
            pendingJobs: jobStats.pending || 0,
            monthlyRevenue,
            yearlyRevenue: monthlyRevenue * 12,
            usersBreakdown: {
              managers: managers.pagination.total,
              technicians,
              customers,
            },
            monthlyTrend,
          },
        };
      }
    );
  },

  getServiceCenters: async ({ search = "", managerId = "", page = 1, pageSize = 5 } = {}) => {
    return tryFetch(
      async () => {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (search) params.append("search", search);
        if (managerId) params.append("managerId", managerId);

        const response = await request(`/admin/service-centers?${params.toString()}`);
        return {
          success: true,
          data: response.data?.rows || [],
          pagination: response.data?.pagination || { page, pageSize, total: 0, totalPages: 1 },
        };
      },
      async () => {
        const rows = getLocalCenters();
        const filtered = rows.filter((row) => {
          const bySearch = !search || row.name.toLowerCase().includes(search.toLowerCase()) || row.location.toLowerCase().includes(search.toLowerCase());
          const byManager = !managerId || String(row.managerId || "") === String(managerId);
          return bySearch && byManager;
        });

        const paged = paginate(filtered, page, pageSize);
        return { success: true, ...paged };
      }
    );
  },

  createServiceCenter: async (payload) => {
    return tryFetch(
      async () => {
        const response = await request("/admin/service-centers", { method: "POST", body: JSON.stringify(payload) });
        return { success: true, data: response.data, message: "Service center created successfully" };
      },
      async () => {
        const centers = getLocalCenters();
        const nextId = centers.length ? Math.max(...centers.map((c) => c.id)) + 1 : 1;
        const managers = getLocalManagers();
        const manager = managers.find((m) => String(m.id) === String(payload.managerId));
        const created = {
          id: nextId,
          name: payload.name,
          location: payload.location,
          managerId: payload.managerId ? Number(payload.managerId) : null,
          managerName: manager?.name || "Unassigned",
          active: true,
        };

        const nextCenters = [created, ...centers];
        setLocalCenters(nextCenters);

        if (manager) {
          const nextManagers = managers.map((m) =>
            m.id === manager.id ? { ...m, serviceCenterId: created.id, serviceCenterName: created.name } : m
          );
          setLocalManagers(nextManagers);
        }

        return { success: true, data: created, message: "Service center created successfully" };
      }
    );
  },

  updateServiceCenter: async (centerId, payload) => {
    return tryFetch(
      async () => {
        const response = await request(`/admin/service-centers/${centerId}`, { method: "PUT", body: JSON.stringify(payload) });
        return { success: true, data: response.data, message: "Service center updated successfully" };
      },
      async () => {
        const centers = getLocalCenters();
        const managers = getLocalManagers();
        const manager = managers.find((m) => String(m.id) === String(payload.managerId));

        const nextCenters = centers.map((center) =>
          center.id === centerId
            ? {
                ...center,
                name: payload.name,
                location: payload.location,
                managerId: payload.managerId ? Number(payload.managerId) : null,
                managerName: manager?.name || "Unassigned",
              }
            : center
        );
        setLocalCenters(nextCenters);

        const updatedCenter = nextCenters.find((c) => c.id === centerId);
        const nextManagers = managers.map((m) => {
          if (updatedCenter?.managerId === m.id) {
            return { ...m, serviceCenterId: centerId, serviceCenterName: updatedCenter.name };
          }
          if (m.serviceCenterId === centerId && updatedCenter?.managerId !== m.id) {
            return { ...m, serviceCenterId: null, serviceCenterName: "Unassigned" };
          }
          return m;
        });
        setLocalManagers(nextManagers);

        return { success: true, data: updatedCenter, message: "Service center updated successfully" };
      }
    );
  },

  deleteServiceCenter: async (centerId) => {
    return tryFetch(
      async () => {
        await request(`/admin/service-centers/${centerId}`, { method: "DELETE" });
        return { success: true, message: "Service center deleted" };
      },
      async () => {
        const centers = getLocalCenters().filter((c) => c.id !== centerId);
        setLocalCenters(centers);

        const managers = getLocalManagers().map((m) =>
          m.serviceCenterId === centerId ? { ...m, serviceCenterId: null, serviceCenterName: "Unassigned" } : m
        );
        setLocalManagers(managers);

        return { success: true, message: "Service center deleted" };
      }
    );
  },

  getManagers: async ({ search = "", centerId = "", active = "", page = 1, pageSize = 5 } = {}) => {
    return tryFetch(
      async () => {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (search) params.append("search", search);
        if (centerId) params.append("centerId", centerId);
        if (active !== "") params.append("active", active);

        const response = await request(`/admin/managers?${params.toString()}`);
        return {
          success: true,
          data: response.data?.rows || [],
          pagination: response.data?.pagination || { page, pageSize, total: 0, totalPages: 1 },
        };
      },
      async () => {
        const rows = getLocalManagers();
        const filtered = rows.filter((row) => {
          const bySearch = !search || row.name.toLowerCase().includes(search.toLowerCase()) || row.email.toLowerCase().includes(search.toLowerCase());
          const byCenter = !centerId || String(row.serviceCenterId || "") === String(centerId);
          const byActive = active === "" || String(row.active) === String(active);
          return bySearch && byCenter && byActive;
        });

        const paged = paginate(filtered, page, pageSize);
        return { success: true, ...paged };
      }
    );
  },

  createManager: async (payload) => {
    return tryFetch(
      async () => {
        const response = await request("/admin/managers", { method: "POST", body: JSON.stringify(payload) });
        return { success: true, data: response.data, message: "Manager created successfully" };
      },
      async () => {
        const managers = getLocalManagers();
        const centers = getLocalCenters();
        const nextId = managers.length ? Math.max(...managers.map((m) => m.id)) + 1 : 1;
        const center = centers.find((c) => String(c.id) === String(payload.serviceCenterId));

        const created = {
          id: nextId,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          serviceCenterId: payload.serviceCenterId ? Number(payload.serviceCenterId) : null,
          serviceCenterName: center?.name || "Unassigned",
          active: true,
        };

        setLocalManagers([created, ...managers]);

        if (center) {
          const nextCenters = centers.map((c) =>
            c.id === center.id ? { ...c, managerId: created.id, managerName: created.name } : c
          );
          setLocalCenters(nextCenters);
        }

        return { success: true, data: created, message: "Manager created successfully" };
      }
    );
  },

  assignManagerToCenter: async (managerId, centerId) => {
    return tryFetch(
      async () => {
        const response = await request(`/admin/managers/${managerId}/assign-center`, {
          method: "PATCH",
          body: JSON.stringify({ centerId }),
        });
        return { success: true, data: response.data, message: "Manager assigned successfully" };
      },
      async () => {
        const managers = getLocalManagers();
        const centers = getLocalCenters();

        const center = centers.find((c) => c.id === Number(centerId));
        const manager = managers.find((m) => m.id === Number(managerId));

        const nextManagers = managers.map((m) => {
          if (m.id === Number(managerId)) {
            return { ...m, serviceCenterId: Number(centerId), serviceCenterName: center?.name || "Unassigned" };
          }
          return m;
        });

        const nextCenters = centers.map((c) => {
          if (c.id === Number(centerId)) {
            return { ...c, managerId: Number(managerId), managerName: manager?.name || "Unassigned" };
          }
          if (c.managerId === Number(managerId) && c.id !== Number(centerId)) {
            return { ...c, managerId: null, managerName: "Unassigned" };
          }
          return c;
        });

        setLocalManagers(nextManagers);
        setLocalCenters(nextCenters);

        return { success: true, message: "Manager assigned successfully" };
      }
    );
  },

  toggleManagerStatus: async (managerId, active) => {
    return tryFetch(
      async () => {
        const response = await request(`/admin/managers/${managerId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ active }),
        });
        return { success: true, data: response.data, message: "Manager status updated" };
      },
      async () => {
        const managers = getLocalManagers().map((m) =>
          m.id === Number(managerId) ? { ...m, active } : m
        );
        setLocalManagers(managers);
        return { success: true, message: "Manager status updated" };
      }
    );
  },

  getReports: async ({ centerId = "", page = 1, pageSize = 5 } = {}) => {
    return tryFetch(
      async () => {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (centerId) params.append("centerId", centerId);
        const response = await request(`/admin/reports/centers?${params.toString()}`);
        return { success: true, data: response.data?.rows || [], pagination: response.data?.pagination };
      },
      async () => {
        const centers = getLocalCenters();
        let rows = buildCenterRevenueRows(centers);
        if (centerId) rows = rows.filter((row) => String(row.centerId) === String(centerId));
        const paged = paginate(rows, page, pageSize);
        return { success: true, ...paged };
      }
    );
  },

  getSettings: async () => {
    return tryFetch(
      async () => {
        const response = await request("/admin/settings");
        return { success: true, data: response.data };
      },
      async () => ({ success: true, data: getLocalSettings() })
    );
  },

  updateTax: async (taxPercentage) => {
    return tryFetch(
      async () => {
        const response = await request("/admin/settings/tax", {
          method: "PATCH",
          body: JSON.stringify({ taxPercentage }),
        });
        return { success: true, data: response.data, message: "Tax updated" };
      },
      async () => {
        const settings = getLocalSettings();
        const next = { ...settings, taxPercentage: Number(taxPercentage) };
        setLocalSettings(next);
        return { success: true, data: next, message: "Tax updated" };
      }
    );
  },

  addDiscountRule: async (rule) => {
    return tryFetch(
      async () => {
        const response = await request("/admin/settings/discount-rules", {
          method: "POST",
          body: JSON.stringify(rule),
        });
        return { success: true, data: response.data, message: "Discount rule added" };
      },
      async () => {
        const settings = getLocalSettings();
        const nextRule = {
          id: Date.now(),
          name: rule.name,
          percentage: Number(rule.percentage),
          minAmount: Number(rule.minAmount),
        };
        const next = { ...settings, discountRules: [...settings.discountRules, nextRule] };
        setLocalSettings(next);
        return { success: true, data: next, message: "Discount rule added" };
      }
    );
  },

  addServiceCategory: async (categoryName) => {
    return tryFetch(
      async () => {
        const response = await request("/admin/settings/service-categories", {
          method: "POST",
          body: JSON.stringify({ name: categoryName }),
        });
        return { success: true, data: response.data, message: "Service category added" };
      },
      async () => {
        const settings = getLocalSettings();
        const next = {
          ...settings,
          serviceCategories: Array.from(new Set([...settings.serviceCategories, categoryName.trim()])),
        };
        setLocalSettings(next);
        return { success: true, data: next, message: "Service category added" };
      }
    );
  },
};

export default superAdminApi;
