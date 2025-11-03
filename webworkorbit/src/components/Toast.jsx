import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Match animation duration
  };

  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      bgColor: 'bg-green-50 border-green-200',
      iconColor: 'text-green-500',
      textColor: 'text-green-800'
    },
    error: {
      icon: <AlertCircle className="w-5 h-5" />,
      bgColor: 'bg-red-50 border-red-200',
      iconColor: 'text-red-500',
      textColor: 'text-red-800'
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      bgColor: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-800'
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      bgColor: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800'
    }
  };

  const { icon, bgColor, iconColor, textColor } = config[type] || config.info;

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg shadow-lg p-4
        ${bgColor}
        transition-all duration-300 transform
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={iconColor}>
          {icon}
        </div>
        <p className={`flex-1 text-sm font-medium ${textColor}`}>
          {message}
        </p>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Toast container to manage multiple toasts
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id || index}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id || index)}
        />
      ))}
    </div>
  );
};

export default Toast;
