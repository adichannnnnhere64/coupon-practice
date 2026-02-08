import React, { ReactElement, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  // IonItem,
  // IonLabel,
  // IonInput,
  IonButton,
  IonIcon,
  IonAvatar,
  IonGrid,
  IonRow,
  IonCol,
  // IonList,
  // IonToggle,
  IonAlert,
} from '@ionic/react';
import {
  personCircle,
  // mail,
  // phonePortrait,
  // location,
  // lockClosed,
  // notifications,
  // shieldCheckmark,
  logOut,
  // save,
  // camera,
} from 'ionicons/icons';
import './AccountPage.scss';
import { RouteName } from '@utils/RouteName';
import { useAuth } from '@services/useApi';

const AccountPage: React.FC = () => {


	const {logout, isAuthenticated, user } = useAuth();

  const [userData] = useState({
    name: user?.name,
    email: user?.email,
    // phone: '+1 (555) 123-4567',
    // address: '123 Main St, New York, NY 10001',
  });
  
  // const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  // const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  // const handleInputChange = (field: string, value: string): void => {
  //   setUserData(prev => ({
  //     ...prev,
  //     [field]: value
  //   }));
  // };
  //
  //
  // const handleSaveProfile = (): void => {
  //   // In a real app, you would save to API
  //   alert('Profile updated successfully!');
  // };
  //
	  const handleLogout = async (): Promise<void> => {
    if (!isAuthenticated) return; // safety guard

    await logout();
    localStorage.removeItem('authToken');
    window.location.href = RouteName.LOGIN; // optional redirect
  };



  const stats = [
    // { label: 'Total Orders', value: '24', icon: '📦' },
    // { label: 'Total Spent', value: '$1,850.75', icon: '💰' },
  ] as any;

  return (
    <IonPage className="account-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Profile Header */}
        <div className="profile-header ion-padding">
          <div className="profile-info">
            <div className="avatar-container">
              <IonAvatar className="profile-avatar">
                <IonIcon icon={personCircle} />
              </IonAvatar>
              {/* <IonButton fill="clear" size="small" className="change-photo-btn"> */}
                {/* <IonIcon icon={camera} /> */}
              {/* </IonButton> */}
            </div>
            <div className="profile-details">
              <h2>{userData.name}</h2>
              <p>{userData.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview ion-padding">
          <IonGrid>
            <IonRow>
              {stats.map((stat: any, index: any): ReactElement<any, any> => (
                <IonCol size="6" key={index}>
                  <div className="stat-card">
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-content">
                      <h3>{stat.value}</h3>
                      <p>{stat.label}</p>
                    </div>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>

        {/* Profile Form */}
        {/* <IonCard className="profile-form-card"> */}
        {/*   <IonCardHeader> */}
        {/*     <IonCardTitle>Personal Information</IonCardTitle> */}
        {/*   </IonCardHeader> */}
        {/*   <IonCardContent> */}
        {/*     <IonList lines="none"> */}
        {/*       <IonItem> */}
        {/*         <IonIcon slot="start" icon={personCircle} color="primary" /> */}
        {/*         <IonLabel position="floating">Full Name</IonLabel> */}
        {/*         <IonInput */}
        {/*           value={userData.name} */}
        {/*           onIonChange={(e) => handleInputChange('name', e.detail.value!)} */}
        {/*         /> */}
        {/*       </IonItem> */}
        {/**/}
        {/*       <IonItem> */}
        {/*         <IonIcon slot="start" icon={mail} color="primary" /> */}
        {/*         <IonLabel position="floating">Email Address</IonLabel> */}
        {/*         <IonInput */}
        {/*           type="email" */}
        {/*           value={userData.email} */}
        {/*           onIonChange={(e) => handleInputChange('email', e.detail.value!)} */}
        {/*         /> */}
        {/*       </IonItem> */}
        {/**/}
        {/*       <IonItem> */}
        {/*         <IonIcon slot="start" icon={phonePortrait} color="primary" /> */}
        {/*         <IonLabel position="floating">Phone Number</IonLabel> */}
        {/*         <IonInput */}
        {/*           type="tel" */}
        {/*           value={userData.phone} */}
        {/*           onIonChange={(e) => handleInputChange('phone', e.detail.value!)} */}
        {/*         /> */}
        {/*       </IonItem> */}
        {/**/}
        {/*       <IonItem> */}
        {/*         <IonIcon slot="start" icon={location} color="primary" /> */}
        {/*         <IonLabel position="floating">Address</IonLabel> */}
        {/*         <IonInput */}
        {/*           value={userData.address} */}
        {/*           onIonChange={(e) => handleInputChange('address', e.detail.value!)} */}
        {/*         /> */}
        {/*       </IonItem> */}
        {/*     </IonList> */}
        {/**/}
        {/*     <IonButton expand="block" onClick={handleSaveProfile}> */}
        {/*       <IonIcon slot="start" icon={save} /> */}
        {/*       Save Changes */}
        {/*     </IonButton> */}
        {/*   </IonCardContent> */}
        {/* </IonCard> */}

        {/* Security & Preferences */}
        {/* <IonCard> */}
        {/*   <IonCardHeader> */}
        {/*     <IonCardTitle>Security & Preferences</IonCardTitle> */}
        {/*   </IonCardHeader> */}
        {/*   <IonCardContent> */}
        {/*     <IonList> */}
        {/*       <IonItem> */}
        {/*         <IonIcon slot="start" icon={lockClosed} color="primary" /> */}
        {/*         <IonLabel>Change Password</IonLabel> */}
        {/*         <IonButton fill="outline" size="small" slot="end"> */}
        {/*           Change */}
        {/*         </IonButton> */}
        {/*       </IonItem> */}
        {/**/}
        {/*       <IonItem> */}
        {/*         <IonIcon slot="start" icon={notifications} color="primary" /> */}
        {/*         <IonLabel>Push Notifications</IonLabel> */}
        {/*         <IonToggle */}
        {/*           slot="end" */}
        {/*           checked={notificationsEnabled} */}
        {/*           onIonChange={(e) => setNotificationsEnabled(e.detail.checked)} */}
        {/*         /> */}
        {/*       </IonItem> */}
        {/**/}
        {/*       <IonItem> */}
        {/*         <IonIcon slot="start" icon={shieldCheckmark} color="primary" /> */}
        {/*         <IonLabel>Two-Factor Authentication</IonLabel> */}
        {/*         <IonToggle */}
        {/*           slot="end" */}
        {/*           checked={twoFactorEnabled} */}
        {/*           onIonChange={(e) => setTwoFactorEnabled(e.detail.checked)} */}
        {/*         /> */}
        {/*       </IonItem> */}
        {/*     </IonList> */}
        {/*   </IonCardContent> */}
        {/* </IonCard> */}
        {/**/}
        {/* Danger Zone */}
        <IonCard className="danger-zone">
          <IonCardHeader>
            <IonCardTitle color="danger">Danger Zone</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton expand="block" color="danger" fill="outline" onClick={() => setShowLogoutAlert(true)}>
              <IonIcon slot="start" icon={logOut} />
              Log Out
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>

      {/* Logout Confirmation Alert */}
      <IonAlert
        isOpen={showLogoutAlert}
        onDidDismiss={() => setShowLogoutAlert(false)}
        header="Log Out"
        message="Are you sure you want to log out?"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Log Out',
            role: 'confirm',
            handler: handleLogout
          }
        ]}
      />
    </IonPage>
  );
};

export default AccountPage;
