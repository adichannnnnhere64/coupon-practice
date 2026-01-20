// src/stores/useCouponStore.ts
import { create } from 'zustand';
import { api } from '../lib/api-client';

export interface CouponTransaction {
  id: number;
  amount: number;
  status: string;
  coupon_code: string;
  operator: string;
  denomination: string;
  purchased_at: string;
  delivered_at?: string;
}

interface CouponState {
  isPurchasing: boolean;
  purchaseCoupon: (
    couponId: number,
    paymentMethod: 'wallet' | 'stripe' | 'paypal'
  ) => Promise<CouponTransaction>;
}

interface LaravelValidationErrors {
  [key: string]: string[];
}

export const useCouponStore = create<CouponState>(set => ({
  isPurchasing: false,

  purchaseCoupon: async (couponId: number, paymentMethod: string) => {
    set({ isPurchasing: true });
    try {
      const response = await api.post('/coupons/purchase', {
        coupon_id: couponId,
        payment_method: paymentMethod,
      });
      return response.data as CouponTransaction;
    } catch (error: any) {
      console.error('Purchase failed:', error);

      // Extract error message from Laravel validation
      if (error.response?.status === 422) {
        const errors = error.response.data.errors as
          | LaravelValidationErrors
          | undefined;
        if (errors && Object.keys(errors).length > 0) {
          const firstError = Object.values(errors)[0][0];
          throw new Error(firstError);
        }
        throw new Error('Validation failed');
      }

      throw new Error(error.response?.data?.message || 'Purchase failed');
    } finally {
      set({ isPurchasing: false });
    }
  },
}));
