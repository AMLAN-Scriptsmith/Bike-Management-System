import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiClipboard,
  FiClock,
  FiTool,
  FiCheckCircle,
  FiArrowRight,
  FiDollarSign,
  FiTrendingUp,
  FiBarChart2,
  FiAlertTriangle,
} from 'react-icons/fi';
import ManagerLayout from '../../components/Layout/ManagerLayout';
import QuickActions from '../../components/Manager/QuickActions';
import { getJobs, approveJob, assignJob } from '../../api/jobApi';
import { getInventoryAlerts, restockItem } from '../../api/inventoryApi';
import '../Manager/ManagerDashboard.scss';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);
  
  const [dashboardData, setDashboardData] = useState({
    totalJobs: 0,
    pendingApprovals: 0,
    activeJobs: 0,
    completedToday: 0,
    inventoryAlerts: 0,
    totalTechnicians: 12,
    availableTechnicians: 7,
    monthlyRevenue: 125000,
    todayRevenue: 4500
  });

  const [recentJobs, setRecentJobs] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load jobs data
      const jobsResponse = await getJobs();
      const jobs = jobsResponse.data || [];
      
      // Load inventory alerts
      const alertsResponse = await getInventoryAlerts();
      const alerts = alertsResponse.data || [];
      
      // Calculate dashboard statistics
      const today = new Date().toDateString();
      const pendingJobs = jobs.filter(job => job.status === 'Pending Assignment' || job.status === 'Pending Approval');
      const activeJobs = jobs.filter(job => job.status === 'In Progress' || job.status === 'Assigned');
      const completedToday = jobs.filter(job => {
        const jobDate = new Date(job.updatedAt || job.createdAt).toDateString();
        return job.status === 'Completed' && jobDate === today;
      });

      setDashboardData(prev => ({
        ...prev,
        totalJobs: jobs.length,
        pendingApprovals: pendingJobs.length,
        activeJobs: activeJobs.length,
        completedToday: completedToday.length,
        inventoryAlerts: alerts.length
      }));

      // Set recent jobs (last 5)
      setRecentJobs(jobs.slice(0, 5).map(job => ({
        id: job.id,
        customer: job.customerName,
        service: job.serviceType,
        status: job.status,
        priority: job.priority,
        date: job.createdAt,
        assignedTechnician: job.assignedTechnician,
        technicianName: job.technicianName
      })));

      // Set inventory alerts (first 5)
      setInventoryAlerts(alerts.slice(0, 5).map(alert => ({
        id: alert.id,
        item: alert.itemName,
        stock: alert.currentStock,
        minStock: alert.minStock,
        status: alert.severity === 'critical' ? 'Critical' : alert.severity === 'high' ? 'Out of Stock' : 'Low Stock'
      })));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Job management functions
  const handleApproveJob = async (jobId) => {
    try {
      await approveJob(jobId);
      loadDashboardData(); // Refresh data
      alert('Job approved successfully!');
    } catch (error) {
      console.error('Error approving job:', error);
      alert('Error approving job. Please try again.');
    }
  };

  const handleAssignJob = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleJobAssignmentComplete = async (jobId, technicianId) => {
    try {
      await assignJob(jobId, technicianId);
      setShowJobModal(false);
      setSelectedJob(null);
      loadDashboardData(); // Refresh data
      alert('Job assigned successfully!');
    } catch (error) {
      console.error('Error assigning job:', error);
      alert('Error assigning job. Please try again.');
    }
  };

  const handleViewProgress = (job) => {
    navigate(`/manager/job-assignment?jobId=${job.id}`);
  };

  // Inventory management functions
  const handleRestockItem = async (alertId, quantity = 10) => {
    try {
      await restockItem(alertId, quantity);
      loadDashboardData(); // Refresh data
      alert('Restock order placed successfully!');
    } catch (error) {
      console.error('Error restocking item:', error);
      alert('Error placing restock order. Please try again.');
    }
  };

  // Metric card click handlers
  const handleMetricClick = (metricType) => {
    switch (metricType) {
      case 'totalJobs':
        navigate('/manager/job-assignment');
        break;
      case 'pendingApprovals':
        navigate('/manager/job-assignment?filter=pending');
        break;
      case 'activeJobs':
        navigate('/manager/job-assignment?filter=active');
        break;
      case 'completedToday':
        navigate('/manager/job-assignment?filter=completed&date=today');
        break;
      default:
        break;
    }
  };

  const handleTechnicianClick = () => {
    navigate('/manager/technicians');
  };

  const handleRevenueClick = () => {
    navigate('/manager/reports?type=revenue');
  };

  if (loading) {
    return (
      <div className="manager-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ManagerLayout>
      <div className="manager-dashboard">
      <div className="dashboard-header">
        <div>
          <div className="manager-meta-bar" role="status" aria-live="polite">
            <span className="manager-meta-chip">Section: Dashboard Overview</span>
            <span className="manager-meta-chip">Today: {todayLabel}</span>
            <span className="manager-meta-chip">Role: Manager</span>
          </div>
          <h1>Manager Dashboard</h1>
          <p>Welcome back! Here's your service center overview</p>
        </div>
        <div className="dashboard-hero" aria-hidden="true">
          <div className="hero-icon"><FiBarChart2 /></div>
          <div>
            <p className="hero-title">Control Tower</p>
            <p className="hero-subtitle">Live jobs, teams, and revenue at a glance</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card primary clickable" onClick={() => handleMetricClick('totalJobs')}>
          <div className="metric-icon"><FiClipboard /></div>
          <div className="metric-info">
            <h3>{dashboardData.totalJobs}</h3>
            <p>Total Jobs</p>
          </div>
          <div className="metric-action"><FiArrowRight /></div>
        </div>
        
        <div className="metric-card warning clickable" onClick={() => handleMetricClick('pendingApprovals')}>
          <div className="metric-icon"><FiClock /></div>
          <div className="metric-info">
            <h3>{dashboardData.pendingApprovals}</h3>
            <p>Pending Approvals</p>
          </div>
          <div className="metric-action"><FiArrowRight /></div>
        </div>
        
        <div className="metric-card success clickable" onClick={() => handleMetricClick('activeJobs')}>
          <div className="metric-icon"><FiTool /></div>
          <div className="metric-info">
            <h3>{dashboardData.activeJobs}</h3>
            <p>Active Jobs</p>
          </div>
          <div className="metric-action"><FiArrowRight /></div>
        </div>
        
        <div className="metric-card info clickable" onClick={() => handleMetricClick('completedToday')}>
          <div className="metric-icon"><FiCheckCircle /></div>
          <div className="metric-info">
            <h3>{dashboardData.completedToday}</h3>
            <p>Completed Today</p>
          </div>
          <div className="metric-action"><FiArrowRight /></div>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="revenue-grid">
        <div className="revenue-card clickable" onClick={handleRevenueClick}>
          <div className="revenue-icon"><FiDollarSign /></div>
          <div className="revenue-info">
            <h3>₹{dashboardData.monthlyRevenue.toLocaleString()}</h3>
            <p>Monthly Revenue</p>
            <span className="growth">+12% from last month</span>
          </div>
          <div className="revenue-action"><FiBarChart2 /></div>
        </div>
        
        <div className="revenue-card clickable" onClick={handleRevenueClick}>
          <div className="revenue-icon"><FiTrendingUp /></div>
          <div className="revenue-info">
            <h3>₹{dashboardData.todayRevenue.toLocaleString()}</h3>
            <p>Today's Revenue</p>
            <span className="growth">+8% from yesterday</span>
          </div>
          <div className="revenue-action"><FiBarChart2 /></div>
        </div>
      </div>

      {/* Enhanced Quick Actions Section */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Recent Jobs Section */}
        <div className="content-section">
          <div className="section-header">
            <h2>Recent Job Requests</h2>
            <Link to="/manager/job-assignment" className="view-all">View All</Link>
          </div>
          <div className="jobs-list">
            {recentJobs.map(job => (
              <div key={job.id} className="job-item">
                <div className="job-details">
                  <div className="job-id">{job.id}</div>
                  <div className="job-customer">{job.customer}</div>
                  <div className="job-service">{job.service}</div>
                </div>
                <div className="job-status">
                  <span className={`status ${job.status.toLowerCase().replace(' ', '-')}`}>
                    {job.status}
                  </span>
                  <span className={`priority ${job.priority.toLowerCase()}`}>
                    {job.priority}
                  </span>
                </div>
                <div className="job-actions">
                  {job.status === 'Pending Approval' && (
                    <>
                      <button 
                        className="btn-approve"
                        onClick={() => handleApproveJob(job.id)}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn-assign"
                        onClick={() => handleAssignJob(job)}
                      >
                        Assign
                      </button>
                    </>
                  )}
                  {job.status === 'Pending Assignment' && (
                    <button 
                      className="btn-assign"
                      onClick={() => handleAssignJob(job)}
                    >
                      Assign
                    </button>
                  )}
                  {job.status === 'In Progress' && (
                    <button 
                      className="btn-view"
                      onClick={() => handleViewProgress(job)}
                    >
                      View Progress
                    </button>
                  )}
                  {job.status === 'Completed' && (
                    <button 
                      className="btn-view"
                      onClick={() => handleViewProgress(job)}
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="content-section">
          <div className="section-header">
            <h2>Inventory Alerts</h2>
            <Link to="/manager/inventory" className="view-all">Manage</Link>
          </div>
          <div className="alerts-list">
            {inventoryAlerts.map((alert, index) => (
              <div key={alert.id || index} className="alert-item">
                <div className="alert-icon"><FiAlertTriangle /></div>
                <div className="alert-details">
                  <div className="alert-item-name">{alert.item}</div>
                  <div className="alert-stock">
                    Stock: {alert.stock} / Min: {alert.minStock}
                  </div>
                </div>
                <div className={`alert-status ${alert.status.toLowerCase().replace(' ', '-')}`}>
                  {alert.status}
                </div>
                <div className="alert-actions">
                  <button 
                    className="btn-restock"
                    onClick={() => handleRestockItem(alert.id)}
                    title="Quick restock (10 units)"
                  >
                    Restock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Status */}
        <div className="content-section">
          <div className="section-header">
            <h2>Technician Status</h2>
            <Link to="/manager/technicians" className="view-all">View All</Link>
          </div>
          <div className="technician-stats clickable-stats" onClick={handleTechnicianClick}>
            <div className="stat-item">
              <div className="stat-number">{dashboardData.totalTechnicians}</div>
              <div className="stat-label">Total Technicians</div>
            </div>
            <div className="stat-item">
              <div className="stat-number available">{dashboardData.availableTechnicians}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="stat-item">
              <div className="stat-number busy">{dashboardData.totalTechnicians - dashboardData.availableTechnicians}</div>
              <div className="stat-label">Busy</div>
            </div>
          </div>
          <div className="technician-actions">
            <button className="btn-assign-tech" onClick={() => navigate('/manager/job-assignment')}>
              Assign Jobs
            </button>
            <button className="btn-view-tech" onClick={() => navigate('/manager/technicians')}>
              View All Technicians
            </button>
          </div>
        </div>
      </div>

      {/* Performance Chart Section */}
      <div className="performance-section">
        <h2>Performance Overview</h2>
        <div className="performance-metrics">
          <div className="metric">
            <div className="metric-label">Customer Satisfaction</div>
            <div className="metric-value">4.8/5.0</div>
            <div className="metric-bar">
              <div className="progress" style={{width: '96%'}}></div>
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Job Completion Rate</div>
            <div className="metric-value">94%</div>
            <div className="metric-bar">
              <div className="progress" style={{width: '94%'}}></div>
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Technician Efficiency</div>
            <div className="metric-value">89%</div>
            <div className="metric-bar">
              <div className="progress" style={{width: '89%'}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Assignment Modal */}
      {showJobModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="job-assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Job: {selectedJob.id}</h3>
              <button className="close-btn" onClick={() => setShowJobModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="job-info">
                <p><strong>Customer:</strong> {selectedJob.customer}</p>
                <p><strong>Service:</strong> {selectedJob.service}</p>
                <p><strong>Priority:</strong> {selectedJob.priority}</p>
              </div>
              <div className="technician-selection">
                <h4>Select Technician:</h4>
                <div className="technician-list">
                  <button 
                    className="technician-btn"
                    onClick={() => handleJobAssignmentComplete(selectedJob.id, 'TECH001')}
                  >
                    Rajesh Kumar (Available)
                  </button>
                  <button 
                    className="technician-btn"
                    onClick={() => handleJobAssignmentComplete(selectedJob.id, 'TECH002')}
                  >
                    Priya Sharma (Available)
                  </button>
                  <button 
                    className="technician-btn"
                    onClick={() => handleJobAssignmentComplete(selectedJob.id, 'TECH003')}
                  >
                    Amit Patel (Available)
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowJobModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerDashboard;
