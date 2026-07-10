import React from 'react';
import { InfoDot } from './FormLayout';

export interface CheckboxOption {
  value: string;
  label: string;
  info?: string;
}

interface CheckboxGridProps {
  options: CheckboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  columns?: number;
}

// FortiGate-style multi-column checkbox matrix (e.g. Administrative Access)
export default function CheckboxGrid({ options, value, onChange, columns = 3 }: CheckboxGridProps) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="grid gap-x-6 gap-y-2 max-w-[600px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(140px, 1fr))` }}>
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 text-sm text-forti-text-primary cursor-pointer">
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="w-4 h-4 rounded accent-forti-accent"
          />
          <span>{opt.label}</span>
          {opt.info && <InfoDot tip={opt.info} />}
        </label>
      ))}
    </div>
  );
}
