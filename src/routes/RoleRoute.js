import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleRoute = ({ children, allowedRoles = [] }) => {
	const { token, role } = useAuth();

	if (!token) {
		return <Navigate to="/login" replace />;
	}

	if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
		return <Navigate to="/dashboard" replace />;
	}

	return children;
};

export default RoleRoute;
