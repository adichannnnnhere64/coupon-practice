// @components/header/DesktopHeader.tsx
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
} from '@ionic/react';
import { personCircle, settings, logOut, walletOutline } from 'ionicons/icons';
import { useState } from 'react';
import './DesktopHeader.scss';
import { RouteName } from '@utils/RouteName';
import { useAuth } from '@services/useApi';

const DesktopHeader: React.FC = () => {
  const [popoverEvent, setPopoverEvent] = useState<MouseEvent | null>(null);
  const { logout, isAuthenticated, user } = useAuth();

	console.log(user)

  const handleLogout = async (): Promise<void> => {
    if (!isAuthenticated) return; // safety guard

    await logout();
    setPopoverEvent(null);
    localStorage.removeItem('authToken');
    window.location.href = RouteName.LOGIN; // optional redirect
  };

  return (
    <IonHeader className="desktop-header">
      <IonToolbar>
        {/* Logo */}
        <div slot="start" className="header-logo">
          <IonTitle className="logo-title">Swag Coupons</IonTitle>
        </div>

        {/* Navigation */}
        <div className="header-nav">
          <IonButtons>
            <IonButton routerLink={RouteName.WELCOME}>Home</IonButton>
            <IonButton routerLink={RouteName.PRODUCTS}>Operators</IonButton>
            <IonButton routerLink={RouteName.ORDERS}>Orders</IonButton>
          </IonButtons>
        </div>

        {/* Right side */}
        <IonButtons slot="end">
          {!isAuthenticated ? (
            // ---- NOT LOGGED IN ----
            <IonButton routerLink={RouteName.LOGIN}>
              Login
            </IonButton>
          ) : (
            // ---- LOGGED IN ----
            <>

                <IonButton routerLink={RouteName.CREDIT} slot="end">
                  <IonChip color="secondary" className="credit-chip">
                    <IonIcon icon={walletOutline} />
                    <IonLabel>{user?.wallet_balance}</IonLabel>
                  </IonChip>
                </IonButton>

              <IonButton
                fill="clear"
                onClick={(e) => setPopoverEvent(e.nativeEvent)}
              >
                <IonIcon slot="icon-only" icon={personCircle} size="large" />
              </IonButton>

              <IonPopover
                isOpen={!!popoverEvent}
                event={popoverEvent}
                onDidDismiss={() => setPopoverEvent(null)}
                className="user-dropdown-popover"
                side="bottom"
                alignment="end"
              >
                <IonList>
                  <IonItem lines="none">
                    <IonLabel>
                      <strong>{user?.name || user?.email}</strong>
                    </IonLabel>
                  </IonItem>

                  <IonItem
                    button
                    detail={false}
                    routerLink={RouteName.ACCOUNT}
                    onClick={() => setPopoverEvent(null)}
                  >
                    <IonIcon icon={settings} slot="start" />
                    <IonLabel>Settings</IonLabel>
                  </IonItem>

                  <IonItem
                    button
                    detail={false}
                    onClick={handleLogout}
                    className="logout-item"
                  >
                    <IonIcon icon={logOut} slot="start" />
                    <IonLabel>Logout</IonLabel>
                  </IonItem>
                </IonList>
              </IonPopover>
            </>
          )}
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default DesktopHeader;

