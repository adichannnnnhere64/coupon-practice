// components/StripeCardElement.tsx
import React, { useEffect, useRef, useState } from 'react';
import { IonText } from '@ionic/react';

interface StripeCardElementProps {
  stripe: any;
  onReady?: () => void;
  onChange?: (event: any) => void;
  onError?: (error: string) => void;
}

const StripeCardElement: React.FC<StripeCardElementProps> = ({
  stripe,
  onReady,
  onChange,
  onError,
}) => {
  const cardElementRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const cardElementRefInternal = useRef<any>(null);

  useEffect(() => {
    if (!stripe || !cardElementRef.current || isMounted) {
      return;
    }

    try {
      const elements = stripe.elements();
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#32325d',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a',
          },
        },
        hidePostalCode: true,
      });

      card.mount(cardElementRef.current);
      cardElementRefInternal.current = card;

      card.on('ready', () => {
        setIsMounted(true);
        if (onReady) onReady();
      });

      card.on('change', (event: any) => {
        if (onChange) onChange(event);
      });

      card.on('loaderror', () => {
        if (onError) onError('Failed to load payment form');
      });

    } catch (err) {
      console.error('Failed to create card element:', err);
      if (onError) onError('Failed to initialize payment form');
    }

    // Cleanup function
    return () => {
      if (cardElementRefInternal.current) {
        try {
          cardElementRefInternal.current.destroy();
        } catch (err) {
          console.error('Error destroying card element:', err);
        }
      }
    };
  }, [stripe, onReady, onChange, onError, isMounted]);

  return (
    <div ref={cardElementRef} style={{ minHeight: '55px', width: '100%' }}>
      {!isMounted && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
          <IonText color="medium">
            <small>Loading payment form...</small>
          </IonText>
        </div>
      )}
    </div>
  );
};

export default StripeCardElement;
