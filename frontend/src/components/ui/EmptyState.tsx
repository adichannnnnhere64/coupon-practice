import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = alertCircleOutline,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="empty-state">
      <IonIcon icon={icon} className="empty-state__icon" />
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {actionLabel && onAction && (
        <IonButton onClick={onAction} className="empty-state__action">
          {actionLabel}
        </IonButton>
      )}
    </div>
  );
};

export default EmptyState;
