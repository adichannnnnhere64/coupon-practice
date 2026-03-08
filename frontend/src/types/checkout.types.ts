// Checkout Step Types
export type CheckoutStep = 1 | 2 | 3;
export type PaymentMethodType = 'credits' | 'external';

// Delivery Method
export interface DeliveryMethod {
  id: number;
  name: string;
  display_name: string;
  type: 'email' | 'sms' | 'webhook' | 'api' | 'manual';
  is_active: boolean;
  is_default?: boolean;
  sort_order?: number;
}

// Plan Type
export interface CheckoutPlanType {
  id: number;
  plan_type_id: number;
  name: string;
  description: string;
  base_price: number;
  actual_price: number;
  is_active: boolean;
  discount_percentage: number;
  meta_data: string;
  delivery_methods?: DeliveryMethod[];
}

// Operator
export interface CheckoutOperator {
  id: number;
  name: string;
  description: string;
  image: string;
}

// Purchase Result (for receipt)
export interface PurchaseResult {
  couponCode: string;
  couponCodes?: string[];
  transactionId: number | null;
  deliveryMethodType: 'email' | 'sms' | 'webhook' | 'api' | 'manual' | null;
}

// Checkout State
export interface CheckoutState {
  currentStep: CheckoutStep;
  paymentMethod: PaymentMethodType;
  selectedGateway: string;
  selectedPaymentMethodId: string;
  selectedDeliveryMethodId: number | null;
  transactionId: number | null;
  error: string;
  isProcessing: boolean;
  showConfirmation: boolean;
  showSuccess: boolean;
  showReceiptModal: boolean;
  purchaseResult: PurchaseResult | null;
}

// Step validation result
export interface StepValidation {
  isValid: boolean;
  errorMessage?: string;
}

// Context actions
export interface CheckoutActions {
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: CheckoutStep) => void;
  canGoToStep: (step: CheckoutStep) => boolean;

  // State setters
  setPaymentMethod: (method: PaymentMethodType) => void;
  setSelectedGateway: (gateway: string) => void;
  setSelectedPaymentMethodId: (id: string) => void;
  setSelectedDeliveryMethodId: (id: number | null) => void;
  setError: (error: string) => void;
  setIsProcessing: (processing: boolean) => void;

  // Validation
  validateCurrentStep: () => StepValidation;
  canProceed: () => boolean;

  // Payment handlers
  handleCheckout: () => Promise<void>;
  handleConfirmPurchase: () => Promise<void>;
}

// Combined context value
export interface CheckoutContextValue extends CheckoutState, CheckoutActions {
  // Plan data
  plan: CheckoutPlanType | null;
  operator: CheckoutOperator | null;
  deliveryMethods: DeliveryMethod[];
  hasDeliveryMethods: boolean;

  // User data
  userCredits: number;
  hasEnoughCredits: boolean;
  totalPrice: number;

  // Gateways
  gateways: any[];
  gatewaysLoading: boolean;

  // Alerts
  setShowConfirmation: (show: boolean) => void;
  setShowSuccess: (show: boolean) => void;
  setShowReceiptModal: (show: boolean) => void;
  handleSuccessClose: () => void;
  handleReceiptClose: () => void;
}

// Session storage key
export const CHECKOUT_STORAGE_KEY = 'checkout_state';

// Persisted state (for session recovery)
export interface PersistedCheckoutState {
  currentStep: CheckoutStep;
  paymentMethod: PaymentMethodType;
  selectedGateway: string;
  selectedPaymentMethodId: string;
  selectedDeliveryMethodId: number | null;
  planId: number;
  timestamp: number;
}
