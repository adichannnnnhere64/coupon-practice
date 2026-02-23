// components/NotificationProvider.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { IonToast, isPlatform } from '@ionic/react';
import { Notification, notification } from '../lib/notification';

interface NotificationContextType {
  notifications: Notification[];
  show: (type: Notification['type'], message: string, options?: any) => void;
  hide: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    console.error('❌ useNotification must be used within NotificationProvider');
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const mounted = useRef(false);

  // Register service with state setter
  useEffect(() => {
    console.log('📦 NotificationProvider mounted');
    mounted.current = true;

    // Register the service
    notification.register(setNotifications);

    // Double-check registration after a short delay
    setTimeout(() => {
      if (mounted.current) {
        console.log('✅ Service registration confirmed:', notification.isRegistered());
        console.log('📊 Current notifications:', notifications);

        // Force process queue if needed
        if (notification.isRegistered()) {
          notification.processQueue();
        }
      }
    }, 200);

    return () => {
      console.log('📦 NotificationProvider unmounting');
      mounted.current = false;
    };
  }, []);

  // Log when notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      console.log('🔔 Notifications updated:', notifications);
    }
  }, [notifications]);

  const hide = useCallback((id: string) => {
    console.log('👋 Hiding notification:', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const show = useCallback((type: Notification['type'], message: string, options?: any) => {
    console.log('🎯 Show called with:', { type, message, options });
    switch(type) {
      case 'success': notification.success(message, options); break;
      case 'error': notification.error(message, options); break;
      case 'warning': notification.warning(message, options); break;
      case 'info': notification.info(message, options); break;
    }
  }, []);

  const getPosition = () => isPlatform('mobile') ? 'top' : 'bottom';

  return (
    <NotificationContext.Provider value={{ notifications, show, hide }}>
      {children}

      {/* Render toasts */}
      {notifications.map((n) => {
        console.log('🎨 Rendering toast:', n.id, n.message);
        return (
          <IonToast
            key={n.id}
            isOpen={true}
            message={n.message}
            header={n.title}
            duration={n.persistent ? undefined : n.duration}
            color={n.type === 'success' ? 'success' :
                   n.type === 'error' ? 'danger' :
                   n.type === 'warning' ? 'warning' : 'primary'}
            position={getPosition()}
            buttons={[
              ...(n.action ? [{
                text: n.action.label,
                handler: () => {
                  n.action?.handler();
                  hide(n.id);
                }
              }] : []),
              {
                text: 'Dismiss',
                role: 'cancel',
                handler: () => hide(n.id)
              }
            ]}
            onDidDismiss={() => hide(n.id)}
          />
        );
      })}
    </NotificationContext.Provider>
  );
};
