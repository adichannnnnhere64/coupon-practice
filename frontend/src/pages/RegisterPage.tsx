import React, { useState, useEffect } from 'react';
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
  IonCheckbox,
} from '@ionic/react';
import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { useAuth } from '@services/useApi';
import { useHistory } from 'react-router-dom';
import './RegisterPage.scss';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  // Field errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmationError, setPasswordConfirmationError] = useState('');

  const { register, loading, error, isAuthenticated } = useAuth();
  const history = useHistory();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      history.replace('/');
    }
  }, [isAuthenticated, history]);

  // Validation functions
  const validateName = (name: string): boolean => {
    if (!name) {
      setNameError('Name is required');
      return false;
    }
    if (name.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

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
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError('Password must contain uppercase, lowercase, and number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validatePasswordConfirmation = (confirmation: string): boolean => {
    if (!confirmation) {
      setPasswordConfirmationError('Please confirm your password');
      return false;
    }
    if (confirmation !== password) {
      setPasswordConfirmationError('Passwords do not match');
      return false;
    }
    setPasswordConfirmationError('');
    return true;
  };

  const handleRegister = async (): Promise<void> => {
    // Validate all fields
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isPasswordConfirmationValid = validatePasswordConfirmation(passwordConfirmation);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isPasswordConfirmationValid) {
      return;
    }

    if (!agreeToTerms) {
      setToastMessage('Please agree to the Terms of Service');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    // Attempt registration
    const success = await register({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });

    if (success) {
      setToastMessage('Registration successful! Welcome aboard!');
      setToastColor('success');
      setShowToast(true);

      // Redirect to home after short delay
      setTimeout(() => {
        history.replace('/');
      }, 1500);
    } else {
      const errorMsg = error?.message || 'Registration failed. Please try again.';
      setToastMessage(errorMsg);
      setToastColor('danger');
      setShowToast(true);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pass: string): string => {
    if (!pass) return '';
    if (pass.length < 6) return 'weak';
    if (pass.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pass)) return 'medium';
    return 'strong';
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <IonPage className="register-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" scrollY={true}>
        <IonGrid className="register-grid">
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
              {/* Logo/Branding Section */}
              <div className="logo-section ion-text-center ion-margin-bottom">
                <div className="logo-circle">
                  <IonIcon icon={checkmarkCircleOutline} className="logo-icon" />
                </div>
                <h1 className="app-title">Join Swag Coupons Coupons</h1>
                <p className="app-subtitle">Create your account to get started</p>
              </div>

              {/* Registration Card */}
              <IonCard className="register-card">
                <IonCardHeader>
                  <IonCardTitle>Sign Up</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  {/* Name Input */}
                  <IonItem
                    className={`input-item ${nameError ? 'ion-invalid' : ''}`}
                    lines="none"
                  >
                    <IonIcon icon={personOutline} slot="start" color="medium" />
                    <IonInput
                      type="text"
                      value={name}
                      placeholder="Full Name"
                      onIonChange={(e) => setName(e.detail.value!)}
                      onIonBlur={() => validateName(name)}
                      clearInput
                    />
                  </IonItem>
                  {nameError && (
                    <IonText color="danger" className="error-text">
                      <small>{nameError}</small>
                    </IonText>
                  )}

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
                  
                  {/* Password Strength Indicator */}
                  {password && !passwordError && (
                    <div className="password-strength">
                      <div className={`strength-bar strength-${passwordStrength}`}>
                        <div className="strength-fill">.</div>
                      </div>
                      <IonText color="medium">
                        <small>
                          Strength: <span className={`strength-label-${passwordStrength}`}>
                            {passwordStrength === 'weak' && 'Weak'}
                            {passwordStrength === 'medium' && 'Medium'}
                            {passwordStrength === 'strong' && 'Strong'}
                          </span>
                        </small>
                      </IonText>
                    </div>
                  )}

                  {/* Confirm Password Input */}
                  <IonItem
                    className={`input-item ${passwordConfirmationError ? 'ion-invalid' : ''}`}
                    lines="none"
                  >
                    <IonIcon icon={lockClosedOutline} slot="start" color="medium" />
                    <IonInput
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      value={passwordConfirmation}
                      placeholder="Confirm Password"
                      onIonChange={(e) => setPasswordConfirmation(e.detail.value!)}
                      onIonBlur={() => validatePasswordConfirmation(passwordConfirmation)}
                    />
                    <IonButton
                      fill="clear"
                      slot="end"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    >
                      <IonIcon
                        slot="icon-only"
                        icon={showPasswordConfirmation ? eyeOffOutline : eyeOutline}
                        color="medium"
                      />
                    </IonButton>
                  </IonItem>
                  {passwordConfirmationError && (
                    <IonText color="danger" className="error-text">
                      <small>{passwordConfirmationError}</small>
                    </IonText>
                  )}

                  {/* Terms and Conditions */}
                  <div className="terms-checkbox ion-margin-top">
                    <IonCheckbox
                      checked={agreeToTerms}
                      onIonChange={(e) => setAgreeToTerms(e.detail.checked)}
                    />
                    <IonText color="medium">
                      <small>
                        I agree to the{' '}
                        <a href="/terms" target="_blank">Terms of Service</a> and{' '}
                        <a href="/privacy" target="_blank">Privacy Policy</a>
                      </small>
                    </IonText>
                  </div>

                  {/* Register Button */}
                  <IonButton
                    expand="block"
                    size="large"
                    onClick={handleRegister}
                    disabled={loading || !name || !email || !password || !passwordConfirmation || !agreeToTerms}
                    className="register-button"
                  >
                    {loading ? (
                      <>
                        <IonSpinner name="crescent" />
                        <span className="ion-padding-start">Creating account...</span>
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </IonButton>

                  {/* Divider */}
                  <div className="divider ion-margin-vertical">
                    <span>OR</span>
                  </div>

                  {/* Login Link */}
                  <div className="ion-text-center">
                    <IonText color="medium">
                      <p>
                        Already have an account?{' '}
                        <IonButton
                          fill="clear"
                          size="small"
                          routerLink="/login"
                          className="inline-link"
                        >
                          Sign In
                        </IonButton>
                      </p>
                    </IonText>
                  </div>
                </IonCardContent>
              </IonCard>
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
              role: 'cancel',
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
