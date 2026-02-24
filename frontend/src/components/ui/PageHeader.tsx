import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonIcon,
} from '@ionic/react';
import { arrowBack, chevronBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { isPlatform } from '@ionic/react';
import './PageHeader.scss';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  defaultHref?: string;
  showBackButton?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  rightButtons?: React.ReactNode;
  transparent?: boolean;
  onBack?: () => void;
}

export function PageHeader({
  title,
  defaultHref = '/',
  showBackButton = true,
  breadcrumbs,
  rightButtons,
  transparent = false,
  onBack,
}: PageHeaderProps) {
  const history = useHistory();
  const isIos = isPlatform('ios');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (history.length > 1) {
      history.goBack();
    } else {
      history.push(defaultHref);
    }
  };

  return (
    <IonHeader className={`page-header ${transparent ? 'page-header--transparent' : ''}`}>
      <IonToolbar>
        {showBackButton && (
          <IonButtons slot="start">
            <IonButton
              className="page-header__back-btn"
              onClick={handleBack}
              fill="clear"
            >
              <IonIcon
                slot="icon-only"
                icon={isIos ? chevronBack : arrowBack}
              />
            </IonButton>
          </IonButtons>
        )}

        {breadcrumbs && breadcrumbs.length > 0 ? (
          <div className="page-header__breadcrumbs" slot="start">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="page-header__breadcrumb">
                {crumb.href ? (
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      history.push(crumb.href!);
                    }}
                    className="page-header__breadcrumb-link"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="page-header__breadcrumb-text">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <IonIcon
                    icon={chevronBack}
                    className="page-header__breadcrumb-separator"
                    style={{ transform: 'rotate(180deg)' }}
                  />
                )}
              </span>
            ))}
          </div>
        ) : (
          <IonTitle>{title}</IonTitle>
        )}

        {rightButtons && (
          <IonButtons slot="end">
            {rightButtons}
          </IonButtons>
        )}
      </IonToolbar>
    </IonHeader>
  );
}

export default PageHeader;
