import React from 'react';
import { IonCard, IonCardContent, IonIcon, IonText } from '@ionic/react';
import { gridOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './CategoryCard.scss';

interface CategoryCardProps {
  id: number;
  name: string;
  description?: string | null;
  iconUrl?: string;
  planTypesCount?: number;
  onClick?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  name,
  description,
  iconUrl,
  // planTypesCount,
  onClick,
}) => {
  const history = useHistory();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      history.push(`/category/${id}`);
    }
  };

  return (
    <IonCard className="category-card" button onClick={handleClick}>
      <IonCardContent className="category-card__content">
        <div className="category-card__icon-wrapper">
          {iconUrl ? (
            <img src={iconUrl} alt={name} className="category-card__icon" />
          ) : (
            <IonIcon icon={gridOutline} className="category-card__icon-default" />
          )}
        </div>
        <div className="category-card__info">
          <h3 className="category-card__name">{name}</h3>
          {description && (
            <IonText color="medium" className="category-card__description">
              <p>{description}</p>
            </IonText>
          )}
          {/* {planTypesCount !== undefined && ( */}
          {/*   <span className="category-card__count"> */}
          {/*     {planTypesCount} {planTypesCount === 1 ? 'type' : 'types'} */}
          {/*   </span> */}
          {/* )} */}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default CategoryCard;
