import React from 'react';

interface StatusBadgeProps {
  value: string;
  type?: 'action' | 'status' | 'custom';
  customColors?: { bg: string; text: string };
}

const STATUS_MAP: Record<string, { bg: string; text: string }> = {
  accept: { bg: 'bg-green-100', text: 'text-green-800' },
  deny: { bg: 'bg-red-100', text: 'text-red-800' },
  enable: { bg: 'bg-green-100', text: 'text-green-800' },
  disable: { bg: 'bg-gray-100', text: 'text-gray-600' },
  up: { bg: 'bg-green-100', text: 'text-green-800' },
  down: { bg: 'bg-red-100', text: 'text-red-800' },
  block: { bg: 'bg-red-100', text: 'text-red-800' },
  monitor: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  pass: { bg: 'bg-green-100', text: 'text-green-800' },
  allow: { bg: 'bg-green-100', text: 'text-green-800' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  authenticate: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

export default function StatusBadge({ value, customColors }: StatusBadgeProps) {
  const colors = customColors || STATUS_MAP[value?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
      {value}
    </span>
  );
}
