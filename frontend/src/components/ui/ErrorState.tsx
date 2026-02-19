import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { alertCircleOutline, refreshOutline } from 'ionicons/icons';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="error-state">
      <IonIcon icon={alertCircleOutline} className="error-state__icon" color="danger" />
      <h3 className="error-state__title">{title}</h3>
      <p className="error-state__message">{message}</p>
      {onRetry && (
        <IonButton onClick={onRetry} fill="outline">
          <IonIcon icon={refreshOutline} slot="start" />
          Try Again
        </IonButton>
      )}
    </div>
  );
};

export default ErrorState;
