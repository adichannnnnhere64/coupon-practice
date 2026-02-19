import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge, IonIcon, IonText } from '@ionic/react';
import { documentsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './PlanTypeCard.scss';

interface PlanTypeCardProps {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
  plansCount?: number;
  isActive?: boolean;
  onClick?: () => void;
}

const PlanTypeCard: React.FC<PlanTypeCardProps> = ({
  id,
  name,
  description,
  image,
  plansCount,
  isActive = true,
  onClick,
}) => {
  const history = useHistory();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      history.push(`/operator/${id}`);
    }
  };

  return (
    <IonCard className="plan-type-card" button onClick={handleClick}>
      <div className="plan-type-card__image">
        {image ? (
          <img src={image} alt={name} />
        ) : (
          <div className="plan-type-card__placeholder">
            <IonIcon icon={documentsOutline} />
          </div>
        )}
        {!isActive && (
          <IonBadge color="medium" className="plan-type-card__status">
            Inactive
          </IonBadge>
        )}
      </div>
      <IonCardHeader>
        <IonCardTitle className="plan-type-card__title">{name}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent className="plan-type-card__content">
        {description && (
          <IonText color="medium" className="plan-type-card__description">
            <p>{description}</p>
          </IonText>
        )}
        {plansCount !== undefined && (
          <div className="plan-type-card__footer">
            <IonBadge color="primary">
              {plansCount} {plansCount === 1 ? 'plan' : 'plans'}
            </IonBadge>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default PlanTypeCard;
