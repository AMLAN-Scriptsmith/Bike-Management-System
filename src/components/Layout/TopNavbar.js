import React from 'react';
import { FiTool, FiLogOut } from 'react-icons/fi';
import './TopNavbar.scss';

const TopNavbar = ({ user, onLogout }) => {
  const displayName = user?.name || user?.email || user || 'Manager';

  return (
    <nav className="top-navbar">
      <div className="navbar-brand">
        <span className="brand-icon"><FiTool /></span>
        <span className="brand-text">Service Center Management</span>
      </div>
      
      <div className="navbar-actions">
        <div className="user-section">
          <span className="welcome-text">Welcome, {displayName}</span>
          <button className="logout-btn" onClick={onLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
