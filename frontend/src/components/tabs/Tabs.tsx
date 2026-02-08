import {
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/react';
import { home, flask, extensionPuzzle, colorFilter } from 'ionicons/icons';
import { RouteName } from '@utils/RouteName';

import './Tabs.scss';

const Tabs: React.FC = () => (
  <IonTabBar slot="bottom">
    <IonTabButton tab="welcome" href={RouteName.WELCOME}>
      <IonIcon aria-hidden="true" icon={home} />
      <IonLabel>Welcome</IonLabel>
    </IonTabButton>
    <IonTabButton tab="ui-components" href={RouteName.PRODUCTS}>
      <IonIcon aria-hidden="true" icon={colorFilter} />
      <IonLabel>UI Components</IonLabel>
    </IonTabButton>
    <IonTabButton tab="integrations" href={RouteName.ORDERS}>
      <IonIcon aria-hidden="true" icon={extensionPuzzle} />
      <IonLabel>Integrations</IonLabel>
    </IonTabButton>
    <IonTabButton tab="about" href={RouteName.ACCOUNT}>
      <IonIcon aria-hidden="true" icon={flask} />
      <IonLabel>About</IonLabel>
    </IonTabButton>
  </IonTabBar>
);

export default Tabs;
