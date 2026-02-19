import React from 'react';
import { IonText } from '@ionic/react';

interface PriceDisplayProps {
  basePrice: number;
  actualPrice: number;
  size?: 'small' | 'medium' | 'large';
  showSavings?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  basePrice,
  actualPrice,
  size = 'medium',
  showSavings = true,
}) => {
  const hasDiscount = basePrice > actualPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((basePrice - actualPrice) / basePrice) * 100)
    : 0;
  const savings = basePrice - actualPrice;

  const sizeClasses = {
    small: 'price-display--small',
    medium: 'price-display--medium',
    large: 'price-display--large',
  };

  return (
    <div className={`price-display ${sizeClasses[size]}`}>
      {hasDiscount ? (
        <>
          <span className="price-display__original">${basePrice.toFixed(2)}</span>
          <span className="price-display__current">${actualPrice.toFixed(2)}</span>
          {showSavings && (
            <IonText color="success" className="price-display__savings">
              <small>Save ${savings.toFixed(2)} ({discountPercentage}%)</small>
            </IonText>
          )}
        </>
      ) : (
        <span className="price-display__current">${actualPrice.toFixed(2)}</span>
      )}
    </div>
  );
};

export default PriceDisplay;
