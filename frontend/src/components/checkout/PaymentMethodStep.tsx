import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonIcon,
  IonText,
  IonButton,
  IonSpinner,
} from '@ionic/react';
import { wallet, cardOutline, warning } from 'ionicons/icons';
import PaymentMethodComponent from '@components/PaymentMethodComponent';
import { RouteName } from '@utils/RouteName';
import { useCheckout } from './CheckoutContext';

const PaymentMethodStep: React.FC = () => {
  const {
    paymentMethod,
    setPaymentMethod,
    selectedGateway,
    setSelectedGateway,
    selectedPaymentMethodId,
    setSelectedPaymentMethodId,
    setError,
    userCredits,
    hasEnoughCredits,
    gateways,
    gatewaysLoading,
    nextStep,
    canProceed,
  } = useCheckout();

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

  return (
    <div className="checkout-step payment-method-step">
      <IonCard className="payment-card">
        <IonCardHeader>
          <IonCardTitle>Select Payment Method</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonRadioGroup
            value={paymentMethod}
            onIonChange={(e) => {
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
                      onIonChange={(e) => {
                        setSelectedGateway(e.detail.value);
                        setSelectedPaymentMethodId('');
                        setError('');
                      }}
                    >
                      <IonList>
                        {gateways.map((gateway: any) => (
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
                            Selected: <strong>{gateways.find((g: any) => g.name === selectedGateway)?.display_name}</strong>
                          </small>
                        </IonText>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Stripe Payment Methods */}
              {selectedGateway === 'stripe' && gateways.find((g: any) => g.name === 'stripe') && (
                <div className="stripe-payment-methods ion-margin-top">
                  <PaymentMethodComponent
                    userEmail=""
                    onMethodSelected={setSelectedPaymentMethodId}
                    gatewayConfig={gateways.find((g: any) => g.name === 'stripe')?.config}
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
                          {' '}Please select or add a payment method to continue
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
                      <strong>{gateways.find((g: any) => g.name === selectedGateway)?.display_name}</strong>{' '}
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

      {/* Continue Button */}
      <div className="step-actions ion-padding">
        <IonButton
          expand="block"
          size="large"
          onClick={nextStep}
          disabled={!canProceed()}
        >
          Continue
        </IonButton>
      </div>
    </div>
  );
};

export default PaymentMethodStep;
