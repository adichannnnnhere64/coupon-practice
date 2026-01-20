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

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">

          {/* Operator Header */}
          <div className="text-center">
            <img
              src={operator.logo || '/placeholder.svg'}
              alt={operator.name}
              className="w-32 h-32 mx-auto mb-6 rounded-full shadow-2xl"
            />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {operator.name}
            </h1>
            <p className="text-xl text-base-content/70 mt-4">
              {operator.country.name} • {operator.code}
            </p>
          </div>

          {/* Plan Types Grid */}
          {operator.plan_types && operator.plan_types.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
              {operator.plan_types.map((planType) => (
                <PlanTypeCard
                  key={planType.id}
                  planType={planType}
                  operatorId={operator.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-2xl text-base-content/60">No plans available</p>
            </div>
          )}

          {/* This renders your ProductList when user clicks a plan */}
          <Outlet />
        </div>
      </div>
    );
  },
});
