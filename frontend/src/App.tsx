import { IonReactRouter } from '@ionic/react-router';
import WelcomePage from '@pages/WelcomePage';
import { 
  IonApp, 
  setupIonicReact, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel, 
  IonRouterOutlet, 
  IonTabs, 
  IonButtons, 
  IonChip, 
  IonHeader, 
  IonToolbar, 
  IonMenuButton, 
  IonTitle, 
  IonButton
} from '@ionic/react';
import { 
  home, 
  cash, 
  settings, 
  list, 
  walletOutline, 
  logInOutline 
} from 'ionicons/icons';
import ProductPage from '@pages/OperatorPage';
import CheckoutPage from '@pages/CheckoutPage';
import { Route } from 'react-router-dom';
import { RouteName } from '@utils/RouteName';

// Stylings
import './global.scss';
import TauriAPI from '@services/TauriAPI';
import AppHeader from '@components/header/AppHeader';
import AccountPage from '@pages/AccountPage';
import SearchPage from '@pages/SearchPage';
import OrderListPage from '@pages/OrderListPage';
import LoginPage from '@pages/LoginPage';
import RegisterPage from '@pages/RegisterPage';
import { useAuth } from '@services/useApi';
import BuyCreditsPage from '@pages/BuyCreditPage';
import ThankYouPage from '@pages/ThankYouPage';

let platformMode;

TauriAPI.getPlatformName().then((name) => {
  switch (name) {
    case 'macos':
    case 'ios':
      platformMode = 'ios';
      break;
    default:
      platformMode = 'md';
      break;
  }
});

setupIonicReact({
  mode: platformMode,
  rippleEffect: true,
  animated: true,
});

const App: React.FC = () => {
  const isMobile = window.innerWidth < 768;
  const { isAuthenticated, user } = useAuth();

  return (
    <IonApp>
      <IonReactRouter>
        {/* Show header only on desktop */}
        {!isMobile && <AppHeader />}

        {/* Mobile header */}
        {isMobile && (
          <IonHeader>
            <IonToolbar color="primary">
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>Swag Coupons Coupons</IonTitle>
              {isAuthenticated && (
                <IonButtons slot="end">
		<IonButton routerLink={RouteName.CREDIT} slot="end">
                  <IonChip color="secondary" className="credit-chip">
                    <IonIcon icon={walletOutline} />
                    <IonLabel>${parseFloat(user?.wallet_balance || '0').toFixed(2)}</IonLabel>
                  </IonChip>
		 </IonButton>
                </IonButtons>
              )}
            </IonToolbar>
          </IonHeader>
        )}

        {isMobile ? (
          // Mobile layout with tabs
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path={RouteName.WELCOME}>
                <WelcomePage />
              </Route>
              <Route exact path={RouteName.LOGIN}>
                <LoginPage />
              </Route>
              <Route exact path="/register">
                <RegisterPage />
              </Route>
              <Route exact path={RouteName.PRODUCTS}>
                <SearchPage />
              </Route>
             <Route exact path={RouteName.THANKYOU}>
                <ThankYouPage />
              </Route>

              <Route exact path="/orders">
                <OrderListPage />
              </Route>
              <Route exact path={RouteName.ACCOUNT}>
                <AccountPage />
              </Route>
              <Route exact path="/operator/:productId">
                <ProductPage />
              </Route>
            <Route exact path={RouteName.CREDIT}>
              <BuyCreditsPage />
            </Route>

              <Route exact path="/checkout/:productId">
                <CheckoutPage />
              </Route>
            </IonRouterOutlet>

            {/* Conditional Tab Bar */}
            <IonTabBar slot="bottom">
              <IonTabButton tab="welcome" href={RouteName.WELCOME}>
                <IonIcon aria-hidden="true" icon={home} />
                <IonLabel>Home</IonLabel>
              </IonTabButton>
              
              <IonTabButton tab="ui-components" href={RouteName.PRODUCTS}>
                <IonIcon aria-hidden="true" icon={list} />
                <IonLabel>Operators</IonLabel>
              </IonTabButton>


							  {isAuthenticated ? (
    <IonTabButton tab="integrations" href={RouteName.ORDERS}>
      <IonIcon icon={cash} />
      <IonLabel>Orders</IonLabel>
    </IonTabButton>
  ) : null}

  {isAuthenticated ? (
    <IonTabButton tab="about" href={RouteName.ACCOUNT}>
      <IonIcon icon={settings} />
      <IonLabel>Settings</IonLabel>
    </IonTabButton>
  ) : (
    <IonTabButton tab="login" href={RouteName.LOGIN}>
      <IonIcon icon={logInOutline} />
      <IonLabel>Sign In</IonLabel>
    </IonTabButton>
  )}

            </IonTabBar>
          </IonTabs>
        ) : (
          // Desktop layout without tabs
          <IonRouterOutlet>
            <Route exact path={RouteName.WELCOME}>
              <WelcomePage />
            </Route>
            <Route exact path={RouteName.LOGIN}>
              <LoginPage />
            </Route>
            <Route exact path="/register">
              <RegisterPage />
            </Route>
            <Route exact path={RouteName.PRODUCTS}>
              <SearchPage />
            </Route>
            <Route exact path={RouteName.ORDERS}>
              <OrderListPage />
            </Route>
            <Route exact path={RouteName.ACCOUNT}>
              <AccountPage />
            </Route>
            <Route exact path="/operator/:productId">
              <ProductPage />
            </Route>
            <Route exact path={RouteName.CREDIT}>
              <BuyCreditsPage />
            </Route>
            <Route exact path="/checkout/:productId">
              <CheckoutPage />
            </Route>
             <Route exact path={RouteName.THANKYOU}>
                <ThankYouPage />
              </Route>
          </IonRouterOutlet>
        )}
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
