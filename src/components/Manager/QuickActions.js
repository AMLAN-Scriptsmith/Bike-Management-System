import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiPackage,
  FiBarChart2,
  FiCreditCard,
  FiClipboard,
  FiAlertTriangle,
  FiTarget,
  FiZap,
  FiTrendingUp,
  FiCheckCircle,
} from 'react-icons/fi';
import './QuickActions.scss';

const QuickActions = () => {
  const [quickStats] = useState({
    pendingJobs: 8,
    lowStockItems: 5,
    pendingDiscounts: 3,
    recentRequests: 12,
    inventoryAlerts: 7,
    reportsGenerated: 15
  });

  const [showNotifications, setShowNotifications] = useState({
    jobs: false,
    inventory: false,
    discounts: false
  });

  useEffect(() => {
    // Simulate checking for urgent notifications
    const checkNotifications = () => {
      setShowNotifications({
        jobs: quickStats.pendingJobs > 5,
        inventory: quickStats.lowStockItems > 3,
        discounts: quickStats.pendingDiscounts > 0
      });
    };

    checkNotifications();
  }, [quickStats]);

  const actionItems = [
    {
      id: 'assign-jobs',
      title: 'Assign Jobs',
      subtitle: `${quickStats.pendingJobs} pending assignments`,
      icon: FiUsers,
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      route: '/manager/job-assignment',
      badge: quickStats.pendingJobs > 0 ? quickStats.pendingJobs : null,
      urgent: showNotifications.jobs,
      description: 'Assign technicians to pending job requests',
      stats: [
        { label: 'Pending', value: quickStats.pendingJobs },
        { label: 'Today', value: 3 }
      ]
    },
    {
      id: 'manage-inventory',
      title: 'Manage Inventory',
      subtitle: `${quickStats.lowStockItems} items need attention`,
      icon: FiPackage,
      bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      route: '/manager/inventory',
      badge: quickStats.lowStockItems > 0 ? quickStats.lowStockItems : null,
      urgent: showNotifications.inventory,
      description: 'Monitor stock levels and manage inventory',
      stats: [
        { label: 'Low Stock', value: quickStats.lowStockItems },
        { label: 'Total Items', value: 150 }
      ]
    },
    {
      id: 'view-reports',
      title: 'View Reports',
      subtitle: 'Generate and analyze reports',
      icon: FiBarChart2,
      bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      route: '/manager/reports',
      badge: null,
      urgent: false,
      description: 'Access comprehensive business reports',
      stats: [
        { label: 'Generated', value: quickStats.reportsGenerated },
        { label: 'This Month', value: 8 }
      ]
    },
    {
      id: 'approve-discounts',
      title: 'Approve Discounts',
      subtitle: `${quickStats.pendingDiscounts} pending approvals`,
      icon: FiCreditCard,
      bgGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      route: '/manager/discounts',
      badge: quickStats.pendingDiscounts > 0 ? quickStats.pendingDiscounts : null,
      urgent: showNotifications.discounts,
      description: 'Review and approve discount requests',
      stats: [
        { label: 'Pending', value: quickStats.pendingDiscounts },
        { label: 'Approved Today', value: 2 }
      ]
    },
    {
      id: 'recent-requests',
      title: 'Recent Job Requests',
      subtitle: `${quickStats.recentRequests} new requests`,
      icon: FiClipboard,
      bgGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      route: '/manager/recent-requests',
      badge: quickStats.recentRequests > 0 ? quickStats.recentRequests : null,
      urgent: false,
      description: 'View latest customer service requests',
      stats: [
        { label: 'Today', value: quickStats.recentRequests },
        { label: 'This Week', value: 45 }
      ]
    },
    {
      id: 'inventory-alerts',
      title: 'Inventory Alerts',
      subtitle: `${quickStats.inventoryAlerts} active alerts`,
      icon: FiAlertTriangle,
      bgGradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      route: '/manager/inventory-alerts',
      badge: quickStats.inventoryAlerts > 0 ? quickStats.inventoryAlerts : null,
      urgent: quickStats.inventoryAlerts > 5,
      description: 'Critical inventory notifications',
      stats: [
        { label: 'Critical', value: 2 },
        { label: 'Warning', value: quickStats.inventoryAlerts - 2 }
      ]
    }
  ];

  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="quick-actions-enhanced">
      <div className="section-header">
        <div className="header-content">
          <h2>Quick Actions</h2>
          <p>Access frequently used management tools</p>
        </div>
        <div className="header-stats">
          <span className="urgent-count">
            {Object.values(showNotifications).filter(Boolean).length} Urgent
          </span>
        </div>
      </div>

      <div className="actions-grid">
        {actionItems.map((action) => (
          <Link
            key={action.id}
            to={action.route}
            className={`action-card ${action.urgent ? 'urgent' : ''} ${hoveredCard === action.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredCard(action.id)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ '--bg-gradient': action.bgGradient }}
          >
            <div className="card-background"></div>
            
            <div className="card-header">
              <div className="icon-wrapper">
                <span className="card-icon"><action.icon /></span>
                {action.badge && (
                  <span className={`notification-badge ${action.urgent ? 'urgent' : ''}`}>
                    {action.badge}
                  </span>
                )}
              </div>
              {action.urgent && <div className="urgent-indicator">!</div>}
            </div>

            <div className="card-content">
              <h3 className="card-title">{action.title}</h3>
              <p className="card-subtitle">{action.subtitle}</p>
              <p className="card-description">{action.description}</p>
            </div>

            <div className="card-stats">
              {action.stats.map((stat, statIndex) => (
                <div key={statIndex} className="stat-item">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="card-footer">
              <div className="action-indicator">
                <span className="action-text">Click to access</span>
                <span className="arrow-icon">→</span>
              </div>
            </div>

            <div className="hover-overlay"></div>
          </Link>
        ))}
      </div>

      {/* Quick Summary Bar */}
      <div className="quick-summary">
        <div className="summary-item">
          <div className="summary-icon"><FiTarget /></div>
          <div className="summary-content">
            <span className="summary-value">{quickStats.pendingJobs + quickStats.pendingDiscounts}</span>
            <span className="summary-label">Tasks Pending</span>
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-icon"><FiZap /></div>
          <div className="summary-content">
            <span className="summary-value">{quickStats.inventoryAlerts}</span>
            <span className="summary-label">Urgent Alerts</span>
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-icon"><FiTrendingUp /></div>
          <div className="summary-content">
            <span className="summary-value">94%</span>
            <span className="summary-label">Efficiency</span>
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-icon"><FiCheckCircle /></div>
          <div className="summary-content">
            <span className="summary-value">12</span>
            <span className="summary-label">Completed Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;