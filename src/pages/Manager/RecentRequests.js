import React, { useState, useEffect, useCallback } from 'react';
import ManagerLayout from '../../components/Layout/ManagerLayout';
import { jobApi } from '../../api/jobApi';
import './RecentRequests.scss';

// Utility functions
const getStatusColor = (status) => {
  const colors = {
    'Pending Assignment': '#f59e0b',
    'Assigned': '#3b82f6',
    'In Progress': '#8b5cf6',
    'Completed': '#10b981',
    'Cancelled': '#ef4444'
  };
  return colors[status] || '#64748b';
};

const getPriorityColor = (priority) => {
  const colors = {
    'High': '#ef4444',
    'Medium': '#f59e0b',
    'Low': '#3b82f6'
  };
  return colors[priority] || '#64748b';
};

const RecentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    timeframe: 'today'
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await jobApi.getAllJobs(filters);
      if (response.success) {
        // Sort by creation date (most recent first)
        const sortedRequests = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setRequests(sortedRequests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const response = await jobApi.updateJobStatus(requestId, newStatus);
      if (response.success) {
        await fetchRequests();
        alert('Status updated successfully!');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleAssignJob = async (requestId) => {
    try {
      const response = await jobApi.getAvailableTechnicians();
      if (response.success && response.data.length > 0) {
        // For simplicity, auto-assign to first available technician
        const technician = response.data[0];
        const assignResponse = await jobApi.assignJob(requestId, technician.id);
        if (assignResponse.success) {
          await fetchRequests();
          alert('Job assigned successfully!');
        }
      } else {
        alert('No available technicians found');
      }
    } catch (error) {
      console.error('Error assigning job:', error);
      alert('Failed to assign job');
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <ManagerLayout>
    <div className="recent-requests">
      <div className="page-header">
        <div className="header-content">
          <h1>Recent Job Requests</h1>
          <p>Monitor and manage incoming service requests</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{requests.length}</span>
            <span className="stat-label">Total Requests</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{requests.filter(r => r.status === 'Pending Assignment').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{requests.filter(r => r.priority === 'High').length}</span>
            <span className="stat-label">High Priority</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Status</option>
            <option value="Pending Assignment">Pending Assignment</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <select 
            value={filters.priority} 
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Timeframe:</label>
          <select 
            value={filters.timeframe} 
            onChange={(e) => setFilters({...filters, timeframe: e.target.value})}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="requests-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No requests found</h3>
            <p>No job requests match your current filters</p>
          </div>
        ) : (
          <div className="requests-grid">
            {requests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-id">{request.id}</div>
                  <div className="request-badges">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(request.priority) }}
                    >
                      {request.priority}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(request.status) }}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>

                <div className="request-content">
                  <div className="customer-info">
                    <h3>{request.customerName}</h3>
                    <p className="phone">{request.customerPhone}</p>
                    <p className="address">{request.customerAddress}</p>
                  </div>

                  <div className="service-info">
                    <div className="service-type">
                      <strong>{request.serviceType}</strong>
                    </div>
                    <div className="service-description">
                      {request.description}
                    </div>
                  </div>

                  <div className="request-meta">
                    <div className="meta-item">
                      <span className="meta-label">Requested:</span>
                      <span className="meta-value">{getTimeAgo(request.createdAt)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Scheduled:</span>
                      <span className="meta-value">
                        {new Date(request.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Duration:</span>
                      <span className="meta-value">{request.estimatedDuration} mins</span>
                    </div>
                  </div>

                  {request.assignedTechnician && (
                    <div className="assigned-tech-info">
                      <div className="tech-avatar">👨‍🔧</div>
                      <div className="tech-details">
                        <span className="tech-name">{request.technicianName}</span>
                        <span className="tech-id">ID: {request.assignedTechnician}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  <button 
                    className="btn-details"
                    onClick={() => handleViewDetails(request)}
                  >
                    📋 Details
                  </button>

                  {request.status === 'Pending Assignment' && (
                    <>
                      <button 
                        className="btn-assign primary"
                        onClick={() => handleAssignJob(request.id)}
                      >
                        👥 Assign
                      </button>
                      <button 
                        className="btn-approve secondary"
                        onClick={() => handleStatusUpdate(request.id, 'Assigned')}
                      >
                        ✓ Approve
                      </button>
                    </>
                  )}

                  {request.status === 'In Progress' && (
                    <button 
                      className="btn-complete success"
                      onClick={() => handleStatusUpdate(request.id, 'Completed')}
                    >
                      ✓ Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <RequestDetailsModal 
          request={selectedRequest}
          onClose={() => setShowDetailsModal(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
    </ManagerLayout>
  );
};

// Request Details Modal Component
const RequestDetailsModal = ({ request, onClose, onStatusUpdate }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Details - {request.id}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="details-grid">
            <div className="detail-section">
              <h3>Customer Information</h3>
              <div className="detail-item">
                <label>Name:</label>
                <span>{request.customerName}</span>
              </div>
              <div className="detail-item">
                <label>Phone:</label>
                <span>{request.customerPhone}</span>
              </div>
              <div className="detail-item">
                <label>Address:</label>
                <span>{request.customerAddress}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Service Details</h3>
              <div className="detail-item">
                <label>Service Type:</label>
                <span>{request.serviceType}</span>
              </div>
              <div className="detail-item">
                <label>Priority:</label>
                <span className="priority-badge" style={{ backgroundColor: getPriorityColor(request.priority) }}>
                  {request.priority}
                </span>
              </div>
              <div className="detail-item">
                <label>Status:</label>
                <span className="status-badge" style={{ backgroundColor: getStatusColor(request.status) }}>
                  {request.status}
                </span>
              </div>
              <div className="detail-item">
                <label>Description:</label>
                <span>{request.description}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Scheduling</h3>
              <div className="detail-item">
                <label>Request Created:</label>
                <span>{new Date(request.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>Scheduled Date:</label>
                <span>{new Date(request.scheduledDate).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>Estimated Duration:</label>
                <span>{request.estimatedDuration} minutes</span>
              </div>
            </div>

            {request.assignedTechnician && (
              <div className="detail-section">
                <h3>Assignment</h3>
                <div className="detail-item">
                  <label>Technician:</label>
                  <span>{request.technicianName}</span>
                </div>
                <div className="detail-item">
                  <label>Technician ID:</label>
                  <span>{request.assignedTechnician}</span>
                </div>
              </div>
            )}

            {request.parts && request.parts.length > 0 && (
              <div className="detail-section">
                <h3>Required Parts</h3>
                <div className="parts-list">
                  {request.parts.map((part, index) => (
                    <span key={index} className="part-tag">{part}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          {request.status === 'Pending Assignment' && (
            <button 
              className="btn-primary" 
              onClick={() => {
                onStatusUpdate(request.id, 'Assigned');
                onClose();
              }}
            >
              Approve Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentRequests;