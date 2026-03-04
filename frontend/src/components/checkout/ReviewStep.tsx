import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonButton,
  IonChip,
} from '@ionic/react';
import {
  wallet,
  cardOutline,
  mailOutline,
  chatbubbleOutline,
  cloudUploadOutline,
  codeSlashOutline,
  personOutline,
  checkmarkCircle,
  cash,
  shieldCheckmark,
} from 'ionicons/icons';
import { useCheckout } from './CheckoutContext';

const getDeliveryIcon = (type: string) => {
  switch (type) {
    case 'email': return mailOutline;
    case 'sms': return chatbubbleOutline;
    case 'webhook': return cloudUploadOutline;
    case 'api': return codeSlashOutline;
    case 'manual': return personOutline;
    default: return mailOutline;
  }
};

const ReviewStep: React.FC = () => {
  const {
    paymentMethod,
    selectedGateway,
    selectedDeliveryMethodId,
    deliveryMethods,
    hasDeliveryMethods,
    gateways,
    totalPrice,
    isProcessing,
    prevStep,
    handleCheckout,
  } = useCheckout();

  const selectedDeliveryMethod = deliveryMethods.find(m => m.id === selectedDeliveryMethodId);
  const selectedGatewayInfo = gateways.find((g: any) => g.name === selectedGateway);

  return (
    <div className="checkout-step review-step">
      {/* Review Summary */}
      <IonCard className="review-card">
        <IonCardHeader>
          <IonCardTitle>Review Your Order</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList lines="none">
            {/* Payment Method Summary */}
            <IonItem className="review-item">
              <IonIcon
                slot="start"
                icon={paymentMethod === 'credits' ? wallet : cardOutline}
                color="primary"
              />
              <IonLabel>
                <h3>Payment Method</h3>
                <p>
                  {paymentMethod === 'credits'
                    ? 'Wallet Balance'
                    : selectedGatewayInfo?.display_name || 'External Payment'}
                </p>
              </IonLabel>
              <IonChip color="success" slot="end">
                <IonIcon icon={checkmarkCircle} />
                <IonLabel>Selected</IonLabel>
              </IonChip>
            </IonItem>

            {/* Delivery Method Summary */}
            {hasDeliveryMethods && selectedDeliveryMethod && (
              <IonItem className="review-item">
                <IonIcon
                  slot="start"
                  icon={getDeliveryIcon(selectedDeliveryMethod.type)}
                  color="primary"
                />
                <IonLabel>
                  <h3>Delivery Method</h3>
                  <p>{selectedDeliveryMethod.display_name}</p>
                </IonLabel>
                <IonChip color="success" slot="end">
                  <IonIcon icon={checkmarkCircle} />
                  <IonLabel>Selected</IonLabel>
                </IonChip>
              </IonItem>
            )}

            {/* Total */}
            <IonItem className="review-item total-item">
              <IonIcon slot="start" icon={cash} color="primary" />
              <IonLabel>
                <h3>Total Amount</h3>
              </IonLabel>
              <IonText slot="end" className="total-price">
                <strong>${totalPrice.toFixed(2)}</strong>
              </IonText>
            </IonItem>
          </IonList>
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

      {/* Navigation Buttons */}
      <div className="step-actions ion-padding">
        <div className="step-buttons">
          <IonButton
            fill="outline"
            size="large"
            onClick={prevStep}
            disabled={isProcessing}
          >
            Back
          </IonButton>
          <IonButton
            size="large"
            color="primary"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            <IonIcon slot="start" icon={cash} />
            {isProcessing ? 'Processing...' : `Complete Purchase - $${totalPrice.toFixed(2)}`}
          </IonButton>
        </div>

        <div className="terms-notice ion-text-center ion-margin-top">
          <IonText color="medium">
            <small>
              By completing your purchase, you agree to our Terms of Service
            </small>
          </IonText>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
