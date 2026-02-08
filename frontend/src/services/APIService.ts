import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
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
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

// Auth Types
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  token_type: string;
  expires_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  wallet_balance: string;
  created_at: string;
  updated_at: string;
}

// Plan Type
export interface PlanType {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  available_coupons_count?: number;
  created_at?: string;
  updated_at?: string;
}

// Plan
export interface Plan {
  id: number;
  plan_type_id: number;
  operator_id?: number;
  name: string;
  description: string | null;
  base_price: number;
  actual_price: number;
  is_active: boolean;
  discount_percentage?: number;
  validity_days?: number;
  attributes?: PlanAttribute[];
  plan_type?: PlanType;
  media?: Media[];
  stock_summary?: StockSummary;
  created_at?: string;
  updated_at?: string;
}

export interface PlanAttribute {
  id: number;
  name: string;
  value: string | number | boolean;
}

export interface Media {
  id: number;
  url: string;
  thumb_url: string;
  name: string;
  size: number;
  mime_type: string;
}

export interface StockSummary {
  total: number;
  available: number;
}

export interface InventoryItem {
  id: number;
  plan_id: number;
  coupon_code: string;
  is_available: boolean;
  sold_at: string | null;
  expires_at: string | null;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = this.getBaseUrl();
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Determine base URL based on environment
   */
  private getBaseUrl(): string {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    return `${backendUrl}/api/v1`;
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add platform header if Tauri
        if (this.isTauri()) {
          config.headers['X-Platform'] = 'tauri';
        }

        return config;
      },
      (error: AxiosError): Promise<never> => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response:AxiosResponse): AxiosResponse => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuth();
          // window.location.href = '/login';
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          console.error('Rate limit exceeded. Please try again later.');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if running in Tauri
   */
  private isTauri(): boolean {
    return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
  }

  /**
   * Get auth token from localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Save auth token
   */
  private saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear auth data
   */
  private clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  // ============================================================================
  // CORE HTTP METHODS
  // ============================================================================

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.post<ApiResponse<AuthResponse>>('/register', data);
    this.saveToken(response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.post<ApiResponse<AuthResponse>>('/login', data);
    this.saveToken(response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.post('/logout');
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Get current user
   */
  async me(): Promise<User> {
    const response = await this.get<ApiResponse<User>>('/me');
    return response.data;
  }

  // ============================================================================
  // PLAN TYPE ENDPOINTS
  // ============================================================================

  /**
   * Get all plan types
   */
  async getPlanTypes(params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<PlanType>> {
    return await this.get<PaginatedResponse<PlanType>>('/plan-types', { params });
  }

  /**
   * Get single plan type
   */
  async getPlanType(id: number): Promise<PlanType> {
    const response = await this.get<ApiResponse<PlanType>>(`/plan-types/${id}`);
    return response.data;
  }

  /**
   * Get plans for a plan type
   */
  async getPlansByType(
    planTypeId: number,
    params?: {
      page?: number;
      per_page?: number;
      is_active?: boolean;
    }
  ): Promise<PaginatedResponse<Plan>> {
    return await this.get<PaginatedResponse<Plan>>(
      `/plan-types/${planTypeId}/plans`,
      { params }
    );
  }

  // ============================================================================
  // PLAN ENDPOINTS
  // ============================================================================

  /**
   * Get all plans
   */
  async getPlans(params?: {
    page?: number;
    per_page?: number;
    plan_type_id?: number;
    is_active?: boolean;
    min_price?: number;
    max_price?: number;
    search?: string; 
  }): Promise<PaginatedResponse<Plan>> {
    return await this.get<PaginatedResponse<Plan>>('/plans', { params });
  }

  /**
   * Get single plan
   */
  async getPlan(id: number): Promise<Plan> {
    const response = await this.get<ApiResponse<Plan>>(`/plans/${id}`);
    return response.data;
  }

  /**
   * Get plan inventory
   */
  async getPlanInventory(
    planId: number,
    params?: {
      page?: number;
      per_page?: number;
      available?: boolean;
    }
  ): Promise<PaginatedResponse<InventoryItem>> {
    return await this.get<PaginatedResponse<InventoryItem>>(
      `/plans/${planId}/inventory`,
      { params }
    );
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get stored user
   */
  getUser(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Search plans
   */
  async searchPlans(query: string, params?: {
    plan_type_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Plan>> {
    return await this.getPlans({
      ...params,
      search: query
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const apiClient = new ApiClient();

export default apiClient;
export { apiClient };
