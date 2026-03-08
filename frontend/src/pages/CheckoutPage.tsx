import React from 'react';
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
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  checkmarkCircle,
  informationCircle,
  timeOutline,
  pricetagOutline,
  warning,
} from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import './CheckoutPage.scss';
import apiClient from '@services/APIService';
import { useProtectedRoute } from '@services/useProtectedRoute';
import { PageHeader } from '@components/ui';
import { queryKeys } from '@hooks/useQueries';
import {
  CheckoutProvider,
  useCheckout,
  CheckoutStepper,
  PaymentMethodStep,
  DeliveryMethodStep,
  ReviewStep,
} from '@components/checkout';
import { ReceiptModal } from '@components/receipt';

// Inner component that uses checkout context
const CheckoutContent: React.FC = () => {
  const {
    currentStep,
    plan,
    operator,
    totalPrice,
    error,
    isProcessing,
    showConfirmation,
    showSuccess,
    showReceiptModal,
    purchaseResult,
    transactionId,
    setShowConfirmation,
    handleConfirmPurchase,
    handleSuccessClose,
    handleReceiptClose,
  } = useCheckout();

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PaymentMethodStep />;
      case 2:
        return <DeliveryMethodStep />;
      case 3:
        return <ReviewStep />;
      default:
        return <PaymentMethodStep />;
    }
  };

  return (
    <>
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

      {/* Order Summary - Always Visible */}
      {plan && (
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
      )}

      {/* Plan Details */}
      {plan && (
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
      )}

      {/* Stepper */}
      <CheckoutStepper />

      {/* Current Step Content */}
      {renderStep()}

      {/* Confirmation Alert */}
      <IonAlert
        isOpen={showConfirmation}
        onDidDismiss={() => setShowConfirmation(false)}
        header="Confirm Purchase"
        message={`Are you sure you want to purchase "${plan?.name}" for $${totalPrice.toFixed(2)}?`}
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
        message={`You have successfully purchased "${plan?.name}". Your plan has been activated.`}
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

      {/* Receipt Modal for Manual Delivery */}
      {purchaseResult && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={handleReceiptClose}
          couponCode={purchaseResult.couponCode}
          couponCodes={purchaseResult.couponCodes}
          planName={plan?.name || ''}
          amount={totalPrice}
          transactionId={transactionId}
        />
      )}
    </>
  );
};

const CheckoutPage: React.FC = () => {
  const history = useHistory();
  const { productId } = useParams<{ productId: string }>();
  const planIdNum = parseInt(productId || '0');

  const { isChecking } = useProtectedRoute({
    redirectTo: '/login',
    errorMessage: 'You need to be logged in to access this page'
  });

  // Fetch plan data for loading/error states
  const planQuery = useQuery({
    queryKey: queryKeys.plan(planIdNum),
    queryFn: () => apiClient.getPlan(planIdNum),
    enabled: !!productId && !isChecking,
  });

  // Loading state for auth check
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
  if (planQuery.isLoading) {
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
  if (!planQuery.data) {
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
        defaultHref={`/operator/${planQuery.data.plan_type_id}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Operator', href: `/operator/${planQuery.data.plan_type_id}` },
          { label: 'Checkout' },
        ]}
      />

      <IonContent fullscreen>
        <CheckoutProvider>
          <CheckoutContent />
        </CheckoutProvider>
      </IonContent>
    </IonPage>
  );
};

export default CheckoutPage;
