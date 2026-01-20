// frontend/src/components/Product/ProductCard.tsx
import { Link } from '@tanstack/react-router';
import { OptimizedImage } from '../Image/Image';
import type { Coupon } from '../../lib/api-client';
import { getCouponImage } from '../../lib/api-client';

interface CouponCardProps {
  coupon: Coupon;
}

const ProductCard: React.FC<CouponCardProps> = ({ coupon }) => {
  const imageUrl = getCouponImage(coupon);

  // ✅ Tailwind v4 Gradient Utilities
  const getOperatorGradient = (operatorCode: string) => {
    const gradients: any = {
      gul: 'bg-gradient-to-br from-purple-500 to-pink-500',
      air: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      jio: 'bg-gradient-to-br from-orange-500 to-red-600',
      vi: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      default: 'bg-gradient-to-br from-slate-500 to-purple-600',
    };
    return gradients[operatorCode.toLowerCase()] || gradients.default;
  };

  const gradientClass = getOperatorGradient(coupon.operator.code);

  return (
    <Link
      to="/product/$id"
      params={{ id: coupon.id.toString() }}
      className="group/card relative w-full h-full block"
      preload="intent"
    >
      {/* ✅ Main Card - Tailwind v4 Compatible */}
      <div
        className={` relative w-full h-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl
        transition-all duration-700 ease-out group-hover/card:scale-105 group-hover/card:rotate-1
        group-hover/card:brightness-110 ${gradientClass} ${
          !coupon.is_available ? 'grayscale opacity-60' : 'animate-pulse-glow'
        } `}
      >
        {/* ✅ Animated Overlay */}
        <div
          className="
                    absolute inset-0 bg-gradient-to-t from-black/20 to-transparent
                    opacity-0 group-hover/card:opacity-100
                    transition-opacity duration-700
                "
        ></div>

        {/* ✅ Floating Orb Effect */}
        <div
          className="
                    absolute -top-6 -right-6 w-24 h-24
                    bg-white/10 rounded-full blur-xl
                    animate-float opacity-0 group-hover/card:opacity-100
                    transition-all duration-700 delay-200
                "
        ></div>

        {/* ✅ Image Container with Glass Effect */}
        <div
          className="
                    relative z-10 w-full h-full p-6 flex items-center justify-center
                "
        >
          <div
            className={` relative w-full h-4/5 max-h-48 backdrop-blur-2xl bg-white/10 border border-white/20
                rounded-xl overflow-hidden shadow-lg hover:bg-white/20 transition-all duration-700
                group-hover/card:shadow-emerald-500/25 `}
          >
            <OptimizedImage
              src={imageUrl}
              alt={`${coupon.operator.name} ${coupon.plan_type.name}`}
              className={`
                    w-full h-full object-cover group-hover/card:scale-110 group-hover/card:rotate-2 transition-all
                    duration-1000 ease-out `}
              loading="lazy"
            />
          </div>
        </div>

        {/* ✅ Shine Effect */}
        <div
          className="
                    absolute inset-0 bg-gradient-to-r from-transparent
                    via-white/30 to-transparent
                    opacity-0 group-hover/card:opacity-100
                    -skew-x-12 transform -translate-x-full
                    group-hover/card:translate-x-full
                    transition-transform duration-1000 ease-out
                "
        ></div>
      </div>
    </Link>
  );
};

export default ProductCard;
