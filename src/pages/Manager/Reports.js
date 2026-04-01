import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/Layout/ManagerLayout';
import { reportApi } from '../../api/reportApi';
import './Reports.scss';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('2025-09-01');
  const [endDate, setEndDate] = useState('2025-09-25');

  const [reportsData, setReportsData] = useState({
    overview: {
      totalJobs: 145,
      completedJobs: 128,
      pendingJobs: 17,
      totalRevenue: 485000,
      averageJobValue: 3345,
      customerSatisfaction: 4.7,
      technicianEfficiency: 87,
      repeatCustomers: 34,
      monthlyGrowth: 12.5
    },
    jobsReport: [
      { month: 'Jan', completed: 42, pending: 8, cancelled: 2 },
      { month: 'Feb', completed: 38, pending: 6, cancelled: 3 },
      { month: 'Mar', completed: 45, pending: 7, cancelled: 1 },
      { month: 'Apr', completed: 41, pending: 9, cancelled: 2 },
      { month: 'May', completed: 48, pending: 5, cancelled: 4 },
      { month: 'Jun', completed: 52, pending: 8, cancelled: 2 },
      { month: 'Jul', completed: 46, pending: 12, cancelled: 3 },
      { month: 'Aug', completed: 49, pending: 7, cancelled: 1 },
      { month: 'Sep', completed: 38, pending: 17, cancelled: 2 }
    ],
    revenueReport: [
      { month: 'Jan', revenue: 142000, target: 130000 },
      { month: 'Feb', revenue: 128000, target: 135000 },
      { month: 'Mar', revenue: 155000, target: 140000 },
      { month: 'Apr', revenue: 138000, target: 142000 },
      { month: 'May', revenue: 162000, target: 145000 },
      { month: 'Jun', revenue: 175000, target: 150000 },
      { month: 'Jul', revenue: 158000, target: 148000 },
      { month: 'Aug', revenue: 168000, target: 152000 },
      { month: 'Sep', revenue: 125000, target: 155000 }
    ],
    technicianReport: [
      { 
        id: 'Tech-001', 
        name: 'Rajesh Kumar', 
        jobsCompleted: 28, 
        avgRating: 4.8, 
        revenue: 95000, 
        efficiency: 92 
      },
      { 
        id: 'Tech-002', 
        name: 'Suresh Patel', 
        jobsCompleted: 25, 
        avgRating: 4.6, 
        revenue: 82000, 
        efficiency: 88 
      },
      { 
        id: 'Tech-003', 
        name: 'Amit Sharma', 
        jobsCompleted: 32, 
        avgRating: 4.9, 
        revenue: 108000, 
        efficiency: 95 
      },
      { 
        id: 'Tech-004', 
        name: 'Vikash Singh', 
        jobsCompleted: 22, 
        avgRating: 4.7, 
        revenue: 75000, 
        efficiency: 85 
      }
    ],
    inventoryReport: [
      { item: 'AC Compressor', used: 15, restocked: 8, currentStock: 2, value: 127500 },
      { item: 'Refrigerator Thermostat', used: 22, restocked: 12, currentStock: 0, value: 26400 },
      { item: 'Washing Machine Belt', used: 18, restocked: 15, currentStock: 1, value: 8100 },
      { item: 'Microwave Magnetron', used: 8, restocked: 5, currentStock: 8, value: 25600 },
      { item: 'Water Heater Element', used: 12, restocked: 8, currentStock: 12, value: 10200 }
    ],
    customerReport: [
      { segment: 'Premium', customers: 45, revenue: 185000, avgSpend: 4111 },
      { segment: 'Standard', customers: 128, revenue: 235000, avgSpend: 1836 },
      { segment: 'Basic', customers: 87, revenue: 65000, avgSpend: 747 }
    ]
  });

  const reportTypes = [
    { id: 'overview', name: 'Business Overview', icon: '📊' },
    { id: 'jobs', name: 'Jobs Analysis', icon: '⚙️' },
    { id: 'revenue', name: 'Revenue Report', icon: '💰' },
    { id: 'technician', name: 'Technician Performance', icon: '👨‍🔧' },
    { id: 'inventory', name: 'Inventory Analysis', icon: '📦' },
    { id: 'customer', name: 'Customer Insights', icon: '👥' }
  ];

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [dashboardResponse, technicianResponse, revenueResponse] = await Promise.all([
          reportApi.getDashboardReport(dateRange),
          reportApi.getTechnicianReport(),
          reportApi.getRevenueReport(startDate, endDate),
        ]);

        if (dashboardResponse.success) {
          const d = dashboardResponse.data;
          setReportsData((prev) => ({
            ...prev,
            overview: {
              ...prev.overview,
              totalJobs: d.jobStats?.total ?? prev.overview.totalJobs,
              completedJobs: d.jobStats?.completed ?? prev.overview.completedJobs,
              pendingJobs: d.jobStats?.pending ?? prev.overview.pendingJobs,
              totalRevenue: d.revenueStats?.thisMonth ?? prev.overview.totalRevenue,
              monthlyGrowth: d.revenueStats?.growth ?? prev.overview.monthlyGrowth,
            },
          }));
        }

        if (technicianResponse.success) {
          const rows = technicianResponse.data?.individualPerformance || [];
          setReportsData((prev) => ({
            ...prev,
            technicianReport: rows.length
              ? rows.map((r) => ({
                  id: `Tech-${r.id || 'N/A'}`,
                  name: r.name || 'Technician',
                  jobsCompleted: r.jobsCompleted || 0,
                  avgRating: r.avgRating || 4.6,
                  revenue: r.revenue || 0,
                  efficiency: r.efficiency || 85,
                }))
              : prev.technicianReport,
          }));
        }

        if (revenueResponse.success) {
          const totalRevenue = Number(revenueResponse.data?.summary?.totalRevenue || 0);
          setReportsData((prev) => ({
            ...prev,
            overview: {
              ...prev.overview,
              totalRevenue: totalRevenue || prev.overview.totalRevenue,
            },
          }));
        }
      } catch (error) {
        // Keep fallback static report data if backend call fails.
      }
    };

    loadReports();
  }, [dateRange, startDate, endDate]);

  const exportReport = (format) => {
    // In a real app, this would generate and download the report
    alert(`Exporting ${selectedReport} report as ${format.toUpperCase()}`);
  };

  const renderOverviewReport = () => (
    <div className="overview-report">
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-number">{reportsData.overview.totalJobs}</div>
            <div className="metric-label">Total Jobs</div>
            <div className="metric-change positive">+{reportsData.overview.monthlyGrowth}% from last month</div>
          </div>
        </div>
        
        <div className="metric-card success">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-number">{reportsData.overview.completedJobs}</div>
            <div className="metric-label">Completed Jobs</div>
            <div className="metric-change positive">88% completion rate</div>
          </div>
        </div>
        
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-number">₹{reportsData.overview.totalRevenue.toLocaleString()}</div>
            <div className="metric-label">Total Revenue</div>
            <div className="metric-change positive">+15% growth</div>
          </div>
        </div>
        
        <div className="metric-card info">
          <div className="metric-icon">⭐</div>
          <div className="metric-content">
            <div className="metric-number">{reportsData.overview.customerSatisfaction}/5.0</div>
            <div className="metric-label">Customer Satisfaction</div>
            <div className="metric-change positive">+0.3 improvement</div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h3>Job Completion Trends</h3>
          <div className="bar-chart">
            {reportsData.jobsReport.slice(-6).map((data, index) => (
              <div key={index} className="bar-group">
                <div className="bar completed" style={{height: `${data.completed * 2}px`}}></div>
                <div className="bar pending" style={{height: `${data.pending * 4}px`}}></div>
                <div className="bar-label">{data.month}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color completed"></span>
              <span>Completed</span>
            </div>
            <div className="legend-item">
              <span className="legend-color pending"></span>
              <span>Pending</span>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h3>Revenue vs Target</h3>
          <div className="line-chart">
            {reportsData.revenueReport.slice(-6).map((data, index) => (
              <div key={index} className="line-point">
                <div className="point revenue" style={{bottom: `${data.revenue / 2000}px`}}></div>
                <div className="point target" style={{bottom: `${data.target / 2000}px`}}></div>
                <div className="point-label">{data.month}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color revenue"></span>
              <span>Actual Revenue</span>
            </div>
            <div className="legend-item">
              <span className="legend-color target"></span>
              <span>Target</span>
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-section">
        <h3>Key Performance Indicators</h3>
        <div className="kpi-grid">
          <div className="kpi-item">
            <div className="kpi-label">Average Job Value</div>
            <div className="kpi-value">₹{reportsData.overview.averageJobValue}</div>
            <div className="kpi-progress">
              <div className="progress-bar" style={{width: '75%'}}></div>
            </div>
          </div>
          
          <div className="kpi-item">
            <div className="kpi-label">Technician Efficiency</div>
            <div className="kpi-value">{reportsData.overview.technicianEfficiency}%</div>
            <div className="kpi-progress">
              <div className="progress-bar" style={{width: `${reportsData.overview.technicianEfficiency}%`}}></div>
            </div>
          </div>
          
          <div className="kpi-item">
            <div className="kpi-label">Repeat Customers</div>
            <div className="kpi-value">{reportsData.overview.repeatCustomers}%</div>
            <div className="kpi-progress">
              <div className="progress-bar" style={{width: `${reportsData.overview.repeatCustomers}%`}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderJobsReport = () => (
    <div className="jobs-report">
      <div className="report-summary">
        <h3>Jobs Analysis Summary</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-title">Completed This Month</div>
            <div className="card-value">{reportsData.jobsReport[reportsData.jobsReport.length - 1].completed}</div>
          </div>
          <div className="summary-card">
            <div className="card-title">Pending Jobs</div>
            <div className="card-value">{reportsData.jobsReport[reportsData.jobsReport.length - 1].pending}</div>
          </div>
          <div className="summary-card">
            <div className="card-title">Completion Rate</div>
            <div className="card-value">88.3%</div>
          </div>
        </div>
      </div>

      <div className="jobs-table">
        <h3>Monthly Job Statistics</h3>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Completed</th>
              <th>Pending</th>
              <th>Cancelled</th>
              <th>Total</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {reportsData.jobsReport.map((row, index) => {
              const total = row.completed + row.pending + row.cancelled;
              const successRate = ((row.completed / total) * 100).toFixed(1);
              return (
                <tr key={index}>
                  <td>{row.month}</td>
                  <td className="completed">{row.completed}</td>
                  <td className="pending">{row.pending}</td>
                  <td className="cancelled">{row.cancelled}</td>
                  <td className="total">{total}</td>
                  <td className="success-rate">{successRate}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTechnicianReport = () => (
    <div className="technician-report">
      <div className="report-summary">
        <h3>Technician Performance Overview</h3>
        <div className="performance-stats">
          <div className="stat-item">
            <div className="stat-label">Average Efficiency</div>
            <div className="stat-value">90%</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Top Performer</div>
            <div className="stat-value">Amit Sharma</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₹360,000</div>
          </div>
        </div>
      </div>

      <div className="technician-cards">
        {reportsData.technicianReport.map(tech => (
          <div key={tech.id} className="technician-card">
            <div className="tech-header">
              <div className="tech-name">{tech.name}</div>
              <div className="tech-id">{tech.id}</div>
            </div>
            
            <div className="tech-metrics">
              <div className="metric">
                <span className="metric-label">Jobs Completed</span>
                <span className="metric-value">{tech.jobsCompleted}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Average Rating</span>
                <span className="metric-value">⭐ {tech.avgRating}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Revenue Generated</span>
                <span className="metric-value">₹{tech.revenue.toLocaleString()}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Efficiency</span>
                <span className="metric-value">{tech.efficiency}%</span>
              </div>
            </div>
            
            <div className="efficiency-bar">
              <div 
                className="efficiency-fill"
                style={{width: `${tech.efficiency}%`}}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRevenueReport = () => (
    <div className="revenue-report">
      <div className="revenue-summary">
        <h3>Revenue Analysis</h3>
        <div className="revenue-metrics">
          <div className="metric-box">
            <div className="metric-title">Total Revenue (YTD)</div>
            <div className="metric-amount">₹1,451,000</div>
            <div className="metric-growth">+18.5% vs last year</div>
          </div>
          
          <div className="metric-box">
            <div className="metric-title">Average Monthly Revenue</div>
            <div className="metric-amount">₹161,222</div>
            <div className="metric-growth">+12% growth rate</div>
          </div>
          
          <div className="metric-box">
            <div className="metric-title">Target Achievement</div>
            <div className="metric-amount">96.8%</div>
            <div className="metric-growth">Nearly achieved</div>
          </div>
        </div>
      </div>

      <div className="revenue-chart">
        <h3>Monthly Revenue vs Target</h3>
        <div className="chart-wrapper">
          {reportsData.revenueReport.map((data, index) => (
            <div key={index} className="revenue-bar-group">
              <div className="revenue-bars">
                <div 
                  className="revenue-bar actual"
                  style={{height: `${(data.revenue / 200000) * 100}%`}}
                  title={`Actual: ₹${data.revenue.toLocaleString()}`}
                ></div>
                <div 
                  className="revenue-bar target"
                  style={{height: `${(data.target / 200000) * 100}%`}}
                  title={`Target: ₹${data.target.toLocaleString()}`}
                ></div>
              </div>
              <div className="month-label">{data.month}</div>
              <div className="amounts">
                <div className="actual-amount">₹{(data.revenue / 1000).toFixed(0)}K</div>
                <div className="target-amount">₹{(data.target / 1000).toFixed(0)}K</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color actual"></span>
            <span>Actual Revenue</span>
          </div>
          <div className="legend-item">
            <span className="legend-color target"></span>
            <span>Target Revenue</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="inventory-report">
      <div className="inventory-summary">
        <h3>Inventory Analysis</h3>
        <div className="summary-metrics">
          <div className="metric">
            <span className="metric-icon">📦</span>
            <span className="metric-label">Total Items</span>
            <span className="metric-value">{reportsData.inventoryReport.length}</span>
          </div>
          
          <div className="metric">
            <span className="metric-icon">💰</span>
            <span className="metric-label">Total Value</span>
            <span className="metric-value">₹{reportsData.inventoryReport.reduce((sum, item) => sum + item.value, 0).toLocaleString()}</span>
          </div>
          
          <div className="metric">
            <span className="metric-icon">📊</span>
            <span className="metric-label">Items Used</span>
            <span className="metric-value">{reportsData.inventoryReport.reduce((sum, item) => sum + item.used, 0)}</span>
          </div>
        </div>
      </div>

      <div className="inventory-table">
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Used</th>
              <th>Restocked</th>
              <th>Current Stock</th>
              <th>Value</th>
              <th>Turnover Rate</th>
            </tr>
          </thead>
          <tbody>
            {reportsData.inventoryReport.map((item, index) => {
              const turnoverRate = ((item.used / (item.restocked || 1)) * 100).toFixed(1);
              return (
                <tr key={index}>
                  <td className="item-name">{item.item}</td>
                  <td className="used">{item.used}</td>
                  <td className="restocked">{item.restocked}</td>
                  <td className="current-stock">{item.currentStock}</td>
                  <td className="value">₹{item.value.toLocaleString()}</td>
                  <td className="turnover">{turnoverRate}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCustomerReport = () => (
    <div className="customer-report">
      <div className="customer-summary">
        <h3>Customer Insights</h3>
        <div className="customer-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-number">260</div>
              <div className="stat-label">Total Customers</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <div className="stat-number">₹1,863</div>
              <div className="stat-label">Avg. Customer Value</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-info">
              <div className="stat-number">34%</div>
              <div className="stat-label">Repeat Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="customer-segments">
        <h3>Customer Segments</h3>
        <div className="segments-grid">
          {reportsData.customerReport.map((segment, index) => (
            <div key={index} className="segment-card">
              <div className="segment-header">
                <div className="segment-name">{segment.segment}</div>
                <div className="segment-customers">{segment.customers} customers</div>
              </div>
              
              <div className="segment-metrics">
                <div className="metric-row">
                  <span>Revenue:</span>
                  <span className="revenue">₹{segment.revenue.toLocaleString()}</span>
                </div>
                
                <div className="metric-row">
                  <span>Avg. Spend:</span>
                  <span className="avg-spend">₹{segment.avgSpend.toLocaleString()}</span>
                </div>
                
                <div className="metric-row">
                  <span>Share:</span>
                  <span className="share">{((segment.revenue / reportsData.customerReport.reduce((sum, s) => sum + s.revenue, 0)) * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="segment-bar">
                <div 
                  className="segment-fill"
                  style={{
                    width: `${(segment.revenue / Math.max(...reportsData.customerReport.map(s => s.revenue))) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'jobs':
        return renderJobsReport();
      case 'revenue':
        return renderRevenueReport();
      case 'technician':
        return renderTechnicianReport();
      case 'inventory':
        return renderInventoryReport();
      case 'customer':
        return renderCustomerReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <ManagerLayout>
    <div className="reports-page">
      <div className="page-header">
        <h1>Service Center Reports</h1>
        <p>Comprehensive analytics and performance insights</p>
      </div>

      {/* Report Controls */}
      <div className="controls-section">
        <div className="report-types">
          {reportTypes.map(type => (
            <button
              key={type.id}
              className={`report-type-btn ${selectedReport === type.id ? 'active' : ''}`}
              onClick={() => setSelectedReport(type.id)}
            >
              <span className="btn-icon">{type.icon}</span>
              <span className="btn-text">{type.name}</span>
            </button>
          ))}
        </div>

        <div className="report-actions">
          <div className="date-filters">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {dateRange === 'custom' && (
              <div className="custom-dates">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="export-actions">
            <button 
              className="export-btn pdf"
              onClick={() => exportReport('pdf')}
            >
              📄 Export PDF
            </button>
            <button 
              className="export-btn excel"
              onClick={() => exportReport('excel')}
            >
              📊 Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-content">
        {renderReportContent()}
      </div>
    </div>
    </ManagerLayout>
  );
};

export default Reports;
