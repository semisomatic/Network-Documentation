import React from 'react';

interface EditorPageProps {
  title: string;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
  saveLabel?: string;
  saveDisabled?: boolean;
}

// Full-page FortiGate-style editor: titled header, scrollable body, sticky action bar.
export default function EditorPage({ title, onSave, onCancel, children, saveLabel = 'OK', saveDisabled = false }: EditorPageProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-0">
        <h1 className="inline-block text-[17px] font-semibold text-forti-text-primary pb-2 border-b-2 border-forti-accent">
          {title}
        </h1>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl">{children}</div>
      </div>

      {/* Sticky action bar */}
      <div className="flex justify-end gap-3 px-6 py-3 border-t border-forti-table-border bg-forti-card shadow-[0_-1px_3px_rgba(20,30,40,0.06)]">
        <button type="button" onClick={onCancel}
          className="px-6 py-2 text-sm rounded border border-gray-300 text-forti-text-primary hover:bg-gray-50">
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={saveDisabled}
          className="px-6 py-2 text-sm rounded bg-forti-accent text-white hover:bg-forti-accent-hover disabled:opacity-50">
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
