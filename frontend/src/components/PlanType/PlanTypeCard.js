import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/PlanType/PlanTypeCard.tsx
import React from 'react';
import { Link } from '@tanstack/react-router';
const icons = {
    data: 'Data',
    talktime: 'Talktime',
    combo: 'Combo',
    sms: 'SMS',
    roaming: 'Roaming',
    validity: 'Validity',
};
export const PlanTypeCard = ({ planType, operatorId }) => {
    const count = planType.available_coupons_count || 0;
    const icon = icons[planType.name.toLowerCase()] || 'Target';
    return (_jsx(Link, { to: "/operator/$id/plan/$planTypeId", params: {
            id: operatorId.toString(),
            planTypeId: planType.id.toString(),
        }, className: "group block", children: _jsxs("div", { className: "relative overflow-hidden rounded-3xl bg-gradient-to-br from-base-200 to-base-300 p-8 text-center hover:shadow-2xl transition-all duration-500 hover:scale-105", children: [_jsx("div", { className: "text-6xl mb-4", children: icon }), _jsx("h3", { className: "text-xl font-bold mb-2", children: planType.name }), _jsx("p", { className: "text-3xl font-bold text-primary", children: count }), _jsx("p", { className: "text-sm text-base-content/70", children: "plans available" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" }), "burat"] }) }));
};
