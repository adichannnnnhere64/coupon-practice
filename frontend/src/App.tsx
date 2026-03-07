import { IonReactRouter } from '@ionic/react-router';
import { useEffect } from 'react';
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
import CategoryPage from '@pages/CategoryPage';
import { Route, Switch, Redirect, useLocation } from 'react-router-dom';
import { RouteName } from '@utils/RouteName';

// Admin Pages
import {
  AdminLoginPage,
  DashboardPage as AdminDashboardPage,
  UsersPage as AdminUsersPage,
  CategoriesPage as AdminCategoriesPage,
  PlanTypesPage as AdminPlanTypesPage,
  PlansPage as AdminPlansPage,
  CouponsPage as AdminCouponsPage,
  ReportsPage as AdminReportsPage,
  PrintSettingsPage as AdminPrintSettingsPage,
  SettingsPage as AdminSettingsPage,
} from '@pages/admin';

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
import { NotificationProvider } from '@components/NotificationProvider';
import { QueryProvider } from '@providers/QueryProvider';

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

// Protected Admin Route Component
const ProtectedAdminRoute: React.FC<{ component: React.ComponentType<any>; path: string; exact?: boolean }> = ({
  component: Component,
  path,
  exact = false
}) => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = isAuthenticated && user?.email?.endsWith('@coupon.com');

  return (
    <Route
      exact={exact}
      path={path}
      render={(props) => {
        if (!isAuthenticated) {
          return <Redirect to="/admin/login" />;
        }
        if (!isAdmin) {
          return <Redirect to="/" />;
        }
        return <Component {...props} />;
      }}
    />
  );
};

// Admin Routes Component (no Ionic UI)
const AdminRoutes: React.FC = () => {
  return (
    <Switch>
      <Route exact path="/admin/login" component={AdminLoginPage} />
      <ProtectedAdminRoute exact path={RouteName.ADMIN} component={AdminDashboardPage} />
      <ProtectedAdminRoute exact path={RouteName.ADMIN_USERS} component={AdminUsersPage} />
      <ProtectedAdminRoute exact path={RouteName.ADMIN_CATEGORIES} component={AdminCategoriesPage} />
      <ProtectedAdminRoute exact path={RouteName.ADMIN_PLAN_TYPES} component={AdminPlanTypesPage} />
      <ProtectedAdminRoute exact path={RouteName.ADMIN_PLANS} component={AdminPlansPage} />
      <ProtectedAdminRoute exact path={RouteName.ADMIN_COUPONS} component={AdminCouponsPage} />
      <ProtectedAdminRoute exact path={RouteName.ADMIN_REPORTS} component={AdminReportsPage} />
      <ProtectedAdminRoute exact path={RouteName.ADMIN_PRINT_SETTINGS} component={AdminPrintSettingsPage} />
      <ProtectedAdminRoute exact path={RouteName.ADMIN_SETTINGS} component={AdminSettingsPage} />
    </Switch>
  );
};

// Main App Routes (Ionic UI)
const MainAppRoutes: React.FC<{ isMobile: boolean; isAuthenticated: boolean; user: any }> = ({ isMobile, isAuthenticated, user }) => {
  return (
    <>
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
            <Route exact path="/category/:categoryId">
              <CategoryPage />
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
          <Route exact path="/category/:categoryId">
            <CategoryPage />
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
    </>
  );
};

// Router wrapper that determines which app to render
const AppRouter: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isMobile = window.innerWidth < 768;
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const className = 'admin-scroll';
    document.documentElement.classList.toggle(className, isAdminRoute);
    document.body.classList.toggle(className, isAdminRoute);
    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, [isAdminRoute]);

  if (isAdminRoute) {
    return <AdminRoutes />;
  }

  return (
    <IonApp>
      <MainAppRoutes isMobile={isMobile} isAuthenticated={isAuthenticated} user={user} />
    </IonApp>
  );
};

const App: React.FC = () => {
  return (
    <QueryProvider>
      <NotificationProvider>
        <IonReactRouter>
          <AppRouter />
        </IonReactRouter>
      </NotificationProvider>
    </QueryProvider>
  );
};

export default App;
