import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiBarChart2,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiCreditCard,
  FiClipboard,
  FiAlertTriangle,
  FiTool,
  FiSettings,
} from 'react-icons/fi';
import './ManagerSidebar.scss';

const ManagerSidebar = ({ currentPath }) => {
  const menuItems = [
    {
      path: '/manager/dashboard',
      icon: <FiBarChart2 />,
      label: 'Dashboard',
      active: currentPath === '/manager' || currentPath === '/manager/dashboard'
    },
    {
      path: '/manager/job-assignment',
      icon: <FiUsers />,
      label: 'Job Assignment',
      active: currentPath === '/manager/job-assignment'
    },
    {
      path: '/manager/inventory',
      icon: <FiPackage />,
      label: 'Inventory',
      active: currentPath === '/manager/inventory'
    },
    {
      path: '/manager/reports',
      icon: <FiTrendingUp />,
      label: 'Reports',
      active: currentPath === '/manager/reports'
    },
    {
      path: '/manager/discounts',
      icon: <FiCreditCard />,
      label: 'Discounts',
      active: currentPath === '/manager/discounts'
    },
    {
      path: '/manager/recent-requests',
      icon: <FiClipboard />,
      label: 'Recent Requests',
      active: currentPath === '/manager/recent-requests'
    },
    {
      path: '/manager/inventory-alerts',
      icon: <FiAlertTriangle />,
      label: 'Inventory Alerts',
      active: currentPath === '/manager/inventory-alerts'
    },
    {
      path: '/manager/technicians',
      icon: <FiTool />,
      label: 'Technicians',
      active: currentPath === '/manager/technicians'
    }
  ];

  return (
    <div className="manager-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon"><FiSettings /></span>
          <span className="logo-text">Manager Portal</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {menuItems.map((item) => (
            <li key={item.path} className={`nav-item ${item.active ? 'active' : ''}`}>
              <Link to={item.path} className="nav-link">
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">M</div>
          <div className="user-details">
            <div className="user-name">Manager</div>
            <div className="user-role">Service Manager</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerSidebar;
