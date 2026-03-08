import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@services/APIService';
import { useAuth } from '@services/useApi';
import { usePaymentGatewaysQuery, queryKeys } from '@hooks/useQueries';
import { useNotification } from '@services/useNotification';
import { RouteName } from '@utils/RouteName';
import {
  CheckoutStep,
  PaymentMethodType,
  CheckoutPlanType,
  CheckoutOperator,
  DeliveryMethod,
  CheckoutContextValue,
  StepValidation,
  CHECKOUT_STORAGE_KEY,
  PersistedCheckoutState,
  PurchaseResult,
} from '@models/checkout.types';
import { TransactionResponse, PaymentResponse } from '@models/payment.types';

interface LocationState {
  plan?: CheckoutPlanType;
  operator?: CheckoutOperator;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export const useCheckout = (): CheckoutContextValue => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
};

interface CheckoutProviderProps {
  children: React.ReactNode;
}

export const CheckoutProvider: React.FC<CheckoutProviderProps> = ({ children }) => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const { productId } = useParams<{ productId: string }>();
  const planIdNum = parseInt(productId || '0');
  const notif = useNotification();
  const { user, refreshUser } = useAuth();

  // Step state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);

  // UI state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('credits');
  const [selectedGateway, setSelectedGateway] = useState('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [transactionId, setTransactionId] = useState<number | null>(null);

  // Delivery state
  const [selectedDeliveryMethodId, setSelectedDeliveryMethodId] = useState<number | null>(null);

  // Operator state
  const [operator, setOperator] = useState<CheckoutOperator | null>(location.state?.operator || null);

  // Fetch plan data
  const planQuery = useQuery({
    queryKey: queryKeys.plan(planIdNum),
    queryFn: () => apiClient.getPlan(planIdNum),
    enabled: !!productId,
  });

  const plan: CheckoutPlanType | null = planQuery.data ? {
    id: planQuery.data.id,
    plan_type_id: planQuery.data.plan_type_id,
    name: planQuery.data.name,
    description: planQuery.data.description || '',
    base_price: planQuery.data.base_price,
    actual_price: planQuery.data.actual_price,
    is_active: planQuery.data.is_active,
    discount_percentage: planQuery.data.discount_percentage || 0,
    meta_data: '',
    delivery_methods: planQuery.data.delivery_methods || [],
  } : location.state?.plan || null;

  // Delivery methods
  const deliveryMethods: DeliveryMethod[] = plan?.delivery_methods || [];
  const hasDeliveryMethods = deliveryMethods.length > 0;

  // Fetch operator data
  useEffect(() => {
    if (planQuery.data?.plan_type_id && !operator) {
      apiClient.getPlanType(planQuery.data.plan_type_id).then((data) => {
        setOperator({
          id: data.id,
          name: data.name,
          description: data.description || '',
          image: '',
        });
      });
    }
  }, [planQuery.data?.plan_type_id, operator]);

  // Fetch payment gateways
  const gatewaysQuery = usePaymentGatewaysQuery();
  const gateways = gatewaysQuery.data || [];
  const gatewaysLoading = gatewaysQuery.isLoading;

  // Set default gateway when gateways load
  useEffect(() => {
    if (gateways.length > 0 && !selectedGateway) {
      const stripeGateway = gateways.find((g: any) => g.name === 'stripe');
      setSelectedGateway(stripeGateway ? 'stripe' : gateways[0].name);
    }
  }, [gateways, selectedGateway]);

  // Set default delivery method when plan loads
  useEffect(() => {
    if (deliveryMethods.length > 0 && !selectedDeliveryMethodId) {
      const defaultMethod = deliveryMethods.find(m => m.is_default) || deliveryMethods[0];
      setSelectedDeliveryMethodId(defaultMethod.id);
    }
  }, [deliveryMethods, selectedDeliveryMethodId]);

  // User balance calculations
  const userCredits = parseFloat(user?.wallet_balance || '0');
  const totalPrice = plan?.actual_price || 0;
  const hasEnoughCredits = userCredits >= totalPrice;

  // Session storage persistence
  useEffect(() => {
    if (plan?.id) {
      const storedState = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (storedState) {
        try {
          const parsed: PersistedCheckoutState = JSON.parse(storedState);
          // Only restore if same plan and less than 30 minutes old
          if (parsed.planId === plan.id && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
            setCurrentStep(parsed.currentStep);
            setPaymentMethod(parsed.paymentMethod);
            setSelectedGateway(parsed.selectedGateway);
            setSelectedPaymentMethodId(parsed.selectedPaymentMethodId);
            setSelectedDeliveryMethodId(parsed.selectedDeliveryMethodId);
          } else {
            sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
          }
        } catch {
          sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        }
      }
    }
  }, [plan?.id]);

  // Persist state on changes
  useEffect(() => {
    if (plan?.id) {
      const stateToStore: PersistedCheckoutState = {
        currentStep,
        paymentMethod,
        selectedGateway,
        selectedPaymentMethodId,
        selectedDeliveryMethodId,
        planId: plan.id,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(stateToStore));
    }
  }, [currentStep, paymentMethod, selectedGateway, selectedPaymentMethodId, selectedDeliveryMethodId, plan?.id]);

  // Step validation
  const validateStep = useCallback((step: CheckoutStep): StepValidation => {
    switch (step) {
      case 1:
        if (paymentMethod === 'credits' && !hasEnoughCredits) {
          return { isValid: false, errorMessage: 'Insufficient wallet balance' };
        }
        if (paymentMethod === 'external') {
          if (!selectedGateway) {
            return { isValid: false, errorMessage: 'Please select a payment gateway' };
          }
          if (selectedGateway === 'stripe' && !selectedPaymentMethodId) {
            return { isValid: false, errorMessage: 'Please select or add a payment method' };
          }
        }
        return { isValid: true };

      case 2:
        if (hasDeliveryMethods && !selectedDeliveryMethodId) {
          return { isValid: false, errorMessage: 'Please select a delivery method' };
        }
        return { isValid: true };

      case 3:
        return { isValid: true };

      default:
        return { isValid: false, errorMessage: 'Invalid step' };
    }
  }, [paymentMethod, hasEnoughCredits, selectedGateway, selectedPaymentMethodId, hasDeliveryMethods, selectedDeliveryMethodId]);

  const validateCurrentStep = useCallback(() => validateStep(currentStep), [validateStep, currentStep]);

  const canProceed = useCallback(() => {
    const validation = validateCurrentStep();
    return validation.isValid;
  }, [validateCurrentStep]);

  const canGoToStep = useCallback((step: CheckoutStep): boolean => {
    // Can always go to step 1
    if (step === 1) return true;

    // For step 2, must have completed step 1
    if (step === 2) {
      const step1Valid = validateStep(1).isValid;
      // If no delivery methods, skip step 2
      if (!hasDeliveryMethods) return step1Valid;
      return step1Valid;
    }

    // For step 3, must have completed steps 1 and 2
    if (step === 3) {
      const step1Valid = validateStep(1).isValid;
      const step2Valid = validateStep(2).isValid;
      return step1Valid && step2Valid;
    }

    return false;
  }, [validateStep, hasDeliveryMethods]);

  // Navigation
  const nextStep = useCallback(() => {
    const validation = validateCurrentStep();
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Please complete this step');
      return;
    }

    setError('');

    if (currentStep === 1) {
      // Skip step 2 if no delivery methods
      if (!hasDeliveryMethods) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  }, [currentStep, validateCurrentStep, hasDeliveryMethods]);

  const prevStep = useCallback(() => {
    setError('');

    if (currentStep === 3) {
      // If no delivery methods, go back to step 1
      if (!hasDeliveryMethods) {
        setCurrentStep(1);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  }, [currentStep, hasDeliveryMethods]);

  const goToStep = useCallback((step: CheckoutStep) => {
    if (step < currentStep || canGoToStep(step)) {
      setError('');
      setCurrentStep(step);
    }
  }, [currentStep, canGoToStep]);

  // Load Stripe helper
  const loadStripe = useCallback(async (publishableKey: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (window.Stripe) {
        resolve(window.Stripe(publishableKey));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => {
        if (window.Stripe) {
          resolve(window.Stripe(publishableKey));
        } else {
          reject(new Error('Stripe failed to load'));
        }
      };
      script.onerror = (err) => {
        reject(new Error(`Failed to load Stripe: ${err}`));
      };
      document.head.appendChild(script);
    });
  }, []);

  // Verify and complete payment
  const verifyAndComplete = useCallback(async (paymentReference: string) => {
    const verificationData = {
      payment_reference: paymentReference,
      gateway: paymentMethod === 'credits' ? 'internal' : selectedGateway,
      transaction_id: transactionId,
    };

    const response = await apiClient.post<PaymentResponse>('/payment/verify', verificationData);

    if (!response.success) {
      notif.error(response.message || 'Payment verification failed');
      throw new Error(response.message || 'Payment verification failed');
    }

    setIsProcessing(false);

    // Clear persisted state
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);

    if (refreshUser) {
      await refreshUser();
    }

    sessionStorage.setItem('refresh_orders', 'true');

    // Check if delivery method is manual - show receipt modal
    const deliveryMethodType = response.data.delivery_method_type;
    const rawCouponCodes = Array.isArray(response.data.coupon_codes) ? response.data.coupon_codes : [];
    const normalizedCouponCodes = rawCouponCodes
      .map((code) => (typeof code === 'string' ? code : (code as { code?: string })?.code))
      .filter((code): code is string => typeof code === 'string' && code.trim().length > 0);
    const couponCode = typeof response.data.coupon_code === 'string'
      ? response.data.coupon_code.trim()
      : (normalizedCouponCodes[0] ?? '');

    if (deliveryMethodType === 'manual' && couponCode) {
      setPurchaseResult({
        couponCode,
        couponCodes: normalizedCouponCodes.length ? normalizedCouponCodes : undefined,
        transactionId,
        deliveryMethodType,
      });
      setShowReceiptModal(true);
    } else {
      setShowSuccess(true);
    }
  }, [paymentMethod, selectedGateway, transactionId, notif, refreshUser]);

  // Stripe payment handler
  const handleStripePayment = useCallback(async (clientSecret: string) => {
    const stripeGateway = gateways.find(g => g.name === 'stripe');
    const publishableKey = stripeGateway?.config?.public_key;

    if (!publishableKey) {
      notif.error('Stripe configuration missing');
      throw new Error('Stripe configuration missing');
    }

    const stripe = await loadStripe(publishableKey);

    if (selectedPaymentMethodId) {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: selectedPaymentMethodId,
          return_url: `${window.location.origin}/payment/success?transaction=${transactionId}`,
        }
      );

      if (error) {
        notif.error(error.message);
        throw new Error(error.message);
      }

      if (paymentIntent?.status === 'succeeded' && paymentIntent.id) {
        await verifyAndComplete(paymentIntent.id);
      } else if (paymentIntent?.status === 'requires_action') {
        const { error: confirmError } = await stripe.handleCardAction(clientSecret);
        if (confirmError) {
          notif.error(confirmError.message);
          throw new Error(confirmError.message);
        }
        await verifyAndComplete(paymentIntent.id);
      } else if (paymentIntent?.status === 'requires_payment_method') {
        notif.error('Payment method is required');
        throw new Error('Payment method is required');
      }
    } else {
      notif.error('No payment method selected');
      throw new Error('No payment method selected');
    }
  }, [gateways, selectedPaymentMethodId, transactionId, loadStripe, verifyAndComplete, notif]);

  // Wallet payment handler
  const handleWalletPayment = useCallback(async () => {
    const paymentData = {
      transaction_id: transactionId,
      gateway: 'internal',
      return_url: `${window.location.origin}/payment/success?transaction=${transactionId}`,
      cancel_url: `${window.location.origin}/payment/cancel?transaction=${transactionId}`,
      description: `Plan Purchase - ${plan?.name}`,
      customer_email: user?.email,
      customer_name: user?.name,
      currency: 'USD',
      metadata: {
        user_id: user?.id,
        type: 'plan_purchase',
        plan_id: plan?.id,
      },
    };

    const response = await apiClient.post<PaymentResponse>('/payment/initiate', paymentData);

    if (!response.success) {
      notif.error(response.message || 'Wallet payment failed');
      throw new Error(response.message || 'Wallet payment failed');
    }

    if (response.data.payment_reference) {
      await verifyAndComplete(response.data.payment_reference);
    } else {
      notif.error('No payment reference returned');
      throw new Error('No payment reference returned');
    }
  }, [transactionId, plan, user, notif, verifyAndComplete]);

  // External payment handler
  const handleExternalPayment = useCallback(async () => {
    const paymentData = {
      transaction_id: transactionId,
      gateway: selectedGateway,
      return_url: `${window.location.origin}/payment/success?transaction=${transactionId}`,
      cancel_url: `${window.location.origin}/payment/cancel?transaction=${transactionId}`,
      description: `Plan Purchase - ${plan?.name}`,
      customer_email: user?.email,
      customer_name: user?.name,
      currency: 'USD',
      metadata: {
        user_id: user?.id,
        type: 'plan_purchase',
        plan_id: plan?.id,
      },
      payment_method_id: selectedPaymentMethodId || undefined,
    };

    const response = await apiClient.post<PaymentResponse>('/payment/initiate', paymentData);

    if (!response.success) {
      notif.error(response.message || 'Payment initiation failed');
      throw new Error(response.message || 'Payment initiation failed');
    }

    if (response.data.action_data?.client_secret) {
      await handleStripePayment(response.data.action_data.client_secret);
      return;
    }

    if (response.data.payment_reference) {
      await verifyAndComplete(response.data.payment_reference);
    } else if (response.data.redirect_url) {
      window.location.href = response.data.redirect_url;
    }
  }, [transactionId, selectedGateway, plan, user, selectedPaymentMethodId, notif, handleStripePayment, verifyAndComplete]);

  // Main checkout handler (creates transaction)
  const handleCheckout = useCallback(async () => {
    if (!user) {
      history.push('/login');
      return;
    }

    const validation = validateStep(1);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Invalid payment selection');
      return;
    }

    if (hasDeliveryMethods) {
      const deliveryValidation = validateStep(2);
      if (!deliveryValidation.isValid) {
        setError(deliveryValidation.errorMessage || 'Please select a delivery method');
        return;
      }
    }

    try {
      setIsProcessing(true);
      setError('');

      const transactionData = {
        amount: totalPrice,
        gateway: paymentMethod === 'credits' ? 'internal' : selectedGateway,
        currency: 'USD',
        description: `Purchase: ${plan?.name}`,
        delivery_method_id: selectedDeliveryMethodId || undefined,
        metadata: {
          purchase_type: 'plan_purchase',
          plan_id: plan?.id,
          operator_id: operator?.id,
          user_email: user.email,
        },
      };

      const transactionResponse = await apiClient.post<TransactionResponse>('/payment/transaction', transactionData);

      if (!transactionResponse.success) {
        notif.error(transactionResponse.message || 'Failed to create transaction');
        throw new Error(transactionResponse.message || 'Failed to create transaction');
      }

      setTransactionId(transactionResponse.data.transaction_id as number);
      setShowConfirmation(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to start purchase process';
      notif.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [user, validateStep, hasDeliveryMethods, totalPrice, paymentMethod, selectedGateway, plan, selectedDeliveryMethodId, operator, notif, history]);

  // Confirm purchase handler
  const handleConfirmPurchase = useCallback(async () => {
    if (!transactionId) {
      setError('Transaction not found');
      return;
    }

    if (paymentMethod === 'external' && selectedGateway === 'stripe' && !selectedPaymentMethodId) {
      setError('Please select or add a payment method');
      return;
    }

    setIsProcessing(true);
    setShowConfirmation(false);

    try {
      if (paymentMethod === 'credits') {
        await handleWalletPayment();
      } else {
        await handleExternalPayment();
      }
    } catch (err: any) {
      setIsProcessing(false);
      const errorMessage = err.response?.data?.message || err.message || 'Purchase failed. Please try again.';
      setError(errorMessage);
      console.error('Purchase failed:', err);
    }
  }, [transactionId, paymentMethod, selectedGateway, selectedPaymentMethodId, handleWalletPayment, handleExternalPayment]);

  // Success close handler
  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    history.push(RouteName.ORDERS, {
      purchase: {
        transaction_id: transactionId,
        amount: totalPrice,
        product_name: plan?.name,
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    });
  }, [history, transactionId, totalPrice, plan?.name]);

  // Receipt modal close handler
  const handleReceiptClose = useCallback(() => {
    setShowReceiptModal(false);
    setPurchaseResult(null);
    history.push(RouteName.ORDERS, {
      purchase: {
        transaction_id: transactionId,
        amount: totalPrice,
        product_name: plan?.name,
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    });
  }, [history, transactionId, totalPrice, plan?.name]);

  // Context value
  const value = useMemo<CheckoutContextValue>(() => ({
    // Step state
    currentStep,

    // UI state
    showConfirmation,
    showSuccess,
    showReceiptModal,
    isProcessing,
    error,
    purchaseResult,

    // Payment state
    paymentMethod,
    selectedGateway,
    selectedPaymentMethodId,
    transactionId,

    // Delivery state
    selectedDeliveryMethodId,

    // Plan data
    plan,
    operator,
    deliveryMethods,
    hasDeliveryMethods,

    // User data
    userCredits,
    hasEnoughCredits,
    totalPrice,

    // Gateways
    gateways,
    gatewaysLoading,

    // Navigation
    nextStep,
    prevStep,
    goToStep,
    canGoToStep,

    // State setters
    setPaymentMethod,
    setSelectedGateway,
    setSelectedPaymentMethodId,
    setSelectedDeliveryMethodId,
    setError,
    setIsProcessing,
    setShowConfirmation,
    setShowSuccess,
    setShowReceiptModal,

    // Validation
    validateCurrentStep,
    canProceed,

    // Payment handlers
    handleCheckout,
    handleConfirmPurchase,
    handleSuccessClose,
    handleReceiptClose,
  }), [
    currentStep,
    showConfirmation,
    showSuccess,
    showReceiptModal,
    isProcessing,
    error,
    purchaseResult,
    paymentMethod,
    selectedGateway,
    selectedPaymentMethodId,
    transactionId,
    selectedDeliveryMethodId,
    plan,
    operator,
    deliveryMethods,
    hasDeliveryMethods,
    userCredits,
    hasEnoughCredits,
    totalPrice,
    gateways,
    gatewaysLoading,
    nextStep,
    prevStep,
    goToStep,
    canGoToStep,
    validateCurrentStep,
    canProceed,
    handleCheckout,
    handleConfirmPurchase,
    handleSuccessClose,
    handleReceiptClose,
  ]);

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

export default CheckoutContext;
