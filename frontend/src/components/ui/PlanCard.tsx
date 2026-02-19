import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonBadge,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { cartOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import PriceDisplay from './PriceDisplay';
import StockBadge from './StockBadge';
import './PlanCard.scss';

interface PlanAttribute {
  id: number;
  name: string;
  value: string | number | boolean;
}

interface PlanCardProps {
  id: number;
  name: string;
  description?: string | null;
  basePrice: number;
  actualPrice: number;
  isActive?: boolean;
  planTypeName?: string;
  image?: string | null;
  stockAvailable?: number;
  attributes?: PlanAttribute[];
  validityDays?: number;
  onClick?: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  id,
  name,
  description,
  basePrice,
  actualPrice,
  isActive = true,
  planTypeName,
  image,
  stockAvailable,
  attributes,
  validityDays,
  onClick,
}) => {
  const history = useHistory();
  const hasDiscount = basePrice > actualPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((basePrice - actualPrice) / basePrice) * 100)
    : 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      history.push(`/checkout/${id}`);
    }
  };

  const isOutOfStock = stockAvailable !== undefined && stockAvailable <= 0;

  return (
    <IonCard className="plan-card" button={!isOutOfStock} onClick={isOutOfStock ? undefined : handleClick}>
      <div className="plan-card__image">
        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <div className="plan-card__placeholder">
            {planTypeName?.charAt(0) || name.charAt(0)}
          </div>
        )}

        <div className="plan-card__badges">
          {discountPercentage > 0 && (
            <IonBadge color="danger" className="plan-card__discount">
              {discountPercentage}% OFF
            </IonBadge>
          )}
          {!isActive && (
            <IonBadge color="medium" className="plan-card__status">
              Inactive
            </IonBadge>
          )}
          {planTypeName && (
            <IonBadge color="primary" className="plan-card__type">
              {planTypeName}
            </IonBadge>
          )}
        </div>
      </div>

      <IonCardHeader>
        <IonCardTitle className="plan-card__title">{name}</IonCardTitle>
        {description && (
          <IonCardSubtitle className="plan-card__subtitle">
            {description}
          </IonCardSubtitle>
        )}
      </IonCardHeader>

      <IonCardContent className="plan-card__content">
        {attributes && attributes.length > 0 && (
          <div className="plan-card__attributes">
            {attributes.slice(0, 2).map((attr) => (
              <div key={attr.id} className="plan-card__attribute">
                <span className="plan-card__attribute-name">{attr.name}:</span>
                <span className="plan-card__attribute-value">{String(attr.value)}</span>
              </div>
            ))}
            {validityDays && (
              <div className="plan-card__attribute">
                <span className="plan-card__attribute-name">Validity:</span>
                <span className="plan-card__attribute-value">{validityDays} days</span>
              </div>
            )}
          </div>
        )}

        <div className="plan-card__footer">
          <div className="plan-card__pricing">
            <PriceDisplay
              basePrice={basePrice}
              actualPrice={actualPrice}
              size="medium"
              showSavings={false}
            />
          </div>

          {stockAvailable !== undefined && (
            <div className="plan-card__stock">
              <StockBadge available={stockAvailable} showCount={stockAvailable <= 10} />
            </div>
          )}
        </div>

        <IonButton
          expand="block"
          color={isOutOfStock ? 'medium' : 'primary'}
          disabled={isOutOfStock || !isActive}
          className="plan-card__button"
        >
          <IonIcon icon={cartOutline} slot="start" />
          {isOutOfStock ? 'Out of Stock' : 'View Details'}
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default PlanCard;
