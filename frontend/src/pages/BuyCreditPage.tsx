// pages/BuyCreditsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
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
  IonInput,
  IonRadioGroup,
  IonRadio,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { 
  cash,
  shieldCheckmark,
  // card,
  // logoPaypal,
  flashOutline,
  arrowBack,
} from 'ionicons/icons';
import './BuyCreditsPage.scss';
import { useAuth } from '@services/useApi';
import apiClient from '@services/APIService';
// import PaymentMethodComponent from '@/components/PaymentMethodComponent';

import PaymentMethodComponent from '@components/PaymentMethodComponent';
import {
  PaymentGateway,
  PaymentResponse,
  TransactionResponse,
  StripeInstance,
  User,
} from '@models/payment.types';
import { RouteName } from '@utils/RouteName';
import { JSX } from 'react/jsx-runtime';



const BuyCreditsPage: React.FC = () => {
  const history = useHistory();
  const { user, isAuthenticated, refreshUser } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      history.replace('/login');
    }
  }, [isAuthenticated, history]);

  const [amount, setAmount] = useState<string>('');
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string | number | null>(null);

  const quickAmounts: number[] = [10, 25, 50, 100, 250, 500];

  useEffect(() => {
    const fetchGateways = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await apiClient.get<{ success: boolean; data: PaymentGateway[] }>('/payment/gateways');
        
        if (response.success && response.data) {
          const externalGateways = response.data.filter((g: PaymentGateway) => 
            g.name !== 'internal' && g.is_external
          );
          
          setGateways(externalGateways);
          if (externalGateways.length > 0) {
            const stripe = externalGateways.find((g: PaymentGateway) => g.name === 'stripe');
            setSelectedGateway(stripe ? stripe.name : externalGateways[0].name);
          }
        }
      } catch (error) {
        console.error('Error fetching gateways:', error);
        setError('Failed to load payment methods');
      } finally {
        setLoading(false);
      }
    };

    fetchGateways();
  }, []);

  const userCredits: number = parseFloat((user as User)?.wallet_balance || '0');
  const purchaseAmount: number = parseFloat(amount || '0');

  const handleQuickAmount = (value: number): void => {
    setAmount(value.toString());
    setError('');
  };

  const validateAmount = (): boolean => {
    if (!amount || purchaseAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (purchaseAmount < 1) {
      setError('Minimum purchase amount is $1');
      return false;
    }

    if (purchaseAmount > 10000) {
      setError('Maximum purchase amount is $10,000');
      return false;
    }

    if (!selectedGateway) {
      setError('Please select a payment method');
      return false;
    }

    return true;
  };

  const handleCheckout = async (): Promise<void> => {
    if (!user) {
      history.push('/login');
      return;
    }

    if (!validateAmount()) {
      return;
    }

    try {
      const transactionData = {
        amount: purchaseAmount,
        gateway: selectedGateway,
        currency: 'USD',
        description: `Credit purchase of $${purchaseAmount.toFixed(2)}`,
        metadata: {
          type: 'credit_purchase',
          user_id: (user as User).id,
          gateway: selectedGateway,
        },
      };

      const transactionResponse = await apiClient.post<TransactionResponse>('/payment/transaction', transactionData);
      
      if (!transactionResponse.success) {
        throw new Error(transactionResponse.message || 'Failed to create transaction');
      }

      setTransactionId(transactionResponse.data.transaction_id);
      setShowConfirmation(true);
      
    } catch (error: any) {
      console.error('Transaction creation failed:', error);
      setError(error.message || 'Failed to start purchase process');
    }
  };

const handleConfirmPurchase = async (): Promise<void> => {
  if (!transactionId) {
    setError('Transaction not found');
    return;
  }

  // Check if payment method is required but not provided
  if (selectedGateway === 'stripe' && !selectedPaymentMethodId) {
    setError('Please select or add a payment method');
    return;
  }

  setIsProcessing(true);
  setShowConfirmation(false);

  try {
    const paymentData = {
      transaction_id: typeof transactionId === 'string' ? parseInt(transactionId) : transactionId,
      gateway: selectedGateway,
      return_url: `${window.location.origin}/payment/success?transaction=${transactionId}`,
      cancel_url: `${window.location.origin}/payment/cancel?transaction=${transactionId}`,
      description: `Credit Purchase - $${purchaseAmount.toFixed(2)}`,
      customer_email: (user as User)?.email,
      customer_name: (user as User)?.name,
      currency: 'USD',
      metadata: {
        user_id: (user as User)?.id,
        type: 'credit_purchase',
      },
      payment_method_id: selectedPaymentMethodId || undefined,
    };

    const response = await apiClient.post<PaymentResponse>('/payment/initiate', paymentData);

    if (!response.success) {
      throw new Error(response.message || 'Payment initiation failed');
    }

    // If response has a client_secret, we need to confirm the payment
    if (response.data.action_data?.client_secret) {
      await handleStripePayment(response.data.action_data.client_secret);
      return;
    }

    // If payment_reference is provided, verify the payment
    if (response.data.payment_reference) {
      await verifyAndComplete(response.data.payment_reference);
    } else if (response.data.redirect_url) {
      // For redirect-based gateways
      window.location.href = response.data.redirect_url;
    }

  } catch (error: any) {
    setIsProcessing(false);
    setError(error.message || 'Payment failed. Please try again.');
    console.error('Purchase failed:', error);
  }
};

	const handleStripePayment = async (
  clientSecret: string,
  // responseData: PaymentResponse['data']
): Promise<void> => {
  try {
    // Get Stripe public key from gateway config
    const stripeGateway = gateways.find(g => g.name === 'stripe');
    const publishableKey = stripeGateway?.config?.public_key;
    
    if (!publishableKey) {
      throw new Error('Stripe configuration missing');
    }

    const stripe = await loadStripe(publishableKey) as any;
    
    if (selectedPaymentMethodId) {
      // Confirm payment with saved payment method
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: selectedPaymentMethodId,
          return_url: `${window.location.origin}/payment/success?transaction=${transactionId}`,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent?.status === 'succeeded' && paymentIntent.id) {
        await verifyAndComplete(paymentIntent.id);
      } else if (paymentIntent?.status === 'requires_action') {
        // Handle 3D Secure authentication
        const { error: confirmError } = await stripe.handleCardAction(clientSecret);
        
        if (confirmError) {
          throw new Error(confirmError.message);
        }
        
        // After action is complete, verify the payment
        await verifyAndComplete(paymentIntent.id);
      } else if (paymentIntent?.status === 'requires_payment_method') {
        throw new Error('Payment method is required. Please select a payment method.');
      }
    } else {
      // Handle payment without saved payment method
      // This shouldn't happen in your flow since you require selection
      throw new Error('No payment method selected');
    }

  } catch (error: any) {
    setIsProcessing(false);
    setError(error.message || 'Payment confirmation failed');
    console.error('Stripe payment error:', error);
  }
};

  // const handleStripeConfirmation = async (
  //   responseData: PaymentResponse['data'], 
  //   clientSecret: string
  // ): Promise<void> => {
  //   try {
  //     const publishableKey = responseData.action_data?.stripe_config?.publishable_key;
  //     if (!publishableKey) {
  //       throw new Error('Stripe configuration missing');
  //     }
  //
  //     const stripe = await loadStripe(publishableKey);
  //
  //     if (selectedPaymentMethodId) {
  //       const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
  //         clientSecret,
  //         {
  //           payment_method: selectedPaymentMethodId,
  //           return_url: `${window.location.origin}/payment/success?transaction=${transactionId}`,
  //         }
  //       );
  //
  //       if (confirmError) {
  //         throw new Error(confirmError.message);
  //       }
  //
  //       if (paymentIntent?.status === 'succeeded' && paymentIntent.id) {
  //         await verifyAndComplete(paymentIntent.id);
  //       }
  //     } else {
  //       const elements = stripe.elements();
  //       const cardElement = elements.create('card');
  //
  //       const cardElementDiv = document.getElementById('card-element');
  //       if (cardElementDiv) {
  //         cardElement.mount('#card-element');
  //       }
  //
  //       const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
  //         clientSecret,
  //         {
  //           payment_method: {
  //             card: cardElement,
  //             billing_details: {
  //               name: (user as User)?.name || '',
  //               email: (user as User)?.email || '',
  //             }
  //           },
  //           return_url: `${window.location.origin}/payment/success?transaction=${transactionId}`,
  //         }
  //       );
  //
  //       if (stripeError) {
  //         throw new Error(stripeError.message);
  //       }
  //
  //       if (paymentIntent?.status === 'succeeded' && paymentIntent.id) {
  //         await verifyAndComplete(paymentIntent.id);
  //       }
  //     }
  //
  //   } catch (error: any) {
  //     setIsProcessing(false);
  //     setError(error.message || 'Payment confirmation failed');
  //     console.error('Stripe confirmation error:', error);
  //   }
  // };

  const verifyAndComplete = async (paymentReference: string): Promise<void> => {
    try {
      const verificationData = {
        payment_reference: paymentReference,
        gateway: selectedGateway,
        transaction_id: typeof transactionId === 'string' ? parseInt(transactionId) : transactionId,
      };

      const response = await apiClient.post<PaymentResponse>('/payment/verify', verificationData);

      if (!response.success) {
        throw new Error(response.message || 'Payment verification failed');
      }

      setIsProcessing(false);
      setShowSuccess(true);
      
      if (refreshUser) {
        await refreshUser();
      }

    } catch (error: any) {
      setIsProcessing(false);
      setError(error.message || 'Payment verification failed');
      console.error('Verification failed:', error);
    }
  };

  const loadStripe = async (publishableKey: string): Promise<StripeInstance> => {
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

// In your BuyCreditsPage.tsx, update the handleSuccessClose function:

const handleSuccessClose = (): void => {
  setShowSuccess(false);
  
  // Pass purchase details to thank you page
  const purchaseDetails = {
    transaction_id: transactionId,
    amount: purchaseAmount,
    credits: purchaseAmount, // 1 USD = 1 Credit
    payment_method: selectedGateway === 'stripe' 
      ? 'Stripe •••• (last 4 digits from payment method)'
      :  'Credit Card',
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    transaction_ref: `PAY-${String(transactionId).substring(0, 8).toUpperCase()}`,
    user_email: (user as User)?.email,
    user_name: (user as User)?.name,
  };
  
  history.push(RouteName.THANKYOU, { purchase: purchaseDetails });
};

  const renderStripeCardElement = (): JSX.Element | null => {
    if (selectedGateway === 'stripe' && !selectedPaymentMethodId) {
      return (
        <div className="stripe-card-element" style={{ marginTop: '15px' }}>
          <div id="card-element" style={{ 
            padding: '12px', 
            border: '1px solid #ccc', 
            borderRadius: '8px',
            margin: '10px 0'
          }} />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Your card details are secured by Stripe and never touch our servers.
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/" />
            </IonButtons>
            <IonTitle>Loading...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonLoading isOpen={true} message="Loading..." />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (gateways.length === 0) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => history.goBack()}>
                <IonIcon slot="icon-only" icon={arrowBack} />
              </IonButton>
            </IonButtons>
            <IonTitle>Buy Credits</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="no-gateways" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <IonCard>
              <IonCardContent>
                <IonIcon icon={cash} size="large" color="medium" />
                <h3>No Payment Methods Available</h3>
                <p>Please contact support or try again later.</p>
                <IonButton onClick={() => history.goBack()}>
                  Go Back
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="buy-credits-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon slot="icon-only" icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Buy Credits</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonCard className="balance-card">
          <IonCardContent>
            <div className="balance-info">
              <IonIcon icon={flashOutline} color="primary" />
              <div>
                <p className="balance-label">Current Balance</p>
                <h2 className="balance-amount">{userCredits.toFixed(2)} Credits</h2>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="amount-card">
          <IonCardHeader>
            <IonCardTitle>Enter Amount</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="amount-input-wrapper">
              <IonItem lines="none" className="amount-input">
                <IonLabel position="stacked">Amount (USD)</IonLabel>
                <IonInput
                  type="number"
                  value={amount}
                  onIonChange={(e) => {
                    setAmount(e.detail.value!);
                    setError('');
                  }}
                  placeholder="0.00"
                  min="1"
                  max="10000"
                  step="0.01"
                  className="custom-input"
                />
              </IonItem>

              <div className="quick-amounts">
                <p className="quick-label">Quick select:</p>
                <div className="amount-buttons">
                  {quickAmounts.map((value) => (
                    <IonButton
                      key={value}
                      fill={amount === value.toString() ? 'solid' : 'outline'}
                      size="small"
                      onClick={() => handleQuickAmount(value)}
                      className="quick-button"
                    >
                      ${value}
                    </IonButton>
                  ))}
                </div>
              </div>

              {purchaseAmount > 0 && (
                <div className="amount-summary">
                  <div className="summary-row">
                    <IonText color="medium">You will receive:</IonText>
                    <IonText color="dark">
                      <strong>{purchaseAmount.toFixed(2)} Credits</strong>
                    </IonText>
                  </div>
                  <p className="exchange-rate">1 USD = 1 Credit</p>
                </div>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Payment Methods Section */}
        {selectedGateway === 'stripe' && (
          <PaymentMethodComponent
            userEmail={(user as User)?.email || ''}
            onMethodSelected={setSelectedPaymentMethodId}
            gatewayConfig={gateways.find(g => g.name === selectedGateway)?.config}
            showAddButton={true}
            onPaymentMethodAdded={() => {
              // Refresh payment methods if needed
            }}
          />
        )}

        {/* Payment Gateway Selection */}
        <IonCard className="payment-card">
          <IonCardHeader>
            <IonCardTitle>Payment Gateway</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonRadioGroup 
              value={selectedGateway} 
              onIonChange={e => {
                setSelectedGateway(e.detail.value);
                setSelectedPaymentMethodId(''); // Reset payment method when gateway changes
                setError('');
              }}
            >
              <IonList lines="none">
                {gateways.map((gateway) => (
                  <IonItem 
                    key={gateway.id} 
                    className={`payment-method-item ${selectedGateway === gateway.name ? 'selected' : ''}`}
                  >
                    <IonIcon 
                      slot="start" 
                      color={selectedGateway === gateway.name ? 'primary' : 'medium'}
                    />
                    <IonLabel>
                      <h2>{gateway.display_name}</h2>
                      <p>{gateway.description}</p>
                    </IonLabel>
                    <IonRadio slot="end" value={gateway.name} />
                  </IonItem>
                ))}
              </IonList>
            </IonRadioGroup>

            {renderStripeCardElement()}

            {error && (
              <div className="error-box">
                <IonText color="danger">{error}</IonText>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        <IonCard className="security-card">
          <IonCardContent>
            <IonItem lines="none" className="security-item">
              <IonIcon slot="start" icon={shieldCheckmark} color="success" />
              <IonLabel>
                <h3>Secure Payment</h3>
                <p>Your payment information is encrypted and secure</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <div className="purchase-section">
          <IonButton 
            expand="block" 
            size="large"
            color="primary"
            onClick={handleCheckout}
            disabled={!amount || purchaseAmount <= 0 || !selectedGateway}
            className="purchase-button"
          >
            <IonIcon slot="start" icon={cash} />
            {purchaseAmount > 0 ? `Buy ${purchaseAmount.toFixed(2)} Credits` : 'Enter Amount'}
          </IonButton>
          
          <div className="terms-notice">
            <IonText color="medium">
              <small>
                By completing your purchase, you agree to our Terms of Service
              </small>
            </IonText>
          </div>
        </div>
      </IonContent>

      <IonAlert
        isOpen={showConfirmation}
        onDidDismiss={() => setShowConfirmation(false)}
        header="Confirm Purchase"
        message={`Are you sure you want to purchase ${purchaseAmount.toFixed(2)} credits for $${purchaseAmount.toFixed(2)} using ${gateways.find(g => g.name === selectedGateway)?.display_name}?`}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Confirm Purchase',
            role: 'confirm',
            handler: handleConfirmPurchase
          }
        ]}
      />

      <IonAlert
        isOpen={showSuccess}
        onDidDismiss={handleSuccessClose}
        header="Purchase Successful!"
        message={`${purchaseAmount.toFixed(2)} credits have been added to your account!`}
        buttons={[
          {
            text: 'Continue',
            handler: handleSuccessClose
          }
        ]}
      />

      <IonLoading
        isOpen={isProcessing}
        message="Processing your purchase..."
        duration={0}
      />
    </IonPage>
  );
};

export default BuyCreditsPage;
