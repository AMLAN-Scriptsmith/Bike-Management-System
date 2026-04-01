import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/Layout/ManagerLayout';
import { getTechnicians } from '../../api/jobApi';
import './Technicians.scss';

const Technicians = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, available, busy
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      const response = await getTechnicians();
      setTechnicians(response.data || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTechnicians = technicians.filter(tech => {
    const matchesSearch = tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tech.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'available') return tech.status === 'Available' && matchesSearch;
    if (filter === 'busy') return tech.status === 'Busy' && matchesSearch;
    return matchesSearch;
  });

  const handleViewDetails = (technician) => {
    setSelectedTechnician(technician);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#10b981';
      case 'Busy': return '#ef4444';
      case 'Off Duty': return '#64748b';
      default: return '#6366f1';
    }
  };

  const getPerformanceColor = (rating) => {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 4.0) return '#f59e0b';
    if (rating >= 3.5) return '#f97316';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="technicians-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Technicians...</p>
        </div>
      </div>
    );
  }

  return (
    <ManagerLayout>
      <div className="technicians-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Technician Management</h1>
          <p>Manage technicians, view performance, and assign jobs</p>
        </div>
        <div className="header-actions">
          <button className="btn-add-technician">
            + Add Technician
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="tech-stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{technicians.length}</div>
            <div className="stat-label">Total Technicians</div>
          </div>
        </div>
        <div className="stat-card available">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">
              {technicians.filter(t => t.status === 'Available').length}
            </div>
            <div className="stat-label">Available</div>
          </div>
        </div>
        <div className="stat-card busy">
          <div className="stat-icon">⚙️</div>
          <div className="stat-content">
            <div className="stat-number">
              {technicians.filter(t => t.status === 'Busy').length}
            </div>
            <div className="stat-label">Busy</div>
          </div>
        </div>
        <div className="stat-card performance">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-number">
              {(technicians.reduce((sum, t) => sum + t.rating, 0) / technicians.length).toFixed(1)}
            </div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="controls-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search technicians..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({technicians.length})
          </button>
          <button
            className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => setFilter('available')}
          >
            Available ({technicians.filter(t => t.status === 'Available').length})
          </button>
          <button
            className={`filter-btn ${filter === 'busy' ? 'active' : ''}`}
            onClick={() => setFilter('busy')}
          >
            Busy ({technicians.filter(t => t.status === 'Busy').length})
          </button>
        </div>
      </div>

      {/* Technicians Grid */}
      <div className="technicians-grid">
        {filteredTechnicians.map(technician => (
          <div key={technician.id} className="technician-card">
            <div className="tech-header">
              <div className="tech-avatar">
                <span>{technician.name.charAt(0)}</span>
              </div>
              <div className="tech-info">
                <h3>{technician.name}</h3>
                <p className="tech-id">ID: {technician.id}</p>
              </div>
              <div 
                className="tech-status"
                style={{ backgroundColor: getStatusColor(technician.status) }}
              >
                {technician.status}
              </div>
            </div>

            <div className="tech-details">
              <div className="detail-row">
                <span className="label">Specialization:</span>
                <span className="value">{technician.specialization}</span>
              </div>
              <div className="detail-row">
                <span className="label">Experience:</span>
                <span className="value">{technician.experience} years</span>
              </div>
              <div className="detail-row">
                <span className="label">Phone:</span>
                <span className="value">{technician.phone}</span>
              </div>
              <div className="detail-row">
                <span className="label">Location:</span>
                <span className="value">{technician.location}</span>
              </div>
            </div>

            <div className="tech-performance">
              <div className="performance-row">
                <span className="label">Rating:</span>
                <div className="rating">
                  <span 
                    className="rating-value"
                    style={{ color: getPerformanceColor(technician.rating) }}
                  >
                    ⭐ {technician.rating}
                  </span>
                  <span className="rating-count">({technician.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="performance-row">
                <span className="label">Jobs Completed:</span>
                <span className="value completed-jobs">{technician.completedJobs}</span>
              </div>
              <div className="performance-row">
                <span className="label">Current Jobs:</span>
                <span className="value current-jobs">{technician.currentJobs || 0}</span>
              </div>
            </div>

            <div className="tech-actions">
              <button 
                className="btn-view"
                onClick={() => handleViewDetails(technician)}
              >
                View Details
              </button>
              {technician.status === 'Available' && (
                <button className="btn-assign">
                  Assign Job
                </button>
              )}
              {technician.status === 'Busy' && (
                <button className="btn-view-jobs">
                  View Jobs
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTechnicians.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Technicians Found</h3>
          <p>No technicians match your current search and filter criteria.</p>
        </div>
      )}

      {/* Technician Details Modal */}
      {showDetailsModal && selectedTechnician && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="technician-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTechnician.name} - Details</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="tech-profile">
                <div className="profile-left">
                  <div className="large-avatar">
                    <span>{selectedTechnician.name.charAt(0)}</span>
                  </div>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedTechnician.status) }}
                  >
                    {selectedTechnician.status}
                  </div>
                </div>
                
                <div className="profile-right">
                  <div className="profile-info">
                    <h3>{selectedTechnician.name}</h3>
                    <p className="tech-role">{selectedTechnician.specialization} Specialist</p>
                    <div className="contact-info">
                      <p>📞 {selectedTechnician.phone}</p>
                      <p>📧 {selectedTechnician.email}</p>
                      <p>📍 {selectedTechnician.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="performance-details">
                <h4>Performance Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric">
                    <span className="metric-label">Rating</span>
                    <span 
                      className="metric-value"
                      style={{ color: getPerformanceColor(selectedTechnician.rating) }}
                    >
                      ⭐ {selectedTechnician.rating}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Experience</span>
                    <span className="metric-value">{selectedTechnician.experience} years</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Completed Jobs</span>
                    <span className="metric-value">{selectedTechnician.completedJobs}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Success Rate</span>
                    <span className="metric-value">{selectedTechnician.successRate}%</span>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <h4>Recent Activity</h4>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-time">2 hours ago</span>
                    <span className="activity-desc">Completed AC repair job</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-time">1 day ago</span>
                    <span className="activity-desc">Started refrigerator service</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-time">2 days ago</span>
                    <span className="activity-desc">Completed washing machine repair</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
              {selectedTechnician.status === 'Available' && (
                <button className="btn-assign-job">
                  Assign New Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </ManagerLayout>
  );
};

export default Technicians;