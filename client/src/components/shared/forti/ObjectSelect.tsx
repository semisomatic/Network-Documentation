import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Search } from 'lucide-react';

export interface ObjectOption {
  value: string;
  label: string;
}

interface ObjectSelectProps {
  options: ObjectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  single?: boolean;
  maxWidth?: number;
}

// FortiGate-style object picker: selected items shown as removable chips in a
// bordered box, with a "+" that opens a searchable dropdown of the remaining
// options. Used for interfaces, addresses, services, groups, IP pools.
export default function ObjectSelect({ options, value, onChange, placeholder = 'Select', single = false, maxWidth = 360 }: ObjectSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const labelFor = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  const available = useMemo(() => {
    const q = query.toLowerCase();
    return options.filter((o) => !value.includes(o.value) && o.label.toLowerCase().includes(q));
  }, [options, value, query]);

  const add = (v: string) => {
    onChange(single ? [v] : [...value, v]);
    setQuery('');
    if (single) setOpen(false);
  };
  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  return (
    <div ref={ref} className="relative" style={{ maxWidth }}>
      <div className="border border-gray-300 rounded bg-white px-2 py-1.5 min-h-[38px] flex flex-wrap gap-1 items-center">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-forti-band text-forti-text-primary text-xs rounded border border-forti-table-border">
            {labelFor(v)}
            <button type="button" onClick={() => remove(v)} className="text-gray-400 hover:text-forti-deny"><X size={11} /></button>
          </span>
        ))}
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center justify-center w-6 h-6 rounded text-forti-text-secondary hover:bg-gray-100" title="Add">
          <Plus size={14} />
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg">
          <div className="relative p-2 border-b border-forti-table-border">
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder}
              className="w-full text-xs pl-7 pr-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-forti-accent" />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {available.length === 0 ? (
              <div className="px-3 py-2 text-xs text-forti-text-secondary">No matches</div>
            ) : (
              available.map((o) => (
                <button key={o.value} type="button" onClick={() => add(o.value)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-forti-accent-soft text-forti-text-primary">
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
