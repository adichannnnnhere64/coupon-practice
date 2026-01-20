// frontend/src/lib/api-client.ts
import axios from 'axios';
class ApiClient {
    client;
    isTauri;
    constructor() {
        this.isTauri =
            typeof window !== 'undefined' && window.__TAURI__ !== undefined;
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
    getBaseUrl() {
        if (this.isTauri) {
            return 'https://coupon-finalz.ddev.site/dashboard/api';
        }
        return 'https://coupon-finalz.ddev.site/dashboard/api';
    }
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(config => {
            // Add auth token if available
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            if (this.isTauri) {
                config.headers['X-Platform'] = 'tauri';
            }
            return config;
        }, error => Promise.reject(error));
        // Response interceptor
        this.client.interceptors.response.use(response => response, async (error) => {
            if (error.response?.status === 401) {
                // Handle token refresh or logout
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        });
    }
    // ✅ PUBLIC METHODS - Expose API methods
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data;
    }
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data;
    }
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data;
    }
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data;
    }
}
// ✅ Image URL Helper Function
export function getImageUrl(imagePath, type = 'full') {
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
    const isTauri = typeof window !== 'undefined' &&
        window.__TAURI__ !== undefined &&
        window.__TAURI__.platform !== undefined;
    console.log(`🔍 getImageUrl - isTauri: ${isTauri}, Path: "${cleanPath}"`);
    if (isTauri) {
        return `https://coupon-finalz.ddev.site/dashboard${cleanPath}`;
    }
    // Web: Relative path
    return cleanPath;
}
// ✅ Get first available image for a coupon
export function getCouponImage(coupon) {
    if (!coupon?.images?.[0]?.url) {
        console.log('⚠️ getCouponImage: No images, using placeholder');
        return '/api/placeholder/400/300';
    }
    const rawPath = coupon.images[0].url.trim();
    // ✅ SMART LOGIC: Check if already full URL
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
        console.log(`✅ getCouponImage(${coupon.id}): Already full URL: ${rawPath}`);
        return rawPath;
    }
    console.log(`🔍 getCouponImage(${coupon.id}): Raw path = "${rawPath}"`);
    // Use getImageUrl for consistent logic
    const finalUrl = getImageUrl(rawPath);
    console.log(`✅ getCouponImage(${coupon.id}): Final URL = "${finalUrl}"`);
    return finalUrl;
}
// ✅ Fetch single coupon
export async function fetchCouponById(id) {
    try {
        console.log(`🔍 Fetching coupon ${id}...`);
        const response = await apiClient.get(`/coupons/${id}`);
        const coupon = response.data; // ✅ Extract .data like fetchCoupons
        console.log('✅ Coupon fetched:', coupon.coupon_code);
        console.log('✅ Images count:', coupon.images?.length || 0);
        return coupon;
    }
    catch (error) {
        if (error.response?.status === 404) {
            console.warn(`Coupon ${id} not found`);
            return null;
        }
        console.error('fetchCouponById error:', error);
        return null;
    }
}
// ✅ NEW: Fetch operators by country
export async function fetchOperatorsByCountry(countryId) {
    try {
        const response = await apiClient.get(`/operators/country/${countryId}`);
        return response;
    }
    catch (error) {
        console.error(`fetchOperatorsByCountry error for ID ${countryId}:`, error);
        throw error;
    }
}
// ✅ NEW: Fetch single operator with plan types
export async function fetchOperatorById(id) {
    try {
        const response = await apiClient.get(`/operators/${id}`);
        return response.data;
    }
    catch (error) {
        if (error.response?.status === 404) {
            console.warn(`Operator ${id} not found`);
            return null;
        }
        console.error('fetchOperatorById error:', error);
        return null;
    }
}
// ✅ NEW: Fetch popular operators
export async function fetchPopularOperators(limit = 12) {
    try {
        const response = await apiClient.get(`/operators/popular?limit=${limit}`);
        return response;
    }
    catch (error) {
        console.error('fetchPopularOperators error:', error);
        throw error;
    }
}
// ✅ NEW: Fetch plan types for operator (if needed as standalone)
export async function fetchPlanTypesForOperator(operatorId) {
    try {
        const response = await apiClient.get(`/operators/${operatorId}/plan-types`);
        return response;
    }
    catch (error) {
        console.error(`fetchPlanTypesForOperator error for ID ${operatorId}:`, error);
        throw error;
    }
}
// ✅ Updated fetchCoupons with filters
export async function fetchCoupons(page = 1, filters) {
    const params = new URLSearchParams({ page: page.toString() });
    if (filters) {
        if (filters.operator_id)
            params.append('operator_id', filters.operator_id.toString());
        if (filters.plan_type_id)
            params.append('plan_type_id', filters.plan_type_id.toString());
        if (filters.search)
            params.append('search', filters.search);
    }
    return apiClient.get(`/coupons?${params.toString()}`);
}
// ✅ Also add error handling utility
export async function apiRequest(url, options = {}) {
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
        return (await response.json());
    }
    catch (error) {
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
