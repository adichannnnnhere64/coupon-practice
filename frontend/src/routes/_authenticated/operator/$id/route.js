import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/routes/_authenticated/operator/$id/route.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { PlanTypeCard } from '../../../../components/PlanType/PlanTypeCard';
import { fetchOperatorById } from '../../../../lib/api-client';
// import { PlanTypeCard } from '@/components/PlanType/PlanTypeCard';
// import { fetchOperatorById } from '@/lib/api-client';
export const Route = createFileRoute('/_authenticated/operator/$id')({
    loader: async ({ params }) => {
        const operator = await fetchOperatorById(Number(params.id));
        return { operator };
    },
    component: () => {
        const { operator } = Route.useLoaderData();
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6 py-12 space-y-16", children: [_jsxs("div", { className: "text-center", children: [_jsx("img", { src: operator.logo || '/placeholder.svg', alt: operator.name, className: "w-32 h-32 mx-auto mb-6 rounded-full shadow-2xl" }), _jsx("h1", { className: "text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent", children: operator.name }), _jsxs("p", { className: "text-xl text-base-content/70 mt-4", children: [operator.country.name, " \u2022 ", operator.code] })] }), operator.plan_types && operator.plan_types.length > 0 ? (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8", children: operator.plan_types.map((planType) => (_jsx(PlanTypeCard, { planType: planType, operatorId: operator.id }, planType.id))) })) : (_jsx("div", { className: "text-center py-20", children: _jsx("p", { className: "text-2xl text-base-content/60", children: "No plans available" }) })), _jsx(Outlet, {})] }) }));
    },
});
