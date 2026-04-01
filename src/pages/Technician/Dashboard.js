import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBox,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiFileText,
  FiFilter,
  FiHome,
  FiImage,
  FiRefreshCw,
  FiTool,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { technicianApi } from "../../api/technicianApi";
import "./TechnicianDashboard.scss";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: <FiHome /> },
  { key: "myjobs", label: "My Jobs", icon: <FiClipboard /> },
  { key: "updatestatus", label: "Update Status", icon: <FiCheckCircle /> },
  { key: "partsrequest", label: "Parts Request", icon: <FiBox /> },
  { key: "worklog", label: "Work Log", icon: <FiFileText /> },
];

const statusOptions = ["Assigned", "In Progress", "Waiting for Parts", "Completed"];

const toCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

export default function TechnicianDashboard() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const activeTabLabel = useMemo(() => {
    return navItems.find((item) => item.key === activeTab)?.label || "Dashboard";
  }, [activeTab]);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  // Dashboard state
  const [overview, setOverview] = useState({ totalAssigned: 0, inProgress: 0, completed: 0, partsRequested: 0 });

  // My Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobsPagination, setJobsPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [jobStatusFilter, setJobStatusFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  // Update Status state
  const [statusForm, setStatusForm] = useState({ jobCardId: "", newStatus: "" });
  const [jobsList, setJobsList] = useState([]);

  // Parts Request state
  const [partsForm, setPartsForm] = useState({ jobCardId: "", partId: "", quantity: "" });
  const [availableParts, setAvailableParts] = useState([]);
  const [partsRequests, setPartsRequests] = useState([]);
  const [partsRequestsPagination, setPartsRequestsPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });

  // Work Log state
  const [workLogForm, setWorkLogForm] = useState({ jobCardId: "", timeSpent: "", notes: "", photos: [] });
  const [workLogs, setWorkLogs] = useState([]);
  const [workLogsPagination, setWorkLogsPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [photoPreview, setPhotoPreview] = useState([]);

  const pushAlert = (type, message) => {
    setAlert({ type, message });
    window.clearTimeout(pushAlert._timer);
    pushAlert._timer = window.setTimeout(() => setAlert({ type: "", message: "" }), 2400);
  };

  // Load overview
  const loadOverview = useCallback(async () => {
    const response = await technicianApi.getOverview(userId);
    if (response.success) setOverview(response.data);
  }, [userId]);

  // Load assigned jobs
  const loadJobs = useCallback(
    async (page = jobsPagination.page) => {
      const response = await technicianApi.getAssignedJobs({
        technicianId: userId,
        status: jobStatusFilter,
        page,
        pageSize: jobsPagination.pageSize,
      });
      if (response.success) {
        setJobs(response.data);
        setJobsPagination(response.pagination);
      }
    },
    [userId, jobStatusFilter, jobsPagination.page, jobsPagination.pageSize]
  );

  // Load available parts
  const loadAvailableParts = useCallback(async () => {
    const response = await technicianApi.getAvailableParts();
    if (response.success) setAvailableParts(response.data);
  }, []);

  // Load all jobs for status update
  const loadJobsList = useCallback(async () => {
    const response = await technicianApi.getAssignedJobs({
      technicianId: userId,
      pageSize: 100,
    });
    if (response.success) setJobsList(response.data);
  }, [userId]);

  // Load parts requests
  const loadPartsRequests = useCallback(async (page = partsRequestsPagination.page) => {
    const response = await technicianApi.getPartsRequests({
      page,
      pageSize: partsRequestsPagination.pageSize,
    });
    if (response.success) {
      setPartsRequests(response.data);
      setPartsRequestsPagination(response.pagination);
    }
  }, [partsRequestsPagination.page, partsRequestsPagination.pageSize]);

  // Load work logs
  const loadWorkLogs = useCallback(
    async (page = workLogsPagination.page) => {
      const response = await technicianApi.getWorkLogs({
        page,
        pageSize: workLogsPagination.pageSize,
      });
      if (response.success) {
        setWorkLogs(response.data);
        setWorkLogsPagination(response.pagination);
      }
    },
    [workLogsPagination.page, workLogsPagination.pageSize]
  );

  // Refresh all
  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadOverview(),
      loadJobs(1),
      loadAvailableParts(),
      loadJobsList(),
      loadPartsRequests(1),
      loadWorkLogs(1),
    ]);
    setLoading(false);
  }, [loadOverview, loadJobs, loadAvailableParts, loadJobsList, loadPartsRequests, loadWorkLogs]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle status update
  const handleStatusSubmit = async (event) => {
    event.preventDefault();

    if (!statusForm.jobCardId.trim()) return pushAlert("error", "Select a job");
    if (!statusForm.newStatus) return pushAlert("error", "Select new status");

    const response = await technicianApi.updateJobStatus(statusForm.jobCardId, statusForm.newStatus);
    if (!response.success) {
      pushAlert("error", response.message || "Failed to update status");
      return;
    }

    pushAlert("success", response.message);
    setStatusForm({ jobCardId: "", newStatus: "" });
    await Promise.all([loadJobs(1), loadOverview()]);
  };

  // Handle parts request
  const handlePartsSubmit = async (event) => {
    event.preventDefault();

    if (!partsForm.jobCardId.trim()) return pushAlert("error", "Select job card ID");
    if (!partsForm.partId) return pushAlert("error", "Select part");

    const quantity = Number(partsForm.quantity || 0);
    if (quantity <= 0) return pushAlert("error", "Quantity must be at least 1");

    const part = availableParts.find((p) => p.id === partsForm.partId);

    const response = await technicianApi.requestParts(partsForm.jobCardId, [
      {
        partId: partsForm.partId,
        partName: part?.name || "",
        quantity,
        unitPrice: part?.unitPrice || 0,
      },
    ]);

    if (!response.success) {
      pushAlert("error", response.message || "Failed to request parts");
      return;
    }

    pushAlert("success", response.message);
    setPartsForm({ jobCardId: "", partId: "", quantity: "" });
    await loadPartsRequests(1);
  };

  // Handle work log submission
  const handleWorkLogSubmit = async (event) => {
    event.preventDefault();

    if (!workLogForm.jobCardId.trim()) return pushAlert("error", "Job card ID is required");

    const timeSpent = Number(workLogForm.timeSpent || 0);
    if (timeSpent <= 0) return pushAlert("error", "Time spent must be more than 0 hours");
    if (!workLogForm.notes.trim()) return pushAlert("error", "Add service notes");

    const response = await technicianApi.createWorkLog({
      jobCardId: workLogForm.jobCardId,
      timeSpent,
      notes: workLogForm.notes,
      photoUrls: workLogForm.photos,
    });

    if (!response.success) {
      pushAlert("error", response.message || "Failed to record work log");
      return;
    }

    pushAlert("success", response.message);
    setWorkLogForm({ jobCardId: "", timeSpent: "", notes: "", photos: [] });
    setPhotoPreview([]);
    await loadWorkLogs(1);
  };

  // Handle photo upload
  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const response = await technicianApi.uploadPhoto(file);
        if (response.success) {
          const preview = URL.createObjectURL(file);
          setPhotoPreview((prev) => [...prev, preview]);
          setWorkLogForm((prev) => ({
            ...prev,
            photos: [...prev.photos, response.data.url],
          }));
        }
      } catch (e) {
        pushAlert("error", `Failed to upload ${file.name}`);
      }
    }
  };

  const removePhoto = (index) => {
    setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
    setWorkLogForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // View job details
  const viewJobDetails = (job) => {
    setSelectedJob(job);
  };

  const selectedJobData = useMemo(() => {
    return jobs.find((j) => j.jobCardId === selectedJob?.jobCardId) || selectedJob;
  }, [jobs, selectedJob]);

  const renderDashboardTab = () => (
    <>
      <div className="tc-top">
        <div>
          <h2>Technician Dashboard</h2>
          <p>Track your assigned jobs, manage spare parts, and log your work progress.</p>
        </div>
        <div className="tc-top-actions">
          <button type="button" className="tc-btn" onClick={refreshAll} disabled={loading}>
            <FiRefreshCw /> Refresh
          </button>
          <div className="tc-hero" aria-hidden="true">
            <div className="tc-hero-icon"><FiImage /></div>
            <div>
              <p className="tc-hero-title">Workshop Command</p>
              <p className="tc-hero-subtitle">Diagnose, repair, and close jobs faster</p>
            </div>
          </div>
        </div>
      </div>

      <div className="tc-grid-4">
        <article className="tc-card">
          <div className="tc-kpi-label">Total Assigned</div>
          <div className="tc-kpi-value">{overview.totalAssigned}</div>
        </article>
        <article className="tc-card">
          <div className="tc-kpi-label">In Progress</div>
          <div className="tc-kpi-value">{overview.inProgress}</div>
        </article>
        <article className="tc-card">
          <div className="tc-kpi-label">Completed</div>
          <div className="tc-kpi-value">{overview.completed}</div>
        </article>
        <article className="tc-card">
          <div className="tc-kpi-label">Parts Pending</div>
          <div className="tc-kpi-value">{overview.partsRequested}</div>
        </article>
      </div>

      <article className="tc-card">
        <div className="tc-section-head">
          <h4>Recently Assigned Jobs</h4>
        </div>

        <div className="tc-table-wrap">
          <table className="tc-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Bike</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 5).map((job) => (
                <tr key={job.jobCardId}>
                  <td>{job.jobCardId}</td>
                  <td>{job.customerName}</td>
                  <td>{job.bikeLabel}</td>
                  <td>
                    <span className={`tc-chip ${job.status.toLowerCase().replace(/ /g, "\\")}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="tc-btn"
                      onClick={() => viewJobDetails(job)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );

  const renderMyJobsTab = () => (
    <article className="tc-card">
      <div className="tc-section-head">
        <h4>My Assigned Jobs</h4>
      </div>

      <div className="tc-actions" style={{ marginBottom: 12 }}>
        <select
          className="tc-select"
          style={{ width: "auto", flex: 1, maxWidth: 200 }}
          value={jobStatusFilter}
          onChange={(e) => setJobStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button type="button" className="tc-btn" onClick={() => loadJobs(1)}>
          <FiFilter /> Filter
        </button>
      </div>

      <div className="tc-table-wrap">
        <table className="tc-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Customer</th>
              <th>Bike Details</th>
              <th>Problem</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.jobCardId}>
                <td>{job.jobCardId}</td>
                <td>{job.customerName}</td>
                <td>{job.bikeLabel}</td>
                <td>{job.problemDescription?.substring(0, 40)}...</td>
                <td>
                  <span className={`tc-chip ${job.status.toLowerCase().replace(/ /g, "\\")}`}>
                    {job.status}
                  </span>
                </td>
                <td>
                  <button type="button" className="tc-btn" onClick={() => viewJobDetails(job)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tc-pagination">
        <button type="button" className="tc-btn" onClick={() => loadJobs(Math.max(1, jobsPagination.page - 1))}>
          Prev
        </button>
        <span>
          Page {jobsPagination.page} / {jobsPagination.totalPages}
        </span>
        <button type="button" className="tc-btn" onClick={() => loadJobs(Math.min(jobsPagination.totalPages, jobsPagination.page + 1))}>
          Next
        </button>
      </div>

      {selectedJobData && (
        <article className="tc-card" style={{ marginTop: 16 }}>
          <div className="tc-section-head">
            <h4>Job Details: {selectedJobData.jobCardId}</h4>
            <button type="button" className="tc-btn secondary" onClick={() => setSelectedJob(null)}>
              Close
            </button>
          </div>

          <div className="tc-job-detail">
            <div className="tc-detail-row">
              <div className="tc-detail-label">Job ID</div>
              <div className="tc-detail-value">{selectedJobData.jobCardId}</div>
            </div>
            <div className="tc-detail-row">
              <div className="tc-detail-label">Customer Name</div>
              <div className="tc-detail-value">{selectedJobData.customerName}</div>
            </div>
            <div className="tc-detail-row">
              <div className="tc-detail-label">Bike Label</div>
              <div className="tc-detail-value">{selectedJobData.bikeLabel}</div>
            </div>
            <div className="tc-detail-row">
              <div className="tc-detail-label">Problem</div>
              <div className="tc-detail-value">{selectedJobData.problemDescription}</div>
            </div>
            <div className="tc-detail-row">
              <div className="tc-detail-label">Status</div>
              <div className="tc-detail-value">
                <span className={`tc-chip ${selectedJobData.status.toLowerCase().replace(/ /g, "\\")}`}>
                  {selectedJobData.status}
                </span>
              </div>
            </div>
          </div>
        </article>
      )}
    </article>
  );

  const renderUpdateStatusTab = () => (
    <article className="tc-card">
      <div className="tc-section-head">
        <h4>Update Job Status</h4>
      </div>

      <form onSubmit={handleStatusSubmit}>
        <div className="tc-form-grid">
          <select
            className="tc-select"
            value={statusForm.jobCardId}
            onChange={(e) => setStatusForm((p) => ({ ...p, jobCardId: e.target.value }))}
          >
            <option value="">Select Job Card</option>
            {jobsList.map((job) => (
              <option key={job.jobCardId} value={job.jobCardId}>
                {job.jobCardId} - {job.customerName}
              </option>
            ))}
          </select>

          <select
            className="tc-select"
            value={statusForm.newStatus}
            onChange={(e) => setStatusForm((p) => ({ ...p, newStatus: e.target.value }))}
          >
            <option value="">Select New Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="tc-actions">
          <button type="submit" className="tc-btn primary">
            <FiCheckCircle /> Update Status
          </button>
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        <h4>Current Job Statuses</h4>
        <div className="tc-table-wrap">
          <table className="tc-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              {jobsList.map((job) => (
                <tr key={job.jobCardId}>
                  <td>{job.jobCardId}</td>
                  <td>{job.customerName}</td>
                  <td>
                    <span className={`tc-chip ${job.status.toLowerCase().replace(/ /g, "\\")}`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );

  const renderPartsRequestTab = () => (
    <article className="tc-card">
      <div className="tc-section-head">
        <h4>Request Spare Parts</h4>
      </div>

      <form onSubmit={handlePartsSubmit}>
        <div className="tc-form-grid">
          <input
            className="tc-input"
            placeholder="Job Card ID"
            value={partsForm.jobCardId}
            onChange={(e) => setPartsForm((p) => ({ ...p, jobCardId: e.target.value }))}
          />

          <select
            className="tc-select"
            value={partsForm.partId}
            onChange={(e) => setPartsForm((p) => ({ ...p, partId: e.target.value }))}
          >
            <option value="">Select Part</option>
            {availableParts.map((part) => (
              <option key={part.id} value={part.id}>
                {part.name} ({toCurrency(part.unitPrice)}) - Stock: {part.currentStock}
              </option>
            ))}
          </select>

          <input
            className="tc-input"
            type="number"
            min="1"
            placeholder="Quantity"
            value={partsForm.quantity}
            onChange={(e) => setPartsForm((p) => ({ ...p, quantity: e.target.value }))}
          />

          <button type="submit" className="tc-btn primary" style={{ gridColumn: "span 2" }}>
            <FiBox /> Submit Parts Request
          </button>
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        <h4>Parts Availability</h4>
        <div className="tc-table-wrap">
          <table className="tc-table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {availableParts.map((part) => (
                <tr key={part.id}>
                  <td>{part.name}</td>
                  <td>{part.category}</td>
                  <td>{toCurrency(part.unitPrice)}</td>
                  <td>{part.currentStock}</td>
                  <td>
                    <span className={`tc-chip ${part.status.toLowerCase().replace(/ /g, "\\")}`}>
                      {part.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>Your Parts Requests</h4>
        <div className="tc-table-wrap">
          <table className="tc-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Job Card</th>
                <th>Parts</th>
                <th>Status</th>
                <th>Requested</th>
              </tr>
            </thead>
            <tbody>
              {partsRequests.map((req) => (
                <tr key={req.requestId}>
                  <td>{req.requestId}</td>
                  <td>{req.jobCardId}</td>
                  <td>{(req.parts || []).map((p) => `${p.quantity}x ${p.partName}`).join(", ")}</td>
                  <td>
                    <span className={`tc-chip ${req.status.toLowerCase()}`}>{req.status}</span>
                  </td>
                  <td>{new Date(req.requestedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tc-pagination">
          <button type="button" className="tc-btn" onClick={() => loadPartsRequests(Math.max(1, partsRequestsPagination.page - 1))}>
            Prev
          </button>
          <span>
            Page {partsRequestsPagination.page} / {partsRequestsPagination.totalPages}
          </span>
          <button type="button" className="tc-btn" onClick={() => loadPartsRequests(Math.min(partsRequestsPagination.totalPages, partsRequestsPagination.page + 1))}>
            Next
          </button>
        </div>
      </div>
    </article>
  );

  const renderWorkLogTab = () => (
    <article className="tc-card">
      <div className="tc-section-head">
        <h4>Work Log Entry</h4>
      </div>

      <form onSubmit={handleWorkLogSubmit}>
        <div className="tc-form-grid">
          <input
            className="tc-input"
            placeholder="Job Card ID"
            value={workLogForm.jobCardId}
            onChange={(e) => setWorkLogForm((p) => ({ ...p, jobCardId: e.target.value }))}
          />

          <input
            className="tc-input"
            type="number"
            min="0.5"
            step="0.5"
            placeholder="Time Spent (hours)"
            value={workLogForm.timeSpent}
            onChange={(e) => setWorkLogForm((p) => ({ ...p, timeSpent: e.target.value }))}
          />

          <textarea
            className="tc-textarea"
            placeholder="Service Notes (e.g., Work performed, observations, next steps)"
            style={{ gridColumn: "span 2" }}
            value={workLogForm.notes}
            onChange={(e) => setWorkLogForm((p) => ({ ...p, notes: e.target.value }))}
          />

          <div className="tc-file-upload" style={{ gridColumn: "span 2" }}>
            <label htmlFor="photo-upload">
              <FiImage /> Click to upload service photos (optional) or drag & drop
            </label>
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
            />
          </div>

          {photoPreview.length > 0 && (
            <div className="tc-photo-grid" style={{ gridColumn: "span 2" }}>
              {photoPreview.map((photo, idx) => (
                <div key={idx} className="tc-photo-item">
                  <img src={photo} alt={`Preview ${idx + 1}`} />
                  <button
                    type="button"
                    className="tc-photo-remove"
                    onClick={() => removePhoto(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="submit" className="tc-btn primary" style={{ gridColumn: "span 2" }}>
            <FiClock /> Record Work Log
          </button>
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        <h4>Your Work Logs</h4>
        <div className="tc-table-wrap">
          <table className="tc-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Job Card</th>
                <th>Time Spent</th>
                <th>Notes</th>
                <th>Photos</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {workLogs.map((log) => (
                <tr key={log.logId}>
                  <td>{log.logId}</td>
                  <td>{log.jobCardId}</td>
                  <td>{log.timeSpent} hours</td>
                  <td>{log.notes?.substring(0, 30)}...</td>
                  <td>{(log.photos || []).length > 0 ? `${log.photos.length} photo(s)` : "—"}</td>
                  <td>{new Date(log.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tc-pagination" style={{ marginTop: 12 }}>
          <button type="button" className="tc-btn" onClick={() => loadWorkLogs(Math.max(1, workLogsPagination.page - 1))}>
            Prev
          </button>
          <span>
            Page {workLogsPagination.page} / {workLogsPagination.totalPages}
          </span>
          <button type="button" className="tc-btn" onClick={() => loadWorkLogs(Math.min(workLogsPagination.totalPages, workLogsPagination.page + 1))}>
            Next
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <div className={`tc-shell tc-view-${activeTab}`}>
      <aside className="tc-sidebar">
        <div className="tc-brand">
          <span className="tc-brand-icon">
            <FiTool />
          </span>
          <div>
            <p className="tc-brand-title">Technician Panel</p>
            <p className="tc-brand-subtitle">Service Job Management</p>
          </div>
        </div>

        <nav className="tc-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`tc-nav-btn ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="tc-content">
        <div className="tc-meta-bar" role="status" aria-live="polite">
          <span className="tc-meta-chip">Section: {activeTabLabel}</span>
          <span className="tc-meta-chip">Today: {todayLabel}</span>
          <span className="tc-meta-chip">Role: Technician</span>
        </div>
        {activeTab === "dashboard" && renderDashboardTab()}
        {activeTab === "myjobs" && renderMyJobsTab()}
        {activeTab === "updatestatus" && renderUpdateStatusTab()}
        {activeTab === "partsrequest" && renderPartsRequestTab()}
        {activeTab === "worklog" && renderWorkLogTab()}

        {alert.message && <div className={`tc-alert ${alert.type}`}>{alert.message}</div>}
      </main>
    </div>
  );
}
