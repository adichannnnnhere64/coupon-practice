// frontend/src/lib/api-client.ts
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface CouponImage {
  id: number;
  url: string; // /storage/1/01KB51R6EC9H7ZBH65KAB90VRK.png
  thumbnail: string; // /storage/1/conversions/01KB51R6EC9H7ZBH65KAB90VRK-thumbnail.jpg
  name: string;
}

export interface Coupon {
  id: number;
  selling_price: {
    amount: string;
    currency: string;
    formatted: string;
  };
  denomination: {
    amount: string;
    currency: string;
    formatted: string;
  };
  coupon_code: string;
  validity_days: number;
  is_available: boolean;
  images: CouponImage[]; // ✅ Added images array
  created_at: string;
  updated_at: string;
  operator: {
    id: number;
    name: string;
    code: string;
    logo_url: string | null;
    country: {
      id: number;
      name: string;
      code: string;
      currency: string;
    };
  };
  plan_type: {
    id: number;
    name: string;
    description: string;
  };
}

export interface Operator {
  id: number;
  name: string;
  code: string;
  logo: string | null;
  country: {
    id: number;
    name: string;
    code: string;
  };
  has_data_plans: boolean;
  has_talktime: boolean;
  plan_types?: PlanType[]; // ← optional + array
}


export interface PlanType {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  available_coupons_count: number;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: PaginationLink[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

class ApiClient {
  private client: AxiosInstance;
  private isTauri: boolean;

  constructor() {
    this.isTauri =
      typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
    this.client = axios.create({
      baseURL: this.getBaseUrl(),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    this.setupInterceptors();
  }

  private getBaseUrl(): string {
    if (this.isTauri) {
      return 'https://coupon-finalz.ddev.site/api/v1';
    }
    return 'https://coupon-finalz.ddev.site/api/v1';
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (this.isTauri) {
          config.headers['X-Platform'] = 'tauri';
        }
        return config;
      },
      error => Promise.reject(error)
    );
    // Response interceptor
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ✅ PUBLIC METHODS - Expose API methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// ✅ Image URL Helper Function
export function getImageUrl(
  imagePath: string | null | undefined,
  type: 'full' | 'thumbnail' = 'full'
): string {
  // ✅ Handle null/undefined
  if (!imagePath) {
    return type === 'full'
      ? '/api/placeholder/400/300'
      : '/api/placeholder/200/150';
  }
  const trimmedPath = imagePath.trim();
  // ✅ SMART LOGIC: Check if URL is already complete
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    console.log(`✅ getImageUrl: Already full URL: ${trimmedPath}`);
    return trimmedPath; // ✅ Return as-is
  }
  // ✅ Clean relative path
  let cleanPath = trimmedPath;
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  // ✅ Platform detection
  const isTauri =
    typeof window !== 'undefined' &&
    (window as any).__TAURI__ !== undefined &&
    (window as any).__TAURI__.platform !== undefined;
  console.log(`🔍 getImageUrl - isTauri: ${isTauri}, Path: "${cleanPath}"`);
  if (isTauri) {
    return `https://coupon-finalz.ddev.site/dashboard${cleanPath}`;
  }
  // Web: Relative path
  return cleanPath;
}

// ✅ Get first available image for a coupon
export function getCouponImage(coupon: Coupon | null | undefined): string {
  if (!coupon?.images?.[0]?.url) {
    console.log('⚠️ getCouponImage: No images, using placeholder');
    return '/api/placeholder/400/300';
  }
  const rawPath = coupon.images[0].url.trim();
  // ✅ SMART LOGIC: Check if already full URL
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    console.log(
      `✅ getCouponImage(${coupon.id}): Already full URL: ${rawPath}`
    );
    return rawPath;
  }
  console.log(`🔍 getCouponImage(${coupon.id}): Raw path = "${rawPath}"`);
  // Use getImageUrl for consistent logic
  const finalUrl = getImageUrl(rawPath);
  console.log(`✅ getCouponImage(${coupon.id}): Final URL = "${finalUrl}"`);
  return finalUrl;
}

// ✅ Fetch single coupon
export async function fetchCouponById(id: number): Promise<Coupon | null> {
  try {
    console.log(`🔍 Fetching coupon ${id}...`);
    const response = await apiClient.get<{ data: Coupon }>(`/coupons/${id}`);
    const coupon = response.data; // ✅ Extract .data like fetchCoupons
    console.log('✅ Coupon fetched:', coupon.coupon_code);
    console.log('✅ Images count:', coupon.images?.length || 0);
    return coupon;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(`Coupon ${id} not found`);
      return null;
    }
    console.error('fetchCouponById error:', error);
    return null;
  }
}

// ✅ NEW: Fetch operators by country
export async function fetchOperatorsByCountry(
  countryId: number
): Promise<PaginatedResponse<Operator>> {
  try {
    const response = await apiClient.get<PaginatedResponse<Operator>>(
      `/plan-types`
    );
        console.log(response);
    return response;
  } catch (error) {
    console.error(`fetchOperatorsByCountry error for ID ${countryId}:`, error);
    throw error;
  }
}

// ✅ NEW: Fetch single operator with plan types
export async function fetchOperatorById(id: number): Promise<Operator | null> {
  try {
    const response = await apiClient.get<{ data: Operator }>(`/operators/${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(`Operator ${id} not found`);
      return null;
    }
    console.error('fetchOperatorById error:', error);
    return null;
  }
}

// ✅ NEW: Fetch popular operators
export async function fetchPopularOperators(
  limit = 12
): Promise<PaginatedResponse<Operator>> {
  try {
    const response = await apiClient.get<PaginatedResponse<Operator>>(
      `/plan-types?limit=${limit}`
    );
    return response;
  } catch (error) {
    console.error('fetchPopularOperators error:', error);
    throw error;
  }
}

// ✅ NEW: Fetch plan types for operator (if needed as standalone)
export async function fetchPlanTypesForOperator(
  operatorId: number
): Promise<PaginatedResponse<PlanType>> {
  try {
    const response = await apiClient.get<PaginatedResponse<PlanType>>(
      `/operators/${operatorId}/plan-types`
    );
    return response;
  } catch (error) {
    console.error(`fetchPlanTypesForOperator error for ID ${operatorId}:`, error);
    throw error;
  }
}

// ✅ Updated fetchCoupons with filters
export async function fetchCoupons(
  page: number = 1,
  filters?: {
    operator_id?: number;
    plan_type_id?: number;
    search?: string;
  }
): Promise<PaginatedResponse<Coupon>> {
  const params = new URLSearchParams({ page: page.toString() });
  if (filters) {
    if (filters.operator_id) params.append('operator_id', filters.operator_id.toString());
    if (filters.plan_type_id) params.append('plan_type_id', filters.plan_type_id.toString());
    if (filters.search) params.append('search', filters.search);
  }
  return apiClient.get<PaginatedResponse<Coupon>>(`/coupons?${params.toString()}`);
}

// ✅ Also add error handling utility
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    return null;
  }
}

const apiClient = new ApiClient();

// ✅ Export public API methods for convenience
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  fetchCoupons,
  fetchOperatorsByCountry,
  fetchOperatorById,
  fetchPopularOperators,
  fetchPlanTypesForOperator,
};

export { apiClient };
