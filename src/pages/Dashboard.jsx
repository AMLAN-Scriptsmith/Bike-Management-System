// src/pages/Dashboard.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import SuperAdminDashboard from "./SuperAdmin/Dashboard";
import ManagerDashboard from "./Manager/Dashboard";
import ReceptionistDashboard from "./Receptionist/Dashboard";
import TechnicianDashboard from "./Technician/Dashboard";
import CustomerDashboard from "./Customer/Dashboard";
import { useNavigate } from "react-router-dom";
import { useAuth as useAuthHook } from "../context/AuthContext";

const Dashboard = () => {
  const { role, user } = useAuth();
  const { logout } = useAuthHook();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.name || user?.email || "User";

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3 modern-topbar">
        <h4>Welcome, {displayName}</h4>
        <div>
          <span className="me-3 badge bg-info text-dark">{role}</span>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {role === "SuperAdmin" && <SuperAdminDashboard />}
      {role === "Manager" && <ManagerDashboard />}
      {role === "Receptionist" && <ReceptionistDashboard />}
      {role === "Technician" && <TechnicianDashboard />}
      {role === "Customer" && <CustomerDashboard />}

      {!role && <div>Role not found. Please login again.</div>}
    </div>
  );
};

export default Dashboard;
