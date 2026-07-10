import React, { useState } from 'react';
import { X } from 'lucide-react';

interface StringChipsProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxWidth?: number;
}

// Free-text chip list: type a value and press Enter to add. For arbitrary
// strings that aren't picked from a fixed option set (probe servers, IPs, ISDB).
export default function StringChips({ value, onChange, placeholder = 'Type and press Enter', maxWidth = 360 }: StringChipsProps) {
  const [input, setInput] = useState('');
  const add = () => { const v = input.trim(); if (v && !value.includes(v)) { onChange([...value, v]); } setInput(''); };
  return (
    <div style={{ maxWidth }}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {value.map((v, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-forti-band text-forti-text-primary text-xs rounded border border-forti-table-border">
              {v}
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-gray-400 hover:text-forti-deny"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
      <input className="forti-input" value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder} />
    </div>
  );
}
