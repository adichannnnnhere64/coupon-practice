import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute, Link, redirect, useNavigate, useSearch, } from '@tanstack/react-router';
import { useState } from 'react';
// import { useAuthStore } from '@/stores/useAuthStore';
import { useCouponStore, } from '../../../stores/useCouponStore';
import { useAuthStore } from '../../../stores/useAuthStore';
const CheckoutPage = () => {
    const navigate = useNavigate();
    const search = useSearch({
        from: '/_authenticated/checkout/',
    });
    const { user } = useAuthStore();
    const { purchaseCoupon, isPurchasing } = useCouponStore();
    const [step, setStep] = useState('details');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [couponTransaction, setCouponTransaction] = useState(null);
    const [error, setError] = useState(null);
    // ✅ REAL DATA FROM SEARCH PARAMS
    const couponId = search.couponId;
    const amount = search.amount || 0;
    const planName = search.planName || 'Standard';
    const planData = search.planData || '2GB';
    const planSpeed = search.planSpeed || '50Mbps';
    // Get real wallet balance from user
    const walletBalance = user?.data?.wallet?.balance ?? user?.wallet?.balance ?? 0;
    // Check if wallet has sufficient balance
    // const hasSufficientBalance = walletBalance >= amount;
    const hasSufficientBalance = walletBalance >= amount;
    const handlePaymentMethodSelect = (method) => {
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
        }
        catch (error) {
            console.error('Purchase error:', error);
            setError(error.response?.data?.message ||
                error.message ||
                'Payment failed. Please try again.');
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
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12", children: _jsx("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "text-center space-y-8", children: [_jsx("div", { className: "mx-auto w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center", children: _jsx("svg", { className: "w-16 h-16 text-emerald-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [_jsx("h1", { className: "text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent", children: "Payment Successful!" }), _jsx("p", { className: "text-xl text-gray-600 leading-relaxed", children: "Your mobile recharge coupon has been purchased successfully!" }), _jsx("div", { className: "bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl p-8 border border-emerald-200/30 backdrop-blur-sm", children: _jsxs("div", { className: "grid md:grid-cols-2 gap-8", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-emerald-800 mb-4", children: "Order Details" }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Plan:" }), _jsx("span", { className: "font-medium", children: planName })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Code:" }), _jsx("span", { className: "font-mono bg-emerald-100 px-3 py-1 rounded-full", children: couponTransaction.coupon_code })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Operator:" }), _jsx("span", { className: "font-medium", children: couponTransaction.operator })] }), _jsxs("div", { className: "flex justify-between pt-3 border-t", children: [_jsx("span", { className: "font-semibold", children: "Total Paid:" }), _jsxs("span", { className: "text-2xl font-bold text-emerald-700", children: ["$", couponTransaction.amount] })] }), _jsxs("div", { className: "flex justify-between pt-2", children: [_jsx("span", { children: "Status:" }), _jsx("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800", children: couponTransaction.status })] })] })] }), _jsx("div", { className: "text-center", children: _jsx("div", { className: "w-24 h-24 mx-auto rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-200/50", children: _jsx("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/20", children: _jsx("span", { className: "font-mono text-2xl font-bold text-white/80", children: couponTransaction.coupon_code }) }) }) })] }) })] }), _jsx("div", { className: "flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto", children: _jsx(Link, { to: "/", className: "btn btn-primary btn-lg flex-1 h-14 text-lg", children: "Continue Shopping" }) })] }) }) }));
    }
    // If no coupon data, redirect back
    if (!couponId || !amount) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50", children: _jsxs("div", { className: "text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl", children: [_jsx("div", { className: "w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center", children: _jsx("svg", { className: "w-12 h-12 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }), _jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Missing Order Details" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Please select a coupon from the product page first." }), _jsx(Link, { to: "/", className: "btn btn-primary w-full h-12", children: "Back to Products" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-6 lg:py-12", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("button", { onClick: () => navigate({ to: '/' }), className: "btn btn-ghost btn-lg flex items-center gap-3", children: [_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 1024 1024", className: "w-5 h-5", children: [_jsx("path", { fill: "currentColor", d: "M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" }), _jsx("path", { fill: "currentColor", d: "m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" })] }), "Back to Product"] }), _jsx("div", { className: "text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent", children: "Secure Checkout" })] }), error && (_jsxs("div", { className: "alert alert-error mb-6 shadow-lg", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }), _jsx("span", { children: error })] })), _jsx("div", { className: "flex justify-center mb-8", children: _jsxs("div", { className: "flex items-center gap-6", children: [_jsxs("div", { className: `flex items-center gap-2 ${step !== 'details' ? 'text-primary' : 'text-gray-500'}`, children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step !== 'details'
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-200 text-gray-600'}`, children: "1" }), _jsx("span", { className: "hidden sm:block font-medium", children: "Order Details" })] }), _jsx("div", { className: "w-12 h-1 bg-gradient-to-r from-primary/30 to-secondary/30" }), _jsxs("div", { className: `flex items-center gap-2 ${step === 'payment-methods' || step === 'processing' ? 'text-primary' : 'text-gray-500'}`, children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step === 'payment-methods' || step === 'processing'
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-200 text-gray-600'}`, children: "2" }), _jsx("span", { className: "hidden sm:block font-medium", children: "Payment" })] })] }) }), _jsxs("div", { className: "grid lg:grid-cols-3 gap-8 lg:gap-12", children: [_jsx("div", { className: "lg:col-span-2 space-y-6", children: _jsxs("div", { className: "bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Order Summary" }), _jsxs("div", { className: "flex items-center gap-6 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-primary/20", children: [_jsx("div", { className: "relative w-24 h-24 rounded-xl overflow-hidden shadow-lg", children: _jsx("div", { className: "w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center", children: _jsx("span", { className: "font-mono text-lg font-bold text-white/80", children: "COUPON" }) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-xl font-bold text-gray-900 truncate", children: "Mobile Recharge Coupon" }), _jsx("p", { className: "text-sm text-gray-600 mt-1 truncate", children: planName }), _jsxs("p", { className: "text-xs text-gray-500 mt-2", children: ["Coupon ID:", ' ', _jsxs("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded-md", children: ["#", couponId] })] }), _jsxs("p", { className: "text-sm text-gray-600 mt-2 flex flex-wrap gap-4", children: [_jsx("span", { className: "font-mono", children: planData }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: planSpeed })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-3xl font-bold text-primary", children: ["$", amount] }), _jsx("div", { className: "mt-2 text-sm text-gray-500", children: "Exclusive price" }), _jsx("div", { className: "mt-1 text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full inline-block", children: "Limited time offer" })] })] })] }) }), _jsx("div", { className: "lg:col-span-1 space-y-6", children: _jsxs("div", { className: "bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8 sticky top-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 mb-6", children: step === 'details'
                                            ? 'Choose Payment Method'
                                            : 'Payment Summary' }), step === 'details' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("button", { onClick: () => handlePaymentMethodSelect('paypal'), className: "w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 border-gray-200 hover:border-primary/40 group", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center", children: _jsx("svg", { className: "w-5 h-5 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z", clipRule: "evenodd" }) }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "PayPal" }), _jsx("p", { className: "text-sm text-gray-600", children: "Safe and secure online payments" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-lg font-bold text-primary", children: ["$", amount] }), _jsx("svg", { className: "w-5 h-5 text-primary group-hover:rotate-180 transition-transform duration-300", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })] })] }), _jsxs("button", { onClick: () => handlePaymentMethodSelect('wallet'), disabled: !hasSufficientBalance, className: `
                      w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-300 group
                      ${hasSufficientBalance
                                                    ? 'border-gray-200 hover:border-emerald-400 hover:shadow-emerald/10'
                                                    : 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'}`, children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center", children: _jsx("svg", { className: "w-5 h-5 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" }) }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Wallet Balance" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["$", walletBalance.toLocaleString(), " available"] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-lg font-bold text-emerald-600", children: ["$", amount] }), _jsx("svg", { className: "w-5 h-5 text-emerald-600 group-hover:rotate-180 transition-transform duration-300", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })] })] }), _jsxs("button", { onClick: () => handlePaymentMethodSelect('stripe'), className: "w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple/10 border-gray-200 hover:border-purple-400 group", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center", children: _jsx("svg", { className: "w-5 h-5 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 110-2 1 1 0 010 2zm7-1a1 1 0 10-2 0 1 1 0 002 0zm2-3a1 1 0 110 2 1 1 0 010-2z", clipRule: "evenodd" }) }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Card (Stripe)" }), _jsx("p", { className: "text-sm text-gray-600", children: "Visa, MasterCard, Amex" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-lg font-bold text-purple-600", children: ["$", amount] }), _jsx("svg", { className: "w-5 h-5 text-purple-600 group-hover:rotate-180 transition-transform duration-300", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })] })] })] })), step === 'payment-methods' && selectedPaymentMethod && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20", children: [_jsxs("span", { className: "font-semibold text-primary", children: ["Selected:", ' ', selectedPaymentMethod === 'paypal'
                                                                ? 'PayPal'
                                                                : selectedPaymentMethod === 'wallet'
                                                                    ? 'Wallet Balance'
                                                                    : 'Credit/Debit Card'] }), _jsx("button", { onClick: handleBackToDetails, className: "btn btn-ghost btn-sm", children: "Change" })] }), _jsx("button", { onClick: handleProceedToPayment, disabled: isPurchasing, className: "btn btn-success w-full btn-lg h-14 text-lg font-bold", children: isPurchasing ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "loading loading-spinner loading-sm" }), "Processing Payment..."] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) }), "Pay $", amount, " Now"] })) })] })), step === 'processing' && (_jsxs("div", { className: "space-y-6 text-center", children: [_jsx("div", { className: "mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center", children: _jsx("span", { className: "loading loading-spinner loading-lg text-primary" }) }), _jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-900", children: "Processing your payment..." }), _jsx("p", { className: "text-gray-600", children: "Please wait while we process your payment securely." })] }), _jsx("div", { className: "flex justify-center", children: _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "w-2 h-2 bg-primary/30 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-primary/50 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-primary rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }) })] })), _jsxs("div", { className: "pt-6 border-t border-gray-200/50", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "Order Summary" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm", children: "Subtotal:" }), _jsxs("span", { className: "font-semibold", children: ["$", amount] })] }), _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "Discount:" }), _jsx("span", { className: "text-emerald-600", children: "Applied" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm", children: "Tax (0%):" }), _jsx("span", { className: "font-semibold", children: "$0" })] }), _jsx("hr", { className: "border-gray-200 my-3" }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-lg font-bold", children: "Total:" }), _jsxs("span", { className: "text-2xl font-bold text-primary", children: ["$", amount] })] })] })] })] }) })] })] }) }));
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
    validateSearch: (search) => {
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
