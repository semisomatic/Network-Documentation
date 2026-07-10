import React from 'react';

// White editor card. px-5 matches the FormSection band's -mx-5 bleed.
export function Card({ title, children }: { title?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-forti-card border border-forti-table-border rounded-md shadow-sm px-5 pt-2 pb-4 mb-4">
      {title && <div className="flex items-center gap-2.5 py-2 text-sm font-semibold text-forti-text-primary">{title}</div>}
      {children}
    </div>
  );
}

// Grey section band that spans the card width (like FortiGate "Address", "Administrative Access")
export function FormSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && (
        <div className="bg-forti-band border-t border-b border-forti-table-border -mx-5 px-5 py-2 my-3 text-sm font-semibold text-forti-text-primary">
          {title}
        </div>
      )}
      {children}
    </section>
  );
}

interface FieldRowProps {
  label?: React.ReactNode;
  children: React.ReactNode;
  indent?: boolean;
  help?: string;
  align?: 'center' | 'start';
}

// A single label-left / control-right row
export function FieldRow({ label, children, indent = false, help, align = 'center' }: FieldRowProps) {
  return (
    <div className={`flex gap-4 py-1.5 flex-wrap ${align === 'center' ? 'items-center' : 'items-start'}`}>
      <div className={`shrink-0 text-sm text-forti-text-secondary ${indent ? 'w-[168px] pl-5' : 'w-[188px]'} ${align === 'start' ? 'pt-1.5' : ''}`}>
        {label}
      </div>
      <div className="flex-1 min-w-[220px]">
        {children}
        {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
      </div>
    </div>
  );
}

// Small circled-i info marker with a tooltip
export function InfoDot({ tip }: { tip: string }) {
  return (
    <span
      title={tip}
      className="inline-flex items-center justify-center w-[15px] h-[15px] rounded-full border border-forti-accent text-forti-accent text-[10px] italic font-serif cursor-help align-middle"
    >
      i
    </span>
  );
}
