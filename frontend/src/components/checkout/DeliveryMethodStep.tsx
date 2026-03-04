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
} from '@ionic/react';
import {
  mailOutline,
  chatbubbleOutline,
  cloudUploadOutline,
  codeSlashOutline,
  personOutline,
  warning,
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

const getDeliveryDescription = (type: string) => {
  switch (type) {
    case 'email': return 'Delivered to your email address';
    case 'sms': return 'Delivered via SMS to your phone';
    case 'webhook': return 'Delivered via webhook';
    case 'api': return 'Delivered via API';
    case 'manual': return 'Manual delivery by support';
    default: return 'Digital delivery';
  }
};

const DeliveryMethodStep: React.FC = () => {
  const {
    deliveryMethods,
    selectedDeliveryMethodId,
    setSelectedDeliveryMethodId,
    setError,
    nextStep,
    prevStep,
    canProceed,
  } = useCheckout();

  return (
    <div className="checkout-step delivery-method-step">
      <IonCard className="delivery-card">
        <IonCardHeader>
          <IonCardTitle>Select Delivery Method</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonRadioGroup
            value={selectedDeliveryMethodId?.toString() || ''}
            onIonChange={(e) => {
              setSelectedDeliveryMethodId(parseInt(e.detail.value));
              setError('');
            }}
          >
            <IonList>
              {deliveryMethods.map((method) => (
                <IonItem
                  key={method.id}
                  lines="none"
                  className={`delivery-method-item ${selectedDeliveryMethodId === method.id ? 'selected' : ''}`}
                >
                  <IonIcon
                    slot="start"
                    icon={getDeliveryIcon(method.type)}
                    color={selectedDeliveryMethodId === method.id ? 'primary' : 'dark'}
                  />
                  <IonLabel>
                    <h2>{method.display_name}</h2>
                    <p>{getDeliveryDescription(method.type)}</p>
                  </IonLabel>
                  <IonRadio
                    slot="end"
                    value={method.id.toString()}
                  />
                </IonItem>
              ))}
            </IonList>
          </IonRadioGroup>

          {!selectedDeliveryMethodId && (
            <div className="delivery-method-warning ion-margin-top">
              <IonText color="warning">
                <small>
                  <IonIcon icon={warning} size="small" />
                  {' '}Please select a delivery method to continue
                </small>
              </IonText>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* Navigation Buttons */}
      <div className="step-actions ion-padding">
        <div className="step-buttons">
          <IonButton
            fill="outline"
            size="large"
            onClick={prevStep}
          >
            Back
          </IonButton>
          <IonButton
            size="large"
            onClick={nextStep}
            disabled={!canProceed()}
          >
            Continue
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMethodStep;
