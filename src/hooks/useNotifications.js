import { useEffect, useRef, useState } from 'react';

// Use HTTP for regular API calls
const API_BASE = import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:7326';
// Use WebSocket protocol for WS connections
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:7326';

// Utility: fetch wrapper with auth
async function apiFetch(path, token, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...opts
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || res.statusText);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * useNotifications
 * - userId: current user id (string)
 * - token: auth token (string)
 */
export default function useNotifications(userId, token) {
  const wsRef = useRef(null);
  const backoffRef = useRef(1000); // ms
  const reconnectTimeoutRef = useRef(null);
  const connectedRef = useRef(false);
  const dedupeRef = useRef(new Set()); // store notification ids to avoid duplicates
  const bcRef = useRef(null); // BroadcastChannel for multi-tab sync

  const [notifications, setNotifications] = useState([]); // newest at front
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch history (on mount & on reconnect)
  const fetchHistory = async () => {
    if (!userId) return;
    try {
      const roleId = userId;
      const response = await apiFetch(`/notifications/${encodeURIComponent(roleId)}`, token);
      // Extract notifications from the nested response structure
      const rows = response?.data?.notifications || [];
      
      // assume rows are ordered newest-first from server; if not, sort by created_at desc
      // dedupe
      const unique = [];
      for (const r of rows) {
        if (!dedupeRef.current.has(r.id)) {
          dedupeRef.current.add(r.id);
          unique.push(r);
        }
      }
      setNotifications(prev => {
        // merge: put unique ones at front, then existing ones that aren't in unique
        const prevFiltered = prev.filter(p => !unique.some(u => u.id === p.id));
        return [...unique, ...prevFiltered];
      });
      const unread = rows.filter(r => !r.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark notifications read locally + server
  const markAsRead = async (ids = []) => {
    try {
      await apiFetch('/notifications/mark-read', token, {
        method: 'POST',
        body: JSON.stringify({ userId, notification_ids: ids })
      });
      setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - ids.length));
      // broadcast to other tabs
      if (bcRef.current) bcRef.current.postMessage({ type: 'mark-read', ids });
    } catch (err) {
      console.warn('markAsRead failed', err);
    }
  };
  
  // Delete notifications locally + server
  const deleteNotifications = async (ids = []) => {
    try {
      await apiFetch('/notifications/delete', token, {
        method: 'POST',
        body: JSON.stringify({ notification_ids: ids })
      });
      
      // Update local state by removing the deleted notifications
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
      
      // Update unread count if any of the deleted notifications were unread
      const unreadDeleted = notifications.filter(n => !n.is_read && ids.includes(n.id)).length;
      if (unreadDeleted > 0) {
        setUnreadCount(prev => Math.max(0, prev - unreadDeleted));
      }
      
      // broadcast to other tabs
      if (bcRef.current) bcRef.current.postMessage({ type: 'delete', ids });
    } catch (err) {
      console.warn('deleteNotifications failed', err);
    }
  };

  // Internal: handle incoming ws messages
  const handleWsMessage = (raw) => {
    try {
      const msg = JSON.parse(raw);
      // Expect { type: "notification", payload: { id, sender_id, receiver_id, title, message, ... } }
      if (msg.type !== "notification" || !msg.payload) {
        console.warn('Unexpected WS message type or missing payload', msg);
        return;
      }

      const notif = msg.payload;
      const id = notif.id;
      if (!id) {
        console.warn('Incoming notification missing id', notif);
        return;
      }
      if (dedupeRef.current.has(id)) return; // ignore duplicates
      dedupeRef.current.add(id);

      // Compose normalized notif object
      const normalized = {
        id,
        title: notif.title || 'Notification',
        message: notif.message || '',
        link: notif.link || null,
        created_at: notif.created_at || new Date().toISOString(),
        service_type: notif.service_type || null,
        is_read: notif.is_read || false,
        raw: notif
      };

      setNotifications(prev => [normalized, ...prev]);
      setUnreadCount(prev => prev + 1);

      // broadcast to other tabs
      if (bcRef.current) bcRef.current.postMessage({ type: 'incoming', notification: normalized });
    } catch (err) {
      console.warn('Invalid WS message', raw, err);
    }
  };

  // Send notification to one or many users
  const sendNotification = async (data) => {
    try {
      // // Validate required fields
      // if (!data.receiver_ids || !Array.isArray(data.receiver_ids) || data.receiver_ids.length === 0) {
      //   throw new Error('receiver_ids must be a non-empty array of user ids');
      // }
      if (!data.title || data.title.trim() === '') {
        throw new Error('title is required');
      }
      if (!data.message || data.message.trim() === '') {
        throw new Error('message is required');
      }

      // Prepare request body
      const body = {
        sender_id: data.sender_id || userId, // Use current user as default sender if not specified
        receiver_ids: data.receiver_ids,
        title: data.title.trim(),
        message: data.message.trim(),
        link: data.link || null,
        service_type: data.service_type || null,
        access: data.access || null // Include access details if provided
      };

      // Send to server
      const response = await apiFetch('/notifications/', token, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      return response?.data?.notifications || [];
    } catch (err) {
      console.warn('sendNotification failed', err);
      throw err;
    }
  };

  // Setup WebSocket connection with reconnection/backoff
  useEffect(() => {
    if (!userId || !token) return;
    let closedByUser = false;

    // BroadcastChannel for multi-tab sync (fallback to localStorage if not supported)
    try {
      bcRef.current = new BroadcastChannel('notifications_channel');
      bcRef.current.onmessage = (ev) => {
        const { type, notification, ids } = ev.data || {};
        if (type === 'incoming' && notification) {
          if (!dedupeRef.current.has(notification.id)) {
            dedupeRef.current.add(notification.id);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        } else if (type === 'mark-read' && ids && ids.length) {
          setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n));
          setUnreadCount(prev => Math.max(0, prev - ids.length));
        } else if (type === 'delete' && ids && ids.length) {
          // Remove deleted notifications
          setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
          // Update unread count if necessary
          const currentNotifications = [...notifications];
          const unreadDeleted = currentNotifications.filter(n => !n.is_read && ids.includes(n.id)).length;
          if (unreadDeleted > 0) {
            setUnreadCount(prev => Math.max(0, prev - unreadDeleted));
          }
        }
      };
    } catch (e) {
      // ignore - not all browsers support BroadcastChannel
      bcRef.current = null;
    }

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        connectedRef.current = true;
        setIsConnected(true);
        backoffRef.current = 1000; // reset backoff
        // Register on server
        const payload = JSON.stringify({ type: 'register', userId, token });
        ws.send(payload);
        // Immediately fetch any missed notifications
        fetchHistory();
      };

      ws.onmessage = (evt) => {
        handleWsMessage(evt.data);
      };

      ws.onclose = (evt) => {
        connectedRef.current = false;
        setIsConnected(false);
        if (closedByUser) return;
        // reconnect with backoff
        const t = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 1.8, 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, t);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error', err);
        ws.close();
      };
    };

    // initial connect
    connect();

    return () => {
      closedByUser = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
      if (bcRef.current) bcRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  // initial fetch once
  useEffect(() => {
    if (userId && token) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Poll fallback (optional) — every 30 sec if you want redundancy
  useEffect(() => {
    if (!userId || !token) return;
    const id = setInterval(() => {
      // only poll when not connected
      if (!connectedRef.current) fetchHistory();
    }, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);


  return {
    notifications,
    unreadCount,
    isConnected,
    loading,
    markAsRead,
    deleteNotifications,
    sendNotification, 
    setNotifications // exported for UI to do optimistic updates if needed
  };
}
