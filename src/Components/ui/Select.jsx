import { ChevronDownIcon } from '../calculator/icons';

const Select = ({
  label,
  hideLabel = false,
  id,
  children,
  className = '',
  labelClassName = '',
  containerClassName = '',
  ...props
}) => {
  const selectId = id || `select-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={containerClassName}>
      <label
        htmlFor={selectId}
        className={`block font-normal text-slate-900 dark:text-slate-50 mb-2 ${hideLabel ? 'sr-only' : ''} ${labelClassName}`}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={`w-full appearance-none px-4 py-2.5 bg-white dark:bg-slate-900 border border-border dark:border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-primary-dark focus:border-transparent dark:focus:border-transparent transition-colors duration-200 pr-10 ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
          <ChevronDownIcon className="w-5 h-5 text-slate-500" />
        </div>
      </div>
    </div>
  );
};

export default Select;