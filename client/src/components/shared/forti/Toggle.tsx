import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

// FortiGate-style green switch
export default function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  const sw = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-[38px] h-5 rounded-full transition-colors flex-none
        ${checked ? 'bg-forti-accent' : 'bg-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all
          ${checked ? 'left-[20px]' : 'left-0.5'}`}
      />
    </button>
  );

  if (!label) return sw;
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      {sw}
      <span className="text-sm text-forti-text-primary">{label}</span>
    </label>
  );
}
