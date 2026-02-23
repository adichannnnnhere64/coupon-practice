// lib/notification.ts
import React from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
  persistent?: boolean;
}

class NotificationService {
  private setNotifications?: React.Dispatch<React.SetStateAction<Notification[]>>;
  private queue: Notification[] = [];
  private _isRegistered: boolean = false; // Renamed to avoid duplicate

  register(setter: React.Dispatch<React.SetStateAction<Notification[]>>) {
    console.log('🔌 Registering notification service...');
    this.setNotifications = setter;
    this._isRegistered = true;

    // Process queue with slight delay to ensure React state is ready
    setTimeout(() => {
      if (this.queue.length > 0) {
        console.log(`📦 Processing ${this.queue.length} queued notifications:`, this.queue);
        this.queue.forEach(notification => {
          this.setNotifications?.(prev => {
            const exists = prev.some(n => n.id === notification.id);
            if (exists) return prev;
            return [...prev, notification];
          });
        });
        this.queue = [];
      }
    }, 100);
  }

  private add(notification: Notification) {
    if (this._isRegistered && this.setNotifications) {
      // Provider is registered, show immediately
      console.log('✅ Showing notification directly:', notification);
      this.setNotifications(prev => {
        const exists = prev.some(n => n.message === notification.message && n.type === notification.type);
        if (exists) {
          console.log('⚠️ Duplicate notification prevented:', notification.message);
          return prev;
        }
        return [...prev, notification];
      });

      // Auto-remove unless persistent
      if (!notification.persistent && notification.duration !== 0) {
        setTimeout(() => {
          this.remove(notification.id);
        }, notification.duration || 5000);
      }
    } else {
      // Provider not ready, queue it
      console.log('⏳ Queuing notification (service not ready):', notification);
      this.queue.push(notification);
    }
  }

  remove(id: string) {
    if (this.setNotifications) {
      this.setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }

  // Helper method to force process queue
  processQueue() {
    if (this.queue.length > 0 && this.setNotifications) {
      console.log('🔄 Manually processing queue...');
      this.queue.forEach(notification => {
        this.setNotifications?.(prev => [...prev, notification]);
      });
      this.queue = [];
    }
  }

  success(message: string, options?: Partial<Notification>) {
    console.log('📢 success called with:', message);
    this.add({
      id: crypto.randomUUID?.() || `notif-${Date.now()}-${Math.random()}`,
      type: 'success',
      message,
      duration: 5000,
      ...options
    });
  }

  error(message: string, options?: Partial<Notification>) {
    console.log('📢 error called with:', message);
    this.add({
      id: crypto.randomUUID?.() || `notif-${Date.now()}-${Math.random()}`,
      type: 'error',
      message,
      duration: 7000,
      ...options
    });
  }

  warning(message: string, options?: Partial<Notification>) {
    console.log('📢 warning called with:', message);
    this.add({
      id: crypto.randomUUID?.() || `notif-${Date.now()}-${Math.random()}`,
      type: 'warning',
      message,
      duration: 5000,
      ...options
    });
  }

  info(message: string, options?: Partial<Notification>) {
    console.log('📢 info called with:', message);
    this.add({
      id: crypto.randomUUID?.() || `notif-${Date.now()}-${Math.random()}`,
      type: 'info',
      message,
      duration: 4000,
      ...options
    });
  }

  apiError(error: any, fallback?: string) {
    let message = fallback || 'Something went wrong';

    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    }

    this.error(message, {
      title: error?.response?.status ? `Error ${error.response.status}` : 'Error',
      action: error?.response?.status === 401 ? {
        label: 'Login',
        handler: () => window.location.href = '/login'
      } : undefined
    });
  }

  isRegistered() {
    return this._isRegistered;
  }
}

export const notification = new NotificationService();
