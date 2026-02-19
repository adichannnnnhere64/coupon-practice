import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/react';

interface PageContainerProps {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  defaultBackHref?: string;
  headerButtons?: React.ReactNode;
  fullscreen?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
  title,
  children,
  showBack = false,
  defaultBackHref = '/',
  headerButtons,
  fullscreen = true,
}) => {
  return (
    <IonPage className="page-container">
      <IonHeader>
        <IonToolbar>
          {showBack && (
            <IonButtons slot="start">
              <IonBackButton defaultHref={defaultBackHref} />
            </IonButtons>
          )}
          <IonTitle>{title}</IonTitle>
          {headerButtons && (
            <IonButtons slot="end">
              {headerButtons}
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen={fullscreen}>
        {children}
      </IonContent>
    </IonPage>
  );
};

export default PageContainer;
