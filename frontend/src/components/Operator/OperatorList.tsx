// src/components/Operator/OperatorList.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OperatorCard } from './OperatorCard';
import { fetchOperatorsByCountry, fetchPopularOperators } from '../../lib/api-client';
// import { fetchPopularOperators, fetchOperatorsByCountry } from '@/lib/api-client';
// import type { Operator } from '@/lib/api-client';

interface OperatorListProps {
  countryId: number | null; // null = show popular/all
}

export const OperatorList: React.FC<OperatorListProps> = ({ countryId }) => {
  const [currentPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['operators', countryId, currentPage, search],
    queryFn: () =>
      countryId
        ? fetchOperatorsByCountry(countryId)
        : fetchPopularOperators(50), // show many for grid
    staleTime: 10 * 60 * 1000,
  });

  const operators = data?.data || [];

  // Client-side search
  const filtered = search
    ? operators.filter(op =>
        op.name.toLowerCase().includes(search.toLowerCase()) ||
        op.code.toLowerCase().includes(search.toLowerCase())
      )
    : operators;

  return (
    <div className="space-y-10">
      <div className="max-w-xl mx-auto">
        <input
          type="text"
          placeholder="Search operator..."
          className="input input-bordered input-lg w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 text-2xl text-base-content/50">
          No operators found
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
          {filtered.map((op) => (
            <OperatorCard key={op.id} operator={op} />
          ))}
        </div>
      )}
    </div>
  );
};
