import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/components/Product/ProductCard.tsx
import { Link } from '@tanstack/react-router';
import { OptimizedImage } from '../Image/Image';
import { getCouponImage } from '../../lib/api-client';
const ProductCard = ({ coupon }) => {
    const imageUrl = getCouponImage(coupon);
    // ✅ Tailwind v4 Gradient Utilities
    const getOperatorGradient = (operatorCode) => {
        const gradients = {
            gul: 'bg-gradient-to-br from-purple-500 to-pink-500',
            air: 'bg-gradient-to-br from-blue-500 to-indigo-600',
            jio: 'bg-gradient-to-br from-orange-500 to-red-600',
            vi: 'bg-gradient-to-br from-emerald-500 to-teal-600',
            default: 'bg-gradient-to-br from-slate-500 to-purple-600',
        };
        return gradients[operatorCode.toLowerCase()] || gradients.default;
    };
    const gradientClass = getOperatorGradient(coupon.operator.code);
    return (_jsx(Link, { to: "/product/$id", params: { id: coupon.id.toString() }, className: "group/card relative w-full h-full block", preload: "intent", children: _jsxs("div", { className: ` relative w-full h-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl
        transition-all duration-700 ease-out group-hover/card:scale-105 group-hover/card:rotate-1
        group-hover/card:brightness-110 ${gradientClass} ${!coupon.is_available ? 'grayscale opacity-60' : 'animate-pulse-glow'} `, children: [_jsx("div", { className: "\n                    absolute inset-0 bg-gradient-to-t from-black/20 to-transparent\n                    opacity-0 group-hover/card:opacity-100\n                    transition-opacity duration-700\n                " }), _jsx("div", { className: "\n                    absolute -top-6 -right-6 w-24 h-24\n                    bg-white/10 rounded-full blur-xl\n                    animate-float opacity-0 group-hover/card:opacity-100\n                    transition-all duration-700 delay-200\n                " }), _jsx("div", { className: "\n                    relative z-10 w-full h-full p-6 flex items-center justify-center\n                ", children: _jsx("div", { className: ` relative w-full h-4/5 max-h-48 backdrop-blur-2xl bg-white/10 border border-white/20
                rounded-xl overflow-hidden shadow-lg hover:bg-white/20 transition-all duration-700
                group-hover/card:shadow-emerald-500/25 `, children: _jsx(OptimizedImage, { src: imageUrl, alt: `${coupon.operator.name} ${coupon.plan_type.name}`, className: `
                    w-full h-full object-cover group-hover/card:scale-110 group-hover/card:rotate-2 transition-all
                    duration-1000 ease-out `, loading: "lazy" }) }) }), _jsx("div", { className: "\n                    absolute inset-0 bg-gradient-to-r from-transparent\n                    via-white/30 to-transparent\n                    opacity-0 group-hover/card:opacity-100\n                    -skew-x-12 transform -translate-x-full\n                    group-hover/card:translate-x-full\n                    transition-transform duration-1000 ease-out\n                " })] }) }));
};
export default ProductCard;
