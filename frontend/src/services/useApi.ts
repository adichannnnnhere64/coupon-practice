import { useState, useEffect, useCallback } from 'react';
import apiClient, {
  PlanType,
  Plan,
  User,
  PaginatedResponse,
  // AuthResponse,
  LoginData,
  RegisterData,
} from './APIService';

// ============================================================================
// TYPES
// ============================================================================

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UsePaginatedApiState<T> {
  data: T[];
  meta: PaginatedResponse<T>['meta'] | null;
  links: PaginatedResponse<T>['links'] | null;
  loading: boolean;
  error: Error | null;
}

const authChangeListeners = new Set<() => void>();

const notifyAuthChange = () => {
  authChangeListeners.forEach(listener => listener());
};

// ============================================================================
// AUTH HOOKS
// ============================================================================

/**
 * Hook for user authentication state
 */

export function useAuth() {
  const [user, setUser] = useState<User | null>(apiClient.getUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const listener = () => {
      setUser(apiClient.getUser());
    };
    authChangeListeners.add(listener);
    return () => {
      authChangeListeners.delete(listener);
    };
  }, []);

  // Auto-refresh user data on mount if authenticated
  useEffect(() => {
    const refreshUserData = async () => {
      if (apiClient.isAuthenticated()) {
        try {
          const userData = await apiClient.me();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (err) {
          console.error('Failed to refresh user data:', err);
        }
      }
    };

    refreshUserData();
  }, []);

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.login(data);
      setUser(response.user);
      notifyAuthChange();
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.register(data);
      setUser(response.user);
      notifyAuthChange();
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiClient.logout();
      setUser(null);
      notifyAuthChange();
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      setLoading(true);
      const userData = await apiClient.me();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      notifyAuthChange(); // Notify all components
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated: apiClient.isAuthenticated(),
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
  };
}

// ============================================================================
// PLAN TYPE HOOKS
// ============================================================================

/**
 * Hook to fetch all plan types
 */
export function usePlanTypes(params?: { page?: number; per_page?: number }) {
  const [state, setState] = useState<UsePaginatedApiState<PlanType>>({
    data: [],
    meta: null,
    links: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await apiClient.getPlanTypes(params);
        
        if (!cancelled) {
          setState({
            data: response.data,
            meta: response.meta,
            links: response.links,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err as Error,
          }));
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [params?.page, params?.per_page]);

  return state;
}

/**
 * Hook to fetch a single plan type
 */
export function usePlanType(id: number | null) {
  const [state, setState] = useState<UseApiState<PlanType>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const data = await apiClient.getPlanType(id);
        
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ data: null, loading: false, error: err as Error });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}

// ============================================================================
// PLAN HOOKS
// ============================================================================

/**
 * Hook to fetch plans with filters
 */
export function usePlans(params?: {
  page?: number;
  per_page?: number;
  plan_type_id?: number;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
}) {
  const [state, setState] = useState<UsePaginatedApiState<Plan>>({
    data: [],
    meta: null,
    links: null,
    loading: true,
    error: null,
  });

  const [filters, setFilters] = useState(params);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await apiClient.getPlans(filters);
        
        if (!cancelled) {
          setState({
            data: response.data,
            meta: response.meta,
            links: response.links,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err as Error,
          }));
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [
    filters?.page,
    filters?.per_page,
    filters?.plan_type_id,
    filters?.is_active,
    filters?.min_price,
    filters?.max_price,
  ]);

  const updateFilters = useCallback((newFilters: typeof params) => {
    setFilters(newFilters);
  }, []);

  return { ...state, updateFilters };
}

/**
 * Hook to fetch a single plan
 */
export function usePlan(id: number | null) {
  const [state, setState] = useState<UseApiState<Plan>>({
    data: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!id) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await apiClient.getPlan(id);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const data = await apiClient.getPlan(id);
        
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ data: null, loading: false, error: err as Error });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { ...state, refresh };
}

/**
 * Hook to fetch plans by plan type
 */
export function usePlansByType(
  planTypeId: number | null,
  params?: { page?: number; per_page?: number; is_active?: boolean }
) {
  const [state, setState] = useState<UsePaginatedApiState<Plan>>({
    data: [],
    meta: null,
    links: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!planTypeId) {
      setState({ data: [], meta: null, links: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await apiClient.getPlansByType(planTypeId, params);
        
        if (!cancelled) {
          setState({
            data: response.data,
            meta: response.meta,
            links: response.links,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err as Error,
          }));
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [planTypeId, params?.page, params?.per_page, params?.is_active]);

  return state;
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Generic hook for any API call
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [apiCall]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const data = await apiCall();
        
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ data: null, loading: false, error: err as Error });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { ...state, execute };
}
