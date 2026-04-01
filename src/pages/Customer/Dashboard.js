import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiHome,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiTool,
} from "react-icons/fi";
import { getServiceHistory, registerBike, submitFeedback, trackJobStatus } from "../../api/customerApi";
import "./CustomerDashboard.scss";

const navItems = [
  { key: "overview", label: "Dashboard", icon: <FiHome /> },
  { key: "register", label: "Register Bike", icon: <FiPlus /> },
  { key: "track", label: "Track Job", icon: <FiSearch /> },
  { key: "feedback", label: "Feedback", icon: <FiMessageSquare /> },
];

const emptyBikeForm = { model: "", brand: "", numberPlate: "" };
const emptyFeedbackForm = { jobId: "", rating: "", comment: "" };

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const alertTimerRef = useRef(null);

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

  const [history, setHistory] = useState([]);
  const [bikeForm, setBikeForm] = useState(emptyBikeForm);
  const [feedbackForm, setFeedbackForm] = useState(emptyFeedbackForm);
  const [trackJobId, setTrackJobId] = useState("");
  const [trackedJob, setTrackedJob] = useState(null);

  const pushAlert = useCallback((type, message) => {
    setAlert({ type, message });
    window.clearTimeout(alertTimerRef.current);
    alertTimerRef.current = window.setTimeout(() => setAlert({ type: "", message: "" }), 2400);
  }, []);

  const loadHistory = useCallback(async () => {
    const response = await getServiceHistory();
    if (response.success) {
      setHistory(response?.data?.rows || []);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    try {
      await loadHistory();
    } catch (error) {
      pushAlert("error", error.message || "Unable to load your dashboard");
    } finally {
      setLoading(false);
    }
  }, [loadHistory, pushAlert]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    return () => {
      window.clearTimeout(alertTimerRef.current);
    };
  }, []);

  const stats = useMemo(() => {
    const completed = history.filter((item) => item.status === "Completed").length;
    const inProgress = history.filter((item) => item.status === "In Progress").length;
    const pending = history.filter((item) => item.status !== "Completed" && item.status !== "In Progress").length;

    return {
      total: history.length,
      completed,
      inProgress,
      pending,
    };
  }, [history]);

  const handleBikeSubmit = async (event) => {
    event.preventDefault();

    if (!bikeForm.model.trim() || !bikeForm.brand.trim() || !bikeForm.numberPlate.trim()) {
      pushAlert("error", "Model, brand and number plate are required");
      return;
    }

    try {
      const response = await registerBike(bikeForm);
      pushAlert("success", response.message || "Bike registered successfully");
      setBikeForm(emptyBikeForm);
    } catch (error) {
      pushAlert("error", error.message || "Could not register bike");
    }
  };

  const handleTrackSubmit = async (event) => {
    event.preventDefault();
    if (!trackJobId.trim()) {
      pushAlert("error", "Enter a job ID to track");
      return;
    }

    try {
      const response = await trackJobStatus(trackJobId.trim());
      setTrackedJob(response?.data?.job || null);
      if (!response?.data?.job) {
        pushAlert("error", "Job not found");
      }
    } catch (error) {
      setTrackedJob(null);
      pushAlert("error", error.message || "Unable to fetch job details");
    }
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();

    const rating = Number(feedbackForm.rating);
    if (!feedbackForm.jobId.trim()) {
      pushAlert("error", "Job ID is required");
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      pushAlert("error", "Rating must be between 1 and 5");
      return;
    }

    try {
      const response = await submitFeedback({
        jobId: Number(feedbackForm.jobId),
        rating,
        comment: feedbackForm.comment,
      });
      pushAlert("success", response.message || "Feedback submitted");
      setFeedbackForm(emptyFeedbackForm);
      await loadHistory();
    } catch (error) {
      pushAlert("error", error.message || "Could not submit feedback");
    }
  };

  return (
    <div className={`cu-shell cu-view-${activeTab}`}>
      <aside className="cu-sidebar">
        <div className="cu-brand">
          <div className="cu-brand-icon">
            <FiTool />
          </div>
          <div>
            <p className="cu-brand-title">Customer Portal</p>
            <p className="cu-brand-subtitle">Bike Service Dashboard</p>
          </div>
        </div>

        <nav className="cu-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`cu-nav-btn ${activeTab === item.key ? "active" : ""}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="cu-content">
        <div className="cu-meta-bar" role="status" aria-live="polite">
          <span className="cu-meta-chip">Section: {activeTabLabel}</span>
          <span className="cu-meta-chip">Today: {todayLabel}</span>
          <span className="cu-meta-chip">Role: Customer</span>
        </div>
        <header className="cu-header">
          <div>
            <h2>Customer Dashboard</h2>
            <p>Track services, register bikes, and share your service feedback.</p>
          </div>
          <div className="cu-header-actions">
            <button type="button" className="cu-btn" onClick={reloadAll} disabled={loading}>
              <FiRefreshCw /> {loading ? "Refreshing..." : "Refresh"}
            </button>
            <div className="cu-hero" aria-hidden="true">
              <div className="cu-hero-icon"><FiTool /></div>
              <div>
                <p className="cu-hero-title">Smart Service Journey</p>
                <p className="cu-hero-subtitle">From booking to bike-ready updates</p>
              </div>
            </div>
          </div>
        </header>

        {alert.message ? <div className={`cu-alert ${alert.type}`}>{alert.message}</div> : null}

        <section className="cu-grid-4">
          <article className="cu-kpi">
            <div className="cu-kpi-icon">
              <FiActivity />
            </div>
            <div>
              <p className="cu-kpi-label">Total Jobs</p>
              <p className="cu-kpi-value">{stats.total}</p>
            </div>
          </article>
          <article className="cu-kpi">
            <div className="cu-kpi-icon success">
              <FiCheckCircle />
            </div>
            <div>
              <p className="cu-kpi-label">Completed</p>
              <p className="cu-kpi-value">{stats.completed}</p>
            </div>
          </article>
          <article className="cu-kpi">
            <div className="cu-kpi-icon info">
              <FiClock />
            </div>
            <div>
              <p className="cu-kpi-label">In Progress</p>
              <p className="cu-kpi-value">{stats.inProgress}</p>
            </div>
          </article>
          <article className="cu-kpi">
            <div className="cu-kpi-icon warn">
              <FiStar />
            </div>
            <div>
              <p className="cu-kpi-label">Pending/Other</p>
              <p className="cu-kpi-value">{stats.pending}</p>
            </div>
          </article>
        </section>

        {activeTab === "overview" ? (
          <section className="cu-card">
            <div className="cu-section-head">
              <h4>Recent Service History</h4>
            </div>

            {history.length === 0 ? (
              <p className="cu-empty">No service history found yet.</p>
            ) : (
              <div className="cu-table-wrap">
                <table className="cu-table">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>Bike</th>
                      <th>Status</th>
                      <th>Service Center</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 8).map((job) => (
                      <tr key={job.id}>
                        <td>#{job.id}</td>
                        <td>{`${job.bike?.brand || "-"} ${job.bike?.model || ""}`.trim()}</td>
                        <td>
                          <span className={`cu-chip ${String(job.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                            {job.status || "Unknown"}
                          </span>
                        </td>
                        <td>{job.service_center?.name || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "register" ? (
          <section className="cu-card">
            <div className="cu-section-head">
              <h4>Register New Bike</h4>
            </div>

            <form onSubmit={handleBikeSubmit} className="cu-form-grid">
              <input
                className="cu-input"
                placeholder="Bike Model"
                value={bikeForm.model}
                onChange={(event) => setBikeForm((prev) => ({ ...prev, model: event.target.value }))}
              />
              <input
                className="cu-input"
                placeholder="Bike Brand"
                value={bikeForm.brand}
                onChange={(event) => setBikeForm((prev) => ({ ...prev, brand: event.target.value }))}
              />
              <input
                className="cu-input"
                placeholder="Number Plate"
                value={bikeForm.numberPlate}
                onChange={(event) => setBikeForm((prev) => ({ ...prev, numberPlate: event.target.value }))}
              />
              <div className="cu-actions">
                <button className="cu-btn primary" type="submit">
                  Register Bike
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {activeTab === "track" ? (
          <section className="cu-card">
            <div className="cu-section-head">
              <h4>Track Job Status</h4>
            </div>

            <form onSubmit={handleTrackSubmit} className="cu-inline-form">
              <input
                className="cu-input"
                placeholder="Enter Job ID"
                value={trackJobId}
                onChange={(event) => setTrackJobId(event.target.value)}
              />
              <button className="cu-btn primary" type="submit">
                Track
              </button>
            </form>

            {trackedJob ? (
              <div className="cu-track-card">
                <p><strong>Job:</strong> #{trackedJob.id}</p>
                <p><strong>Bike:</strong> {trackedJob.bike ? `${trackedJob.bike.brand} ${trackedJob.bike.model}` : "-"}</p>
                <p><strong>Status:</strong> <span className={`cu-chip ${String(trackedJob.status || "").toLowerCase().replace(/\s+/g, "-")}`}>{trackedJob.status}</span></p>
                <p><strong>Latest Updates:</strong></p>
                {trackedJob.technician_updates?.length ? (
                  <ul className="cu-updates">
                    {trackedJob.technician_updates.slice(0, 4).map((update) => (
                      <li key={update.id}>
                        {update.notes || "Status updated"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="cu-empty">No technician updates yet.</p>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === "feedback" ? (
          <section className="cu-card">
            <div className="cu-section-head">
              <h4>Submit Service Feedback</h4>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="cu-form-grid">
              <input
                className="cu-input"
                placeholder="Job ID"
                value={feedbackForm.jobId}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, jobId: event.target.value }))}
              />
              <select
                className="cu-select"
                value={feedbackForm.rating}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, rating: event.target.value }))}
              >
                <option value="">Select Rating</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
              <textarea
                className="cu-textarea"
                placeholder="Share your feedback (optional)"
                value={feedbackForm.comment}
                onChange={(event) => setFeedbackForm((prev) => ({ ...prev, comment: event.target.value }))}
              />
              <div className="cu-actions">
                <button className="cu-btn primary" type="submit">
                  Submit Feedback
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </main>
    </div>
  );
}
