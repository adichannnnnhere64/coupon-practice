// src/stores/useCouponStore.ts
import { create } from 'zustand';
import { api } from '../lib/api-client';
export const useCouponStore = create(set => ({
    isPurchasing: false,
    purchaseCoupon: async (couponId, paymentMethod) => {
        set({ isPurchasing: true });
        try {
            const response = await api.post('/coupons/purchase', {
                coupon_id: couponId,
                payment_method: paymentMethod,
            });
            return response.data;
        }
        catch (error) {
            console.error('Purchase failed:', error);
            // Extract error message from Laravel validation
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                if (errors && Object.keys(errors).length > 0) {
                    const firstError = Object.values(errors)[0][0];
                    throw new Error(firstError);
                }
                throw new Error('Validation failed');
            }
            throw new Error(error.response?.data?.message || 'Purchase failed');
        }
        finally {
            set({ isPurchasing: false });
        }
    },
}));
