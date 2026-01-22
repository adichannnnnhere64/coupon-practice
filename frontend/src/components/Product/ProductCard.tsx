// components/Product/ProductCard.tsx - Modern version
import { Link } from '@tanstack/react-router';
import { OptimizedImage } from '../Image/Image';
import { getCouponImage } from '../../lib/api-client';
import { ArrowRight, Zap, Shield, Clock } from 'lucide-react';
import type { Coupon } from '../../lib/api-client';

interface ProductCardProps {
  coupon: Coupon;
}

const ProductCard: React.FC<ProductCardProps> = ({ coupon }) => {
  const imageUrl = getCouponImage(coupon);
  const isAvailable = coupon.is_available;

  return (
    <Link
      to="/product/$id"
      params={{ id: coupon.id.toString() }}
      className="group block"
      preload="intent"
    >
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-xl transition-all duration-300">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <OptimizedImage
            src={imageUrl}
            alt={`${coupon.operator.name} ${coupon.plan_type.name}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Availability Badge */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
            isAvailable
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {isAvailable ? 'In Stock' : 'Out of Stock'}
          </div>

          {/* Operator Badge */}
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
              {coupon.operator.logo_url && (
                <img
                  src={coupon.operator.logo_url}
                  alt={coupon.operator.name}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span className="text-sm font-medium">{coupon.operator.name}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Plan Type */}
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">{coupon.plan_type.name}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">
            {coupon.operator.name} - {coupon.plan_type.name}
          </h3>

          {/* Code */}
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-gray-400" />
            <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {coupon.coupon_code}
            </code>
          </div>

          {/* Price & Details */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-600">
                {coupon.selling_price.formatted}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{coupon.validity_days} days</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 text-indigo-600 group-hover:text-indigo-700 transition-colors">
              <span className="font-semibold">View</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
