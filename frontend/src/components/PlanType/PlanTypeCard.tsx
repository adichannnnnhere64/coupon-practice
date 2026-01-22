// src/components/PlanType/PlanTypeCard.tsx
import React from 'react';
import { Link } from '@tanstack/react-router';
import { PlanType } from '../../lib/api-client';

interface PlanTypeCardProps {
  planType: PlanType;
  operatorId: Number
}

const icons: Record<string, string> = {
  data: 'Data',
  talktime: 'Talktime',
  combo: 'Combo',
  sms: 'SMS',
  roaming: 'Roaming',
  validity: 'Validity',
};

export const PlanTypeCard: React.FC<PlanTypeCardProps> = ({ planType, operatorId }) => {
  const count = planType.available_coupons_count || 0;
  const icon = icons[planType.name.toLowerCase()] || 'Target';

    console.log('adi')
    console.log(operatorId)

  // The Link component automatically inherits parent route params
  // So if you're in /operator/123, the operator ID is already known
  return (
    <Link
      to="/operator/$operatorId/plan/$id"
      params={{
        operatorId: operatorId,
        id: planType.id.toString(),
      }}
      // The operator ID (first $id) comes from the current route context
      preload="intent"
      className="group block"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-base-200 to-base-300 p-8 text-center hover:shadow-2xl transition-all duration-500 hover:scale-105">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{planType.name}</h3>
        <p className="text-3xl font-bold text-primary">{count}</p>
        <p className="text-sm text-base-content/70">plans available</p>

        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </Link>
  );
};
