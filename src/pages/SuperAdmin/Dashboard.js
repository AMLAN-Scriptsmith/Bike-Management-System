import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBarChart2,
  FiDownload,
  FiEdit2,
  FiHome,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShield,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { superAdminApi } from "../../api/superAdminApi";
import "./SuperAdminDashboard.scss";

const navItems = [
  { key: "overview", label: "Dashboard Overview", icon: <FiHome /> },
  { key: "centers", label: "Service Centers Management", icon: <FiMapPin /> },
  { key: "managers", label: "Managers Management", icon: <FiUsers /> },
  { key: "reports", label: "Reports", icon: <FiBarChart2 /> },
  { key: "settings", label: "Settings", icon: <FiSettings /> },
];

const toCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const activeTabLabel = useMemo(() => {
    return navItems.find((item) => item.key === activeTab)?.label || "Dashboard Overview";
  }, [activeTab]);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const [overview, setOverview] = useState({
    totalCenters: 0,
    totalUsers: 0,
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    usersBreakdown: { managers: 0, technicians: 0, customers: 0 },
    monthlyTrend: [],
  });

  const [centers, setCenters] = useState([]);
  const [centersPagination, setCentersPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [centerFilters, setCenterFilters] = useState({ search: "", managerId: "" });
  const [centerForm, setCenterForm] = useState({ id: null, name: "", location: "", managerId: "" });

  const [managers, setManagers] = useState([]);
  const [managersPagination, setManagersPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [managerFilters, setManagerFilters] = useState({ search: "", centerId: "", active: "" });
  const [managerForm, setManagerForm] = useState({ name: "", email: "", phone: "", serviceCenterId: "" });

  const [reports, setReports] = useState([]);
  const [reportsPagination, setReportsPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [reportCenterId, setReportCenterId] = useState("");

  const [settings, setSettings] = useState({ taxPercentage: 0, discountRules: [], serviceCategories: [] });
  const [discountForm, setDiscountForm] = useState({ name: "", percentage: "", minAmount: "" });
  const [categoryName, setCategoryName] = useState("");

  const usersPieStyle = useMemo(() => {
    const total =
      Number(overview.usersBreakdown.managers || 0) +
      Number(overview.usersBreakdown.technicians || 0) +
      Number(overview.usersBreakdown.customers || 0);

    if (!total) {
      return { background: "conic-gradient(#dbeafe 0 100%)" };
    }

    const managersPct = Math.round((overview.usersBreakdown.managers / total) * 100);
    const techniciansPct = Math.round((overview.usersBreakdown.technicians / total) * 100);
    const customersPct = Math.max(0, 100 - managersPct - techniciansPct);

    return {
      background: `conic-gradient(#0ea5e9 0 ${managersPct}%, #14b8a6 ${managersPct}% ${managersPct + techniciansPct}%, #f59e0b ${managersPct + techniciansPct}% ${managersPct + techniciansPct + customersPct}%)`,
    };
  }, [overview]);

  const jobsPieStyle = useMemo(() => {
    const total = Number(overview.totalJobs || 0);
    if (!total) {
      return { background: "conic-gradient(#e2e8f0 0 100%)" };
    }

    const completedPct = Math.round((Number(overview.completedJobs || 0) / total) * 100);
    return {
      background: `conic-gradient(#10b981 0 ${completedPct}%, #f97316 ${completedPct}% 100%)`,
    };
  }, [overview]);

  const loadOverview = useCallback(async () => {
    const response = await superAdminApi.getOverview();
    if (response.success) setOverview(response.data);
  }, []);

  const loadCenters = useCallback(async (page = centersPagination.page) => {
    const response = await superAdminApi.getServiceCenters({ ...centerFilters, page, pageSize: centersPagination.pageSize });
    if (response.success) {
      setCenters(response.data);
      setCentersPagination(response.pagination);
    }
  }, [centerFilters, centersPagination.page, centersPagination.pageSize]);

  const loadManagers = useCallback(async (page = managersPagination.page) => {
    const response = await superAdminApi.getManagers({ ...managerFilters, page, pageSize: managersPagination.pageSize });
    if (response.success) {
      setManagers(response.data);
      setManagersPagination(response.pagination);
    }
  }, [managerFilters, managersPagination.page, managersPagination.pageSize]);

  const loadReports = useCallback(async (page = reportsPagination.page) => {
    const response = await superAdminApi.getReports({ centerId: reportCenterId, page, pageSize: reportsPagination.pageSize });
    if (response.success) {
      setReports(response.data);
      setReportsPagination(response.pagination);
    }
  }, [reportCenterId, reportsPagination.page, reportsPagination.pageSize]);

  const loadSettings = useCallback(async () => {
    const response = await superAdminApi.getSettings();
    if (response.success) setSettings(response.data);
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadOverview(), loadCenters(1), loadManagers(1), loadReports(1), loadSettings()]);
    setLoading(false);
  }, [loadCenters, loadManagers, loadOverview, loadReports, loadSettings]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const handleCenterSubmit = async (event) => {
    event.preventDefault();
    if (!centerForm.name.trim() || !centerForm.location.trim()) return;

    if (centerForm.id) {
      await superAdminApi.updateServiceCenter(centerForm.id, centerForm);
    } else {
      await superAdminApi.createServiceCenter(centerForm);
    }

    setCenterForm({ id: null, name: "", location: "", managerId: "" });
    await Promise.all([loadCenters(1), loadManagers(1), loadOverview()]);
  };

  const handleDeleteCenter = async (centerId) => {
    await superAdminApi.deleteServiceCenter(centerId);
    await Promise.all([loadCenters(1), loadManagers(1), loadOverview()]);
  };

  const handleManagerSubmit = async (event) => {
    event.preventDefault();
    if (!managerForm.name.trim() || !managerForm.email.trim()) return;

    await superAdminApi.createManager(managerForm);
    setManagerForm({ name: "", email: "", phone: "", serviceCenterId: "" });
    await Promise.all([loadManagers(1), loadCenters(1), loadOverview()]);
  };

  const handleAssignManager = async (managerId, centerId) => {
    if (!centerId) return;
    await superAdminApi.assignManagerToCenter(managerId, Number(centerId));
    await Promise.all([loadManagers(managersPagination.page), loadCenters(centersPagination.page)]);
  };

  const handleToggleManager = async (managerId, active) => {
    await superAdminApi.toggleManagerStatus(managerId, !active);
    await loadManagers(managersPagination.page);
  };

  const handleTaxUpdate = async (taxPercentage) => {
    await superAdminApi.updateTax(Number(taxPercentage));
    await loadSettings();
  };

  const handleAddDiscountRule = async (event) => {
    event.preventDefault();
    if (!discountForm.name.trim()) return;
    await superAdminApi.addDiscountRule(discountForm);
    setDiscountForm({ name: "", percentage: "", minAmount: "" });
    await loadSettings();
  };

  const handleAddServiceCategory = async (event) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    await superAdminApi.addServiceCategory(categoryName);
    setCategoryName("");
    await loadSettings();
  };

  const exportCsv = () => {
    const headers = ["Center", "Location", "Jobs Completed", "Jobs Pending", "Monthly Revenue", "Yearly Revenue"];
    const lines = reports.map((row) => [row.centerName, row.location, row.jobsCompleted, row.jobsPending, row.monthlyRevenue, row.yearlyRevenue]);
    const csv = [headers, ...lines].map((line) => line.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `center-report-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head><title>Center Revenue Report</title></head>
        <body style="font-family: Arial; padding: 24px;">
          <h2>Center Revenue Report</h2>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead><tr><th>Center</th><th>Location</th><th>Completed</th><th>Pending</th><th>Monthly Revenue</th><th>Yearly Revenue</th></tr></thead>
            <tbody>
              ${reports
                .map(
                  (row) =>
                    `<tr><td>${row.centerName}</td><td>${row.location}</td><td>${row.jobsCompleted}</td><td>${row.jobsPending}</td><td>${toCurrency(row.monthlyRevenue)}</td><td>${toCurrency(row.yearlyRevenue)}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const renderOverview = () => (
    <>
      <div className="sa-header">
        <div>
          <h2>Super Admin Dashboard</h2>
          <p>Cross-center performance, user mix, job flow, and revenue insights.</p>
        </div>
        <div className="sa-header-actions">
          <button type="button" className="sa-btn" onClick={reloadAll} disabled={loading}>
            <FiRefreshCw /> Refresh
          </button>
          <div className="sa-hero" aria-hidden="true">
            <div className="sa-hero-icon"><FiShield /></div>
            <div>
              <p className="sa-hero-title">Network Governance</p>
              <p className="sa-hero-subtitle">Unified control across every service center</p>
            </div>
          </div>
        </div>
      </div>

      <div className="sa-grid-4">
        <article className="sa-kpi"><div className="sa-kpi-title">Total Service Centers</div><div className="sa-kpi-value">{overview.totalCenters}</div></article>
        <article className="sa-kpi"><div className="sa-kpi-title">Total Users</div><div className="sa-kpi-value">{overview.totalUsers}</div></article>
        <article className="sa-kpi"><div className="sa-kpi-title">Total Jobs</div><div className="sa-kpi-value">{overview.totalJobs}</div></article>
        <article className="sa-kpi"><div className="sa-kpi-title">Monthly Revenue</div><div className="sa-kpi-value">{toCurrency(overview.monthlyRevenue)}</div></article>
      </div>

      <div className="sa-grid-4">
        <article className="sa-kpi"><div className="sa-kpi-title">Completed Jobs</div><div className="sa-kpi-value">{overview.completedJobs}</div></article>
        <article className="sa-kpi"><div className="sa-kpi-title">Pending Jobs</div><div className="sa-kpi-value">{overview.pendingJobs}</div></article>
        <article className="sa-kpi"><div className="sa-kpi-title">Yearly Revenue</div><div className="sa-kpi-value">{toCurrency(overview.yearlyRevenue)}</div></article>
        <article className="sa-kpi"><div className="sa-kpi-title">Managers</div><div className="sa-kpi-value">{overview.usersBreakdown.managers}</div></article>
      </div>

      <div className="sa-chart-grid">
        <article className="sa-card">
          <div className="sa-section-head"><h5>Revenue Trend (Bar Chart)</h5></div>
          <div className="sa-bar-chart">
            {(overview.monthlyTrend || []).map((item) => {
              const max = Math.max(...(overview.monthlyTrend || []).map((r) => r.revenue || 1), 1);
              const height = Math.max(10, Math.round(((item.revenue || 0) / max) * 160));
              return (
                <div key={item.month} className="sa-bar">
                  <div className="sa-bar-fill" style={{ height }} title={`${item.month}: ${toCurrency(item.revenue)}`} />
                  <div className="sa-bar-label">{item.month}</div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="sa-card">
          <div className="sa-section-head"><h5>Users Distribution (Pie)</h5></div>
          <div className="sa-pie" style={usersPieStyle} />
          <div className="sa-pie-legend">
            <span><strong>M:</strong> {overview.usersBreakdown.managers}</span>
            <span><strong>T:</strong> {overview.usersBreakdown.technicians}</span>
            <span><strong>C:</strong> {overview.usersBreakdown.customers}</span>
          </div>
          <div style={{ marginTop: 18 }}>
            <h6>Jobs Completed vs Pending (Pie)</h6>
            <div className="sa-pie" style={{ ...jobsPieStyle, width: 120, height: 120, borderWidth: 6 }} />
          </div>
        </article>
      </div>
    </>
  );

  const renderCenters = () => (
    <article className="sa-card">
      <div className="sa-section-head"><h4>Service Center Management</h4></div>

      <form className="sa-form-grid" onSubmit={handleCenterSubmit}>
        <input className="sa-input" placeholder="Center Name" value={centerForm.name} onChange={(e) => setCenterForm((p) => ({ ...p, name: e.target.value }))} />
        <input className="sa-input" placeholder="Location" value={centerForm.location} onChange={(e) => setCenterForm((p) => ({ ...p, location: e.target.value }))} />
        <select className="sa-select" value={centerForm.managerId} onChange={(e) => setCenterForm((p) => ({ ...p, managerId: e.target.value }))}>
          <option value="">Assign Manager</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button type="submit" className="sa-btn primary"><FiPlus /> {centerForm.id ? "Update Center" : "Add Center"}</button>
      </form>

      <div className="sa-controls">
        <div style={{ position: "relative" }}>
          <FiSearch style={{ position: "absolute", left: 10, top: 10, color: "#7a8da8" }} />
          <input className="sa-input" style={{ paddingLeft: 30 }} placeholder="Search center/location" value={centerFilters.search} onChange={(e) => setCenterFilters((p) => ({ ...p, search: e.target.value }))} />
        </div>
        <select className="sa-select" value={centerFilters.managerId} onChange={(e) => setCenterFilters((p) => ({ ...p, managerId: e.target.value }))}>
          <option value="">Filter by Manager</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button type="button" className="sa-btn" onClick={() => loadCenters(1)}>Apply Filters</button>
      </div>

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Name</th><th>Location</th><th>Manager</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {centers.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.location}</td>
                <td>{row.managerName || "Unassigned"}</td>
                <td><span className={`sa-chip ${row.active ? "active" : "inactive"}`}>{row.active ? "Active" : "Inactive"}</span></td>
                <td>
                  <div className="sa-row-actions">
                    <button type="button" className="sa-btn" onClick={() => setCenterForm({ id: row.id, name: row.name, location: row.location, managerId: row.managerId || "" })}><FiEdit2 /> Edit</button>
                    <button type="button" className="sa-btn danger" onClick={() => handleDeleteCenter(row.id)}><FiTrash2 /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sa-pagination">
        <button type="button" className="sa-btn" onClick={() => loadCenters(Math.max(1, centersPagination.page - 1))}>Prev</button>
        <span>Page {centersPagination.page} / {centersPagination.totalPages}</span>
        <button type="button" className="sa-btn" onClick={() => loadCenters(Math.min(centersPagination.totalPages, centersPagination.page + 1))}>Next</button>
      </div>
    </article>
  );

  const renderManagers = () => (
    <article className="sa-card">
      <div className="sa-section-head"><h4>Managers Management</h4></div>

      <form className="sa-form-grid" onSubmit={handleManagerSubmit}>
        <input className="sa-input" placeholder="Manager Name" value={managerForm.name} onChange={(e) => setManagerForm((p) => ({ ...p, name: e.target.value }))} />
        <input className="sa-input" placeholder="Email" value={managerForm.email} onChange={(e) => setManagerForm((p) => ({ ...p, email: e.target.value }))} />
        <input className="sa-input" placeholder="Phone" value={managerForm.phone} onChange={(e) => setManagerForm((p) => ({ ...p, phone: e.target.value }))} />
        <select className="sa-select" value={managerForm.serviceCenterId} onChange={(e) => setManagerForm((p) => ({ ...p, serviceCenterId: e.target.value }))}>
          <option value="">Assign Service Center</option>
          {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className="sa-btn primary"><FiPlus /> Add Manager</button>
      </form>

      <div className="sa-controls">
        <input className="sa-input" placeholder="Search managers" value={managerFilters.search} onChange={(e) => setManagerFilters((p) => ({ ...p, search: e.target.value }))} />
        <select className="sa-select" value={managerFilters.centerId} onChange={(e) => setManagerFilters((p) => ({ ...p, centerId: e.target.value }))}>
          <option value="">Filter by Center</option>
          {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="sa-select" value={managerFilters.active} onChange={(e) => setManagerFilters((p) => ({ ...p, active: e.target.value }))}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button type="button" className="sa-btn" onClick={() => loadManagers(1)}>Apply Filters</button>
      </div>

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Center</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td>
                  <select className="sa-select" value={row.serviceCenterId || ""} onChange={(e) => handleAssignManager(row.id, e.target.value)}>
                    <option value="">Unassigned</option>
                    {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td><span className={`sa-chip ${row.active ? "active" : "inactive"}`}>{row.active ? "Active" : "Inactive"}</span></td>
                <td>
                  <div className="sa-row-actions">
                    <button type="button" className="sa-btn" onClick={() => handleToggleManager(row.id, row.active)}>{row.active ? "Deactivate" : "Activate"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sa-pagination">
        <button type="button" className="sa-btn" onClick={() => loadManagers(Math.max(1, managersPagination.page - 1))}>Prev</button>
        <span>Page {managersPagination.page} / {managersPagination.totalPages}</span>
        <button type="button" className="sa-btn" onClick={() => loadManagers(Math.min(managersPagination.totalPages, managersPagination.page + 1))}>Next</button>
      </div>
    </article>
  );

  const renderReports = () => {
    const totalCompleted = reports.reduce((acc, row) => acc + Number(row.jobsCompleted || 0), 0);
    const totalPending = reports.reduce((acc, row) => acc + Number(row.jobsPending || 0), 0);

    return (
      <article className="sa-card">
        <div className="sa-section-head">
          <h4>Reports</h4>
          <div className="sa-row-actions">
            <button type="button" className="sa-btn" onClick={exportCsv}><FiDownload /> Export CSV</button>
            <button type="button" className="sa-btn" onClick={exportPdf}><FiDownload /> Export PDF</button>
          </div>
        </div>

        <div className="sa-controls">
          <select className="sa-select" value={reportCenterId} onChange={(e) => setReportCenterId(e.target.value)}>
            <option value="">All Centers</option>
            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" className="sa-btn" onClick={() => loadReports(1)}>Apply Filter</button>
        </div>

        <div className="sa-grid-4" style={{ marginBottom: 14 }}>
          <article className="sa-kpi"><div className="sa-kpi-title">Jobs Completed</div><div className="sa-kpi-value">{totalCompleted}</div></article>
          <article className="sa-kpi"><div className="sa-kpi-title">Jobs Pending</div><div className="sa-kpi-value">{totalPending}</div></article>
          <article className="sa-kpi"><div className="sa-kpi-title">Center-wise Revenue</div><div className="sa-kpi-value">{toCurrency(reports.reduce((a, r) => a + Number(r.monthlyRevenue || 0), 0))}</div></article>
          <article className="sa-kpi"><div className="sa-kpi-title">Monthly vs Yearly</div><div className="sa-kpi-value">{toCurrency(reports.reduce((a, r) => a + Number(r.yearlyRevenue || 0), 0))}</div></article>
        </div>

        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Center</th><th>Location</th><th>Jobs Completed</th><th>Jobs Pending</th><th>Monthly Revenue</th><th>Yearly Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((row) => (
                <tr key={row.centerId}>
                  <td>{row.centerName}</td>
                  <td>{row.location}</td>
                  <td>{row.jobsCompleted}</td>
                  <td>{row.jobsPending}</td>
                  <td>{toCurrency(row.monthlyRevenue)}</td>
                  <td>{toCurrency(row.yearlyRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sa-pagination">
          <button type="button" className="sa-btn" onClick={() => loadReports(Math.max(1, reportsPagination.page - 1))}>Prev</button>
          <span>Page {reportsPagination.page} / {reportsPagination.totalPages}</span>
          <button type="button" className="sa-btn" onClick={() => loadReports(Math.min(reportsPagination.totalPages, reportsPagination.page + 1))}>Next</button>
        </div>
      </article>
    );
  };

  const renderSettings = () => (
    <article className="sa-card">
      <div className="sa-section-head"><h4>Settings</h4></div>

      <div className="sa-grid-4">
        <article className="sa-kpi">
          <div className="sa-kpi-title">Tax Percentage</div>
          <div className="sa-row-actions" style={{ marginTop: 8 }}>
            <input className="sa-input" type="number" min="0" max="100" value={settings.taxPercentage} onChange={(e) => setSettings((p) => ({ ...p, taxPercentage: e.target.value }))} />
            <button type="button" className="sa-btn primary" onClick={() => handleTaxUpdate(settings.taxPercentage)}>Save Tax</button>
          </div>
        </article>

        <article className="sa-kpi" style={{ gridColumn: "span 3" }}>
          <div className="sa-kpi-title">Discount Rules</div>
          <form className="sa-controls" onSubmit={handleAddDiscountRule}>
            <input className="sa-input" placeholder="Rule Name" value={discountForm.name} onChange={(e) => setDiscountForm((p) => ({ ...p, name: e.target.value }))} />
            <input className="sa-input" type="number" placeholder="Discount %" value={discountForm.percentage} onChange={(e) => setDiscountForm((p) => ({ ...p, percentage: e.target.value }))} />
            <input className="sa-input" type="number" placeholder="Minimum Amount" value={discountForm.minAmount} onChange={(e) => setDiscountForm((p) => ({ ...p, minAmount: e.target.value }))} />
            <button type="submit" className="sa-btn primary"><FiPlus /> Add Rule</button>
          </form>
          <div className="sa-inline-list">
            {settings.discountRules.map((rule) => (
              <span key={rule.id} className="sa-tag">{rule.name}: {rule.percentage}% (Min {toCurrency(rule.minAmount)})</span>
            ))}
          </div>
        </article>
      </div>

      <article className="sa-kpi" style={{ marginTop: 14 }}>
        <div className="sa-kpi-title">Service Categories</div>
        <form className="sa-controls" onSubmit={handleAddServiceCategory}>
          <input className="sa-input" placeholder="New Service Category" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
          <button type="submit" className="sa-btn primary"><FiPlus /> Add Category</button>
        </form>
        <div className="sa-inline-list">
          {settings.serviceCategories.map((category) => <span key={category} className="sa-tag">{category}</span>)}
        </div>
      </article>
    </article>
  );

  return (
    <div className={`sa-shell sa-view-${activeTab}`}>
      <aside className="sa-sidebar">
        <div className="sa-brand">
          <span className="sa-brand-icon"><FiShield /></span>
          <div>
            <p className="sa-brand-title">Super Admin</p>
            <p className="sa-brand-subtitle">Bike Service Command Center</p>
          </div>
        </div>

        <nav className="sa-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sa-nav-btn ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="sa-content">
        <div className="sa-meta-bar" role="status" aria-live="polite">
          <span className="sa-meta-chip">Section: {activeTabLabel}</span>
          <span className="sa-meta-chip">Today: {todayLabel}</span>
          <span className="sa-meta-chip">Role: Super Admin</span>
        </div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "centers" && renderCenters()}
        {activeTab === "managers" && renderManagers()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "settings" && renderSettings()}
      </main>
    </div>
  );
}
