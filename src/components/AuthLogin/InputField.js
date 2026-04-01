import React from "react";

const InputField = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  rightAction,
  autoComplete,
  required = false,
  ariaDescribedBy,
}) => {
  const describedBy = error ? `${id}-error ${ariaDescribedBy || ""}`.trim() : ariaDescribedBy;

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className={`input-shell ${error ? "input-shell-error" : ""}`}>
        {Icon ? <Icon className="input-icon" aria-hidden="true" /> : null}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        {rightAction ? <div className="input-action">{rightAction}</div> : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default InputField;
