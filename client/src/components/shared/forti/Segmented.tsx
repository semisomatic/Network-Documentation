import React from 'react';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean; // when active, render red instead of green (e.g. "Disabled")
}

interface SegmentedProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

// FortiGate-style segmented button group (Manual / IPAM / DHCP / PPPoE, etc.)
export default function Segmented<T extends string | number>({ options, value, onChange, className = '' }: SegmentedProps<T>) {
  return (
    <div className={`inline-flex rounded border border-gray-300 overflow-hidden ${className}`}>
      {options.map((opt, i) => {
        const active = opt.value === value;
        const activeCls = opt.danger ? 'bg-forti-deny text-white' : 'bg-forti-accent text-white';
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3.5 py-1.5 text-sm inline-flex items-center gap-1.5 transition-colors
              ${i > 0 ? 'border-l border-gray-300' : ''}
              ${active ? activeCls : 'bg-white text-forti-text-secondary hover:bg-gray-50'}`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
