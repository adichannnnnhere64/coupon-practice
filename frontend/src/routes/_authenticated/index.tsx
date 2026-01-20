import { createFileRoute } from '@tanstack/react-router';
import useEmblaCarousel from 'embla-carousel-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductList from '../../components/Product/ProductList';

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
});

function Home() {
  const [emblaRef] = useEmblaCarousel({
    loop: true,
    align: 'start',
    dragFree: false, // important
    containScroll: 'trimSnaps', // prevents weird jumps
  });

  const queryClient = new QueryClient();

  return (
    <div className="min-h-screen bg-base-200">
      {' '}
      {/* Same background as product page */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {' '}
        {/* Centered content like product page */}
        {/* Hero Carousel */}
        <div className="mb-12">
          <div
            className="embla overflow-hidden rounded-2xl shadow-2xl"
            ref={emblaRef}
          >
            <div className="embla__container flex">
              {/* Slide 1 */}
              <div className="embla__slide flex-[0_0_100%] min-w-0">
                <div className="relative">
                  <img
                    src="../b3.jpg"
                    alt="Latest Phones"
                    className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-8 left-8 text-white"></div>
                </div>
              </div>

              <div className="embla__slide flex-[0_0_100%] min-w-0">
                <div className="relative">
                  <img
                    src="../b2.jpg"
                    alt="Premium Collection"
                    className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-8 left-8 text-white"></div>
                </div>
              </div>

              <div className="embla__slide flex-[0_0_100%] min-w-0">
                <div className="relative">
                  <img
                    src="../b1.jpg"
                    alt="Best Deals"
                    className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-8 left-8 text-white"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <QueryClientProvider client={queryClient}>
          {/* Featured Products Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-center mb-10">Rigodon</h2>
            <ProductList />
          </div>
        </QueryClientProvider>
        {/* Optional: Additional Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-8 bg-base-100 rounded-2xl shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Free Shipping</h3>
            <p className="text-base-content/70">On all orders over $500</p>
          </div>

          <div className="text-center p-8 bg-base-100 rounded-2xl shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
            <p className="text-base-content/70">100% secure transactions</p>
          </div>

          <div className="text-center p-8 bg-base-100 rounded-2xl shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Returns</h3>
            <p className="text-base-content/70">30-day return policy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Route;
