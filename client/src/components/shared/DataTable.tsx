import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Search, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import type { HighlightColor } from '../../types/fortigate';

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
  // Highlight support
  highlights?: Record<string, HighlightColor>;
  onHighlight?: (key: string, color: HighlightColor | null) => void;
  // Warning support (orphan refs, etc.)
  getWarnings?: (item: T) => string[];
}

const HIGHLIGHT_COLORS: { color: HighlightColor; label: string; dot: string; bg: string }[] = [
  { color: 'red', label: 'Red', dot: 'bg-red-400', bg: 'bg-red-100' },
  { color: 'yellow', label: 'Yellow', dot: 'bg-yellow-400', bg: 'bg-yellow-100' },
  { color: 'green', label: 'Green', dot: 'bg-green-400', bg: 'bg-green-100' },
  { color: 'blue', label: 'Blue', dot: 'bg-blue-400', bg: 'bg-blue-100' },
];

const HIGHLIGHT_BG: Record<HighlightColor, string> = {
  red: 'bg-red-50',
  yellow: 'bg-yellow-50',
  green: 'bg-green-50',
  blue: 'bg-blue-50',
};

const HIGHLIGHT_NAME_BG: Record<HighlightColor, string> = {
  red: 'bg-red-200 text-red-900',
  yellow: 'bg-yellow-200 text-yellow-900',
  green: 'bg-green-200 text-green-900',
  blue: 'bg-blue-200 text-blue-900',
};

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
  highlights,
  onHighlight,
  getWarnings,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Drag-and-drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    key: string;
  } | null>(null);

  const canDrag = !!onReorder && !searchQuery.trim() && !sortKey;
  const canHighlight = !!highlights && !!onHighlight && !!getRowKey;

  // Close context menu on any click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    const fields = searchFields || columns.map((c) => c.key);
    return data.filter((item) =>
      fields.some((field) => {
        const val = item[field];
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      }),
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

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
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

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = dragIndex;
      setDragIndex(null);
      setDragOverIndex(null);
      dragCounter.current = 0;
      if (fromIndex !== null && fromIndex !== toIndex && onReorder) {
        onReorder(fromIndex, toIndex);
      }
    },
    [dragIndex, onReorder],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: T, index: number) => {
      if (!canHighlight) return;
      e.preventDefault();
      const key = getRowKey!(item, index);
      setContextMenu({ x: e.clientX, y: e.clientY, key });
    },
    [canHighlight, getRowKey],
  );

  const hasActions = onEdit || onDelete || onClone;
  const hasWarnings = !!getWarnings;
  const totalCols = columns.length + (hasActions ? 1 : 0) + (hasWarnings ? 1 : 0);

  return (
    <div className="forti-card">
      {/* Header */}
      <div className="forti-section-header">
        <h2 className="forti-section-title">{title}</h2>
        <div className="flex items-center space-x-3">
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
              onClick={() => {
                setSortKey(null);
                setSortDir('asc');
              }}
              className="text-xs text-forti-accent hover:text-forti-accent-hover"
            >
              Clear sort
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="forti-btn-primary flex items-center space-x-1 text-xs"
            >
              <Plus size={14} />
              <span>Create New</span>
            </button>
          )}
        </div>
      </div>

      {/* Drag hint when disabled */}
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
              {hasWarnings && <th style={{ width: '30px' }} />}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={col.sortable !== false ? 'cursor-pointer hover:bg-gray-200' : ''}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.label}</span>
                    {sortKey === col.key &&
                      (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
              ))}
              {hasActions && <th style={{ width: '120px' }}>Actions</th>}
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
                const isDragTarget = dragOverIndex === index && dragIndex !== index;
                const isBeingDragged = dragIndex === index;
                const rowKey = getRowKey ? getRowKey(item, index) : String(index);
                const rowHighlight = highlights?.[rowKey];
                const warnings = getWarnings ? getWarnings(item) : [];

                return (
                  <tr
                    key={rowKey}
                    draggable={canDrag}
                    onDragStart={canDrag ? (e) => handleDragStart(e, index) : undefined}
                    onDragEnd={canDrag ? handleDragEnd : undefined}
                    onDragEnter={canDrag ? (e) => handleDragEnter(e, index) : undefined}
                    onDragLeave={canDrag ? handleDragLeave : undefined}
                    onDragOver={canDrag ? handleDragOver : undefined}
                    onDrop={canDrag ? (e) => handleDrop(e, index) : undefined}
                    onContextMenu={(e) => handleContextMenu(e, item, index)}
                    onDoubleClick={
                      onEdit
                        ? (e) => {
                            // Ignore double-clicks that land on the action buttons
                            if ((e.target as HTMLElement).closest('button')) return;
                            onEdit(item, index);
                          }
                        : undefined
                    }
                    className={`
                      ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}
                      ${isDragTarget ? 'border-t-2 !border-t-forti-accent bg-blue-50' : ''}
                      ${isBeingDragged ? 'opacity-40' : ''}
                    `}
                  >
                    {hasWarnings && (
                      <td className="!px-1 !py-0 text-center" style={{ width: '30px' }}>
                        {warnings.length > 0 && (
                          <span className="group relative">
                            <AlertTriangle size={14} className="text-amber-500 inline-block" />
                            <span className="hidden group-hover:block absolute left-6 top-0 z-50 bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg max-w-xs">
                              {warnings.map((w, i) => (
                                <span key={i} className="block">
                                  {w}
                                </span>
                              ))}
                            </span>
                          </span>
                        )}
                      </td>
                    )}
                    {columns.map((col, colIdx) => {
                      const isFirstCol = colIdx === 0;
                      const highlightClass =
                        isFirstCol && rowHighlight ? HIGHLIGHT_NAME_BG[rowHighlight] : '';
                      return (
                        <td key={col.key}>
                          {isFirstCol && rowHighlight ? (
                            <span className={`inline-block px-1.5 py-0.5 rounded text-sm ${highlightClass}`}>
                              {col.render
                                ? col.render(item, index)
                                : String(item[col.key] ?? '')}
                            </span>
                          ) : (
                            col.render
                              ? col.render(item, index)
                              : String(item[col.key] ?? '')
                          )}
                        </td>
                      );
                    })}
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

      {/* Right-click highlight context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs text-gray-500 font-semibold">Highlight</div>
          {HIGHLIGHT_COLORS.map(({ color, label, dot }) => {
            const isActive = highlights?.[contextMenu.key] === color;
            return (
              <button
                key={color}
                onClick={() => {
                  onHighlight!(contextMenu.key, isActive ? null : color);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 flex items-center"
              >
                <span className={`w-3 h-3 rounded-full mr-2 ${dot}`} />
                <span className="flex-1">{label}</span>
                {isActive && <span className="text-forti-accent text-xs ml-2">Active</span>}
              </button>
            );
          })}
          {highlights?.[contextMenu.key] && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  onHighlight!(contextMenu.key, null);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 text-gray-500"
              >
                Remove Highlight
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
