import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { LoginData, RegisterData } from '@services/APIService';

// Query Keys
export const queryKeys = {
  categories: ['categories'] as const,
  category: (id: number) => ['category', id] as const,
  categoryPlanTypes: (id: number) => ['categoryPlanTypes', id] as const,
  planTypes: (params?: object) => ['planTypes', params] as const,
  planType: (id: number) => ['planType', id] as const,
  plans: (params?: object) => ['plans', params] as const,
  plan: (id: number) => ['plan', id] as const,
  plansByType: (id: number, params?: object) => ['plansByType', id, params] as const,
  planInventory: (id: number) => ['planInventory', id] as const,
  user: ['user'] as const,
  paymentGateways: ['paymentGateways'] as const,
  orders: (params?: object) => ['orders', params] as const,
  order: (id: number) => ['order', id] as const,
};

// ============================================================================
// CATEGORY HOOKS
// ============================================================================

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const response = await apiClient.getCategories();
      return response.data;
    },
  });
}

export function useCategoryQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.category(id!),
    queryFn: () => apiClient.getCategory(id!),
    enabled: !!id,
  });
}

export function useCategoryPlanTypesQuery(categoryId: number | null) {
  return useQuery({
    queryKey: queryKeys.categoryPlanTypes(categoryId!),
    queryFn: () => apiClient.getCategoryPlanTypes(categoryId!),
    enabled: !!categoryId,
    select: (data) => ({
      category: data.category,
      planTypes: data.plan_types,
    }),
  });
}

// ============================================================================
// PLAN TYPE HOOKS
// ============================================================================

export function usePlanTypesQuery(params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: queryKeys.planTypes(params),
    queryFn: () => apiClient.getPlanTypes(params),
  });
}

export function usePlanTypeQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.planType(id!),
    queryFn: () => apiClient.getPlanType(id!),
    enabled: !!id,
  });
}

// ============================================================================
// PLAN HOOKS
// ============================================================================

interface PlansQueryParams {
  page?: number;
  per_page?: number;
  plan_type_id?: number;
  category_id?: number;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort_by?: 'name' | 'actual_price' | 'base_price' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export function usePlansQuery(params?: PlansQueryParams) {
  return useQuery({
    queryKey: queryKeys.plans(params),
    queryFn: () => apiClient.getPlans(params),
    placeholderData: (previousData) => previousData,
  });
}

export function usePlanQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.plan(id!),
    queryFn: () => apiClient.getPlan(id!),
    enabled: !!id,
  });
}

export function usePlansByTypeQuery(
  planTypeId: number | null,
  params?: { page?: number; per_page?: number; is_active?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.plansByType(planTypeId!, params),
    queryFn: () => apiClient.getPlansByType(planTypeId!, params),
    enabled: !!planTypeId,
  });
}

export function usePlanInventoryCheck(planId: number) {
  return useQuery({
    queryKey: queryKeys.planInventory(planId),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          in_stock: boolean;
          available_stock: number;
          is_low_stock: boolean;
          is_out_of_stock: boolean;
          inventory_enabled: boolean;
        };
      }>(`/plans/${planId}/inventory/check`);
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds for inventory data
  });
}

// ============================================================================
// AUTH HOOKS
// ============================================================================

export function useUserQuery() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => apiClient.me(),
    enabled: apiClient.isAuthenticated(),
    staleTime: 1000 * 60, // 1 minute
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginData) => apiClient.login(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user, data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => apiClient.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user, data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.user, null);
      queryClient.clear();
    },
  });
}

// ============================================================================
// PAYMENT HOOKS
// ============================================================================

export function usePaymentGatewaysQuery() {
  return useQuery({
    queryKey: queryKeys.paymentGateways,
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: any[] }>('/payment/gateways');
      if (response.success && response.data) {
        return response.data.filter(gateway => {
          const isActive = gateway.is_active === undefined ? true : Boolean(gateway.is_active);
          const isNotInternal = gateway.name !== 'internal';
          const isExternal = Boolean(gateway.is_external);
          return isActive && isNotInternal && isExternal;
        });
      }
      return [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ============================================================================
// ORDER HOOKS
// ============================================================================

interface OrdersQueryParams {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  sort?: string;
}

export function useOrdersQuery(params?: OrdersQueryParams) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => apiClient.get<any>('/orders', { params }),
    enabled: apiClient.isAuthenticated(),
  });
}

export function useOrderQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.order(id!),
    queryFn: () => apiClient.get<any>(`/orders/${id}`),
    enabled: !!id && apiClient.isAuthenticated(),
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateOrders: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
    invalidateUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.user }),
    invalidatePlans: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}
