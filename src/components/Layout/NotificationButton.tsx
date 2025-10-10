import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
// @ts-ignore
import useNotifications from '../../hooks/useNotifications';
import  {useAuth}  from '../../hooks/useAuth';

// Define the Notification type
interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  link: string | null;
  raw?: any;
}

export function NotificationButton() {
  const { user } = useAuth();
  const token = localStorage.getItem('auth_token');

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  console.log("user in NotificationButton:", user, "token:", token);
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    deleteNotifications,
    isConnected
  } = useNotifications(user?.id, token);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle notification click - mark as read and follow link if available
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
    
    if (notification.link) {
      window.open(notification.link, '_blank');
    }
  };
  
  // Delete a single notification
  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering the notification click handler
    deleteNotifications([id]);
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter((n: Notification) => !n.is_read)
      .map((n: Notification) => n.id);
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };
  
  // Delete all notifications
  const deleteAllNotifications = () => {
    if (notifications.length > 0) {
      const allIds = notifications.map((n: Notification) => n.id);
      deleteNotifications(allIds);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-[28rem] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h3 className="font-medium text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {isConnected && (
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500 mr-1" title="Connected"></span>
              )}
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={deleteAllNotifications}
                    className="text-xs text-red-600 hover:text-red-800"
                    title="Delete all notifications"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-grow">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification: Notification) => (
                  <li 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex justify-between">
                      <p className="font-medium text-gray-900 mb-1">{notification.title}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        <button
                          onClick={(e) => handleDeleteNotification(e, notification.id)}
                          className="text-gray-400 hover:text-red-500 focus:outline-none"
                          title="Delete notification"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {notification.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}