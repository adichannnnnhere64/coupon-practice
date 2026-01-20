import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/routes/operators.tsx
import { createFileRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { OperatorList } from '@/components/Operator/OperatorList';
import { useState } from 'react';
import { OperatorList } from '../../../components/Operator/OperatorList';
export const Route = createFileRoute('/_authenticated/operator/')({
    component: OperatorsPage,
});
function OperatorsPage() {
    const [countryId] = useState(null); // null = all countries
    const queryClient = new QueryClient();
    return (_jsx("div", { className: "min-h-screen bg-base-200", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center py-12", children: [_jsx("h1", { className: "text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4", children: "All Operators" }), _jsx("p", { className: "text-xl text-base-content/70 max-w-2xl mx-auto", children: "Choose your mobile operator and recharge instantly" })] }), _jsx(QueryClientProvider, { client: queryClient, children: _jsx(OperatorList, { countryId: countryId }) })] }) }));
}
