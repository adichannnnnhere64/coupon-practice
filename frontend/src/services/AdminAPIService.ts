import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// ============================================================================
// ADMIN TYPE DEFINITIONS
// ============================================================================

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  wallet?: {
    balance: number;
  };
  created_at: string;
  updated_at: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  plan_types_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPlanType {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  category_id: number;
  category?: AdminCategory;
  plans_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPlan {
  id: number;
  name: string;
  description: string | null;
  base_price: number;
  actual_price: number;
  is_active: boolean;
  plan_type_id: number;
  plan_type?: AdminPlanType;
  inventories_count?: number;
  available_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminInventory {
  id: number;
  plan_id: number;
  code: string;
  status: number;
  expires_at: string | null;
  meta_data: Record<string, any> | null;
  plan?: AdminPlan;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_categories: number;
  total_plan_types: number;
  total_plans: number;
  total_coupons: number;
  available_coupons: number;
  sold_coupons: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PrintSettings {
  printer_name: string;
  paper_size: string;
  font_size: string;
  include_qr: boolean;
  include_logo: boolean;
  header_text: string;
  footer_text: string;
}

// ============================================================================
// ADMIN API CLIENT CLASS
// ============================================================================

class AdminApiClient {
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

  private getBaseUrl(): string {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    return `${backendUrl}/api/v1/admin`;
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError): Promise<never> => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse): AxiosResponse => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
        }
        if (error.response?.status === 403) {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
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
  // DASHBOARD
  // ============================================================================

  async getDashboardStats(): Promise<{ data: DashboardStats }> {
    return this.get('/dashboard/stats');
  }

  // ============================================================================
  // USERS
  // ============================================================================

  async getUsers(params?: { page?: number; per_page?: number; search?: string; status?: string }): Promise<PaginatedResponse<AdminUser>> {
    return this.get('/users', { params });
  }

  async getUser(id: number): Promise<{ data: AdminUser }> {
    return this.get(`/users/${id}`);
  }

  async createUser(data: { name: string; email: string; password: string }): Promise<{ data: AdminUser; message: string }> {
    return this.post('/users', data);
  }

  async updateUser(id: number, data: Partial<{ name: string; email: string; password: string }>): Promise<{ data: AdminUser; message: string }> {
    return this.put(`/users/${id}`, data);
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    return this.delete(`/users/${id}`);
  }

  async toggleUserStatus(id: number): Promise<{ data: AdminUser; message: string }> {
    return this.post(`/users/${id}/toggle-status`);
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  async getCategories(params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse<AdminCategory>> {
    return this.get('/categories', { params });
  }

  async getCategory(id: number): Promise<{ data: AdminCategory }> {
    return this.get(`/categories/${id}`);
  }

  async createCategory(data: { name: string; description?: string; is_active?: boolean }): Promise<{ data: AdminCategory; message: string }> {
    return this.post('/categories', data);
  }

  async updateCategory(id: number, data: Partial<{ name: string; description: string; is_active: boolean }>): Promise<{ data: AdminCategory; message: string }> {
    return this.put(`/categories/${id}`, data);
  }

  async deleteCategory(id: number): Promise<{ message: string }> {
    return this.delete(`/categories/${id}`);
  }

  async toggleCategoryStatus(id: number): Promise<{ data: AdminCategory; message: string }> {
    return this.post(`/categories/${id}/toggle-status`);
  }

  // ============================================================================
  // PLAN TYPES
  // ============================================================================

  async getPlanTypes(params?: { page?: number; per_page?: number; search?: string; category_id?: number }): Promise<PaginatedResponse<AdminPlanType>> {
    return this.get('/plan-types', { params });
  }

  async getPlanType(id: number): Promise<{ data: AdminPlanType }> {
    return this.get(`/plan-types/${id}`);
  }

  async createPlanType(data: { name: string; category_id: number; description?: string; icon?: string; is_active?: boolean }): Promise<{ data: AdminPlanType; message: string }> {
    return this.post('/plan-types', data);
  }

  async updatePlanType(id: number, data: Partial<{ name: string; category_id: number; description: string; icon: string; is_active: boolean }>): Promise<{ data: AdminPlanType; message: string }> {
    return this.put(`/plan-types/${id}`, data);
  }

  async deletePlanType(id: number): Promise<{ message: string }> {
    return this.delete(`/plan-types/${id}`);
  }

  async togglePlanTypeStatus(id: number): Promise<{ data: AdminPlanType; message: string }> {
    return this.post(`/plan-types/${id}/toggle-status`);
  }

  // ============================================================================
  // PLANS
  // ============================================================================

  async getPlans(params?: { page?: number; per_page?: number; search?: string; plan_type_id?: number; category_id?: number }): Promise<PaginatedResponse<AdminPlan>> {
    return this.get('/plans', { params });
  }

  async getPlan(id: number): Promise<{ data: AdminPlan }> {
    return this.get(`/plans/${id}`);
  }

  async createPlan(data: { name: string; plan_type_id: number; description?: string; base_price: number; actual_price: number; is_active?: boolean }): Promise<{ data: AdminPlan; message: string }> {
    return this.post('/plans', data);
  }

  async updatePlan(id: number, data: Partial<{ name: string; plan_type_id: number; description: string; base_price: number; actual_price: number; is_active: boolean }>): Promise<{ data: AdminPlan; message: string }> {
    return this.put(`/plans/${id}`, data);
  }

  async deletePlan(id: number): Promise<{ message: string }> {
    return this.delete(`/plans/${id}`);
  }

  async togglePlanStatus(id: number): Promise<{ data: AdminPlan; message: string }> {
    return this.post(`/plans/${id}/toggle-status`);
  }

  // ============================================================================
  // INVENTORY
  // ============================================================================

  async getInventory(params?: { page?: number; per_page?: number; search?: string; plan_id?: number; status?: number }): Promise<PaginatedResponse<AdminInventory>> {
    return this.get('/inventory', { params });
  }

  async getInventoryItem(id: number): Promise<{ data: AdminInventory }> {
    return this.get(`/inventory/${id}`);
  }

  async createInventory(data: { plan_id: number; code: string; status?: number; expires_at?: string }): Promise<{ data: AdminInventory; message: string }> {
    return this.post('/inventory', data);
  }

  async updateInventory(id: number, data: Partial<{ plan_id: number; code: string; status: number; expires_at: string }>): Promise<{ data: AdminInventory; message: string }> {
    return this.put(`/inventory/${id}`, data);
  }

  async deleteInventory(id: number): Promise<{ message: string }> {
    return this.delete(`/inventory/${id}`);
  }

  async bulkImportInventory(data: { plan_id: number; codes: string[]; expires_at?: string; skip_duplicates?: boolean }): Promise<{ message: string; imported: number; skipped: number }> {
    return this.post('/inventory/bulk-import', data);
  }

  async bulkDeleteInventory(ids: number[]): Promise<{ message: string; deleted: number }> {
    return this.post('/inventory/bulk-delete', { ids });
  }

  // ============================================================================
  // REPORTS
  // ============================================================================

  async getSalesReport(params?: { page?: number; per_page?: number; from_date?: string; to_date?: string }): Promise<PaginatedResponse<any>> {
    return this.get('/reports/sales', { params });
  }

  async getWalletTransactions(params?: { page?: number; per_page?: number; from_date?: string; to_date?: string; type?: string }): Promise<PaginatedResponse<any>> {
    return this.get('/reports/wallet-transactions', { params });
  }

  async getRevenueReport(params?: { from_date?: string; to_date?: string }): Promise<{ data: any }> {
    return this.get('/reports/revenue', { params });
  }

  async getUserReport(params?: { page?: number; per_page?: number; from_date?: string; to_date?: string }): Promise<PaginatedResponse<any>> {
    return this.get('/reports/users', { params });
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  async getSettings(): Promise<{ data: Record<string, any> }> {
    return this.get('/settings');
  }

  async updateSettings(data: Record<string, any>): Promise<{ data: Record<string, any>; message: string }> {
    return this.put('/settings', data);
  }

  async getPrintSettings(): Promise<{ data: PrintSettings }> {
    return this.get('/settings/print');
  }

  async updatePrintSettings(data: Partial<PrintSettings>): Promise<{ data: PrintSettings; message: string }> {
    return this.put('/settings/print', data);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const adminApiClient = new AdminApiClient();

export default adminApiClient;
export { adminApiClient };
