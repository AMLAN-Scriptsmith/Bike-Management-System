import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import ManagerSidebar from '../../components/Layout/ManagerSidebar';
import TopNavbar from '../../components/Layout/TopNavbar';
import './ManagerLayout.scss';

const ManagerLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/manager':
      case '/manager/dashboard':
        return 'Manager Dashboard';
      case '/manager/job-assignment':
        return 'Job Assignment';
      case '/manager/inventory':
        return 'Inventory Management';
      case '/manager/reports':
        return 'Reports & Analytics';
      case '/manager/discounts':
        return 'Discount Management';
      case '/manager/recent-requests':
        return 'Recent Job Requests';
      case '/manager/inventory-alerts':
        return 'Inventory Alerts';
      case '/manager/technicians':
        return 'Technician Management';
      default:
        return 'Manager Portal';
    }
  };

  return (
    <div className="manager-layout">
      <TopNavbar user={user} onLogout={handleLogout} />
      
      <div className="layout-content">
        <ManagerSidebar currentPath={location.pathname} />
        
        <main className="main-content">
          <div className="page-header-breadcrumb">
            <div className="breadcrumb">
              <Link to="/manager" className="breadcrumb-item">
                Manager
              </Link>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{getPageTitle()}</span>
            </div>
            
            <div className="page-actions">
              <button className="btn-notifications">
                <FiBell /> <span className="notification-badge">3</span>
              </button>
              <button className="btn-settings">
                <FiSettings /> Settings
              </button>
            </div>
          </div>
          
          <div className="page-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;