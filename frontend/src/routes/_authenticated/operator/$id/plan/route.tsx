// src/routes/_authenticated/operator/$id/plan/route.tsx
import { createFileRoute } from '@tanstack/react-router';
import { Outlet, useParams } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/operator/$id/plan')({
  component: () => {
    const { id } = useParams({ from: '/_authenticated/operator/$id/plan' });
    return (
      <div className="min-h-screen bg-base-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold mb-4">Plans for Operator {id}</h2>
          <Outlet />  {/* ← Renders child $planTypeId.tsx */}
        </div>
      </div>
    );
  },
});
