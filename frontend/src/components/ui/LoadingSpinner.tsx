import React from 'react';
import { IonSpinner } from '@ionic/react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'default' | 'large';
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'default',
  fullPage = false,
}) => {
  const sizeMap = {
    small: { width: '24px', height: '24px' },
    default: { width: '32px', height: '32px' },
    large: { width: '48px', height: '48px' },
  };

  const spinnerStyle = sizeMap[size];

  if (fullPage) {
    return (
      <div className="loading-spinner loading-spinner--full-page">
        <div className="loading-spinner__content">
          <IonSpinner name="crescent" style={spinnerStyle} />
          {message && <p className="loading-spinner__message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-spinner">
      <IonSpinner name="crescent" style={spinnerStyle} />
      {message && <p className="loading-spinner__message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
