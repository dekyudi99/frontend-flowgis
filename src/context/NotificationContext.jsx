import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationContainer from '@/components/commons/NotificationContainer';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((type, message) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setNotifications((prev) => [...prev, { id, type, message }]);
    return id;
  }, []);

  const notify = {
    success: (message) => addNotification('success', message),
    error: (message) => addNotification('error', message),
    info: (message) => addNotification('info', message),
    add: addNotification,
    remove: removeNotification,
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, notify }}>
      {children}
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      addNotification: (type, msg) => console.log(`[Notification ${type}]:`, msg),
      removeNotification: () => {},
      notify: {
        success: (msg) => console.log('[Notification success]:', msg),
        error: (msg) => console.error('[Notification error]:', msg),
        info: (msg) => console.log('[Notification info]:', msg),
      }
    };
  }
  return context;
}
