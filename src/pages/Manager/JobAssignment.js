import React, { useState, useEffect, useCallback } from 'react';
import ManagerLayout from '../../components/Layout/ManagerLayout';
import { jobApi } from '../../api/jobApi';
import './JobAssignment.scss';

const JobAssignment = () => {
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'Pending Assignment',
    priority: '',
    serviceType: ''
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await jobApi.getAllJobs(filters);
      if (response.success) {
        setJobs(response.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchTechnicians = useCallback(async () => {
    try {
      const response = await jobApi.getAvailableTechnicians();
      if (response.success) {
        setTechnicians(response.data);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchTechnicians();
  }, [fetchJobs, fetchTechnicians]);

  const handleAssignJob = (job) => {
    setSelectedJob(job);
    setShowAssignModal(true);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Assignment': return '#f59e0b';
      case 'Assigned': return '#3b82f6';
      case 'In Progress': return '#8b5cf6';
      case 'Completed': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <ManagerLayout>
      <div className="job-assignment">
      <div className="page-header">
        <div className="header-content">
          <h1>Job Assignment</h1>
          <p>Assign technicians to pending job requests</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{jobs.length}</span>
            <span className="stat-label">Total Jobs</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{jobs.filter(j => j.status === 'Pending Assignment').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{technicians.filter(t => t.status === 'Available').length}</span>
            <span className="stat-label">Available Techs</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
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
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Service Type:</label>
          <select 
            value={filters.serviceType} 
            onChange={(e) => handleFilterChange('serviceType', e.target.value)}
          >
            <option value="">All Services</option>
            <option value="AC Repair">AC Repair</option>
            <option value="Refrigerator Service">Refrigerator Service</option>
            <option value="Washing Machine">Washing Machine</option>
            <option value="Dishwasher">Dishwasher</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      <div className="jobs-section">
        {loading ? (
          <div className="loading">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="no-jobs">No jobs found with current filters</div>
        ) : (
          <div className="jobs-grid">
            {jobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <div className="job-id">{job.id}</div>
                  <div className="job-priority" style={{ backgroundColor: getPriorityColor(job.priority) }}>
                    {job.priority}
                  </div>
                </div>

                <div className="job-customer">
                  <h3>{job.customerName}</h3>
                  <p>{job.customerPhone}</p>
                  <p>{job.customerAddress}</p>
                </div>

                <div className="job-details">
                  <div className="detail-item">
                    <span className="label">Service:</span>
                    <span className="value">{job.serviceType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className="value status" style={{ color: getStatusColor(job.status) }}>
                      {job.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Scheduled:</span>
                    <span className="value">{new Date(job.scheduledDate).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Duration:</span>
                    <span className="value">{job.estimatedDuration} mins</span>
                  </div>
                </div>

                <div className="job-description">
                  <p>{job.description}</p>
                </div>

                {job.parts && job.parts.length > 0 && (
                  <div className="job-parts">
                    <span className="parts-label">Required Parts:</span>
                    <div className="parts-list">
                      {job.parts.map((part, index) => (
                        <span key={index} className="part-tag">{part}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="job-actions">
                  {job.status === 'Pending Assignment' && (
                    <button 
                      className="btn-assign primary"
                      onClick={() => handleAssignJob(job)}
                    >
                      Assign Technician
                    </button>
                  )}
                  {job.assignedTechnician && (
                    <div className="assigned-tech">
                      <span>Assigned to: {job.technicianName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <AssignmentModal 
          job={selectedJob}
          technicians={technicians}
          onClose={() => setShowAssignModal(false)}
          onAssign={fetchJobs}
        />
      )}
      </div>
    </ManagerLayout>
  );
};

// Assignment Modal Component
const AssignmentModal = ({ job, technicians, onClose, onAssign }) => {
  const [selectedTech, setSelectedTech] = useState('');
  const [scheduledDate, setScheduledDate] = useState(job?.scheduledDate?.slice(0, 16) || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedTech) {
      alert('Please select a technician');
      return;
    }

    setLoading(true);
    try {
      const response = await jobApi.assignJob(job.id, selectedTech, scheduledDate);
      if (response.success) {
        alert('Job assigned successfully!');
        onAssign();
        onClose();
      } else {
        alert(response.error || 'Failed to assign job');
      }
    } catch (error) {
      alert('Error assigning job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTechnicians = technicians.filter(tech => 
    tech.specialization.includes(job?.serviceType)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="assignment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Job {job?.id}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="job-summary">
            <h3>Job Details</h3>
            <p><strong>Customer:</strong> {job?.customerName}</p>
            <p><strong>Service:</strong> {job?.serviceType}</p>
            <p><strong>Priority:</strong> {job?.priority}</p>
            <p><strong>Description:</strong> {job?.description}</p>
          </div>

          <div className="assignment-form">
            <div className="form-group">
              <label>Select Technician:</label>
              <select 
                value={selectedTech} 
                onChange={(e) => setSelectedTech(e.target.value)}
              >
                <option value="">Choose a technician...</option>
                {filteredTechnicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} - {tech.specialization.join(', ')} (Rating: {tech.rating})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Scheduled Date & Time:</label>
              <input 
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Assignment Notes:</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for the technician..."
                rows="3"
              />
            </div>

            {selectedTech && (
              <div className="technician-details">
                {(() => {
                  const tech = technicians.find(t => t.id === selectedTech);
                  return tech ? (
                    <div className="tech-info">
                      <h4>Technician Details</h4>
                      <p><strong>Name:</strong> {tech.name}</p>
                      <p><strong>Experience:</strong> {tech.experience}</p>
                      <p><strong>Rating:</strong> {tech.rating}/5.0</p>
                      <p><strong>Current Jobs:</strong> {tech.currentJobs}/{tech.maxJobs}</p>
                      <p><strong>Status:</strong> {tech.status}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="btn-assign primary" 
            onClick={handleAssign}
            disabled={loading || !selectedTech}
          >
            {loading ? 'Assigning...' : 'Assign Job'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobAssignment;
