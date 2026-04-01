// src/context/AuthContext.js
import React, { createContext, useContext, useState } from "react";
import { loginUser, getProfile } from "../api/authApi";

const AuthContext = createContext();

const DEMO_USERS = {
  "admin@test.com": { id: 1, name: "Super Admin", role: "SuperAdmin" },
  "manager@test.com": { id: 2, name: "Manager", role: "Manager" },
  "reception@test.com": { id: 3, name: "Reception", role: "Receptionist" },
  "tech@test.com": { id: 4, name: "Technician", role: "Technician" },
  "customer@test.com": { id: 5, name: "Customer", role: "Customer" },
};

const normalizeRole = (role) => {
  if (!role) return null;
  return role.replace(/\s+/g, "");
};

const getInitialAuth = () => {
  try {
    const stored = localStorage.getItem("auth");
    if (!stored) {
      return { user: null, role: null, token: null, userId: null };
    }
    const parsed = JSON.parse(stored);
    return {
      user: parsed.user || null,
      role: parsed.role || null,
      token: parsed.token || null,
      userId: parsed.userId || null,
    };
  } catch (error) {
    return { user: null, role: null, token: null, userId: null };
  }
};

const resolveDemoUser = (email, password) => {
  if (password !== "1234") return null;
  return DEMO_USERS[email.toLowerCase()] || null;
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(getInitialAuth());

  const saveAuth = (nextAuth) => {
    setAuth(nextAuth);
    localStorage.setItem("auth", JSON.stringify(nextAuth));
    if (nextAuth.token) {
      localStorage.setItem("token", nextAuth.token);
    } else {
      localStorage.removeItem("token");
    }
  };

  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      if (!response.success) {
        return { ok: false, message: response.message || "Login failed" };
      }

      const user = response.data.user;
      const token = response.data.token;
      saveAuth({
        user,
        userId: user.id,
        role: normalizeRole(user.role),
        token,
      });
      return { ok: true };
    } catch (error) {
      const demoUser = resolveDemoUser(email, password);
      if (demoUser) {
        saveAuth({
          user: { ...demoUser, email },
          userId: demoUser.id,
          role: normalizeRole(demoUser.role),
          token: `demo-token-${demoUser.role.toLowerCase()}`,
        });
        return { ok: true };
      }

      return { ok: false, message: error.message || "Login failed" };
    }
  };

  const refreshProfile = async () => {
    try {
      if (!auth.token) return;
      const response = await getProfile();
      if (response.success && response.data?.user) {
        const user = response.data.user;
        saveAuth({
          user,
          userId: user.id,
          role: normalizeRole(user.role),
          token: auth.token,
        });
      }
    } catch (error) {
      // Ignore silent refresh failures.
    }
  };

  const logout = () => {
    saveAuth({ user: null, role: null, token: null, userId: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
