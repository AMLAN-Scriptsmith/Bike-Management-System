import React from "react";

const RegisterInputField = ({
  id,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  register,
  error,
  rightAction,
  autoComplete,
  disabled = false,
}) => {
  return (
    <div className="register-field">
      <label htmlFor={id}>{label}</label>
      <div className={`register-input-shell ${error ? "register-input-shell-error" : ""}`}>
        {Icon ? <Icon className="register-input-icon" aria-hidden="true" /> : null}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...register(id)}
        />
        {rightAction ? <div className="register-input-action">{rightAction}</div> : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="register-field-error" role="alert" aria-live="polite">
          {error.message}
        </p>
      ) : null}
    </div>
  );
};

export default RegisterInputField;
