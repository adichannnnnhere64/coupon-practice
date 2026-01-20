// src/components/Operator/OperatorCard.tsx
import React from 'react';
import { Link } from '@tanstack/react-router';
import { OptimizedImage } from '../Image/Image';
import type { Operator } from '../../lib/api-client';

interface OperatorCardProps {
  operator: Operator;
}

export const OperatorCard: React.FC<OperatorCardProps> = ({ operator }) => {
  const hasData = operator.has_data_plans;
  const hasTalktime = operator.has_talktime;
  const totalPlans = operator.plan_types?.reduce((sum, pt) => sum + (pt.available_coupons_count || 0), 0) || 0;

  return (
    <Link
      to="/operator/$id"
      params={{ id: operator.id.toString() }}
      className="group relative block"
      preload="intent"
    >
      <div className="relative overflow-hidden rounded-3xl bg-base-200/50 backdrop-blur-sm border border-base-300/30 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
        {/* Gradient Top Bar */}
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />

        {/* Main Card */}
        <div className="p-8 text-center space-y-6">
          {/* Logo */}
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl scale-110 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10 w-full h-full rounded-full overflow-hidden ring-4 ring-white/50 shadow-2xl">
              <OptimizedImage
                src={operator.logo || '/placeholder-operator.svg'}
                alt={operator.name}
                className="w-full h-full object-contain p-6 bg-white"
                loading="lazy"
              />
            </div>
          </div>

          {/* Name */}
          <h3 className="text-2xl font-bold tracking-tight">{operator.name}</h3>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {hasData && (
              <span className="badge badge-lg badge-primary shadow-md">Data Plans</span>
            )}
            {hasTalktime && (
              <span className="badge badge-lg badge-success shadow-md">Talktime</span>
            )}
            {totalPlans > 20 && (
              <span className="badge badge-lg badge-accent shadow-md">Hot</span>
            )}
          </div>

          {/* Stats */}
          <div className="text-sm text-base-content/60 space-y-1">
            <p className="font-semibold text-lg text-primary">
              {totalPlans} plans available
            </p>
            <p className="text-xs">{operator?.country?.name}</p>
          </div>
        </div>

        {/* Hover Shine */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      </div>
    </Link>
  );
};
