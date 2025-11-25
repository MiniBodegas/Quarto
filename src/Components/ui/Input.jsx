import React, { forwardRef } from 'react';

const Input = forwardRef((props, ref) => {
  const {
    label,
    hideLabel = false,
    id,
    icon,
    labelAdornment,
    className = '',
    labelClassName = '',
    containerClassName = '',
    error,
    ...rest
  } = props;

  const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  const errorBorderClasses = error
    ? 'border-red-500 focus:ring-red-500/50'
    : 'border-border focus:ring-primary focus:border-primary';

  return (
    <div className={containerClassName}>
      <div className="flex justify-between items-center mb-2">
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-text-secondary ${hideLabel ? 'sr-only' : ''} ${labelClassName}`}
        >
          {label}
        </label>
        {labelAdornment}
      </div>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full bg-card border rounded-md px-3 py-2 text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors duration-200 ${errorBorderClasses} ${icon ? 'pl-11' : ''} ${className}`}
          {...rest}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;