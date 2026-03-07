// src/utils/RouteName.ts
export const RouteName = {
  WELCOME: '/',
  PRODUCTS: '/products',

  LOGIN: '/login',
  REGISTER: '/register',
  ACCOUNT: '/account',

  // Category hierarchy navigation
  CATEGORY: '/category/:categoryId',
  PLAN_TYPE: '/operator/:productId',

  PRODUCT: '/product/:productId',
  CHECKOUT: '/checkout/:productId',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:orderId',
  CREDIT: '/credit',
  THANKYOU: '/thankyou',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_USERS: '/admin/users',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_PLAN_TYPES: '/admin/plan-types',
  ADMIN_PLANS: '/admin/plans',
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_PRINT_SETTINGS: '/admin/print-settings',
  ADMIN_SETTINGS: '/admin/settings',
};

// Helper function to generate category URL
export const getCategoryUrl = (categoryId: number): string => `/category/${categoryId}`;

// Helper function to generate plan type URL
export const getPlanTypeUrl = (planTypeId: number): string => `/operator/${planTypeId}`;

// Helper function to generate checkout URL
export const getCheckoutUrl = (planId: number): string => `/checkout/${planId}`;
