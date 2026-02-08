// @components/header/AppHeader.tsx
import { IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import DesktopHeader from './DesktopHeader';
import useTauriApi from '@services/useTauriApi';
import TauriAPI from '@services/TauriAPI';

const AppHeader: React.FC = () => {

  const { result: platformName } = useTauriApi(TauriAPI.getPlatformName, []);
  console.log(platformName);

  // For desktop platforms, show the full desktop header
  if (platformName == 'desktop' || window.innerWidth >= 768) {
    return <DesktopHeader />;
  }

  // For mobile, show a simpler header
  return (
    <IonHeader>
      <IonToolbar>
        <IonTitle>Swag Coupon</IonTitle>
      </IonToolbar>
    </IonHeader>
  );
};

export default AppHeader;
