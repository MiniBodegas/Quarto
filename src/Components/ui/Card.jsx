import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-card rounded-lg border border-border shadow-sm p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;