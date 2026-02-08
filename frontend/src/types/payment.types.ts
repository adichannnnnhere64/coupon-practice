// types/payment.types.ts

export interface PaymentGateway {
  id: number;
  name: string;
  driver: string;
  display_name: string;
  description: string;
  icon: string;
  is_external: boolean;
  config?: {
    public_key?: string;
    webhook_secret?: string;
    client_id?: string;
    client_secret?: string;
    mode?: string;
  };
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  type: 'card' | 'bank_account';
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  message?: string;
  data: {
    requires_action?: boolean;
    redirect_url?: string;
    payment_reference?: string;
    action_data?: {
      client_secret?: string;
      stripe_config?: {
        public_key?: string;
      };
      approval_url?: string;
      order_id?: string;
      type?: string;
    };
    payment_id?: string;
  };
}

export interface TransactionResponse {
  success: boolean;
  message?: string;
  data: {
    transaction_id: string | number;
    amount: number;
    currency: string;
    status: string;
    created_at?: string;
  };
}

export interface PaymentVerificationData {
  payment_reference: string;
  gateway: string;
  transaction_id?: string | number;
}

export interface User {
  id: string | number;
  email: string;
  name: string;
  wallet_balance?: string;
  metadata?: Record<string, any>;
}

// Stripe types
declare global {
  interface Window {
    Stripe?: any;
  }
}

export interface StripeCardElement {
  mount: (element: HTMLElement) => void;
  unmount: () => void;
  on: (event: string, handler: (event: any) => void) => void;
  update: (options: any) => void;
}

export interface StripeElements {
  create: (elementType: string, options?: any) => any;
  getElement: (elementType: string) => any;
}

export interface StripeInstance {
  elements: (options?: any) => StripeElements;
  confirmCardPayment: (
    clientSecret: string,
    data?: {
      payment_method?: string | {
        card: any;
        billing_details?: {
          name?: string;
          email?: string;
        };
      };
      return_url?: string;
    }
  ) => Promise<{
    error?: { message: string };
    paymentIntent?: { id: string; status: string };
  }>;
  createPaymentMethod: (
    options: {
      type: string;
      card: any;
      billing_details?: {
        email?: string;
      };
    }
  ) => Promise<{
    error?: { message: string };
    paymentMethod?: { id: string };
  }>;
}

export interface PaymentMethodComponentProps {
  userEmail: string;
  onMethodSelected?: (methodId: string) => void;
  showAddButton?: boolean;
  onPaymentMethodAdded?: () => void;
  gatewayConfig?: {
    public_key?: string;
  };
}
