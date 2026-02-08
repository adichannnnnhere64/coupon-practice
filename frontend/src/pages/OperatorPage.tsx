import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonLabel,
  IonChip,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonText,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  heart,
  shareSocial,
  arrowBack,
  pricetag,
  checkmarkCircle,
  flashOutline,
  timeOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import './OperatorPage.scss';
import apiClient from '@services/APIService';

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
  created_at: string;
  updated_at: string;
}

interface Operator {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  plans_count: number;
  plan_types: PlanType[];
  image: string;
  created_at: string;
  updated_at: string;
}

const OperatorPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const history = useHistory();
  
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOperator = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiClient.getPlanType(parseInt(productId || '1')) as any;
        
        if (result) {
          setOperator(result);
        } else {
          setError('Operator not found');
        }
      } catch (err) {
        console.error('Error fetching operator:', err);
        setError('Failed to load operator');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchOperator();
    }
  }, [productId]);

  const handlePlanClick = (planId: number) => {
    history.push(`/checkout/${planId}`);
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
          <div className="ion-padding ion-text-center" style={{ marginTop: '50%' }}>
            <IonSpinner name="crescent" />
            <p>Loading operator details...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error || !operator) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/" />
            </IonButtons>
            <IonTitle>Operator Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="ion-padding ion-text-center">
            <h2>{error || 'Operator not found'}</h2>
            <IonButton onClick={() => history.push('/')}>Back to Home</IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="product-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon slot="icon-only" icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>{operator.name}</IonTitle>
          <IonButtons slot="end">
            <IonButton>
              <IonIcon slot="icon-only" icon={heart} />
            </IonButton>
            <IonButton>
              <IonIcon slot="icon-only" icon={shareSocial} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Operator Image Gallery */}
        <div className="product-gallery">
          <div className="main-image">
            {operator.is_active && (
              <IonChip className="product-tag" color="success">
                <IonLabel>Active</IonLabel>
              </IonChip>
            )}
            {operator.image ? (
              <img 
                src={operator.image} 
                alt={operator.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <IonIcon icon={pricetag} className="product-icon-large" />
            )}
          </div>
        </div>

        {/* Operator Info */}
        <div className="product-info ion-padding">
          <div className="product-header">
            <div>
              <IonChip color="primary" outline>
                <IonLabel>Operator</IonLabel>
              </IonChip>
              <h1 className="product-title">{operator.name}</h1>
            </div>
          </div>

          <p className="product-description">{operator.description}</p>

          {/* Features Section */}
          <IonGrid className="features-grid ion-margin-vertical">
            <IonRow>
              <IonCol size="4" className="ion-text-center">
                <div className="feature-item">
                  <IonIcon icon={flashOutline} color="primary" size="large" />
                  <IonText color="medium">
                    <small>Instant</small>
                  </IonText>
                </div>
              </IonCol>
              <IonCol size="4" className="ion-text-center">
                <div className="feature-item">
                  <IonIcon icon={shieldCheckmarkOutline} color="success" size="large" />
                  <IonText color="medium">
                    <small>Secure</small>
                  </IonText>
                </div>
              </IonCol>
              <IonCol size="4" className="ion-text-center">
                <div className="feature-item">
                  <IonIcon icon={timeOutline} color="warning" size="large" />
                  <IonText color="medium">
                    <small>24/7</small>
                  </IonText>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Available Plans Section */}
          <div className="plans-section">
            <div className="section-header">
              <h2>Available Plans</h2>
              <IonBadge color="primary">{operator.plans_count}</IonBadge>
            </div>

            {operator.plan_types && operator.plan_types.length > 0 ? (
              <div className="plans-list">
                {operator.plan_types.map((plan) => (
                  <IonCard 
                    key={plan.id} 
                    className={`plan-card ${!plan.is_active ? 'inactive-plan' : ''}`}
                    button={plan.is_active}
                    onClick={() => plan.is_active && handlePlanClick(plan.id)}
                  >
                    <IonCardHeader>
                      <div className="plan-card-header">
                        <div>
                          <IonCardTitle className="plan-name">{plan.name}</IonCardTitle>
                          <IonCardSubtitle>{plan.description}</IonCardSubtitle>
                        </div>
                        {plan.discount_percentage < 0 && (
                          <IonBadge color="danger" className="discount-badge">
                            {Math.abs(plan.discount_percentage).toFixed(0)}% OFF
                          </IonBadge>
                        )}
                      </div>
                    </IonCardHeader>

                    <IonCardContent>
                      <div className="plan-pricing-section">
                        {plan.discount_percentage < 0 ? (
                          <div className="pricing-discounted">
                            <span className="original-price">${plan.base_price.toFixed(2)}</span>
                            <span className="current-price">${plan.actual_price.toFixed(2)}</span>
                            <IonText color="success" className="savings">
                              <small>Save ${(plan.base_price - plan.actual_price).toFixed(2)}</small>
                            </IonText>
                          </div>
                        ) : (
                          <div className="pricing-regular">
                            <span className="current-price">${plan.actual_price.toFixed(2)}</span>
                          </div>
                        )}

                        <IonButton
                          expand="block"
                          color={plan.is_active ? 'primary' : 'medium'}
                          disabled={!plan.is_active}
                          className="select-plan-btn"
                        >
                          {plan.is_active ? 'Select Plan' : 'Not Available'}
                        </IonButton>
                      </div>

                      {plan.meta_data && (
                        <div className="plan-metadata">
                          <IonText color="medium">
                            <small><IonIcon icon={checkmarkCircle} /> {plan.meta_data}</small>
                          </IonText>
                        </div>
                      )}
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            ) : (
              <IonCard>
                <IonCardContent className="ion-text-center">
                  <IonText color="medium">
                    <p>No plans available at the moment.</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            )}
          </div>

          {/* Additional Information */}
          <IonCard className="info-card ion-margin-top">
            <IonCardContent>
              <h3 className="info-title">Why Choose Us?</h3>
              <div className="info-list">
                <div className="info-item">
                  <IonIcon icon={checkmarkCircle} color="success" />
                  <div>
                    <strong>Instant Activation</strong>
                    <p>Your plan activates immediately after purchase</p>
                  </div>
                </div>
                <div className="info-item">
                  <IonIcon icon={checkmarkCircle} color="success" />
                  <div>
                    <strong>Secure Payments</strong>
                    <p>100% safe and encrypted transactions</p>
                  </div>
                </div>
                <div className="info-item">
                  <IonIcon icon={checkmarkCircle} color="success" />
                  <div>
                    <strong>24/7 Support</strong>
                    <p>Get help whenever you need it</p>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OperatorPage;
