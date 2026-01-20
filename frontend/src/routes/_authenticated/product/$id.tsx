import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
// import { OptimizedImage } from '@/components/Image/Image'
// import { fetchCouponById, getCouponImage } from '@/lib/api-client'  // ✅ YOUR FUNCTIONS
// import type { Coupon } from '@/lib/api-client'
import { useState } from 'react';
import { Suspense } from 'react';
import { OptimizedImage } from '../../../components/Image/Image';
import {
  fetchCouponById,
  getCouponImage,
  getImageUrl,
  type Coupon,
} from '../../../lib/api-client';

// ✅ Your existing plans
const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 149,
    data: '1GB',
    speed: '10Mbps',
    popular: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 299,
    data: '2GB',
    speed: '50Mbps',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 499,
    data: '5GB',
    speed: '100Mbps',
    popular: false,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: 799,
    data: 'Unlimited',
    speed: '500Mbps+',
    popular: false,
  },
];

interface Plan {
  id: string;
  name: string;
  price: number;
  data: string;
  speed: string;
  popular: boolean;
}

// interface Coupon {
//   id: number
//   coupon_code: string
//   operator: { id: number; name: string; code: string; logo_url: string | null }
//   plan_type: { id: number; name: string }
//   selling_price: { formatted: string }
//   denomination: { formatted: string }
//   validity_days: number
//   is_available: boolean
//   images: Array<{ id: number; url: string; thumbnail: string }>
// }
//
// ✅ Image Gallery Component
// ✅ Plan Selector Component

// ImageGallery.tsx - ADD DEBUG LOGS
const ImageGallery: React.FC<{ images: string[]; mainImage: string }> = ({
  images,
  mainImage,
}) => {
  const [currentImage, setCurrentImage] = useState(mainImage);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-white/80 to-white/50">
        <div className="absolute top-2 left-2 z-20 bg-black/80 text-white text-xs px-2 py-1 rounded-full">
          📍 {mainImage.substring(0, 50)}...
        </div>

        <OptimizedImage src={currentImage} alt="Coupon image" loading="eager" />
      </div>

      {/* Thumbnails with debug */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => {
                console.log('Thumbnail clicked:', img);
                setCurrentImage(img);
              }}
              className={`
                shrink-0 p-1 rounded-xl
                ${currentImage === img ? 'ring-2 ring-primary ring-offset-2 bg-primary/10' : 'hover:ring-1 hover:ring-primary/50'}
                transition-all duration-300
              `}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shadow-sm relative">
                {/* ✅ DEBUG: Tiny URL label */}
                <div className="absolute top-0 right-0 z-10 bg-black/60 text-white text-[8px] px-1 rounded-bl">
                  {img.includes('localhost') ? 'TAURI' : 'WEB'}
                </div>
                <OptimizedImage
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PlanSelector: React.FC<{
  plans: Plan[];
  selectedPlan: Plan;
  onSelect: (plan: Plan) => void;
}> = ({ plans, selectedPlan, onSelect }) => (
  <div className="space-y-6">
    <h3 className="text-xl sm:text-2xl font-bold">Select Plan</h3>
    <div className="grid grid-cols-2 gap-4 sm:gap-6">
      {plans.map(plan => {
        const isSelected = selectedPlan.id === plan.id;
        return (
          <button
            key={plan.id}
            onClick={() => onSelect(plan)}
            className={`
              group relative p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300
              ${
                isSelected
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-secondary/5 shadow-xl shadow-primary/20 scale-105'
                  : 'border-base-300/50 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10'
              }
            `}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-primary badge-sm shadow-md">
                Most Popular
              </div>
            )}
            <div className="text-center space-y-3">
              <h4 className="font-semibold text-sm sm:text-base">
                {plan.name}
              </h4>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                ${plan.price}
              </div>
              <div className="space-y-1 text-xs opacity-70">
                <div className="font-mono">{plan.data}</div>
                <div>{plan.speed}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

// ✅ ProductDetail Component
const ProductDetail: React.FC<{ coupon: Coupon }> = ({ coupon }) => {
  const [selectedPlan, setSelectedPlan] = useState(plans[1]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const images = coupon.images.map(img => getImageUrl(img.url));
  const mainImage = getCouponImage(coupon); // ✅ Use your working function

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-2">
        <Link to="/" className="btn btn-square w-20">
          <svg
            width="48"
            height="48"
            className="w-4"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#000000"
              d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
            />
            <path
              fill="#000000"
              d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
            />
          </svg>
          Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          {/* Images */}
          <div className="lg:col-span-5">
            <ImageGallery images={images} mainImage={mainImage} />
          </div>

          {/* Product Info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                    {coupon.operator.name} - {coupon.plan_type.name}
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-base-content/70">
                    Code:{' '}
                    <span className="font-mono bg-base-200 px-3 py-1 rounded-full text-sm">
                      {coupon.coupon_code}
                    </span>{' '}
                    • {coupon.validity_days} days validity
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-3xl sm:text-4xl font-bold text-primary">
                    {coupon.selling_price.formatted}
                  </div>
                  <div className="mt-2">
                    <span className="text-lg font-medium line-through text-base-content/50">
                      {coupon.denomination.formatted}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-base-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-base-300/30">
                <p className="text-base-content/80 leading-relaxed">
                  Instant mobile recharge with exclusive discount. Valid across
                  all circles for {coupon.plan_type.name} plans.
                </p>
              </div>
            </div>

            <PlanSelector
              plans={plans}
              selectedPlan={selectedPlan}
              onSelect={setSelectedPlan}
            />

            <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl p-6 border border-emerald-200/30 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide">
                    Selected Plan
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-base-content mt-1">
                    {selectedPlan.name}
                  </p>
                  <p className="text-sm text-base-content/70 mt-1 flex items-center gap-2">
                    <span className="font-mono">{selectedPlan.data}</span>
                    <span>•</span>
                    <span>{selectedPlan.speed}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl sm:text-4xl font-bold text-emerald-600">
                    ${selectedPlan.price}
                  </p>
                  <p className="text-sm text-base-content/70 mt-1">
                    per recharge
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="btn btn-primary btn-lg flex-1 h-12"
              >
                <span>Buy Now</span>
                <span className="ml-3 font-bold">${selectedPlan.price}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Complete Purchase</h2>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="btn btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-base-200 rounded-xl">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                  <OptimizedImage
                    src={images[0]}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {coupon.operator.name}
                  </h3>
                  <p className="text-sm text-base-content/70 truncate">
                    {selectedPlan.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    ${selectedPlan.price}
                  </p>
                </div>
              </div>

              {/**/}
              {/*                             <button */}
              {/*   onClick={() => { */}
              {/*     // Close modal first */}
              {/*     setIsCheckoutOpen(false) */}
              {/*     // Navigate to checkout */}
              {/*     navigate({ */}
              {/*       to: '/checkout', */}
              {/*     }) */}
              {/*   }} */}
              {/*   className="btn btn-primary w-full btn-lg h-12" */}
              {/* > */}
              {/*   <span>Proceed to Checkout</span> */}
              {/*   <span className="ml-3 font-bold">${selectedPlan.price}</span> */}
              {/* </button> */}
              {/**/}

              <button
                onClick={() => {
                  // Close modal first
                  setIsCheckoutOpen(false);
                  // Navigate to checkout WITH REAL DATA
                  navigate({
                    to: '/checkout',
                    search: prev => ({
                      ...prev,
                      couponId: coupon.id,
                      planId: selectedPlan.id,
                      amount: selectedPlan.price,
                      planName: selectedPlan.name,
                      planData: selectedPlan.data,
                      planSpeed: selectedPlan.speed,
                    }),
                  });
                }}
                className="btn btn-primary w-full btn-lg h-12"
              >
                <span>Proceed to Checkout</span>
                <span className="ml-3 font-bold">${selectedPlan.price}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute('/_authenticated/product/$id')({
  loader: async ({ params }) => {
    const { id } = params;

    // ✅ YOUR EXISTING FUNCTION - PERFECT!
    const coupon = await fetchCouponById(Number(id));

    if (!coupon) {
      throw new Response('Coupon not found', { status: 404 });
    }

    return { coupon };
  },

  component: () => {
    const { coupon } = Route.useLoaderData();
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        }
      >
        <ProductDetail coupon={coupon} />
      </Suspense>
    );
  },
});
