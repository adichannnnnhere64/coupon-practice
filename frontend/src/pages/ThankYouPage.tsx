// pages/ThankYouPage.tsx
import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonText,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonList,
  IonItem,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { 
  checkmarkCircle,
  home,
  receipt,
  card,
  flashOutline,
  calendar,
  person,
} from 'ionicons/icons';
import './ThankYouPage.scss';
import { useAuth } from '@services/useApi';
import { RouteName } from '@utils/RouteName';

interface PurchaseDetails {
  transaction_id: string | number;
  amount: number;
  credits: number;
  payment_method: string;
  date: string;
  transaction_ref: string;
  user_email: string;
  user_name: string;
}

const ThankYouPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { user } = useAuth();
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get purchase details from location state or query params
    const state = location.state as { purchase?: PurchaseDetails };
    const searchParams = new URLSearchParams(location.search);
    
    if (state?.purchase) {
      setPurchaseDetails(state.purchase);
      setLoading(false);
    } else if (searchParams.get('transaction_id')) {
      // Try to fetch from API if we have transaction ID
      fetchPurchaseDetails(searchParams.get('transaction_id')!);
    } else {

      // setTimeout(() => {
      //   history.push(RouteName.WELCOME);
      // }, 2000);
    }
  }, [location, history]);

  const fetchPurchaseDetails = async (transactionId: string) => {
    try {
      // You would normally fetch from your API
      // const response = await apiClient.get(`/payment/transactions/${transactionId}`);
      // setPurchaseDetails(response.data);
      
      // For demo, create mock data
      const mockDetails: PurchaseDetails = {
        transaction_id: transactionId,
        amount: 10.00,
        credits: 10.00,
        payment_method: 'Stripe •••• 4242',
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        transaction_ref: `PAY-${transactionId.substring(0, 8).toUpperCase()}`,
        user_email: user?.email || 'customer@example.com',
        user_name: user?.name || 'Customer',
      };
      
      setPurchaseDetails(mockDetails);
    } catch (error) {
      console.error('Failed to fetch purchase details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    history.push(RouteName.WELCOME);
  };

  const handleViewReceipt = () => {
    // Implement receipt viewing/download
    console.log('View receipt for:', purchaseDetails?.transaction_id);
  };

  const handleBuyMore = () => {
    history.push(RouteName.CREDIT);
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="thank-you-loading">
          <div className="loading-content">
            <IonIcon icon={checkmarkCircle} size="large" color="primary" />
            <h2>Loading your purchase details...</h2>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="thank-you-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Purchase Complete</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="thank-you-content">
        <div className="confirmation-section">
          <div className="success-icon">
            <IonIcon icon={checkmarkCircle} />
          </div>
          
          <h1 className="thank-you-title">Thank You!</h1>
          <p className="thank-you-subtitle">
            Your purchase has been completed successfully
          </p>
        </div>

        {purchaseDetails && (
          <>
            {/* Purchase Summary Card */}
            <IonCard className="summary-card">
              <IonCardHeader>
                <IonCardTitle className="summary-title">
                  <IonIcon icon={receipt} slot="start" />
                  Purchase Summary
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList lines="none" className="summary-list">
                  <IonItem className="summary-item">
                    <IonIcon icon={flashOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3>Credits Purchased</h3>
                      <p>{purchaseDetails.credits.toFixed(2)} Credits</p>
                    </IonLabel>
                    <IonText slot="end" className="amount-text">
                      <strong>${purchaseDetails.amount.toFixed(2)}</strong>
                    </IonText>
                  </IonItem>

                  <IonItem className="summary-item">
                    <IonIcon icon={card} slot="start" color="primary" />
                    <IonLabel>
                      <h3>Payment Method</h3>
                      <p>{purchaseDetails.payment_method}</p>
                    </IonLabel>
                  </IonItem>

                  <IonItem className="summary-item">
                    <IonIcon icon={calendar} slot="start" color="primary" />
                    <IonLabel>
                      <h3>Purchase Date</h3>
                      <p>{purchaseDetails.date}</p>
                    </IonLabel>
                  </IonItem>

                  <IonItem className="summary-item">
                    <IonIcon icon={receipt} slot="start" color="primary" />
                    <IonLabel>
                      <h3>Transaction Reference</h3>
                      <p>{purchaseDetails.transaction_ref}</p>
                    </IonLabel>
                  </IonItem>
                </IonList>

                <div className="total-section">
                  <div className="total-row">
                    <IonText>Total Paid</IonText>
                    <IonText className="total-amount">
                      ${purchaseDetails.amount.toFixed(2)}
                    </IonText>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Account Details Card */}
            <IonCard className="account-card">
              <IonCardHeader>
                <IonCardTitle className="account-title">
                  <IonIcon icon={person} slot="start" />
                  Account Details
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <div className="detail-item">
                        <IonText color="medium" className="detail-label">
                          Account Email
                        </IonText>
                        <IonText className="detail-value">
                          {purchaseDetails.user_email}
                        </IonText>
                      </div>
                    </IonCol>
                    <IonCol size="6">
                      <div className="detail-item">
                        <IonText color="medium" className="detail-label">
                          Account Name
                        </IonText>
                        <IonText className="detail-value">
                          {purchaseDetails.user_name}
                        </IonText>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

            {/* Next Steps Card */}
            <IonCard className="next-steps-card">
              <IonCardContent>
                <h3 className="next-steps-title">What happens next?</h3>
                <ul className="steps-list">
                  <li className="step-item">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <strong>Credits added instantly</strong>
                      <p>Your {purchaseDetails.credits.toFixed(2)} credits are now available in your account</p>
                    </div>
                  </li>
                  <li className="step-item">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <strong>Receipt emailed</strong>
                      <p>A receipt has been sent to {purchaseDetails.user_email}</p>
                    </div>
                  </li>
                  <li className="step-item">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <strong>Start using credits</strong>
                      <p>You can now use your credits for services on our platform</p>
                    </div>
                  </li>
                </ul>
              </IonCardContent>
            </IonCard>
          </>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <IonButton
            expand="block"
            color="primary"
            onClick={handleGoHome}
            className="action-button"
          >
            <IonIcon slot="start" icon={home} />
            Go to Home
          </IonButton>

          <div className="secondary-buttons">
            {purchaseDetails && (
              <IonButton
                fill="outline"
                color="medium"
                onClick={handleViewReceipt}
                className="secondary-button"
              >
                <IonIcon slot="start" icon={receipt} />
                View Receipt
              </IonButton>
            )}
            
            <IonButton
              fill="outline"
              color="primary"
              onClick={handleBuyMore}
              className="secondary-button"
            >
              Buy More Credits
            </IonButton>
          </div>
        </div>

        {/* Help Section */}
        <div className="help-section">
          <p className="help-text">
            Need help with your purchase?{' '}
            <a href="/support" className="help-link">
              Contact our support team
            </a>
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ThankYouPage;
