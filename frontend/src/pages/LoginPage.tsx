import React, {  useState  } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonToast,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useAuth } from '@services/useApi';
import { useHistory } from 'react-router-dom';
import './LoginPage.scss';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { login, loading, error } = useAuth();
  const history = useHistory();

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     history.replace('/');
  //   }
  // }, [isAuthenticated, history]);

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     history.replace('/');
  //   }
  // }, [isAuthenticated, history]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    // Attempt login
    const success = await login({ email, password });
    
    if (success) {
      setToastMessage('Login successful! Welcome back!');
      setToastColor('success');
      setShowToast(true);
      
      // Redirect to home after short delay
      setTimeout(() => {
        history.replace('/');
      }, 1000);
    } else {
      setToastMessage(error?.message || 'Login failed. Please check your credentials.');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <IonPage className="login-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" scrollY={true}>
        <IonGrid className="login-grid">
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
              {/* Logo/Branding Section */}
              <div className="logo-section ion-text-center ion-margin-bottom">
                <div className="logo-circle">
                  <IonIcon icon={lockClosedOutline} className="logo-icon" />
                </div>
                <h1 className="app-title">Swag Coupons Coupons</h1>
                <p className="app-subtitle">Sign in to continue</p>
              </div>

              {/* Login Card */}
              <IonCard className="login-card">
                <IonCardHeader>
                  <IonCardTitle>Welcome Back</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  {/* Email Input */}
                  <IonItem 
                    className={`input-item ${emailError ? 'ion-invalid' : ''}`}
                    lines="none"
                  >
                    <IonIcon icon={mailOutline} slot="start" color="medium" />
                    <IonInput
                      type="email"
                      value={email}
                      placeholder="Email address"
                      onIonChange={(e) => setEmail(e.detail.value!)}
                      onIonBlur={() => validateEmail(email)}
                      onKeyPress={handleKeyPress}
                      clearInput
                    />
                  </IonItem>
                  {emailError && (
                    <IonText color="danger" className="error-text">
                      <small>{emailError}</small>
                    </IonText>
                  )}

                  {/* Password Input */}
                  <IonItem 
                    className={`input-item ${passwordError ? 'ion-invalid' : ''}`}
                    lines="none"
                  >
                    <IonIcon icon={lockClosedOutline} slot="start" color="medium" />
                    <IonInput
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      placeholder="Password"
                      onIonChange={(e) => setPassword(e.detail.value!)}
                      onIonBlur={() => validatePassword(password)}
                      onKeyPress={handleKeyPress}
                    />
                    <IonButton
                      fill="clear"
                      slot="end"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <IonIcon
                        slot="icon-only"
                        icon={showPassword ? eyeOffOutline : eyeOutline}
                        color="medium"
                      />
                    </IonButton>
                  </IonItem>
                  {passwordError && (
                    <IonText color="danger" className="error-text">
                      <small>{passwordError}</small>
                    </IonText>
                  )}

                  {/* Forgot Password Link */}
                  <div className="ion-text-right ion-margin-top">
                    <IonText color="medium">
                        <IonButton
                          fill="clear"
                          size="small"
                          routerLink="/register"
                          className="inline-link"
                        >
                          Sign Up
                        </IonButton>
                    </IonText>
                    <IonButton
                      fill="clear"
                      size="small"
                      routerLink="/forgot-password"
                    >
                      Forgot Password?
                    </IonButton>
                  </div>

                  {/* Login Button */}
                  <IonButton
                    expand="block"
                    size="large"
                    onClick={handleLogin}
                    disabled={loading || !email || !password}
                    className="login-button"
                  >
                    {loading ? (
                      <>
                        <IonSpinner name="crescent" />
                        <span className="ion-padding-start">Signing in...</span>
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </IonButton>

                  {/* Divider */}
                  <div className="divider ion-margin-vertical">
                    <span>OR</span>
                  </div>

                  {/* Register Link */}

                </IonCardContent>
              </IonCard>

              {/* Terms and Privacy */}
              <div className="ion-text-center ion-margin-top">
                <IonText color="medium">
                  <small>
                    By signing in, you agree to our{' '}
                    <a href="/terms">Terms of Service</a> and{' '}
                    <a href="/privacy">Privacy Policy</a>
                  </small>
                </IonText>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Toast Notification */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
          buttons={[
            {
              text: 'Close',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
