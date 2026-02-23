// hooks/useProtectedRoute.ts
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '@services/useApi';
import { useNotification } from '@services/useNotification';

interface ProtectedRouteOptions {
  redirectTo?: string;
  errorMessage?: string;
  showNotification?: boolean;
  replace?: boolean; // use replace vs push
  checkAuth?: () => boolean; // custom auth check
  onRedirect?: () => void; // callback before redirect
}

// hooks/useProtectedRoute.ts
export const useProtectedRoute = (options: ProtectedRouteOptions = {}) => {
  const {
    redirectTo = '/',
    errorMessage = 'You need to be logged in to access this page',
    showNotification = true,
    replace = true,
    checkAuth,
    onRedirect
  } = options;

  const history = useHistory();
  const { isAuthenticated, user,  loading } = useAuth(); // Assuming useAuth has isLoading
  const notif = useNotification();
  const [isChecking, setIsChecking] = useState(true);
  const [redirectReason, setRedirectReason] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    const isAuthorized = checkAuth ? checkAuth() : isAuthenticated;

    if (!isAuthorized) {
      setRedirectReason(errorMessage);
      setShouldRedirect(true);
    } else {
      setIsChecking(false);
      setRedirectReason(null);
      setShouldRedirect(false);
    }
  }, [isAuthenticated, loading, checkAuth, errorMessage]);

  // Handle redirect separately
  useEffect(() => {
    if (shouldRedirect) {
      if (showNotification && errorMessage) {
        notif.error(errorMessage);
      }

      if (onRedirect) {
        onRedirect();
      }

      if (replace) {
        history.replace(redirectTo);
      } else {
        history.push(redirectTo);
      }
    }
  }, [shouldRedirect, redirectTo, errorMessage, showNotification, replace, onRedirect]);

  return {
    isAuthenticated,
    isChecking: isChecking || loading,
    redirectReason,
    user
  };
};
