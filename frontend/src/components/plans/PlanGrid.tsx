import React from 'react';
import PlanCard from '../ui/PlanCard';
import ResponsiveGrid from '../layout/ResponsiveGrid';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { bagOutline } from 'ionicons/icons';
import './PlanGrid.scss';

interface Plan {
  id: number;
  name: string;
  description: string | null;
  base_price: number;
  actual_price: number;
  is_active: boolean;
  plan_type?: {
    id: number;
    name: string;
    image?: string;
  };
  stock_summary?: {
    available: number;
    total: number;
  };
  attributes?: Array<{
    id: number;
    name: string;
    value: string | number | boolean;
  }>;
  validity_days?: number;
  media?: Array<{
    url: string;
  }>;
}

interface PlanGridProps {
  plans: Plan[];
  loading?: boolean;
  error?: Error | null;
  columns?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
  onPlanClick?: (plan: Plan) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

const PlanGrid: React.FC<PlanGridProps> = ({
  plans,
  loading = false,
  error = null,
  columns = { xs: '12', sm: '6', md: '4', lg: '3' },
  onPlanClick,
  emptyTitle = 'No plans found',
  emptyDescription = 'Try adjusting your filters or check back later',
}) => {
  if (loading) {
    return <LoadingSpinner message="Loading plans..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon={bagOutline}
        title="Error loading plans"
        description={error.message}
      />
    );
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={bagOutline}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="plan-grid">
      <ResponsiveGrid columns={columns} gap="medium">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            id={plan.id}
            name={plan.name}
            description={plan.description}
            basePrice={plan.base_price}
            actualPrice={plan.actual_price}
            isActive={plan.is_active}
            planTypeName={plan.plan_type?.name}
            image={plan.plan_type?.image || plan.media?.[0]?.url}
            stockAvailable={plan.stock_summary?.available}
            attributes={plan.attributes}
            validityDays={plan.validity_days}
            onClick={onPlanClick ? () => onPlanClick(plan) : undefined}
          />
        ))}
      </ResponsiveGrid>
    </div>
  );
};

export default PlanGrid;
