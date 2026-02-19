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
};

// Helper function to generate category URL
export const getCategoryUrl = (categoryId: number): string => `/category/${categoryId}`;

// Helper function to generate plan type URL
export const getPlanTypeUrl = (planTypeId: number): string => `/operator/${planTypeId}`;

// Helper function to generate checkout URL
export const getCheckoutUrl = (planId: number): string => `/checkout/${planId}`;
