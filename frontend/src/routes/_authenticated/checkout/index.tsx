import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { useState } from 'react';
// import { useAuthStore } from '@/stores/useAuthStore';
import {
  useCouponStore,
  type CouponTransaction,
} from '../../../stores/useCouponStore';
import { useAuthStore } from '../../../stores/useAuthStore';
// import { useCouponStore, type CouponTransaction } from '@/stores/useCouponStore';

interface CheckoutSearchParams {
  couponId: number;
  planId: string;
  amount: number;
  planName: string;
  planData: string;
  planSpeed: string;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const search = useSearch({
    from: '/_authenticated/checkout/',
  }) as CheckoutSearchParams;

  const { user } = useAuthStore();
  const { purchaseCoupon, isPurchasing } = useCouponStore();

  const [step, setStep] = useState<
    'details' | 'payment-methods' | 'processing' | 'success'
  >('details');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'paypal' | 'wallet' | 'stripe' | null
  >(null);
  const [couponTransaction, setCouponTransaction] =
    useState<CouponTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ REAL DATA FROM SEARCH PARAMS
  const couponId = search.couponId;
  const amount = search.amount || 0;
  const planName = search.planName || 'Standard';
  const planData = search.planData || '2GB';
  const planSpeed = search.planSpeed || '50Mbps';

  // Get real wallet balance from user
  const walletBalance =
    user?.data?.wallet?.balance ?? user?.wallet?.balance ?? 0;

  // Check if wallet has sufficient balance
  // const hasSufficientBalance = walletBalance >= amount;
  const hasSufficientBalance = walletBalance >= amount;

  const handlePaymentMethodSelect = (
    method: 'paypal' | 'wallet' | 'stripe'
  ) => {
    if (method === 'wallet' && !hasSufficientBalance) {
      setError('Insufficient wallet balance');
      return;
    }

    setSelectedPaymentMethod(method);
    setStep('payment-methods');
    setError(null);
  };

  const handleProceedToPayment = async () => {
    if (!selectedPaymentMethod || !couponId) {
      setError('Missing coupon information');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      // ✅ CALL REAL API WITH COUPON ID
      const transaction = await purchaseCoupon(couponId, selectedPaymentMethod);
      setCouponTransaction(transaction);
      setStep('success');

      // Clear search params on success
      navigate({});
    } catch (error: any) {
      console.error('Purchase error:', error);
      setError(
        error.response?.data?.message ||
          error.message ||
          'Payment failed. Please try again.'
      );
      setStep('payment-methods');
    }
  };

  const handleBackToDetails = () => {
    setSelectedPaymentMethod(null);
    setStep('details');
    setError(null);
  };

  // SUCCESS PAGE
  if (step === 'success' && couponTransaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="mx-auto w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="max-w-3xl mx-auto space-y-6">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Payment Successful!
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your mobile recharge coupon has been purchased successfully!
              </p>
              <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl p-8 border border-emerald-200/30 backdrop-blur-sm">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-emerald-800 mb-4">
                      Order Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Plan:</span>
                        <span className="font-medium">{planName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Code:</span>
                        <span className="font-mono bg-emerald-100 px-3 py-1 rounded-full">
                          {couponTransaction.coupon_code}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Operator:</span>
                        <span className="font-medium">
                          {couponTransaction.operator}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t">
                        <span className="font-semibold">Total Paid:</span>
                        <span className="text-2xl font-bold text-emerald-700">
                          ${couponTransaction.amount}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span>Status:</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {couponTransaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-200/50">
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                        <span className="font-mono text-2xl font-bold text-white/80">
                          {couponTransaction.coupon_code}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
              <Link
                to="/"
                className="btn btn-primary btn-lg flex-1 h-14 text-lg"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no coupon data, redirect back
  if (!couponId || !amount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Missing Order Details
          </h1>
          <p className="text-gray-600 mb-8">
            Please select a coupon from the product page first.
          </p>
          <Link to="/" className="btn btn-primary w-full h-12">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-6 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="btn btn-ghost btn-lg flex items-center gap-3"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 1024 1024"
              className="w-5 h-5"
            >
              <path
                fill="currentColor"
                d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
              />
              <path
                fill="currentColor"
                d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
              />
            </svg>
            Back to Product
          </button>
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Secure Checkout
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6 shadow-lg">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Steps Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-6">
            <div
              className={`flex items-center gap-2 ${step !== 'details' ? 'text-primary' : 'text-gray-500'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step !== 'details'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                1
              </div>
              <span className="hidden sm:block font-medium">Order Details</span>
            </div>
            <div className="w-12 h-1 bg-gradient-to-r from-primary/30 to-secondary/30"></div>
            <div
              className={`flex items-center gap-2 ${step === 'payment-methods' || step === 'processing' ? 'text-primary' : 'text-gray-500'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step === 'payment-methods' || step === 'processing'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
              <span className="hidden sm:block font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Order Details - REAL DATA */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>
              <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-primary/20">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-lg">
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <span className="font-mono text-lg font-bold text-white/80">
                      COUPON
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    Mobile Recharge Coupon
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {planName}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Coupon ID:{' '}
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md">
                      #{couponId}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-2 flex flex-wrap gap-4">
                    <span className="font-mono">{planData}</span>
                    <span>•</span>
                    <span>{planSpeed}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    ${amount}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Exclusive price
                  </div>
                  <div className="mt-1 text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full inline-block">
                    Limited time offer
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods & Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {step === 'details'
                  ? 'Choose Payment Method'
                  : 'Payment Summary'}
              </h2>

              {step === 'details' && (
                <div className="space-y-4">
                  {/* PayPal */}
                  <button
                    onClick={() => handlePaymentMethodSelect('paypal')}
                    className="w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 border-gray-200 hover:border-primary/40 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">PayPal</h3>
                        <p className="text-sm text-gray-600">
                          Safe and secure online payments
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        ${amount}
                      </span>
                      <svg
                        className="w-5 h-5 text-primary group-hover:rotate-180 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Wallet */}
                  <button
                    onClick={() => handlePaymentMethodSelect('wallet')}
                    disabled={!hasSufficientBalance}
                    className={`
                      w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-300 group
                      ${
                        hasSufficientBalance
                          ? 'border-gray-200 hover:border-emerald-400 hover:shadow-emerald/10'
                          : 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Wallet Balance
                        </h3>
                        <p className="text-sm text-gray-600">
                          ${walletBalance.toLocaleString()} available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-emerald-600">
                        ${amount}
                      </span>
                      <svg
                        className="w-5 h-5 text-emerald-600 group-hover:rotate-180 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Stripe */}
                  <button
                    onClick={() => handlePaymentMethodSelect('stripe')}
                    className="w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple/10 border-gray-200 hover:border-purple-400 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 110-2 1 1 0 010 2zm7-1a1 1 0 10-2 0 1 1 0 002 0zm2-3a1 1 0 110 2 1 1 0 010-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Card (Stripe)
                        </h3>
                        <p className="text-sm text-gray-600">
                          Visa, MasterCard, Amex
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-purple-600">
                        ${amount}
                      </span>
                      <svg
                        className="w-5 h-5 text-purple-600 group-hover:rotate-180 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              )}

              {step === 'payment-methods' && selectedPaymentMethod && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <span className="font-semibold text-primary">
                      Selected:{' '}
                      {selectedPaymentMethod === 'paypal'
                        ? 'PayPal'
                        : selectedPaymentMethod === 'wallet'
                          ? 'Wallet Balance'
                          : 'Credit/Debit Card'}
                    </span>
                    <button
                      onClick={handleBackToDetails}
                      className="btn btn-ghost btn-sm"
                    >
                      Change
                    </button>
                  </div>
                  <button
                    onClick={handleProceedToPayment}
                    disabled={isPurchasing}
                    className="btn btn-success w-full btn-lg h-14 text-lg font-bold"
                  >
                    {isPurchasing ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Pay ${amount} Now
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === 'processing' && (
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Processing your payment...
                    </h3>
                    <p className="text-gray-600">
                      Please wait while we process your payment securely.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="flex gap-4">
                      <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary - Always Visible */}
              <div className="pt-6 border-t border-gray-200/50">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal:</span>
                    <span className="font-semibold">${amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span className="text-emerald-600">Applied</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tax (0%):</span>
                    <span className="font-semibold">$0</span>
                  </div>
                  <hr className="border-gray-200 my-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${amount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// In your route file
export const Route = createFileRoute('/_authenticated/checkout/')({
  beforeLoad: async () => {
    const { isAuthenticated, checkAuth } = useAuthStore.getState();
    if (!isAuthenticated) {
      await checkAuth();
      throw redirect({ to: '/login' });
    }
  },
  component: CheckoutPage,
  validateSearch: (search: Record<string, unknown>): CheckoutSearchParams => {
    return {
      couponId: Number(search.couponId) || 0,
      planId: String(search.planId || ''),
      amount: Number(search.amount) || 0,
      planName: String(search.planName || ''),
      planData: String(search.planData || ''),
      planSpeed: String(search.planSpeed || ''),
    };
  },
});
