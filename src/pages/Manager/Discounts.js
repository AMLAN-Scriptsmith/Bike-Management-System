import React, { useState } from 'react';
import ManagerLayout from '../../components/Layout/ManagerLayout';
import './Discounts.scss';

const Discounts = () => {
  const [discountRequests, setDiscountRequests] = useState([
    {
      id: 'DR001',
      jobId: 'JOB001',
      customer: 'John Doe',
      phone: '+91 9876543210',
      service: 'AC Repair',
      originalAmount: 2500,
      requestedDiscount: 500,
      discountPercentage: 20,
      reason: 'Loyal customer - 5th service this year',
      requestedBy: 'Tech-001',
      requestedByName: 'Rajesh Kumar',
      status: 'Pending',
      requestDate: '2025-09-25',
      customerHistory: {
        totalJobs: 5,
        totalSpent: 12000,
        lastService: '2025-08-15',
        satisfaction: 4.9
      }
    },
    {
      id: 'DR002',
      jobId: 'JOB002',
      customer: 'Jane Smith',
      phone: '+91 9876543211',
      service: 'Refrigerator Service',
      originalAmount: 1800,
      requestedDiscount: 180,
      discountPercentage: 10,
      reason: 'Goodwill gesture - previous service issue resolved',
      requestedBy: 'Tech-003',
      requestedByName: 'Amit Sharma',
      status: 'Pending',
      requestDate: '2025-09-25',
      customerHistory: {
        totalJobs: 2,
        totalSpent: 3200,
        lastService: '2025-07-10',
        satisfaction: 4.2
      }
    },
    {
      id: 'DR003',
      jobId: 'JOB003',
      customer: 'Mike Johnson',
      phone: '+91 9876543212',
      service: 'Washing Machine',
      originalAmount: 1200,
      requestedDiscount: 120,
      discountPercentage: 10,
      reason: 'Senior citizen discount',
      requestedBy: 'Tech-002',
      requestedByName: 'Suresh Patel',
      status: 'Approved',
      requestDate: '2025-09-24',
      approvedDate: '2025-09-25',
      approvedBy: 'Manager',
      customerHistory: {
        totalJobs: 1,
        totalSpent: 1080,
        lastService: '2025-09-24',
        satisfaction: 4.5
      }
    }
  ]);

  const [activeDiscounts] = useState([
    {
      id: 'AD001',
      name: 'Senior Citizen Discount',
      type: 'Customer Category',
      discountPercentage: 10,
      maxAmount: 500,
      validFrom: '2025-01-01',
      validTo: '2025-12-31',
      conditions: 'Age 60+ with valid ID proof',
      usageCount: 45,
      status: 'Active'
    },
    {
      id: 'AD002',
      name: 'Loyalty Rewards',
      type: 'Customer History',
      discountPercentage: 15,
      maxAmount: 1000,
      validFrom: '2025-01-01',
      validTo: '2025-12-31',
      conditions: '5+ services in current year',
      usageCount: 23,
      status: 'Active'
    },
    {
      id: 'AD003',
      name: 'Festive Special',
      type: 'Seasonal',
      discountPercentage: 20,
      maxAmount: 800,
      validFrom: '2025-10-01',
      validTo: '2025-11-15',
      conditions: 'All services during festival season',
      usageCount: 12,
      status: 'Scheduled'
    }
  ]);

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');

  const handleApproveDiscount = (requestId, approvedAmount) => {
    setDiscountRequests(discountRequests.map(request => 
      request.id === requestId 
        ? { 
            ...request, 
            status: 'Approved',
            approvedDate: new Date().toISOString().split('T')[0],
            approvedBy: 'Manager',
            approvedAmount: approvedAmount || request.requestedDiscount
          }
        : request
    ));
  };

  const handleRejectDiscount = (requestId, reason) => {
    setDiscountRequests(discountRequests.map(request => 
      request.id === requestId 
        ? { 
            ...request, 
            status: 'Rejected',
            rejectedDate: new Date().toISOString().split('T')[0],
            rejectedBy: 'Manager',
            rejectionReason: reason
          }
        : request
    ));
  };

  const filteredRequests = discountRequests.filter(request => 
    filterStatus === 'All' || request.status === filterStatus
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'info';
    }
  };

  const calculateSavings = () => {
    return discountRequests
      .filter(req => req.status === 'Approved')
      .reduce((sum, req) => sum + (req.approvedAmount || req.requestedDiscount), 0);
  };

  const getDiscountStats = () => {
    const total = discountRequests.length;
    const pending = discountRequests.filter(req => req.status === 'Pending').length;
    const approved = discountRequests.filter(req => req.status === 'Approved').length;
    const rejected = discountRequests.filter(req => req.status === 'Rejected').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getDiscountStats();

  return (
    <ManagerLayout>
    <div className="discounts-page">
      <div className="page-header">
        <h1>Discount Management</h1>
        <p>Approve discounts, manage special offers, and track savings</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-icon">🎫</div>
          <div className="card-content">
            <h3>{stats.total}</h3>
            <p>Total Requests</p>
          </div>
        </div>
        
        <div className="summary-card pending">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <h3>{stats.pending}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
        
        <div className="summary-card approved">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>
        
        <div className="summary-card savings">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>₹{calculateSavings().toLocaleString()}</h3>
            <p>Customer Savings</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="filters">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="actions">
          <button 
            className="btn-manage-discounts"
            onClick={() => setShowDiscountModal(true)}
          >
            🎯 Manage Active Discounts
          </button>
        </div>
      </div>

      {/* Discount Requests */}
      <div className="discount-requests">
        <div className="section-header">
          <h2>Discount Requests ({filteredRequests.length})</h2>
        </div>
        
        <div className="requests-grid">
          {filteredRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <div className="request-id">{request.id}</div>
                <span className={`status-badge ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>

              <div className="request-content">
                <div className="customer-info">
                  <h3>{request.customer}</h3>
                  <p className="phone">{request.phone}</p>
                  <p className="service">
                    <strong>Job:</strong> {request.jobId} - {request.service}
                  </p>
                </div>

                <div className="discount-details">
                  <div className="amount-section">
                    <div className="original-amount">
                      Original: <strong>₹{request.originalAmount}</strong>
                    </div>
                    <div className="discount-amount">
                      Discount: <strong>₹{request.requestedDiscount} ({request.discountPercentage}%)</strong>
                    </div>
                    <div className="final-amount">
                      Final: <strong>₹{request.originalAmount - request.requestedDiscount}</strong>
                    </div>
                  </div>

                  <div className="reason-section">
                    <div className="reason-title">Reason:</div>
                    <div className="reason-text">{request.reason}</div>
                  </div>

                  <div className="request-info">
                    <div className="requested-by">
                      Requested by: <strong>{request.requestedByName}</strong>
                    </div>
                    <div className="request-date">
                      Date: {request.requestDate}
                    </div>
                  </div>
                </div>

                <div className="customer-history">
                  <div className="history-title">Customer History</div>
                  <div className="history-stats">
                    <div className="stat">
                      <span className="label">Jobs:</span>
                      <span className="value">{request.customerHistory.totalJobs}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Spent:</span>
                      <span className="value">₹{request.customerHistory.totalSpent.toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Rating:</span>
                      <span className="value">⭐ {request.customerHistory.satisfaction}</span>
                    </div>
                  </div>
                </div>

                {request.status === 'Approved' && (
                  <div className="approval-info">
                    <div className="approval-details">
                      ✅ Approved on {request.approvedDate} by {request.approvedBy}
                    </div>
                  </div>
                )}

                {request.status === 'Rejected' && (
                  <div className="rejection-info">
                    <div className="rejection-details">
                      ❌ Rejected on {request.rejectedDate} by {request.rejectedBy}
                    </div>
                    {request.rejectionReason && (
                      <div className="rejection-reason">
                        Reason: {request.rejectionReason}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {request.status === 'Pending' && (
                <div className="request-actions">
                  <button 
                    className="btn-approve"
                    onClick={() => {
                      const approved = window.confirm(
                        `Approve ₹${request.requestedDiscount} discount for ${request.customer}?`
                      );
                      if (approved) {
                        handleApproveDiscount(request.id);
                      }
                    }}
                  >
                    ✅ Approve
                  </button>
                  <button 
                    className="btn-approve-partial"
                    onClick={() => {
                      const amount = prompt('Enter approved discount amount:', request.requestedDiscount);
                      if (amount && !isNaN(amount) && amount > 0) {
                        handleApproveDiscount(request.id, parseInt(amount));
                      }
                    }}
                  >
                    ⚖️ Partial Approve
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => {
                      const reason = prompt('Enter rejection reason:');
                      if (reason) {
                        handleRejectDiscount(request.id, reason);
                      }
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Discounts Section */}
      <div className="active-discounts">
        <div className="section-header">
          <h2>Active Discount Programs</h2>
        </div>
        
        <div className="discounts-grid">
          {activeDiscounts.map(discount => (
            <div key={discount.id} className="discount-card">
              <div className="discount-header">
                <div className="discount-name">{discount.name}</div>
                <span className={`discount-status ${discount.status.toLowerCase()}`}>
                  {discount.status}
                </span>
              </div>

              <div className="discount-content">
                <div className="discount-type">
                  <strong>Type:</strong> {discount.type}
                </div>
                
                <div className="discount-value">
                  <div className="percentage">{discount.discountPercentage}% OFF</div>
                  <div className="max-amount">Max: ₹{discount.maxAmount}</div>
                </div>

                <div className="validity">
                  <div className="valid-from">From: {discount.validFrom}</div>
                  <div className="valid-to">To: {discount.validTo}</div>
                </div>

                <div className="conditions">
                  <strong>Conditions:</strong> {discount.conditions}
                </div>

                <div className="usage">
                  <div className="usage-count">Used {discount.usageCount} times</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discount Management Modal */}
      {showDiscountModal && (
        <div className="modal-overlay">
          <div className="discount-modal">
            <div className="modal-header">
              <h3>Manage Discount Programs</h3>
              <button onClick={() => setShowDiscountModal(false)}>✕</button>
            </div>
            
            <div className="modal-content">
              <div className="discount-programs">
                <h4>Current Programs</h4>
                
                {activeDiscounts.map(discount => (
                  <div key={discount.id} className="program-item">
                    <div className="program-details">
                      <div className="program-name">{discount.name}</div>
                      <div className="program-info">
                        {discount.discountPercentage}% off, Max ₹{discount.maxAmount} | Used {discount.usageCount} times
                      </div>
                    </div>
                    
                    <div className="program-actions">
                      <button className="btn-edit-program">Edit</button>
                      <button className="btn-deactivate-program">
                        {discount.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="add-program">
                <h4>Create New Program</h4>
                <div className="program-form">
                  <div className="form-row">
                    <input type="text" placeholder="Program Name" />
                    <select>
                      <option>Customer Category</option>
                      <option>Customer History</option>
                      <option>Seasonal</option>
                      <option>Service Type</option>
                    </select>
                  </div>
                  
                  <div className="form-row">
                    <input type="number" placeholder="Discount %" />
                    <input type="number" placeholder="Max Amount" />
                  </div>
                  
                  <div className="form-row">
                    <input type="date" />
                    <input type="date" />
                  </div>
                  
                  <textarea placeholder="Conditions and eligibility criteria"></textarea>
                  
                  <button className="btn-create-program">Create Program</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ManagerLayout>
  );
};

export default Discounts;