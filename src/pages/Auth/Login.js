// src/pages/Auth/Login.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { InputField, ShowcasePanel, TestAccountsCard } from "../../components/AuthLogin";
import "./Login.scss";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseJwt = (token) => {
  try {
    if (!token || token.startsWith("demo-token-")) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
};

const getSessionState = (token) => {
  if (!token) return { state: "none", label: "No active session" };
  if (token.startsWith("demo-token-")) {
    return {
      state: "demo",
      label: "Demo session active",
      expiresText: "Expires when you sign out",
    };
  }
  const payload = parseJwt(token);
  if (!payload?.exp) {
    return { state: "active", label: "Session active" };
  }

  const expiresAt = payload.exp * 1000;
  const isExpired = Date.now() >= expiresAt;
  return {
    state: isExpired ? "expired" : "active",
    label: isExpired ? "Session expired" : "Session active",
    expiresText: `Expires ${new Date(expiresAt).toLocaleString()}`,
  };
};

const Login = () => {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("1234");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const { login, token, user, logout } = useAuth();
  const navigate = useNavigate();

  const sessionMeta = useMemo(() => getSessionState(token), [token]);

  const validate = () => {
    const nextErrors = { email: "", password: "" };
    if (!emailRegex.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (password.length < 4) {
      nextErrors.password = "Password must be at least 4 characters.";
    }
    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleUseAccount = (nextEmail, nextPassword) => {
    setEmail(nextEmail);
    setPassword(nextPassword);
    setFeedback({ type: "success", message: "Credentials filled. Click Sign In to continue." });
    setFieldErrors({ email: "", password: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setFeedback({ type: "error", message: "Please fix the highlighted fields and try again." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: "info", message: "Signing you in securely..." });
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (result.ok) {
      if (!rememberMe) {
        sessionStorage.setItem("session-auth-email", email.trim());
      }
      setFeedback({ type: "success", message: "Login successful. Redirecting to dashboard..." });
      navigate("/dashboard");
    } else {
      setFeedback({
        type: "error",
        message: result.message || "Invalid credentials. Try the test accounts (password: 1234).",
      });
    }
  };

  return (
    <section className="login-page">
      <div className="login-overlay" />

      <ShowcasePanel />

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2>Sign In</h2>
        <p className="login-card-subtitle">Continue to your workshop dashboard</p>

        {sessionMeta.state !== "none" && user ? (
          <div className={`session-state session-${sessionMeta.state}`} role="status" aria-live="polite">
            <div>
              <strong>
                <FiCheckCircle aria-hidden="true" /> {sessionMeta.label}
              </strong>
              <p>{user.name} ({user.role})</p>
              {sessionMeta.expiresText ? <small>{sessionMeta.expiresText}</small> : null}
            </div>
            <div className="session-actions">
              <button type="button" onClick={() => navigate("/dashboard")}>Continue</button>
              <button type="button" className="ghost" onClick={logout}>Switch account</button>
            </div>
          </div>
        ) : null}

        {feedback.message ? (
          <motion.div
            className={`login-alert login-alert-${feedback.type || "info"}`}
            role={feedback.type === "error" ? "alert" : "status"}
            aria-live="polite"
            initial={{ opacity: 0, x: feedback.type === "error" ? -8 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28 }}
          >
            <FiAlertCircle aria-hidden="true" />
            {feedback.message}
          </motion.div>
        ) : null}

        <form onSubmit={handleSubmit} className="login-form">
          <InputField
            id="email"
            label="Email"
            icon={FiMail}
            value={email}
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@test.com"
            autoComplete="username"
            error={fieldErrors.email}
            required
          />

          <InputField
            id="password"
            label="Password"
            icon={FiLock}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="1234"
            autoComplete="current-password"
            error={fieldErrors.password}
            rightAction={(
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            )}
            required
          />

          <div className="form-meta-row">
            <label className="remember-row" htmlFor="rememberMe">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          </div>

          <button type="submit" className="login-submit-btn" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? <span className="spinner" aria-hidden="true" /> : null}
            {isSubmitting ? "Signing In..." : "Login"}
          </button>
        </form>

        <TestAccountsCard onUseAccount={handleUseAccount} />

        <div className="login-links">
          <Link to="/register" className="subtle-link-btn">Register</Link>
          <span>|</span>
          <Link to="/" className="subtle-link-btn">Back to Home</Link>
        </div>
      </motion.div>
    </section>
  );
};

export default Login;
