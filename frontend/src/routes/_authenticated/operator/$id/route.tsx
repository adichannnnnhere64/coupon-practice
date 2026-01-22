// routes/_authenticated/operator/$id/route.tsx - Simplified version
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, ChevronRight, Star, Clock, Check } from 'lucide-react';
import { fetchOperatorById } from '../../../../lib/api-client';

export const Route = createFileRoute('/_authenticated/operator/$id')({
  loader: async ({ params }) => {
    const operator = await fetchOperatorById(Number(params.id));
    return { operator };
  },
  component: OperatorPage,
});

function OperatorPage() {
  const { operator } = Route.useLoaderData();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: -1 })}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{operator?.name}</h1>
              <p className="text-sm text-gray-600">Mobile plans & packages</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Operator Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
            <img
              src={operator?.logo || 'https://via.placeholder.com/100'}
              alt={operator?.name}
              className="w-20 h-20 rounded-2xl bg-white p-3 shadow-lg"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{operator?.name}</h2>
              <p className="text-gray-600">Prepaid mobile services</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">4.8</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Instant activation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Available Plans</h2>
            <span className="text-sm text-gray-600">
              {operator?.plan_types?.length || 0} plans
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operator?.plan_types?.map((plan: any) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                {/* Plan Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{plan.description}</p>
                    )}
                  </div>
                  {plan.discount_percentage > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      -{plan.discount_percentage}%
                    </span>
                  )}
                </div>

                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-indigo-600">
                      ₱{plan.actual_price.toFixed(2)}
                    </span>
                    {plan.base_price !== plan.actual_price && (
                      <span className="text-sm text-gray-400 line-through">
                        ₱{plan.base_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                {plan.attributes?.slice(0, 3).map((attr: any) => (
                  <div key={attr.id} className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{attr.name}: {attr.value}</span>
                  </div>
                ))}

                {/* Status */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className={`text-sm font-medium ${plan.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {plan.is_active ? 'Available' : 'Unavailable'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* No Plans State */}
        {(!operator?.plan_types || operator.plan_types.length === 0) && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📱</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Plans Available</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              This operator doesn't have any plans available at the moment.
            </p>
          </div>
        )}

        <Outlet />
      </main>

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Plan Details</h2>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Plan Info */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedPlan.name}</h3>
                {selectedPlan.description && (
                  <p className="text-gray-600">{selectedPlan.description}</p>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-indigo-600">
                    ₱{selectedPlan.actual_price.toFixed(2)}
                  </span>
                  {selectedPlan.base_price !== selectedPlan.actual_price && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        ₱{selectedPlan.base_price.toFixed(2)}
                      </span>
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                        Save {selectedPlan.discount_percentage}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              {selectedPlan.attributes?.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
                  <div className="space-y-3">
                    {selectedPlan.attributes.map((attr: any) => (
                      <div key={attr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">{attr.name}</span>
                        <span className="font-semibold text-indigo-600">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  navigate({
                    to: '/checkout',
                    search: {
                      planId: selectedPlan.id,
                      operatorId: operator.id,
                      amount: selectedPlan.actual_price,
                      planName: selectedPlan.name,
                    },
                  });
                }}
                disabled={!selectedPlan.is_active}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  selectedPlan.is_active
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {selectedPlan.is_active ? 'Select This Plan' : 'Currently Unavailable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
