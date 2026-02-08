// components/SimpleStripeCard.tsx
import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { stripeLoader } from '@services/stripeLoader';

export interface SimpleStripeCardProps {
  publicKey: string;
  onCardReady?: () => void;
  onCardChange?: (error?: string) => void;
  onCardError?: (error: string) => void;
}

export interface SimpleStripeCardHandle {
  createPaymentMethod: () => Promise<{ paymentMethodId?: string; error?: string }>;
  clearCard: () => void;
}

const SimpleStripeCard = forwardRef<SimpleStripeCardHandle, SimpleStripeCardProps>(
  ({ publicKey, onCardReady, onCardChange, onCardError }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stripeRef = useRef<any>(null);
    const elementsRef = useRef<any>(null);
    const cardRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Initialize
    useEffect(() => {
      let mounted = true;
      let cardElement: any = null;

      const initialize = async () => {
        try {
          if (!publicKey || !containerRef.current || !mounted) {
            return;
          }

          setIsLoading(true);
          setError('');

          // Clear container first
          containerRef.current.innerHTML = '';

          // Load Stripe
          const stripe = await stripeLoader.loadStripe(publicKey);
          
          if (!mounted) return;
          
          stripeRef.current = stripe;

          // Create elements instance
          const elements = stripe.elements();
          elementsRef.current = elements;

          // Create card element
          cardElement = elements.create('card', {
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

          cardRef.current = cardElement;

          // Mount the card
          cardElement.mount(containerRef.current);

          // Listen for events
          cardElement.on('ready', () => {
            if (mounted) {
              setIsLoading(false);
              onCardReady?.();
            }
          });

          cardElement.on('change', (event: any) => {
            if (mounted) {
              onCardChange?.(event.error?.message);
            }
          });

        } catch (err: any) {
          console.error('Failed to initialize Stripe card:', err);
          if (mounted) {
            setError(err.message || 'Failed to initialize payment form');
            setIsLoading(false);
            onCardError?.(err.message || 'Failed to initialize payment form');
          }
        }
      };

      initialize();

      return () => {
        mounted = false;
        // Clean up card element if it exists
        if (cardRef.current) {
          try {
            cardRef.current.unmount();
            cardRef.current.destroy();
          } catch (err) {
						console.log(err)
            // Ignore cleanup errors
          }
          cardRef.current = null;
        }
      };
    }, [publicKey, onCardReady, onCardChange, onCardError]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      async createPaymentMethod(): Promise<{ paymentMethodId?: string; error?: string }> {
        if (!stripeRef.current || !cardRef.current) {
          return { error: 'Payment system not ready' };
        }

        try {
          const { error, paymentMethod } = await stripeRef.current.createPaymentMethod({
            type: 'card',
            card: cardRef.current,
          });

          if (error) {
            return { error: error.message };
          }

          if (!paymentMethod?.id) {
            return { error: 'Failed to create payment method' };
          }

          return { paymentMethodId: paymentMethod.id };
        } catch (err: any) {
          console.error('Error creating payment method:', err);
          return { error: err.message || 'Unknown error' };
        }
      },

      clearCard(): void {
        if (cardRef.current) {
          try {
            cardRef.current.clear();
          } catch (err) {
            console.error('Error clearing card:', err);
          }
        }
      },
    }));

    return (
      <div>
        {isLoading && (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            marginBottom: '8px',
          }}>
            Loading payment form...
          </div>
        )}
        
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '8px',
            marginBottom: '8px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <div
          ref={containerRef}
          style={{
            minHeight: '56px',
            padding: '16px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: 'white',
          }}
        />
        
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Your card details are secured and encrypted</span>
        </div>
      </div>
    );
  }
);

SimpleStripeCard.displayName = 'SimpleStripeCard';

export default SimpleStripeCard;
