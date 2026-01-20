// frontend/src/components/Product/ProductList.tsx
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from './ProductCard';
import { fetchCoupons } from '../../lib/api-client';
import type { PaginatedResponse, Coupon } from '../../lib/api-client'; // ✅ Removed unused PaginationLink
import { useParams, useSearch } from '@tanstack/react-router';

interface ProductListProps {
  initialPage?: number;
    initialFilters?: {
    operator_id?: number;
    plan_type_id?: number;
  };
}

const ProductList: React.FC<ProductListProps> = ({ initialPage = 1, initialFilters }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState('');


    interface RouteParams {
      id: string;
      planTypeId: string;
   }

    // In ProductList.tsx - temporary fix
const params = useParams({
  from: '/operator/$id/plan/$planTypeId' as any,
});

const urlOperatorId = (params as any)?.id ? Number((params as any).id) : undefined;
const urlPlanTypeId = (params as any)?.planTypeId ? Number((params as any).planTypeId) : undefined;

    const filters = {
    operator_id: urlOperatorId ?? initialFilters?.operator_id,
    plan_type_id: urlPlanTypeId ?? initialFilters?.plan_type_id,
    search: searchQuery.trim() || undefined,
  };

  const queryResult = useQuery({
    queryKey: ['coupons', currentPage, filters] as const,
    queryFn: () => fetchCoupons(currentPage, filters),
    // ✅ Fixed: cacheTime → gcTime (React Query v5)
    gcTime: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ Fixed: Explicit typing to resolve React Query v5 inference issues
  const {
    data: paginatedCoupons,
    isLoading,
    isError,
    error,
    refetch,
  } = queryResult as {
    data: PaginatedResponse<Coupon> | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
  };

  // ✅ SAFE ACCESS with proper typing
  const coupons: Coupon[] =
    paginatedCoupons?.data?.filter((coupon): coupon is Coupon => {
      // ✅ Explicit type guard
      return Boolean(
        coupon &&
        typeof coupon === 'object' &&
        'id' in coupon &&
        coupon.id !== undefined &&
        'operator' in coupon &&
        coupon.operator !== null
      );
    }) || [];

  // ✅ SAFE META ACCESS
  const totalPages = paginatedCoupons?.meta?.last_page ?? 1;
  const totalItems = paginatedCoupons?.meta?.total ?? 0;
  const currentItems = paginatedCoupons?.meta?.from ?? 0;
  const lastItem = paginatedCoupons?.meta?.to ?? 0;

  // ✅ SAFE FILTERING with explicit typing
  const filteredCoupons: Coupon[] = coupons.filter(coupon => {
    if (!coupon || !coupon.id || !coupon.operator) {
      console.warn('Invalid coupon filtered out:', coupon);
      return false;
    }

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const matchesCode = coupon.coupon_code.toLowerCase().includes(query);
    const matchesOperator = coupon.operator.name.toLowerCase().includes(query);
    const matchesPlan = coupon.plan_type.name.toLowerCase().includes(query);

    return matchesCode || matchesOperator || matchesPlan;
  });

    useEffect(() => {
    setCurrentPage(1);
  }, [filters.operator_id, filters.plan_type_id, searchQuery]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ✅ Properly typed PaginationButton component
  interface PaginationButtonProps {
    page: number;
    active?: boolean;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
  }

  const PaginationButton: React.FC<PaginationButtonProps> = ({
    page,
    active = false,
    children,
    disabled = false,
    className = '',
  }) => (
    <button
      type="button"
      onClick={() => !disabled && handlePageChange(page)}
      disabled={disabled || page === currentPage}
      className={`
        btn btn-sm join-item transition-all duration-200
        ${page === currentPage ? 'btn-primary' : 'btn-ghost hover:btn-primary'}
        ${active ? 'btn-active' : ''}
        ${disabled ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      aria-label={`Go to page ${page}`}
    >
      {children}
    </button>
  );

  // ✅ Loading Skeleton Component
  const LoadingSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="card bg-base-100 shadow-sm overflow-hidden">
          <figure className="w-full h-56 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 animate-pulse rounded-t-lg" />
          <div className="card-body p-4 space-y-3">
            <div className="h-5 bg-gray-300 rounded w-4/5 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-3/5 animate-pulse" />
            <div className="h-10 bg-gray-300 rounded-full animate-pulse" />
            <div className="flex justify-between">
              <div className="h-4 bg-gray-300 rounded w-16 animate-pulse" />
              <div className="h-6 bg-gray-300 rounded w-20 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ✅ Error State
  if (isError && error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="alert alert-error shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Error loading coupons: {error.message}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => refetch()}
            >
              Try Again
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          Mobile Recharge Coupons
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Discover the best recharge coupons from top operators. Get amazing
          deals on talktime, data, and combo packs.
        </p>
      </div>

      {/* Search Bar */}
      <div className="form-control w-full max-w-2xl mx-auto">
        <div className="input-group">
          <input
            type="text"
            placeholder="Search by coupon code, operator, or plan..."
            className="input input-bordered w-full lg:input-lg"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {/* <button */}
          {/*   type="button" */}
          {/*   className="btn btn-square btn-primary lg:btn-lg" */}
          {/*   onClick={() => refetch()} */}
          {/* > */}
          {/*   <svg */}
          {/*     xmlns="http://www.w3.org/2000/svg" */}
          {/*     className="h-6 w-6" */}
          {/*     fill="none" */}
          {/*     viewBox="0 0 24 24" */}
          {/*     stroke="currentColor" */}
          {/*   > */}
          {/*     <path */}
          {/*       strokeLinecap="round" */}
          {/*       strokeLinejoin="round" */}
          {/*       strokeWidth="2" */}
          {/*       d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" */}
          {/*     /> */}
          {/*   </svg> */}
          {/* </button> */}
        </div>
        {searchQuery.trim() && (
          <div className="mt-2 text-sm text-center text-gray-500">
            Found {filteredCoupons.length} of {coupons.length} coupons
          </div>
        )}
      </div>

      {/* Stats */}
      {/* <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-100"> */}
      {/*   <div className="stat"> */}
      {/*     <div className="stat-figure text-primary"> */}
      {/*       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> */}
      {/*         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> */}
      {/*       </svg> */}
      {/*     </div> */}
      {/*     <div className="stat-title">Total Available</div> */}
      {/*     <div className="stat-value">{totalItems}</div> */}
      {/*     <div className="stat-desc">Page {currentPage} of {totalPages}</div> */}
      {/*   </div> */}
      {/**/}
      {/*   <div className="stat"> */}
      {/*     <div className="stat-figure text-success"> */}
      {/*       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> */}
      {/*         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> */}
      {/*       </svg> */}
      {/*     </div> */}
      {/*     <div className="stat-title">In Stock</div> */}
      {/*     <div className="stat-value text-success"> */}
      {/*       {coupons.filter(c => c.is_available).length} */}
      {/*     </div> */}
      {/*   </div> */}
      {/**/}
      {/*   <div className="stat"> */}
      {/*     <div className="stat-figure text-warning"> */}
      {/*       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> */}
      {/*         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> */}
      {/*       </svg> */}
      {/*     </div> */}
      {/*     <div className="stat-title">Low Stock</div> */}
      {/*     <div className="stat-value text-warning"> */}
      {/*       {coupons.filter(c => c.is_low_stock).length} */}
      {/*     </div> */}
      {/*   </div> */}
      {/* </div> */}

      {/* Loading State */}
      {isLoading && !paginatedCoupons && <LoadingSkeleton />}

      {/* Empty State */}
      {!isLoading && !isError && filteredCoupons.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-32 h-32 mb-8">
            <svg
              className="w-full h-full text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            No coupons found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchQuery.trim()
              ? `No coupons match "${searchQuery}". Try different keywords.`
              : 'No coupons available right now. Check back later!'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSearchQuery('');
              refetch();
            }}
          >
            Clear & Refresh
          </button>
        </div>
      )}

      {/* Coupons Grid */}
      {filteredCoupons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredCoupons.map(coupon => (
            <ProductCard key={coupon.id} coupon={coupon} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t">
          <div className="text-sm text-gray-600 font-medium">
            Showing <span className="font-semibold">{currentItems}</span> to{' '}
            <span className="font-semibold">
              {Math.min(lastItem, totalItems)}
            </span>{' '}
            of <span className="font-semibold">{totalItems}</span> coupons
          </div>

          <div
            className="join shadow-lg"
            role="navigation"
            aria-label="Pagination"
          >
            <PaginationButton page={1} disabled={currentPage === 1}>
              « First
            </PaginationButton>

            <PaginationButton
              page={currentPage - 1}
              disabled={currentPage === 1}
            >
              Previous
            </PaginationButton>

            {/* Smart Pagination Numbers */}
            {(() => {
              const pagesToShow = 5;
              const startPage = Math.max(
                1,
                currentPage - Math.floor(pagesToShow / 2)
              );
              const endPage = Math.min(totalPages, startPage + pagesToShow - 1);

              const pageButtons: React.ReactNode[] = [];

              if (startPage > 1) {
                pageButtons.push(
                  <PaginationButton key={1} page={1}>
                    1
                  </PaginationButton>
                );
                if (startPage > 2) {
                  pageButtons.push(
                    <span
                      key="ellipsis1"
                      className="join-item btn btn-disabled btn-sm"
                    >
                      ...
                    </span>
                  );
                }
              }

              for (let i = startPage; i <= endPage; i++) {
                pageButtons.push(
                  <PaginationButton key={i} page={i} active={i === currentPage}>
                    {i}
                  </PaginationButton>
                );
              }

              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pageButtons.push(
                    <span
                      key="ellipsis2"
                      className="join-item btn btn-disabled btn-sm"
                    >
                      ...
                    </span>
                  );
                }
                pageButtons.push(
                  <PaginationButton key={totalPages} page={totalPages}>
                    {totalPages}
                  </PaginationButton>
                );
              }

              return pageButtons;
            })()}

            <PaginationButton
              page={currentPage + 1}
              disabled={currentPage === totalPages}
            >
              Next
            </PaginationButton>

            <PaginationButton
              page={totalPages}
              disabled={currentPage === totalPages}
            >
              Last »
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
