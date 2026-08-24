import React from 'react';
import { clsx } from 'clsx';

/* --- Input --- */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Wraps input in a field group with label/hint/error */
  fieldClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, fieldClassName, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const input = (
      <input
        ref={ref}
        id={inputId}
        className={clsx('ad-input', error && 'ad-input--error', className)}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
    );

    if (!label && !hint && !error) return input;

    return (
      <div className={clsx('space-y-1', fieldClassName)}>
        {label && (
          <label htmlFor={inputId} className="ad-label">
            {label}
          </label>
        )}
        {input}
        {error && (
          <p id={`${inputId}-error`} className="ad-field-error" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="ad-field-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';


/* --- Select --- */
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  /** Placeholder option text */
  placeholder?: string;
  fieldClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, placeholder, className, fieldClassName, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const select = (
      <select
        ref={ref}
        id={selectId}
        className={clsx('ad-select', error && 'ad-input--error', className)}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
        }
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );

    if (!label && !hint && !error) return select;

    return (
      <div className={clsx('space-y-1', fieldClassName)}>
        {label && (
          <label htmlFor={selectId} className="ad-label">
            {label}
          </label>
        )}
        {select}
        {error && (
          <p id={`${selectId}-error`} className="ad-field-error" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${selectId}-hint`} className="ad-field-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
