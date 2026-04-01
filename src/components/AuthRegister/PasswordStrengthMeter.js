import React from "react";

const scorePassword = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

const labels = ["Too weak", "Weak", "Medium", "Good", "Strong", "Very strong"];

const PasswordStrengthMeter = ({ password }) => {
  const score = scorePassword(password);
  const width = `${Math.max(14, score * 20)}%`;
  const tone = score <= 1 ? "weak" : score <= 3 ? "medium" : "strong";

  return (
    <div className="password-meter" aria-live="polite">
      <div className="password-meter-track">
        <div className={`password-meter-fill ${tone}`} style={{ width }} />
      </div>
      <small>Password strength: {labels[score]}</small>
    </div>
  );
};

export default PasswordStrengthMeter;
