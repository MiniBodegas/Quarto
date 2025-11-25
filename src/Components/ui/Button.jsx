import React from 'react';

const Button = React.forwardRef((props, ref) => {
  const {
    children,
    variant = 'primary',
    icon,
    className = '',
    href,
    ...rest
  } = props;

  const baseClasses =
    'px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-center border border-transparent';

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-gray-100 text-text-secondary hover:bg-gray-200 focus:ring-primary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'bg-transparent border-primary text-primary hover:bg-primary/10 focus:ring-primary',
    tertiary: 'bg-transparent text-primary hover:bg-primary/10 focus:ring-primary',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant] || ''} ${className}`;

  const content = (
    <>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <a className={combinedClasses} ref={ref} href={href} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button className={combinedClasses} ref={ref} {...rest}>
      {content}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;