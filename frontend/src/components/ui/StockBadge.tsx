import React from 'react';
import { IonBadge, IonIcon } from '@ionic/react';
import { checkmarkCircle, alertCircle, closeCircle } from 'ionicons/icons';

interface StockBadgeProps {
  available: number;
  lowStockThreshold?: number;
  showCount?: boolean;
}

const StockBadge: React.FC<StockBadgeProps> = ({
  available,
  lowStockThreshold = 5,
  showCount = true,
}) => {
  const isOutOfStock = available <= 0;
  const isLowStock = available > 0 && available <= lowStockThreshold;

  if (isOutOfStock) {
    return (
      <IonBadge color="danger" className="stock-badge stock-badge--out">
        <IonIcon icon={closeCircle} />
        <span>Out of Stock</span>
      </IonBadge>
    );
  }

  if (isLowStock) {
    return (
      <IonBadge color="warning" className="stock-badge stock-badge--low">
        <IonIcon icon={alertCircle} />
        <span>{showCount ? `Only ${available} left` : 'Low Stock'}</span>
      </IonBadge>
    );
  }

  return (
    <IonBadge color="success" className="stock-badge stock-badge--in">
      <IonIcon icon={checkmarkCircle} />
      <span>{showCount ? `${available} in stock` : 'In Stock'}</span>
    </IonBadge>
  );
};

export default StockBadge;
