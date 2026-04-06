import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Copy, Search, ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  onAdd?: () => void;
  onEdit?: (item: T, index: number) => void;
  onDelete?: (item: T, index: number) => void;
  onClone?: (item: T, index: number) => void;
  getRowKey?: (item: T, index: number) => string;
  searchFields?: string[];
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  title,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  onClone,
  getRowKey,
  searchFields,
  emptyMessage = 'No entries configured.',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    const fields = searchFields || columns.map((c) => c.key);
    return data.filter((item) =>
      fields.some((field) => {
        const val = item[field];
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, searchQuery, searchFields, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="forti-card">
      {/* Header */}
      <div className="forti-section-header">
        <h2 className="forti-section-title">{title}</h2>
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="forti-input pl-9 w-56 text-xs"
            />
          </div>
          {onAdd && (
            <button onClick={onAdd} className="forti-btn-primary flex items-center space-x-1 text-xs">
              <Plus size={14} />
              <span>Create New</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="forti-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={col.sortable !== false ? 'cursor-pointer hover:bg-gray-200' : ''}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.label}</span>
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onClone) && (
                <th style={{ width: '120px' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || onClone ? 1 : 0)} className="text-center py-8 text-forti-text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr key={getRowKey ? getRowKey(item, index) : index}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(item, index) : String(item[col.key] ?? '')}
                    </td>
                  ))}
                  {(onEdit || onDelete || onClone) && (
                    <td>
                      <div className="flex items-center space-x-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item, index)}
                            className="p-1 text-forti-accent hover:text-forti-accent-hover rounded"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {onClone && (
                          <button
                            onClick={() => onClone(item, index)}
                            className="p-1 text-gray-500 hover:text-gray-700 rounded"
                            title="Clone"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item, index)}
                            className="p-1 text-red-500 hover:text-red-700 rounded"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-forti-table-border text-xs text-forti-text-secondary">
        {sortedData.length} of {data.length} entries
      </div>
    </div>
  );
}
