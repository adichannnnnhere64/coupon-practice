// hooks/useNotification.ts
import { useCallback } from 'react';
import { notification } from '../lib/notification';

export const useNotification = () => {
  const success = useCallback((message: string, options?: any) => {
    notification.success(message, options);
  }, []);

  const error = useCallback((message: string, options?: any) => {
    notification.error(message, options);
  }, []);

  const warning = useCallback((message: string, options?: any) => {
    notification.warning(message, options);
  }, []);

  const info = useCallback((message: string, options?: any) => {
    notification.info(message, options);
  }, []);

  const apiError = useCallback((err: any, msg?: string) => {
    notification.apiError(err, msg);
  }, []);

  return { success, error, warning, info, apiError };
};
