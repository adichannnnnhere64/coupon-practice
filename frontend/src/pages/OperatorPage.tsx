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
  // IonCardHeader,
  // IonCardTitle,
  // IonCardSubtitle,
  IonText,
  IonSpinner,
  // IonGrid,
  // IonRow,
  // IonCol,
  IonBadge,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  heart,
  shareSocial,
  arrowBack,
  pricetag,
  // checkmarkCircle,
  // flashOutline,
  // timeOutline,
  // shieldCheckmarkOutline,
  // warningOutline,
  // closeCircle,
} from 'ionicons/icons';
import './OperatorPage.scss';
import apiClient from '@services/APIService';
import CouponCard from '@components/ui/CouponCard';

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
  // Add inventory fields
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
  [planId: number]: {
    in_stock: boolean;
    available_stock: number;
    is_low_stock: boolean;
    is_out_of_stock: boolean;
    inventory_enabled: boolean;
  };
}

const OperatorPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const history = useHistory();

  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus>({});
  const [checkingInventory, setCheckingInventory] = useState(false);

  useEffect(() => {
    const fetchOperator = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiClient.getPlanType(parseInt(productId || '1')) as any;

        if (result) {
          setOperator(result);
          // Check inventory for all active plans
          if (result.plan_types && result.plan_types.length > 0) {
            await checkPlansInventory(result.plan_types);
          }
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

  // Check inventory for all plans
  const checkPlansInventory = async (plans: PlanType[]) => {
    try {
      setCheckingInventory(true);
      const statusMap: InventoryStatus = {};

      // Check each active plan's inventory
      await Promise.all(
        plans.map(async (plan) => {
          try {
            const response = await apiClient.get<{
              success: boolean;
              data: {
                in_stock: boolean;
                available_stock: number;
                is_low_stock: boolean;
                is_out_of_stock: boolean;
                inventory_enabled: boolean;
              };
            }>(`/plans/${plan.id}/inventory/check`);

            if (response.success && response.data) {
              statusMap[plan.id] = response.data;
            } else {
              // Default values if no inventory data
              statusMap[plan.id] = {
                in_stock: true,
                available_stock: 999,
                is_low_stock: false,
                is_out_of_stock: false,
                inventory_enabled: false,
              };
            }
          } catch (error) {
            console.error(`Error checking inventory for plan ${plan.id}:`, error);
            // If inventory check fails, assume it's in stock
            statusMap[plan.id] = {
              in_stock: true,
              available_stock: 999,
              is_low_stock: false,
              is_out_of_stock: false,
              inventory_enabled: false,
            };
          }
        })
      );

      setInventoryStatus(statusMap);
    } catch (error) {
      console.error('Error checking inventory:', error);
    } finally {
      setCheckingInventory(false);
    }
  };

  // const handlePlanClick = (planId: number) => {
  //   const plan = operator?.plan_types.find(p => p.id === planId);
  //   const status = inventoryStatus[planId];
  //
  //   // Check if plan is available to purchase
  //   const isAvailable = plan?.is_active &&
  //     (!status?.inventory_enabled || (status?.in_stock && !status?.is_out_of_stock));
  //
  //   if (isAvailable) {
  //     history.push(`/operator/${planId}`);
  //   }
  // };

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
