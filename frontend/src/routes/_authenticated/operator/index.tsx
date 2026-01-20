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
  const [countryId] = useState<number | null>(null); // null = all countries
  const queryClient = new QueryClient();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        {/* Hero Header */}
        <div className="text-center py-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            All Operators
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            Choose your mobile operator and recharge instantly
          </p>
        </div>


        {/* Main Content */}
        <QueryClientProvider client={queryClient}>
          <OperatorList countryId={countryId} />
        </QueryClientProvider>

      </div>
    </div>
  );
}
