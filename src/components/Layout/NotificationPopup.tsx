import React, { useEffect } from 'react';

interface NotificationPopupProps {
  message: string;
  title?: string;
  isVisible: boolean;
  onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  message,
  title,
  isVisible,
  onClose
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto-close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 max-w-sm w-full bg-gradient-to-r from-white to-gray-50
        transform transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}
        z-50 overflow-hidden rounded-lg shadow-2xl
        border border-gray-100/50 backdrop-blur-sm
        animate-fade-in
      `}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
        <div className="h-full bg-blue-500 animate-progress origin-left" />
      </div>

      <div className="p-4">
        <div className="flex items-start space-x-4">
          {/* Notification Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                {title}
              </h3>
            )}
            <p className="text-sm text-gray-600 line-clamp-2">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 h-5 w-5 text-gray-400 hover:text-gray-600 
              transition-colors duration-200 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-blue-500 rounded-full"
          >
            <span className="sr-only">Close</span>
            <svg className="h-full w-full" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;