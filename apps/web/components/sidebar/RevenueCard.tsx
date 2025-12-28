import React from 'react';

interface RevenueCardProps {
  title: string;
  amount: string;
  description: string;
  highlight?: boolean;
}

export default function RevenueCard({
  title,
  amount,
  description,
  highlight = false,
}: RevenueCardProps) {
  if (highlight) {
    return (
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="text-sm font-medium text-blue-600 mb-1">{title}</div>
        <div className="text-2xl font-bold text-blue-700">{amount}</div>
        <div className="mt-4 text-xs text-blue-400">{description}</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
      <div className="text-sm font-medium text-blue-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{amount}</div>
      <div className="mt-2 text-xs text-gray-400">{description}</div>
    </div>
  );
}
