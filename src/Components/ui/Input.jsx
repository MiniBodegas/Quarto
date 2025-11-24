import React from 'react';

const Input = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <input
        id={id}
        className="w-full bg-card border border-border rounded-md px-3 py-2 text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        {...props}
      />
    </div>
  );
};

export default Input;