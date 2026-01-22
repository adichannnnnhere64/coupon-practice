// src/components/Operator/OperatorList.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  X,
  Loader2,
  Wifi,
  Phone,
  Globe
} from 'lucide-react';
import { OperatorCard } from './OperatorCard';
import { fetchOperatorsByCountry, fetchPopularOperators } from '../../lib/api-client';
import type { Operator } from '../../lib/api-client';

interface OperatorListProps {
  countryId: number | null;
}

export const OperatorList: React.FC<OperatorListProps> = ({ countryId }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'data' | 'talktime'>('all');

  const {
    data,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['operators', countryId],
    queryFn: () =>
      countryId
        ? fetchOperatorsByCountry(countryId)
        : fetchPopularOperators(20), // Optimized: Load only 20 for mobile
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const operators = data?.data || [];

  // Memoized filtered operators
  const filteredOperators = useMemo(() => {
    return operators.filter(op => {
      // Search filter
      const matchesSearch = search === '' ||
        op.name.toLowerCase().includes(search.toLowerCase()) ||
        op.country?.name.toLowerCase().includes(search.toLowerCase());

      // Type filter
      const matchesType = filterType === 'all' ||
        (filterType === 'data' && op.has_data_plans) ||
        (filterType === 'talktime' && op.has_talktime);

      return matchesSearch && matchesType;
    });
  }, [operators, search, filterType]);

  // Clear search handler
  const clearSearch = useCallback(() => {
    setSearch('');
  }, []);

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'All', icon: Globe },
    { id: 'data', label: 'Data', icon: Wifi },
    { id: 'talktime', label: 'Talktime', icon: Phone },
  ];

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-2xl aspect-square mb-3"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <X className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load operators
        </h3>
        <p className="text-gray-600 mb-4">
          {error?.message || 'Please try again later'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (!isLoading && filteredOperators.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Search className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No operators found
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {search
            ? `No operators match "${search}". Try different keywords.`
            : 'No operators available right now. Check back later!'}
        </p>
        {search && (
          <button
            onClick={clearSearch}
            className="mt-4 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
          >
            Clear search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search operators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-white rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            aria-label="Search operators"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
            <Filter className="w-4 h-4 inline mr-2" />
            Filter by:
          </span>
          {filterOptions.map((option) => {
            const Icon = option.icon;
            const isActive = filterType === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setFilterType(option.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {filteredOperators.length} of {operators.length} operators
            </span>
            {search && (
              <button
                onClick={clearSearch}
                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Operators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredOperators.map((operator) => (
              <OperatorCard key={operator.id} operator={operator} />
            ))}
          </div>

          {/* Load More (if applicable) */}
          {filteredOperators.length > 0 && filteredOperators.length < operators.length && (
            <div className="text-center pt-6">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                onClick={() => {/* Implement load more */}}
              >
                <Loader2 className="w-4 h-4" />
                Load more operators
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
