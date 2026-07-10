import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export interface InlineColumn<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
}

interface InlineTableProps<T> {
  columns: InlineColumn<T>[];
  data: T[];
  onCreate?: () => void;
  onEdit?: (item: T, index: number) => void;
  onDelete?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string;
  searchFields?: string[];
  emptyMessage?: string;
  maxHeight?: number; // px; enables vertical scroll when the list is long (e.g. reservations)
}

// FortiGate-style inline sub-table: Create New / Edit / Delete toolbar, row selection,
// search, sortable-looking headers and a count badge. Replaces the textarea editors.
export default function InlineTable<T extends Record<string, any>>({
  columns, data, onCreate, onEdit, onDelete, getRowKey, searchFields, emptyMessage = 'No results', maxHeight,
}: InlineTableProps<T>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const withIdx = data.map((item, index) => ({ item, index }));
    if (!query.trim()) return withIdx;
    const q = query.toLowerCase();
    const fields = searchFields || columns.map((c) => c.key);
    return withIdx.filter(({ item }) =>
      fields.some((f) => item[f] != null && String(item[f]).toLowerCase().includes(q)),
    );
  }, [data, query, searchFields, columns]);

  const selItem = selected != null ? data[selected] : null;

  return (
    <div className="border border-forti-table-border rounded overflow-hidden w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white border-b border-forti-table-border flex-wrap">
        {onCreate && (
          <button type="button" onClick={onCreate}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-forti-accent text-forti-accent-hover hover:bg-forti-accent-soft">
            <Plus size={13} /> Create New
          </button>
        )}
        <button type="button" disabled={selItem == null}
          onClick={() => selItem != null && onEdit?.(selItem, selected!)}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-gray-300 text-forti-text-primary enabled:hover:bg-gray-50 disabled:opacity-50">
          <Pencil size={13} /> Edit
        </button>
        <button type="button" disabled={selItem == null}
          onClick={() => { if (selItem != null) { onDelete?.(selItem, selected!); setSelected(null); } }}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-gray-300 text-forti-text-primary enabled:hover:bg-gray-50 disabled:opacity-50">
          <Trash2 size={13} /> Delete
        </button>
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search"
            className="text-xs pl-7 pr-2 py-1.5 border border-gray-300 rounded w-40 focus:outline-none focus:ring-1 focus:ring-forti-accent" />
        </div>
      </div>

      {/* Table */}
      <div style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
        <table className="w-full text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <thead>
            <tr className="bg-forti-table-header text-forti-text-secondary">
              {columns.map((c) => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined}
                  className="text-left font-semibold px-2.5 py-1.5 border-b border-forti-table-border whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center text-forti-text-secondary py-6">{emptyMessage}</td></tr>
            ) : (
              rows.map(({ item, index }) => (
                <tr key={getRowKey ? getRowKey(item, index) : index}
                  onClick={() => setSelected(index)}
                  onDoubleClick={() => onEdit?.(item, index)}
                  className={`cursor-pointer border-b border-forti-table-border last:border-b-0
                    ${selected === index ? 'bg-forti-accent-soft' : 'hover:bg-gray-50'}`}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-2.5 py-1.5">
                      {c.render ? c.render(item, index) : String(item[c.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="flex justify-end px-2.5 py-1.5 bg-white border-t border-forti-table-border">
        <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 rounded-full bg-forti-band text-forti-text-secondary text-[11px]">
          {data.length}
        </span>
      </div>
    </div>
  );
}
