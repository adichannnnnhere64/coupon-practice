// src/components/Operator/OperatorCard.tsx - Optimized version
import React from 'react';
import { Link } from '@tanstack/react-router';
import { OptimizedImage } from '../Image/Image';
import { Wifi, Phone, Check } from 'lucide-react';
import type { Operator } from '../../lib/api-client';

interface OperatorCardProps {
  operator: Operator;
}

export const OperatorCard: React.FC<OperatorCardProps> = ({ operator }) => {
  const planCount = operator.plan_types?.length || 0;

  return (
    <Link
      to="/operator/$id"
      params={{ id: operator.id.toString() }}
      className="group block"
      preload="intent"
    >
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all duration-300 active:scale-[0.98]">
        {/* Logo Container */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 p-6">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full h-full">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl blur-xl group-hover:blur-2xl transition-all" />

              {/* Logo */}
              <div className="relative w-full h-full flex items-center justify-center">
                <OptimizedImage
                  src={operator.logo}
                  alt={operator.name}
                  className="w-4/5 h-4/5 object-contain drop-shadow-lg"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Badge */}
          {planCount > 0 && (
            <div className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {planCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name */}
          <h3 className="font-bold text-gray-900 mb-2 truncate">
            {operator.name}
          </h3>

          {/* Country */}
          {operator.country && (
            <p className="text-sm text-gray-600 mb-3">
              {operator.country.name}
            </p>
          )}

          {/* Features */}
          <div className="flex items-center gap-3">
            {operator.has_data_plans && (
              <div className="flex items-center gap-1">
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600">Data</span>
              </div>
            )}
            {operator.has_talktime && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-600">Talktime</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700 transition-colors">
              View plans
            </span>
            <Check className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </Link>
  );
};
