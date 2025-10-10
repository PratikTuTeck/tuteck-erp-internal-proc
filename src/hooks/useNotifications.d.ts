// src/hook/useNotifications.d.ts

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  link: string | null;
  service_type?: string | null;
  raw: any;
}

interface SendNotificationData {
  receiver_ids: string[];
  title: string;
  message: string;
  link?: string | null;
  service_type?: string | null;
  sender_id?: string | null;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  loading: boolean;
  markAsRead: (ids: string[]) => Promise<void>;
  deleteNotifications: (ids: string[]) => Promise<void>;
  sendNotification: (data: SendNotificationData) => Promise<Notification[]>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

declare function useNotifications(userId?: string, token?: string | null): UseNotificationsReturn;

export default useNotifications;