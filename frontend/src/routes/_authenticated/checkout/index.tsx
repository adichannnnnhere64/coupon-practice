// routes/_authenticated/checkout/index.tsx
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Shield, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { fetchOperatorById, fetchPlanById } from '../../../lib/api-client';

export const Route = createFileRoute('/_authenticated/checkout/')({
  component: CheckoutPage,
});

function CheckoutPage() {
  const search = useSearch({
    from: '/_authenticated/checkout/',
  });

  const { planId, operatorId } = search;
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [operator, setOperator] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'paypal'>('card');

  useEffect(() => {
    const fetchData = async () => {
      if (!planId) {
        navigate({ to: '/' });
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        if (operatorId) {
          const operatorData = await fetchOperatorById(Number(operatorId));
          setOperator(operatorData);
        }

        if (planId) {
          const planData = await fetchPlanById(Number(planId));
          setPlan(planData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load plan details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [planId, operatorId, navigate]);

  const handleCheckout = async () => {
    if (!planId || !plan) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to success page
      navigate({
        to: '/success',
        search: {
          planName: plan.name,
          amount: plan.actual_price,
          orderId: `ORD-${Date.now()}`,
        },
      });
    } catch (error) {
      console.error('Checkout failed:', error);
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const displayAmount = plan?.actual_price || 0;
  const finalAmount = displayAmount.toFixed(2);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: -1 })}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            <div className="w-20"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Steps - Mobile Optimized */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-indigo-600">Cart</span>
            </div>
            <div className="flex-1 h-1 bg-indigo-200 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2">
                <span className="text-sm font-semibold">2</span>
              </div>
              <span className="text-xs font-medium text-gray-900">Checkout</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2">
                <span className="text-sm font-semibold">3</span>
              </div>
              <span className="text-xs font-medium text-gray-500">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Plan Details */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                {operator?.logo && (
                  <img
                    src={operator.logo}
                    alt={operator.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{plan?.name || 'Plan'}</h3>
                  <p className="text-sm text-gray-600 mt-1">{operator?.name || 'Operator'}</p>
                  {plan?.description && (
                    <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-600">₱{finalAmount}</div>
                  {plan?.discount_percentage && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      Save {plan.discount_percentage}%
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                  >
                    <CreditCard className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-indigo-600' : 'text-gray-600'}`}>Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'wallet' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                  >
                    <div className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'wallet' ? 'text-indigo-600' : 'text-gray-400'}`}>
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${paymentMethod === 'wallet' ? 'text-indigo-600' : 'text-gray-600'}`}>Wallet</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'paypal' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                  >
                    <div className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'paypal' ? 'text-indigo-600' : 'text-gray-400'}`}>
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.081.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.522 0-.97.382-1.052.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-1.646-1.174-4.11-1.04-5.274-1.04h-4.88c-.327 0-.625.24-.662.562l-1.584 10.04a.459.459 0 0 0 .454.526h3.175c.327 0 .625-.24.662-.562l.542-3.435a.662.662 0 0 1 .662-.562h1.585c3.24 0 5.705-1.155 6.546-4.5.225-.963.3-1.808.163-2.508z"/>
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${paymentMethod === 'paypal' ? 'text-indigo-600' : 'text-gray-600'}`}>PayPal</span>
                  </button>
                </div>
              </div>

              {/* Order Breakdown */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">Order Breakdown</h3>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Plan Price</span>
                  <span className="font-medium">₱{finalAmount}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-indigo-600">₱{finalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Badges */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-green-500" />
                <h3 className="font-semibold text-gray-900">Secure Payment</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-sm">🔒</span>
                  </div>
                  <span className="text-sm text-gray-600">SSL Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm">✓</span>
                  </div>
                  <span className="text-sm text-gray-600">Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-600">24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 text-sm">↩️</span>
                  </div>
                  <span className="text-sm text-gray-600">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Checkout Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Complete Purchase</h3>
                <p className="text-sm text-gray-600">Review and confirm your payment</p>
              </div>

              <div className="space-y-6">
                {/* Total Amount */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Due</span>
                    <span className="text-3xl font-bold text-indigo-600">₱{finalAmount}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Including all taxes and fees</p>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      Processing...
                    </div>
                  ) : (
                    `Pay ₱${finalAmount}`
                  )}
                </button>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center">
                  By completing your purchase, you agree to our{' '}
                  <a href="#" className="text-indigo-600 hover:underline">Terms</a>
                  {' '}and{' '}
                  <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
                </p>

                {/* Support */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center mb-3">Need help?</p>
                  <a
                    href="mailto:support@example.com"
                    className="block text-center text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
