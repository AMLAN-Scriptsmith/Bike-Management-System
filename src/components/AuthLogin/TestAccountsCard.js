import React, { useMemo, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

const rows = [
  ["Admin", "admin@test.com"],
  ["Manager", "manager@test.com"],
  ["Receptionist", "reception@test.com"],
  ["Technician", "tech@test.com"],
  ["Customer", "customer@test.com"],
];

const TestAccountsCard = ({ onUseAccount }) => {
  const [copied, setCopied] = useState("");
  const password = "1234";

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1400);
    } catch (error) {
      setCopied("");
    }
  };

  const accountRows = useMemo(() => rows, []);

  return (
    <section className="test-accounts-card" aria-label="Test account credentials">
      <div className="test-accounts-head">
        <p>Test Accounts</p>
        <button type="button" onClick={() => copy(password, "password")} className="tiny-copy-btn">
          {copied === "password" ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
          Password: {password}
        </button>
      </div>

      <div className="test-table" role="table" aria-label="Account list">
        {accountRows.map(([role, email]) => (
          <div key={email} className="test-row" role="row">
            <div role="cell" className="test-role">{role}</div>
            <button
              type="button"
              role="cell"
              className="test-email-btn"
              onClick={() => onUseAccount(email, password)}
              aria-label={`Use ${role} account`}
            >
              {email}
            </button>
            <button
              type="button"
              className="tiny-copy-btn"
              onClick={() => copy(email, email)}
              aria-label={`Copy ${email}`}
            >
              {copied === email ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
              Copy
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestAccountsCard;
