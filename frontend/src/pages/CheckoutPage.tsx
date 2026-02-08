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
  IonChip,
  IonBadge,
  IonSpinner,
} from '@ionic/react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { 
  arrowBack, 
  wallet, 
  checkmarkCircle,
  cash,
  shieldCheckmark,
  informationCircle,
  timeOutline,
  pricetagOutline,
} from 'ionicons/icons';
import './CheckoutPage.scss';
import apiClient from '@services/APIService';
import { useAuth } from '@services/useApi';
import { RouteName } from '@utils/RouteName';

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

const CheckoutPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const history = useHistory();
  const location = useLocation<LocationState>();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      history.replace('/');
    }
  }, [isAuthenticated, history]);
  
  const [plan, setPlan] = useState<PlanType | null>(location.state?.plan || null);
  const [operator, setOperator] = useState<Operator | null>(location.state?.operator || null);
  const [loading, setLoading] = useState(!plan);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credits');

  // Fetch plan data if not passed via location state
  useEffect(() => {
    const fetchPlanData = async () => {
      if (!plan && productId) {
        try {
          setLoading(true);
          const planData = await apiClient.getPlan(parseInt(productId));
          
          // Map the API response to our PlanType interface
          const mappedPlan: PlanType = {
            id: planData.id,
            plan_type_id: planData.plan_type_id,
            name: planData.name,
            description: planData.description || '',
            base_price: planData.base_price,
            actual_price: planData.actual_price,
            is_active: planData.is_active,
            discount_percentage: planData.discount_percentage || 0,
            meta_data: '',
          };
          
          setPlan(mappedPlan);

          // Try to fetch operator data if we have plan_type_id
          if (planData.plan_type_id) {
            const operatorData = await apiClient.getPlanType(planData.plan_type_id);
            setOperator({
              id: operatorData.id,
              name: operatorData.name,
              description: operatorData.description || '',
              image: '',
            });
          }
        } catch (error) {
          console.error('Error fetching plan:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPlanData();
  }, [productId, plan]);

  const userCredits = parseFloat(user?.wallet_balance || '0');
  const totalPrice = plan?.actual_price || 0;
  const hasEnoughCredits = userCredits >= totalPrice;

  const handleCheckout = () => {
    if (!user) {
      // Redirect to login if not authenticated
      history.push('/login');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);
    
    try {
      // TODO: Replace with actual API call to purchase
      // await apiClient.purchasePlan({
      //   plan_id: plan?.id,
      //   operator_id: operator?.id,
      //   payment_method: paymentMethod,
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsProcessing(false);
      setShowSuccess(true);
    } catch (error) {
      setIsProcessing(false);
      console.error('Purchase failed:', error);
      // TODO: Show error message
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    history.push('/orders');
  };

  const paymentMethods = [
    { 
      id: 'credits', 
      name: 'Wallet Balance', 
      icon: wallet, 
      description: `Available: $${userCredits.toFixed(2)}` 
    },
  ];

  // Loading state
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
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/" />
            </IonButtons>
            <IonTitle>Plan Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
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
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon slot="icon-only" icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Checkout</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
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
              {plan.discount_percentage < 0 && (
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
            {plan.discount_percentage < 0 && (
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
            <IonList>
              {paymentMethods.map((method) => (
                <IonItem 
                  key={method.id} 
                  lines="none"
                  className={`payment-method-item ${paymentMethod === method.id ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <IonIcon 
                    slot="start" 
                    icon={method.icon} 
                    color={paymentMethod === method.id ? 'primary' : 'medium'}
                  />
                  <IonLabel>
                    <h2>{method.name}</h2>
                    <p>{method.description}</p>
                  </IonLabel>
                  <IonIcon 
                    slot="end" 
                    icon={checkmarkCircle} 
                    color={paymentMethod === method.id ? 'primary' : 'medium'}
                  />
                </IonItem>
              ))}
            </IonList>

            {/* Credits Warning */}
            {paymentMethod === 'credits' && !hasEnoughCredits && (
              <div className="credits-warning ion-margin-top">
                <IonText color="danger">
                  <p>
                    <IonIcon icon={wallet} /> 
                    Insufficient balance. You need ${(totalPrice - userCredits).toFixed(2)} more.
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
            disabled={paymentMethod === 'credits' && !hasEnoughCredits}
          >
            <IonIcon slot="start" icon={cash} />
            Complete Purchase - ${totalPrice.toFixed(2)}
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
