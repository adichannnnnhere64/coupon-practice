// services/stripeLoader.ts
class StripeLoader {
  private static instance: StripeLoader;
  private stripePromise: Promise<any> | null = null;
  private isLoaded = false;

  private constructor() {}

  static getInstance(): StripeLoader {
    if (!StripeLoader.instance) {
      StripeLoader.instance = new StripeLoader();
    }
    return StripeLoader.instance;
  }

  async loadStripe(publicKey: string): Promise<any> {
    // If already loaded, return the existing instance
    if (this.stripePromise) {
      return this.stripePromise;
    }

    this.stripePromise = new Promise<any>((resolve, reject) => {
      // Check if Stripe is already loaded globally
      if (window.Stripe) {
        const stripe = window.Stripe(publicKey);
        this.isLoaded = true;
        resolve(stripe);
        return;
      }

      // Load Stripe.js
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      
      script.onload = () => {
        if (window.Stripe) {
          const stripe = window.Stripe(publicKey);
          this.isLoaded = true;
          resolve(stripe);
        } else {
          reject(new Error('Stripe not available after loading'));
        }
      };
      
      script.onerror = () => reject(new Error('Failed to load Stripe'));
      document.head.appendChild(script);
    });

    return this.stripePromise;
  }

  isStripeLoaded(): boolean {
    return this.isLoaded;
  }

  clear(): void {
    this.stripePromise = null;
    this.isLoaded = false;
  }
}

export const stripeLoader = StripeLoader.getInstance();
