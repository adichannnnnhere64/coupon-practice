// CouponCard.tsx
import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonButton,
  IonIcon,
  IonLabel,
  IonChip,
  IonBadge,
  IonText,
} from '@ionic/react';
import {
  checkmarkCircle,
  warningOutline,
  closeCircle,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './CouponCard.scss';

export interface PlanType {
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

export interface InventoryStatus {
  in_stock: boolean;
  available_stock: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  inventory_enabled: boolean;
}

interface CouponCardProps {
  plan: PlanType;
  inventoryStatus?: InventoryStatus;
  onSelect?: (planId: number) => void;
  checkoutPath?: string;
  showMetaData?: boolean;
  className?: string;
}

const CouponCard: React.FC<CouponCardProps> = ({
  plan,
  inventoryStatus,
  onSelect,
  checkoutPath = '/checkout',
  showMetaData = true,
  className = '',
}) => {
  const history = useHistory();

  // Get plan status message
  const getPlanStatusMessage = (): { message: string; color: string; icon: string } => {
    if (!plan.is_active) {
      return {
        message: 'Currently Unavailable',
        color: 'medium',
        icon: closeCircle,
      };
    }

    if (inventoryStatus?.inventory_enabled) {
      if (inventoryStatus.is_out_of_stock) {
        return {
          message: 'Out of Stock',
          color: 'danger',
          icon: warningOutline,
        };
      }
      if (inventoryStatus.is_low_stock) {
        return {
          message: `Only ${inventoryStatus.available_stock} left!`,
          color: 'warning',
          icon: warningOutline,
        };
      }
      if (inventoryStatus.available_stock > 0) {
        return {
          message: `${inventoryStatus.available_stock} in stock`,
          color: 'success',
          icon: checkmarkCircle,
        };
      }
    }

    return {
      message: 'In Stock',
      color: 'success',
      icon: checkmarkCircle,
    };
  };

  // Check if plan is available for purchase
  const isPlanAvailable = (): boolean => {
    if (!plan.is_active) return false;
    if (!inventoryStatus) return true;

    if (inventoryStatus.inventory_enabled) {
      return inventoryStatus.in_stock && !inventoryStatus.is_out_of_stock && inventoryStatus.available_stock > 0;
    }

    return true;
  };

  const handleSelectPlan = () => {
    if (isPlanAvailable()) {
      if (onSelect) {
        onSelect(plan.id);
      } else {
        history.push(`${checkoutPath}/${plan.id}`);
      }
    }
  };

  const available = isPlanAvailable();
  const statusMessage = getPlanStatusMessage();

  // Determine card classes
  const cardClasses = [
    'coupon-card',
    !available ? 'coupon-unavailable' : '',
    inventoryStatus?.is_low_stock ? 'low-stock' : '',
    !plan.is_active ? 'inactive-plan' : '',
    className,
  ].filter(Boolean).join(' ');

  // Format price display
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <IonCard className={cardClasses}>
      <IonCardHeader className="coupon-card-header">
        <div className="header-top-row">
          <div className="title-section">
            <IonCardTitle className="coupon-name">{plan.name}</IonCardTitle>
            {plan.discount_percentage < 0 && (
              <IonBadge color="danger" className="discount-badge">
                {Math.abs(plan.discount_percentage).toFixed(0)}% OFF
              </IonBadge>
            )}
          </div>
          <div className="price-section">
            {plan.discount_percentage < 0 ? (
              <div className="price-discounted">
                <span className="original-price">{formatPrice(plan.base_price)}</span>
                <span className="current-price">{formatPrice(plan.actual_price)}</span>
              </div>
            ) : (
              <div className="price-regular">
                <span className="current-price">{formatPrice(plan.actual_price)}</span>
              </div>
            )}
          </div>
        </div>
        <IonCardSubtitle className="coupon-description">
          {plan.description}
        </IonCardSubtitle>
      </IonCardHeader>

      <IonCardContent>
        {/* Stock Status */}
        {inventoryStatus?.inventory_enabled && (
          <div className="stock-status">
            <IonChip
              color={statusMessage.color as any}
              className="stock-chip"
            >
              <IonIcon icon={statusMessage.icon} />
              <IonLabel>{statusMessage.message}</IonLabel>
            </IonChip>
          </div>
        )}

        {/* Savings text for discounted items */}
        {plan.discount_percentage < 0 && (
          <IonText color="success" className="savings-text">
            <small>Save {formatPrice(plan.base_price - plan.actual_price)}</small>
          </IonText>
        )}

        {/* Select Plan Button */}
        <IonButton
          expand="block"
          color={available ? 'primary' : 'medium'}
          disabled={!available}
          className="select-coupon-btn"
          onClick={handleSelectPlan}
        >
          {available ? 'Select Plan' : statusMessage.message}
        </IonButton>

        {/* Meta Data */}
        {showMetaData && plan.meta_data && (
          <div className="coupon-metadata">
            <IonText color="medium">
              <small>
                <IonIcon icon={checkmarkCircle} /> {plan.meta_data}
              </small>
            </IonText>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default CouponCard;
