import React from 'react';
import { IonBreadcrumbs, IonBreadcrumb, IonIcon } from '@ionic/react';
import { homeOutline, chevronForward } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './CategoryNavigation.scss';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface CategoryNavigationProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  items,
  showHome = true,
}) => {
  const history = useHistory();

  const handleClick = (href?: string) => {
    if (href) {
      history.push(href);
    }
  };

  return (
    <div className="category-navigation">
      <IonBreadcrumbs>
        {showHome && (
          <IonBreadcrumb onClick={() => handleClick('/')}>
            <IonIcon icon={homeOutline} slot="start" />
            Home
            <IonIcon icon={chevronForward} slot="separator" />
          </IonBreadcrumb>
        )}
        {items.map((item, index) => (
          <IonBreadcrumb
            key={index}
            onClick={item.href ? () => handleClick(item.href) : undefined}
            className={item.isActive ? 'breadcrumb--active' : ''}
          >
            {item.label}
            {index < items.length - 1 && (
              <IonIcon icon={chevronForward} slot="separator" />
            )}
          </IonBreadcrumb>
        ))}
      </IonBreadcrumbs>
    </div>
  );
};

export default CategoryNavigation;
