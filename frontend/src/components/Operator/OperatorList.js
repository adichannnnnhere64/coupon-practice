import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/Operator/OperatorList.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OperatorCard } from './OperatorCard';
import { fetchOperatorsByCountry, fetchPopularOperators } from '../../lib/api-client';
export const OperatorList = ({ countryId }) => {
    const [currentPage] = useState(1);
    const [search, setSearch] = useState('');
    const { data, isLoading } = useQuery({
        queryKey: ['operators', countryId, currentPage, search],
        queryFn: () => countryId
            ? fetchOperatorsByCountry(countryId)
            : fetchPopularOperators(50), // show many for grid
        staleTime: 10 * 60 * 1000,
    });
    const operators = data?.data || [];
    // Client-side search
    const filtered = search
        ? operators.filter(op => op.name.toLowerCase().includes(search.toLowerCase()) ||
            op.code.toLowerCase().includes(search.toLowerCase()))
        : operators;
    return (_jsxs("div", { className: "space-y-10", children: [_jsx("div", { className: "max-w-xl mx-auto", children: _jsx("input", { type: "text", placeholder: "Search operator...", className: "input input-bordered input-lg w-full", value: search, onChange: (e) => setSearch(e.target.value) }) }), isLoading && (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8", children: [...Array(12)].map((_, i) => (_jsx("div", { className: "skeleton h-64 rounded-3xl" }, i))) })), !isLoading && filtered.length === 0 && (_jsx("div", { className: "text-center py-20 text-2xl text-base-content/50", children: "No operators found" })), !isLoading && filtered.length > 0 && (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8", children: filtered.map((op) => (_jsx(OperatorCard, { operator: op }, op.id))) }))] }));
};
