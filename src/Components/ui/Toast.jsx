import { useEffect } from 'react';

export const Toast = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 4000); // Auto dismiss after 4 seconds

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const bgColors = {
    success: 'bg-white border-l-4 border-green-500',
    error: 'bg-white border-l-4 border-red-500',
    info: 'bg-white border-l-4 border-primary',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-primary',
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };

  return (
    <div className={`${bgColors[notification.type]} shadow-lg rounded-r-lg p-4 flex items-center justify-between min-w-[300px] transform transition-all duration-300 animate-slide-in mb-3`}>
      <div className="flex items-center">
        <span className={`material-symbols-outlined mr-3 ${iconColors[notification.type]}`}>
          {icons[notification.type]}
        </span>
        <p className="text-sm font-medium text-gray-800">{notification.message}</p>
      </div>
      <button 
        onClick={() => onDismiss(notification.id)} 
        className="ml-4 text-gray-400 hover:text-gray-600"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
};

export const ToastContainer = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {notifications.map(notification => (
          <Toast key={notification.id} notification={notification} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};
