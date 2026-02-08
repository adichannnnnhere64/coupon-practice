// components/PaymentMethodComponent.tsx - SIMPLIFIED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonLoading,
  IonText,
  IonAlert,
} from '@ionic/react';
import { card, addOutline, trashOutline, checkmarkOutline } from 'ionicons/icons';
import apiClient from '@services/APIService';
import { PaymentMethod, PaymentMethodComponentProps } from '@models/payment.types';
import StripeCardForm from './StripeCardForm';
import './PaymentMethodComponent.scss';

const PaymentMethodComponent: React.FC<PaymentMethodComponentProps> = ({
  userEmail,
  onMethodSelected,
  showAddButton = true,
  onPaymentMethodAdded,
  gatewayConfig,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  // Fetch payment methods
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: PaymentMethod[] }>('/payment/methods');
      
      if (response.success && response.data) {
        setPaymentMethods(response.data);
        const defaultMethod = response.data.find((m: PaymentMethod) => m.is_default);
        if (defaultMethod) {
          setSelectedMethod(defaultMethod.id);
          onMethodSelected?.(defaultMethod.id);
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, [onMethodSelected]);

  const handleAddPaymentMethod = async (paymentMethodId: string): Promise<void> => {
    try {
      setIsAdding(true);
      setError('');

      const response = await apiClient.post<{ 
        success: boolean; 
        message?: string; 
        data?: any;
      }>('/payment/methods', {
        payment_method_id: paymentMethodId,
        gateway: 'stripe',
        set_as_default: paymentMethods.length === 0,
        email: userEmail,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to save payment method');
      }

      await fetchPaymentMethods();
      onPaymentMethodAdded?.();
      setShowAddForm(false);
      
    } catch (error: any) {
      console.error('Add payment method error:', error);
      setError(error.message || 'Failed to add payment method');
      setShowErrorAlert(true);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePaymentMethod = async (methodId: string): Promise<void> => {
    try {
      const response = await apiClient.delete<{ success: boolean; message?: string }>(`/payment/methods/${methodId}`);
      
      if (response.success) {
        await fetchPaymentMethods();
        if (selectedMethod === methodId) {
          setSelectedMethod('');
          onMethodSelected?.('');
        }
      } else {
        setError(response.message || 'Failed to remove payment method');
        setShowErrorAlert(true);
      }
    } catch (error: any) {
      console.error('Error removing payment method:', error);
      setError('Failed to remove payment method');
      setShowErrorAlert(true);
    }
  };

  const handleMethodSelect = (methodId: string): void => {
    setSelectedMethod(methodId);
    onMethodSelected?.(methodId);
  };

  const handleToggleAddForm = () => {
    setShowAddForm(!showAddForm);
    setError('');
  };

  if (loading) {
    return (
      <IonCard>
        <IonCardContent className="loading-container">
          <IonLoading isOpen={true} message="Loading payment methods..." />
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Payment Methods</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {paymentMethods.length > 0 ? (
            <IonRadioGroup 
              value={selectedMethod} 
              onIonChange={(e) => handleMethodSelect(e.detail.value)}
            >
              <IonList lines="none">
                {paymentMethods.map((method) => (
                  <IonItem key={method.id} className="payment-method-item">
                    <IonIcon slot="start" icon={card} color="primary" />
                    <IonLabel>
                      <h3 className="method-brand">
                        {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                      </h3>
                      <p className="method-details">Expires {method.exp_month}/{method.exp_year}</p>
                      {method.is_default && (
                        <IonText color="success" className="default-badge">
                          <small>Default</small>
                        </IonText>
                      )}
                    </IonLabel>
                    <IonRadio slot="end" value={method.id} />
                    {!method.is_default && (
                      <IonButton
                        slot="end"
                        fill="clear"
                        color="medium"
                        size="small"
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        title="Remove payment method"
                      >
                        <IonIcon slot="icon-only" icon={trashOutline} />
                      </IonButton>
                    )}
                  </IonItem>
                ))}
              </IonList>
            </IonRadioGroup>
          ) : (
            <div className="no-methods">
              <IonIcon icon={card} size="large" color="medium" />
              <p>No payment methods added yet</p>
            </div>
          )}

          {showAddButton && !showAddForm && (
            <IonButton 
              expand="block" 
              fill="outline" 
              onClick={handleToggleAddForm}
              disabled={!gatewayConfig?.public_key}
              className="add-button"
            >
              <IonIcon slot="start" icon={addOutline} />
              Add New Payment Method
            </IonButton>
          )}

          {showAddForm && gatewayConfig?.public_key && (
            <div className="add-form-container">
              <div className="form-header">
                <IonText><h3>Add New Card</h3></IonText>
                <IonButton 
                  fill="clear" 
                  size="small"
                  onClick={handleToggleAddForm}
                  disabled={isAdding}
                >
                  Cancel
                </IonButton>
              </div>
              
              <StripeCardForm
                publicKey={gatewayConfig.public_key}
                onSubmit={handleAddPaymentMethod}
                disabled={isAdding}
              />
              
              <div className="security-notice">
                <IonIcon icon={checkmarkOutline} color="success" size="small" />
                <IonText color="medium">
                  <small>Your card details are secured by Stripe and never touch our servers.</small>
                </IonText>
              </div>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* Error Alert */}
      <IonAlert
        isOpen={showErrorAlert}
        onDidDismiss={() => setShowErrorAlert(false)}
        header="Error"
        message={error}
        buttons={['OK']}
      />

      <IonLoading isOpen={isAdding} message="Adding payment method..." />
    </>
  );
};

export default PaymentMethodComponent;
