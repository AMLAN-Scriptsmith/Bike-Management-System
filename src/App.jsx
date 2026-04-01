// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Welcome from "./pages/Auth/Welcome";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./routes/PrivateRoute";
import RoleRoute from "./routes/RoleRoute";
import NotFound from "./pages/NotFound";
import SuperAdminDashboard from "./pages/SuperAdmin/Dashboard";

// Manager Pages
import ManagerDashboard from "./pages/Manager/Dashboard";
import JobAssignment from "./pages/Manager/JobAssignment";
import Inventory from "./pages/Manager/Inventory";
import Reports from "./pages/Manager/Reports";
import Discounts from "./pages/Manager/Discounts";
import RecentRequests from "./pages/Manager/RecentRequests";
import InventoryAlerts from "./pages/Manager/InventoryAlerts";
import Technicians from "./pages/Manager/Technicians";

// import Unauthorized from "./pages/Unauthorized";

function App(){
  const { pathname } = useLocation();
  const isModernRoute = /^(\/dashboard|\/manager|\/super-admin)(\/|$)/.test(pathname);

  return (
    <div className={isModernRoute ? "app-modern" : "app-shell"}>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/unauthorized" element={<Unauthorized />} />n */}

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/super-admin"
          element={
            <PrivateRoute>
              <RoleRoute allowedRoles={["SuperAdmin"]}>
                <SuperAdminDashboard />
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* Manager Routes */}
        <Route path="/manager" element={<PrivateRoute><RoleRoute allowedRoles={["Manager", "SuperAdmin"]}><ManagerDashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/manager/dashboard" element={<PrivateRoute><RoleRoute allowedRoles={["Manager", "SuperAdmin"]}><ManagerDashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/manager/job-assignment" element={<PrivateRoute><RoleRoute allowedRoles={["Manager", "SuperAdmin"]}><JobAssignment /></RoleRoute></PrivateRoute>} />
        <Route path="/manager/inventory" element={<PrivateRoute><RoleRoute allowedRoles={["Manager", "SuperAdmin"]}><Inventory /></RoleRoute></PrivateRoute>} />
        <Route path="/manager/reports" element={<PrivateRoute><RoleRoute allowedRoles={["Manager", "SuperAdmin"]}><Reports /></RoleRoute></PrivateRoute>} />
        <Route path="/manager/discounts" element={<PrivateRoute><RoleRoute allowedRoles={["Manager", "SuperAdmin"]}><Discounts /></RoleRoute></PrivateRoute>} />
        <Route path="/manager/recent-requests" element={<PrivateRoute><RoleRoute allowedRoles={["Manager", "SuperAdmin"]}><RecentRequests /></RoleRoute></PrivateRoute>} />
        <Route path="/manager/inventory-alerts" element={<PrivateRoute><RoleRoute allowedRoles={["Manager", "SuperAdmin"]}><InventoryAlerts /></RoleRoute></PrivateRoute>} />
        <Route path="/manager/technicians" element={<PrivateRoute><RoleRoute allowedRoles={["Manager", "SuperAdmin"]}><Technicians /></RoleRoute></PrivateRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
