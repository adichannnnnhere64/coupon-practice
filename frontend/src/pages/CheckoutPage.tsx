import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonIcon,
  IonAlert,
  IonLoading,
  IonChip,
  IonBadge,
  IonSpinner,
  IonRadio,
  IonRadioGroup,
} from '@ionic/react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import {
  wallet,
  checkmarkCircle,
  cash,
  shieldCheckmark,
  informationCircle,
  timeOutline,
  pricetagOutline,
  cardOutline,
  warning,
} from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import './CheckoutPage.scss';
import apiClient from '@services/APIService';
import { RouteName } from '@utils/RouteName';
import PaymentMethodComponent from '@components/PaymentMethodComponent';
import { useAuth } from '@services/useApi';
import { useProtectedRoute } from '@services/useProtectedRoute';
import { PageHeader } from '@components/ui';
import { usePaymentGatewaysQuery, queryKeys } from '@hooks/useQueries';
import { useNotification } from '@services/useNotification';

interface PlanType {
  id: number;
  plan_type_id: number;
  name: string;
  description: string;
  base_price: number;
  actual_price: number;
  is_active: boolean;
  discount_percentage: number;
  meta_data: string;
}

interface Operator {
  id: number;
  name: string;
  description: string;
  image: string;
}

interface LocationState {
  plan?: PlanType;
  operator?: Operator;
}

interface TransactionResponse {
  success: boolean;
  message: string;
  data: {
    transaction_id: number;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  };
}

interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    payment_reference: string;
    requires_action: boolean;
    redirect_url?: string;
    action_data?: {
      client_secret?: string;
      payment_method?: string;
      status?: string;
    };
  };
}

const CheckoutPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const { productId } = useParams<{ productId: string }>();
  const planIdNum = parseInt(productId || '0');
   const notif = useNotification();

  // UI state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credits' | 'external'>('credits');
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(location.state?.operator || null);

  // Auth hooks
  const { user, refreshUser } = useAuth();

  const { isChecking } = useProtectedRoute({
    redirectTo: '/login',
    errorMessage: 'You need to be logged in to access this page'
  });

  // Fetch plan data with React Query
  const planQuery = useQuery({
    queryKey: queryKeys.plan(planIdNum),
    queryFn: () => apiClient.getPlan(planIdNum),
    enabled: !!productId && !isChecking,
  });

  const plan: PlanType | null = planQuery.data ? {
    id: planQuery.data.id,
    plan_type_id: planQuery.data.plan_type_id,
    name: planQuery.data.name,
    description: planQuery.data.description || '',
    base_price: planQuery.data.base_price,
    actual_price: planQuery.data.actual_price,
    is_active: planQuery.data.is_active,
    discount_percentage: planQuery.data.discount_percentage || 0,
    meta_data: '',
  } : location.state?.plan || null;

  const loading = planQuery.isLoading;

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

  // Fetch payment gateways with React Query
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

  const userCredits = parseFloat(user?.wallet_balance || '0');
  const totalPrice = plan?.actual_price || 0;
  const hasEnoughCredits = userCredits >= totalPrice;

  const paymentMethods = [
    {
      id: 'credits',
      name: 'Wallet Balance',
      icon: wallet,
      description: `Available: $${userCredits.toFixed(2)}`,
      disabled: !hasEnoughCredits,
    },
    {
      id: 'external',
      name: 'Credit/Debit Card',
      icon: cardOutline,
      description: 'Pay with external payment',
      disabled: gateways.length === 0,
    },
  ];

  const handleCheckout = async () => {
    if (!user) {
      history.push('/login');
      return;
    }

    if (paymentMethod === 'credits' && !hasEnoughCredits) {
      setError('Insufficient wallet balance. Please add funds or use external payment.');
      return;
    }

    if (paymentMethod === 'external') {
      if (!selectedGateway) {
        setError('Please select a payment gateway');
        return;
      }

      if (selectedGateway === 'stripe' && !selectedPaymentMethodId) {
        setError('Please select or add a payment method');
        return;
      }
    }

    try {
      setIsProcessing(true);
      setError('');

      // Create transaction
      const transactionData = {
        amount: totalPrice,
        gateway: paymentMethod === 'credits' ? 'internal' : selectedGateway,
        currency: 'USD',
        description: `Purchase: ${plan?.name}`,
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

      setTransactionId(transactionResponse.data.transaction_id);
      setShowConfirmation(true);


    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start purchase process';
      notif.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPurchase = async () => {
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
    } catch (error: any) {
      setIsProcessing(false);
      const errorMessage = error.response?.data?.message || error.message || 'Purchase failed. Please try again.';
      setError(errorMessage);
      console.error('Purchase failed:', error);
    }
  };

  const handleWalletPayment = async () => {
    try {
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

        notif.success(response.message);
        throw new Error(response.message || 'Wallet payment failed');
      }

      if (response.data.payment_reference) {
        await verifyAndComplete(response.data.payment_reference);
      } else {

        notif.error('No payment reference returned');
        throw new Error('No payment reference returned');
      }

    } catch (error: any) {
      throw error;
    }
  };

  const verifyAndComplete = async (paymentReference: string) => {
    try {
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
      setShowSuccess(true);

      if (refreshUser) {
        await refreshUser();
      }

      sessionStorage.setItem('refresh_orders', 'true');

    } catch (error: any) {
      throw error;
    }
  };

  const handleExternalPayment = async () => {
    try {
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

    } catch (error: any) {
      throw error;
    }
  };

  const handleStripePayment = async (clientSecret: string) => {
    try {
      const stripeGateway = gateways.find(g => g.name === 'stripe');
      const publishableKey = stripeGateway?.config?.public_key;

      if (!publishableKey) {

        notif.error('Stripe configuration missing');
        throw new Error('Stripe configuration missing');
      }

      const stripe = await loadStripe(publishableKey) as any;

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

        notif.error('Payment method is required. Please select a payment method.');
          throw new Error('Payment method is required. Please select a payment method.');
        }
      } else {

        notif.error('No payment method selected');
        throw new Error('No payment method selected');
      }

    } catch (error: any) {
      throw error;
    }
  };

  const loadStripe = async (publishableKey: string): Promise<any> => {
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
      script.onerror = (error) => {
        reject(new Error(`Failed to load Stripe: ${error}`));
      };
      document.head.appendChild(script);
    });
  };

  const handleSuccessClose = () => {
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
  };

  // Conditional returns AFTER all hooks
  if (isChecking) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" />
            <IonLabel style={{ marginLeft: '10px' }}>Checking authentication...</IonLabel>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Loading state for plan data
  if (loading) {
    return (
      <IonPage>
        <PageHeader title="Loading..." defaultHref="/" />
        <IonContent>
          <div className="ion-padding ion-text-center" style={{ marginTop: '50%' }}>
            <IonSpinner name="crescent" />
            <p>Loading checkout...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Plan not found
  if (!plan) {
    return (
      <IonPage>
        <PageHeader title="Plan Not Found" defaultHref="/" />
        <IonContent>
          <div className="ion-padding ion-text-center">
            <h2>Plan not found</h2>
            <IonButton onClick={() => history.push('/')}>Back to Home</IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="checkout-page">
      <PageHeader
        title="Checkout"
        defaultHref={`/operator/${plan.plan_type_id}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: operator?.name || 'Operator', href: `/operator/${plan.plan_type_id}` },
          { label: 'Checkout' },
        ]}
      />

      <IonContent fullscreen>
        {/* Error Message */}
        {error && (
          <div className="ion-padding">
            <IonCard color="danger">
              <IonCardContent>
                <IonIcon icon={warning} slot="start" />
                <IonText color="light">{error}</IonText>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Operator Info (if available) */}
        {operator && (
          <IonCard className="operator-card">
            <IonCardContent>
              <div className="operator-info">
                {operator.image && (
                  <img src={operator.image} alt={operator.name} className="operator-image" />
                )}
                <div>
                  <IonChip color="primary" outline>
                    <IonLabel>{operator.name}</IonLabel>
                  </IonChip>
                  <p className="operator-description">{operator.description}</p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Order Summary */}
        <IonCard className="summary-card">
          <IonCardHeader>
            <IonCardTitle>Order Summary</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem className="product-item">
                <IonLabel>
                  <h2>{plan.name}</h2>
                  <p>{plan.description}</p>
                  {plan.meta_data && (
                    <p className="meta-data">
                      <IonIcon icon={informationCircle} /> {plan.meta_data}
                    </p>
                  )}
                </IonLabel>
              </IonItem>

              {/* Pricing Breakdown */}
              {plan.discount_percentage > 0 && (
                <>
                  <IonItem>
                    <IonLabel color="medium">Original Price</IonLabel>
                    <IonText slot="end" className="original-price">
                      ${plan.base_price.toFixed(2)}
                    </IonText>
                  </IonItem>
                  <IonItem>
                    <IonLabel color="success">
                      Discount ({Math.abs(plan.discount_percentage).toFixed(0)}%)
                    </IonLabel>
                    <IonText slot="end" color="success">
                      -${(plan.base_price - plan.actual_price).toFixed(2)}
                    </IonText>
                  </IonItem>
                </>
              )}

              <IonItem className="total-item">
                <IonLabel>
                  <h2><strong>Total Amount</strong></h2>
                </IonLabel>
                <IonText slot="end" className="total-price">
                  <strong>${totalPrice.toFixed(2)}</strong>
                </IonText>
              </IonItem>
            </IonList>

            {/* Discount Badge */}
            {plan.discount_percentage > 0 && (
              <div className="ion-text-center ion-margin-top">
                <IonBadge color="danger">
                  <IonIcon icon={pricetagOutline} />
                  Save ${(plan.base_price - plan.actual_price).toFixed(2)}
                </IonBadge>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Plan Details */}
        <IonCard className="details-card">
          <IonCardHeader>
            <IonCardTitle>Plan Details</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonIcon slot="start" icon={checkmarkCircle} color="success" />
                <IonLabel>
                  <h3>Plan ID</h3>
                  <p>#{plan.id}</p>
                </IonLabel>
              </IonItem>
              {operator && (
                <IonItem>
                  <IonIcon slot="start" icon={checkmarkCircle} color="success" />
                  <IonLabel>
                    <h3>Operator</h3>
                    <p>{operator.name} (ID: {operator.id})</p>
                  </IonLabel>
                </IonItem>
              )}
              <IonItem>
                <IonIcon slot="start" icon={timeOutline} color="primary" />
                <IonLabel>
                  <h3>Activation</h3>
                  <p>Instant delivery after payment</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Payment Method */}
        <IonCard className="payment-card">
          <IonCardHeader>
            <IonCardTitle>Payment Method</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonRadioGroup
              value={paymentMethod}
              onIonChange={e => {
                const newMethod = e.detail.value as 'credits' | 'external';
                setPaymentMethod(newMethod);
                if (newMethod === 'credits') {
                  setError('');
                }
              }}
            >
              <IonList>
                {paymentMethods.map((method) => (
                  <IonItem
                    key={method.id}
                    lines="none"
                    className={`payment-method-item ${paymentMethod === method.id ? 'selected' : ''}`}
                    disabled={method.disabled}
                  >
                    <IonIcon
                      slot="start"
                      icon={method.icon}
                      color={paymentMethod === method.id ? 'primary' : (method.disabled ? 'medium' : 'dark')}
                    />
                    <IonLabel>
                      <h2>{method.name}</h2>
                      <p>{method.description}</p>
                      {method.disabled && method.id === 'credits' && (
                        <p style={{ color: 'var(--ion-color-danger)', fontSize: '0.8em', marginTop: '4px' }}>
                          Insufficient balance
                        </p>
                      )}
                      {method.disabled && method.id === 'external' && gateways.length === 0 && (
                        <p style={{ color: 'var(--ion-color-warning)', fontSize: '0.8em', marginTop: '4px' }}>
                          No payment gateways available
                        </p>
                      )}
                    </IonLabel>
                    <IonRadio
                      slot="end"
                      value={method.id}
                      disabled={method.disabled}
                    />
                  </IonItem>
                ))}
              </IonList>
            </IonRadioGroup>

            {/* External Payment Gateway Selection */}
            {paymentMethod === 'external' && (
              <div className="external-payment-section">
                <div className="ion-margin-top">
                  <IonLabel>Select Payment Method</IonLabel>

                  {gatewaysLoading ? (
                    <div className="ion-text-center ion-padding">
                      <IonSpinner name="crescent" />
                      <p>Loading payment options...</p>
                    </div>
                  ) : gateways.length === 0 ? (
                    <IonCard className="no-gateways-card ion-margin-top">
                      <IonCardContent>
                        <IonIcon icon={warning} color="warning" size="large" />
                        <h3>No Payment Methods Available</h3>
                        <p>Please try again later or use wallet payment.</p>
                        <IonButton
                          fill="outline"
                          size="small"
                          onClick={() => setPaymentMethod('credits')}
                          className="ion-margin-top"
                        >
                          Use Wallet Instead
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  ) : (
                    <>
                      <IonRadioGroup
                        value={selectedGateway}
                        onIonChange={e => {
                          setSelectedGateway(e.detail.value);
                          setSelectedPaymentMethodId('');
                          setError('');
                        }}
                      >
                        <IonList>
                          {gateways.map((gateway) => (
                            <IonItem
                              key={gateway.id}
                              button
                              lines="full"
                              disabled={gateway.disabled}
                            >
                              <IonIcon
                                slot="start"
                                icon={cardOutline}
                                color={selectedGateway === gateway.name ? 'primary' : (gateway.disabled ? 'medium' : 'dark')}
                              />
                              <IonLabel>
                                <h3>{gateway.display_name}</h3>
                                <p>{gateway.description || `Pay with ${gateway.display_name}`}</p>
                                {gateway.disabled && (
                                  <p style={{ color: 'var(--ion-color-danger)', fontSize: '0.8em', marginTop: '4px' }}>
                                    {gateway.disabled_reason || 'Currently unavailable'}
                                  </p>
                                )}
                              </IonLabel>
                              <IonRadio
                                slot="end"
                                value={gateway.name}
                                disabled={gateway.disabled}
                              />
                            </IonItem>
                          ))}
                        </IonList>
                      </IonRadioGroup>

                      {selectedGateway && (
                        <div className="selected-gateway-info ion-margin-top">
                          <IonText color="medium">
                            <small>
                              Selected: <strong>{gateways.find(g => g.name === selectedGateway)?.display_name}</strong>
                            </small>
                          </IonText>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Stripe Payment Methods */}
                {selectedGateway === 'stripe' && gateways.find(g => g.name === 'stripe') && (
                  <div className="stripe-payment-methods ion-margin-top">
                    <PaymentMethodComponent
                      userEmail={user?.email || ''}
                      onMethodSelected={setSelectedPaymentMethodId}
                      gatewayConfig={gateways.find(g => g.name === 'stripe')?.config}
                      showAddButton={true}
                      onPaymentMethodAdded={(newMethodId: any) => {
                        setSelectedPaymentMethodId(newMethodId);
                      }}
                    />

                    {!selectedPaymentMethodId && (
                      <div className="payment-method-warning ion-margin-top">
                        <IonText color="warning">
                          <small>
                            <IonIcon icon={warning} size="small" />
                            Please select or add a payment method to continue
                          </small>
                        </IonText>
                      </div>
                    )}
                  </div>
                )}

                {/* Other Gateway-specific messages */}
                {selectedGateway && selectedGateway !== 'stripe' && (
                  <div className="gateway-info ion-margin-top">
                    <IonText color="medium">
                      <p>
                        You will be redirected to{' '}
                        <strong>{gateways.find(g => g.name === selectedGateway)?.display_name}</strong>{' '}
                        to complete your payment.
                      </p>
                    </IonText>
                  </div>
                )}

                {/* Credits Warning */}
                {!hasEnoughCredits && (
                  <div className="credits-suggestion ion-margin-top">
                    <IonText color="medium">
                      <p>
                        <IonIcon icon={wallet} />
                        Not enough credits? You can add funds to your wallet.
                      </p>
                    </IonText>
                    <IonButton
                      routerLink={RouteName.CREDIT}
                      expand="block"
                      fill="outline"
                      color="primary"
                      size="small"
                      className="ion-margin-top"
                    >
                      Add Funds to Wallet
                    </IonButton>
                  </div>
                )}
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Security Info */}
        <IonCard className="security-card">
          <IonCardContent>
            <IonItem lines="none">
              <IonIcon slot="start" icon={shieldCheckmark} color="success" />
              <IonLabel>
                <h3>Secure Payment</h3>
                <p>Your payment information is encrypted and secure</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Checkout Button */}
        <div className="checkout-button ion-padding">
          <IonButton
            expand="block"
            size="large"
            color="primary"
            onClick={handleCheckout}
            disabled={
              isProcessing ||
              (paymentMethod === 'credits' && !hasEnoughCredits) ||
              (paymentMethod === 'external' && (!selectedGateway || (selectedGateway === 'stripe' && !selectedPaymentMethodId)))
            }
          >
            <IonIcon slot="start" icon={cash} />
            {isProcessing ? 'Processing...' : `Complete Purchase - $${totalPrice.toFixed(2)}`}
          </IonButton>

          <div className="terms-notice ion-text-center ion-margin-top">
            <IonText color="medium">
              <small>
                By completing your purchase, you agree to our Terms of Service
              </small>
            </IonText>
          </div>
        </div>
      </IonContent>

      {/* Confirmation Alert */}
      <IonAlert
        isOpen={showConfirmation}
        onDidDismiss={() => setShowConfirmation(false)}
        header="Confirm Purchase"
        message={`Are you sure you want to purchase "${plan.name}" for $${totalPrice.toFixed(2)}?`}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Confirm',
            role: 'confirm',
            handler: handleConfirmPurchase
          }
        ]}
      />

      {/* Success Alert */}
      <IonAlert
        isOpen={showSuccess}
        onDidDismiss={handleSuccessClose}
        header="Purchase Successful!"
        message={`You have successfully purchased "${plan.name}". Your plan has been activated.`}
        buttons={[
          {
            text: 'View Orders',
            handler: handleSuccessClose
          }
        ]}
      />

      {/* Loading Spinner */}
      <IonLoading
        isOpen={isProcessing}
        message="Processing your purchase..."
        duration={0}
      />
    </IonPage>
  );
};

export default CheckoutPage;
