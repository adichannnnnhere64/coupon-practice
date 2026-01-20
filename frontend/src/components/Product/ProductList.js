import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/components/Product/ProductList.tsx
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from './ProductCard';
import { fetchCoupons } from '../../lib/api-client';
import { useParams, useSearch } from '@tanstack/react-router';
const ProductList = ({ initialPage = 1, initialFilters }) => {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [searchQuery, setSearchQuery] = useState('');
    const params = useParams({
        from: '/_authenticated/operator/$id/plan/$planTypeId',
    });
    // const search = useSearch({ from: '/_authenticated/operator/$id/plan/$planTypeId' });
    const urlOperatorId = params.id ? Number(params.id) : undefined;
    const urlPlanTypeId = params.planTypeId ? Number(params.planTypeId) : undefined;
    const filters = {
        operator_id: urlOperatorId ?? initialFilters?.operator_id,
        plan_type_id: urlPlanTypeId ?? initialFilters?.plan_type_id,
        search: searchQuery.trim() || undefined,
    };
    const queryResult = useQuery({
        queryKey: ['coupons', currentPage, filters],
        queryFn: () => fetchCoupons(currentPage, filters),
        // ✅ Fixed: cacheTime → gcTime (React Query v5)
        gcTime: 10 * 60 * 1000,
        staleTime: 5 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
    // ✅ Fixed: Explicit typing to resolve React Query v5 inference issues
    const { data: paginatedCoupons, isLoading, isError, error, refetch, } = queryResult;
    // ✅ SAFE ACCESS with proper typing
    const coupons = paginatedCoupons?.data?.filter((coupon) => {
        // ✅ Explicit type guard
        return Boolean(coupon &&
            typeof coupon === 'object' &&
            'id' in coupon &&
            coupon.id !== undefined &&
            'operator' in coupon &&
            coupon.operator !== null);
    }) || [];
    // ✅ SAFE META ACCESS
    const totalPages = paginatedCoupons?.meta?.last_page ?? 1;
    const totalItems = paginatedCoupons?.meta?.total ?? 0;
    const currentItems = paginatedCoupons?.meta?.from ?? 0;
    const lastItem = paginatedCoupons?.meta?.to ?? 0;
    // ✅ SAFE FILTERING with explicit typing
    const filteredCoupons = coupons.filter(coupon => {
        if (!coupon || !coupon.id || !coupon.operator) {
            console.warn('Invalid coupon filtered out:', coupon);
            return false;
        }
        if (!searchQuery.trim())
            return true;
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = coupon.coupon_code.toLowerCase().includes(query);
        const matchesOperator = coupon.operator.name.toLowerCase().includes(query);
        const matchesPlan = coupon.plan_type.name.toLowerCase().includes(query);
        return matchesCode || matchesOperator || matchesPlan;
    });
    useEffect(() => {
        setCurrentPage(1);
    }, [filters.operator_id, filters.plan_type_id, searchQuery]);
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const PaginationButton = ({ page, active = false, children, disabled = false, className = '', }) => (_jsx("button", { type: "button", onClick: () => !disabled && handlePageChange(page), disabled: disabled || page === currentPage, className: `
        btn btn-sm join-item transition-all duration-200
        ${page === currentPage ? 'btn-primary' : 'btn-ghost hover:btn-primary'}
        ${active ? 'btn-active' : ''}
        ${disabled ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}
        ${className}
      `, "aria-label": `Go to page ${page}`, children: children }));
    // ✅ Loading Skeleton Component
    const LoadingSkeleton = () => (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: [...Array(8)].map((_, i) => (_jsxs("div", { className: "card bg-base-100 shadow-sm overflow-hidden", children: [_jsx("figure", { className: "w-full h-56 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 animate-pulse rounded-t-lg" }), _jsxs("div", { className: "card-body p-4 space-y-3", children: [_jsx("div", { className: "h-5 bg-gray-300 rounded w-4/5 animate-pulse" }), _jsx("div", { className: "h-4 bg-gray-300 rounded w-3/5 animate-pulse" }), _jsx("div", { className: "h-10 bg-gray-300 rounded-full animate-pulse" }), _jsxs("div", { className: "flex justify-between", children: [_jsx("div", { className: "h-4 bg-gray-300 rounded w-16 animate-pulse" }), _jsx("div", { className: "h-6 bg-gray-300 rounded w-20 animate-pulse" })] })] })] }, i))) }));
    // ✅ Error State
    if (isError && error) {
        return (_jsx("div", { className: "max-w-4xl mx-auto p-8", children: _jsxs("div", { className: "alert alert-error shadow-lg", children: [_jsxs("div", { children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "stroke-current flex-shrink-0 h-6 w-6", fill: "none", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsxs("span", { children: ["Error loading coupons: ", error.message] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", className: "btn btn-primary btn-sm", onClick: () => refetch(), children: "Try Again" }), _jsx("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => window.location.reload(), children: "Refresh" })] })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center py-8", children: [_jsx("h1", { className: "text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4", children: "Mobile Recharge Coupons" }), _jsx("p", { className: "text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed", children: "Discover the best recharge coupons from top operators. Get amazing deals on talktime, data, and combo packs." })] }), _jsxs("div", { className: "form-control w-full max-w-2xl mx-auto", children: [_jsx("div", { className: "input-group", children: _jsx("input", { type: "text", placeholder: "Search by coupon code, operator, or plan...", className: "input input-bordered w-full lg:input-lg", value: searchQuery, onChange: e => setSearchQuery(e.target.value) }) }), searchQuery.trim() && (_jsxs("div", { className: "mt-2 text-sm text-center text-gray-500", children: ["Found ", filteredCoupons.length, " of ", coupons.length, " coupons"] }))] }), isLoading && !paginatedCoupons && _jsx(LoadingSkeleton, {}), !isLoading && !isError && filteredCoupons.length === 0 && (_jsxs("div", { className: "text-center py-16", children: [_jsx("div", { className: "mx-auto w-32 h-32 mb-8", children: _jsx("svg", { className: "w-full h-full text-gray-300", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }) }), _jsx("h3", { className: "text-2xl font-semibold text-gray-900 mb-2", children: "No coupons found" }), _jsx("p", { className: "text-gray-500 max-w-md mx-auto mb-6", children: searchQuery.trim()
                            ? `No coupons match "${searchQuery}". Try different keywords.`
                            : 'No coupons available right now. Check back later!' }), _jsx("button", { type: "button", className: "btn btn-primary", onClick: () => {
                            setSearchQuery('');
                            refetch();
                        }, children: "Clear & Refresh" })] })), filteredCoupons.length > 0 && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6", children: filteredCoupons.map(coupon => (_jsx(ProductCard, { coupon: coupon }, coupon.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t", children: [_jsxs("div", { className: "text-sm text-gray-600 font-medium", children: ["Showing ", _jsx("span", { className: "font-semibold", children: currentItems }), " to", ' ', _jsx("span", { className: "font-semibold", children: Math.min(lastItem, totalItems) }), ' ', "of ", _jsx("span", { className: "font-semibold", children: totalItems }), " coupons"] }), _jsxs("div", { className: "join shadow-lg", role: "navigation", "aria-label": "Pagination", children: [_jsx(PaginationButton, { page: 1, disabled: currentPage === 1, children: "\u00AB First" }), _jsx(PaginationButton, { page: currentPage - 1, disabled: currentPage === 1, children: "Previous" }), (() => {
                                const pagesToShow = 5;
                                const startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
                                const endPage = Math.min(totalPages, startPage + pagesToShow - 1);
                                const pageButtons = [];
                                if (startPage > 1) {
                                    pageButtons.push(_jsx(PaginationButton, { page: 1, children: "1" }, 1));
                                    if (startPage > 2) {
                                        pageButtons.push(_jsx("span", { className: "join-item btn btn-disabled btn-sm", children: "..." }, "ellipsis1"));
                                    }
                                }
                                for (let i = startPage; i <= endPage; i++) {
                                    pageButtons.push(_jsx(PaginationButton, { page: i, active: i === currentPage, children: i }, i));
                                }
                                if (endPage < totalPages) {
                                    if (endPage < totalPages - 1) {
                                        pageButtons.push(_jsx("span", { className: "join-item btn btn-disabled btn-sm", children: "..." }, "ellipsis2"));
                                    }
                                    pageButtons.push(_jsx(PaginationButton, { page: totalPages, children: totalPages }, totalPages));
                                }
                                return pageButtons;
                            })(), _jsx(PaginationButton, { page: currentPage + 1, disabled: currentPage === totalPages, children: "Next" }), _jsx(PaginationButton, { page: totalPages, disabled: currentPage === totalPages, children: "Last \u00BB" })] })] }))] }));
};
export default ProductList;
