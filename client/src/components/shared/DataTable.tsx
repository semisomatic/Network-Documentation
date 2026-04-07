import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, Copy, Search, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

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
  onReorder?: (fromIndex: number, toIndex: number) => void;
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
  onReorder,
  getRowKey,
  searchFields,
  emptyMessage = 'No entries configured.',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Drag-and-drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

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

  // Disable sorting when drag-and-drop is active (no search/sort active)
  const isDragEnabled = !!onReorder && !searchQuery.trim() && !sortKey;

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

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndex;
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
    if (fromIndex !== null && fromIndex !== toIndex && onReorder) {
      onReorder(fromIndex, toIndex);
    }
  }, [dragIndex, onReorder]);

  const hasActions = onEdit || onDelete || onClone;
  const totalCols = columns.length + (isDragEnabled ? 1 : 0) + (hasActions ? 1 : 0);

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
          {sortKey && (
            <button
              onClick={() => { setSortKey(null); setSortDir('asc'); }}
              className="text-xs text-forti-accent hover:text-forti-accent-hover"
            >
              Clear sort
            </button>
          )}
          {onAdd && (
            <button onClick={onAdd} className="forti-btn-primary flex items-center space-x-1 text-xs">
              <Plus size={14} />
              <span>Create New</span>
            </button>
          )}
        </div>
      </div>

      {/* Drag hint */}
      {onReorder && (searchQuery.trim() || sortKey) && (
        <div className="px-4 py-1.5 bg-yellow-50 text-xs text-yellow-700 border-b border-yellow-200">
          Drag-and-drop reordering is disabled while search or sort is active.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="forti-table">
          <thead>
            <tr>
              {isDragEnabled && (
                <th style={{ width: '40px' }} className="text-center">&nbsp;</th>
              )}
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
              {hasActions && (
                <th style={{ width: '120px' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="text-center py-8 text-forti-text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => {
                const isBeingDragged = dragIndex === index;
                const isDragTarget = dragOverIndex === index && dragIndex !== index;

                return (
                  <tr
                    key={getRowKey ? getRowKey(item, index) : index}
                    className={`${isDragTarget ? 'border-t-2 !border-t-forti-accent bg-blue-50' : ''} ${isBeingDragged ? 'opacity-50' : ''}`}
                    onDragEnter={isDragEnabled ? (e) => handleDragEnter(e, index) : undefined}
                    onDragLeave={isDragEnabled ? handleDragLeave : undefined}
                    onDragOver={isDragEnabled ? handleDragOver : undefined}
                    onDrop={isDragEnabled ? (e) => handleDrop(e, index) : undefined}
                  >
                    {isDragEnabled && (
                      <td className="text-center cursor-grab active:cursor-grabbing">
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 p-1"
                        >
                          <GripVertical size={14} />
                        </div>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(item, index) : String(item[col.key] ?? '')}
                      </td>
                    ))}
                    {hasActions && (
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
                );
              })
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
