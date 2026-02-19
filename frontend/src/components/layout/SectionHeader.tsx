import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { arrowForward } from 'ionicons/icons';
import './SectionHeader.scss';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  actionIcon = arrowForward,
  onAction,
}) => {
  return (
    <div className="section-header">
      <div className="section-header__text">
        <h2 className="section-header__title">{title}</h2>
        {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <IonButton fill="clear" size="small" onClick={onAction} className="section-header__action">
          {actionLabel}
          <IonIcon icon={actionIcon} slot="end" />
        </IonButton>
      )}
    </div>
  );
};

export default SectionHeader;
