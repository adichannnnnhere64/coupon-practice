// components/StripeCardForm.tsx - NEW APPROACH
import React, { useState, useEffect, useRef } from 'react';
import { IonButton, IonIcon, IonText } from '@ionic/react';
import { stripeLoader } from '@utils/stripeLoader';
import './StripeCardForm.scss';

interface StripeCardFormProps {
  publicKey: string;
  onSubmit: (paymentMethodId: string) => Promise<void>;
  disabled?: boolean;
}

const StripeCardForm: React.FC<StripeCardFormProps> = ({ publicKey, onSubmit, disabled = false }) => {
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const cardRef = useRef<any>(null);

  // Initialize Stripe once
  useEffect(() => {
    let isMounted = true;

    const initStripe = async () => {
      try {
        // Clear container first
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Load Stripe
        const stripe = await stripeLoader.loadStripe(publicKey);
        if (!isMounted) return;
        
        stripeRef.current = stripe;

        // Create elements
        const elements = stripe.elements();
        elementsRef.current = elements;

        // Create card element with simple styling
        const card = elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#32325d',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              '::placeholder': {
                color: '#aab7c4',
              },
              lineHeight: '1.5',
            },
            invalid: {
              color: '#fa755a',
              iconColor: '#fa755a',
            },
          },
          hidePostalCode: true,
        });

        cardRef.current = card;

        // Mount card to container
        if (containerRef.current && isMounted) {
          card.mount(containerRef.current);
          
          card.on('ready', () => {
            if (isMounted) {
              setIsReady(true);
              setError('');
            }
          });

          card.on('change', (event: any) => {
            if (isMounted) {
              if (event.error) {
                setError(event.error.message);
              } else {
                setError('');
              }
            }
          });
        }

      } catch (err: any) {
        console.error('Failed to initialize Stripe:', err);
        if (isMounted) {
          setError('Failed to load payment form');
        }
      }
    };

    if (publicKey) {
      initStripe();
    }

    return () => {
      isMounted = false;
      // Don't destroy elements on cleanup to avoid DOM conflicts
      // Let Stripe handle its own cleanup
    };
  }, [publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripeRef.current || !cardRef.current || isProcessing || disabled) {
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const { error, paymentMethod } = await stripeRef.current.createPaymentMethod({
        type: 'card',
        card: cardRef.current,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!paymentMethod?.id) {
        throw new Error('Failed to create payment method');
      }

      await onSubmit(paymentMethod.id);
      
      // Clear the card
      cardRef.current.clear();

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="stripe-card-form">
      <div className="form-group">
        <label className="form-label">Card Details</label>
        <div 
          ref={containerRef}
          id="stripe-card-element"
          className="stripe-card-container"
          style={{
            minHeight: '56px',
            padding: '16px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: 'white',
            marginBottom: '16px',
          }}
        />
        
        {error && (
          <div className="error-message">
            <IonIcon icon="warning" size="small" color="danger" />
            <IonText color="danger">
              <small style={{ marginLeft: '8px' }}>{error}</small>
            </IonText>
          </div>
        )}
      </div>

      <IonButton 
        type="button"
        onClick={handleSubmit}
        expand="block" 
        color="primary"
        disabled={!isReady || isProcessing || disabled || !!error}
        className="submit-button"
      >
        {isProcessing ? 'Processing...' : 'Add Card'}
      </IonButton>
    </div>
  );
};

export default StripeCardForm;
