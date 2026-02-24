import React from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonLabel,
  IonChip,
  IonCard,
  IonCardContent,
  IonText,
  IonSpinner,
  IonBadge,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { heart, shareSocial, pricetag } from 'ionicons/icons';
import { useQueries } from '@tanstack/react-query';
import './OperatorPage.scss';
import apiClient from '@services/APIService';
import CouponCard from '@components/ui/CouponCard';
import { PageHeader } from '@components/ui';

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
  inventory_enabled?: boolean;
  available_stock?: number;
  total_stock?: number;
  is_low_stock?: boolean;
  is_out_of_stock?: boolean;
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

interface InventoryStatus {
  in_stock: boolean;
  available_stock: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  inventory_enabled: boolean;
}

const OperatorPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const history = useHistory();
  const operatorId = parseInt(productId || '1');

  // Fetch operator data with React Query
  const operatorQuery = useQueries({
    queries: [
      {
        queryKey: ['planType', operatorId],
        queryFn: () => apiClient.getPlanType(operatorId) as unknown as Promise<Operator>,
        enabled: !!productId,
      },
    ],
  })[0];

  const operator = operatorQuery.data;
  const loading = operatorQuery.isLoading;
  const error = operatorQuery.error ? 'Failed to load operator' : null;

  // Fetch inventory for all plans
  const inventoryQueries = useQueries({
    queries: (operator?.plan_types || []).map((plan) => ({
      queryKey: ['planInventory', plan.id],
      queryFn: async () => {
        const response = await apiClient.get<{
          success: boolean;
          data: InventoryStatus;
        }>(`/plans/${plan.id}/inventory/check`);
        return { planId: plan.id, data: response.data };
      },
      enabled: !!operator?.plan_types?.length,
      staleTime: 1000 * 30, // 30 seconds
    })),
  });

  const checkingInventory = inventoryQueries.some((q) => q.isLoading);

  // Build inventory status map from queries
  const inventoryStatus = inventoryQueries.reduce((acc, query) => {
    if (query.data) {
      acc[query.data.planId] = query.data.data || {
        in_stock: true,
        available_stock: 999,
        is_low_stock: false,
        is_out_of_stock: false,
        inventory_enabled: false,
      };
    }
    return acc;
  }, {} as Record<number, InventoryStatus>);

  if (loading) {
    return (
      <IonPage>
        <PageHeader title="Loading..." defaultHref="/" />
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
        <PageHeader title="Operator Not Found" defaultHref="/" />
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
      <PageHeader
        title={operator.name}
        defaultHref="/"
        rightButtons={
          <>
            <IonButton>
              <IonIcon slot="icon-only" icon={heart} />
            </IonButton>
            <IonButton>
              <IonIcon slot="icon-only" icon={shareSocial} />
            </IonButton>
          </>
        }
      />

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
          {/* <IonGrid className="features-grid ion-margin-vertical"> */}
          {/*   <IonRow> */}
          {/*     <IonCol size="4" className="ion-text-center"> */}
          {/*       <div className="feature-item"> */}
          {/*         <IonIcon icon={flashOutline} color="primary" size="large" /> */}
          {/*         <IonText color="medium"> */}
          {/*           <small>Instant</small> */}
          {/*         </IonText> */}
          {/*       </div> */}
          {/*     </IonCol> */}
          {/*     <IonCol size="4" className="ion-text-center"> */}
          {/*       <div className="feature-item"> */}
          {/*         <IonIcon icon={shieldCheckmarkOutline} color="success" size="large" /> */}
          {/*         <IonText color="medium"> */}
          {/*           <small>Secure</small> */}
          {/*         </IonText> */}
          {/*       </div> */}
          {/*     </IonCol> */}
          {/*     <IonCol size="4" className="ion-text-center"> */}
          {/*       <div className="feature-item"> */}
          {/*         <IonIcon icon={timeOutline} color="warning" size="large" /> */}
          {/*         <IonText color="medium"> */}
          {/*           <small>24/7</small> */}
          {/*         </IonText> */}
          {/*       </div> */}
          {/*     </IonCol> */}
          {/*   </IonRow> */}
          {/* </IonGrid> */}
          {/**/}
          {/* Available Plans Section */}
          <div className="plans-section">
            <div className="section-header">
              <h2>Available Coupons</h2>
              <div className="section-header-right">
                {checkingInventory && <IonSpinner name="dots" />}
                <IonBadge color="primary">{operator.plans_count}</IonBadge>
              </div>
            </div>

            {operator.plan_types && operator.plan_types.length > 0 ? (
              <div className="plans-list">
                {operator.plan_types.map((plan) => {
              {/* const isAvailable = isPlanAvailable(plan); */}
              {/* const statusMessage = getPlanStatusMessage(plan); */}

              return (
              <CouponCard
                                                key={plan.id}
                plan={plan}
                inventoryStatus={inventoryStatus[plan.id]}
                checkoutPath="/checkout"
                                        />

              );
            })}
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

          {/* {/* Additional Information */}
          {/* <IonCard className="info-card ion-margin-top"> */}
          {/*   <IonCardContent> */}
          {/*     <h3 className="info-title">Why Choose Us?</h3> */}
          {/*     <div className="info-list"> */}
          {/*       <div className="info-item"> */}
          {/*         <IonIcon icon={checkmarkCircle} color="success" /> */}
          {/*         <div> */}
          {/*           <strong>Instant Activation</strong> */}
          {/*           <p>Your plan activates immediately after purchase</p> */}
          {/*         </div> */}
          {/*       </div> */}
          {/*       <div className="info-item"> */}
          {/*         <IonIcon icon={checkmarkCircle} color="success" /> */}
          {/*         <div> */}
          {/*           <strong>Secure Payments</strong> */}
          {/*           <p>100% safe and encrypted transactions</p> */}
          {/*         </div> */}
          {/*       </div> */}
          {/*       <div className="info-item"> */}
          {/*         <IonIcon icon={checkmarkCircle} color="success" /> */}
          {/*         <div> */}
          {/*           <strong>24/7 Support</strong> */}
          {/*           <p>Get help whenever you need it</p> */}
          {/*         </div> */}
          {/*       </div> */}
          {/*     </div> */}
          {/*   </IonCardContent> */}
          {/* </IonCard> */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OperatorPage;
