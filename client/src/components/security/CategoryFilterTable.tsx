import React, { useRef } from 'react';
import { CATEGORY_GROUP_ORDER, FORTIGUARD_CATEGORIES, categoryName } from '../../data/fortiguardCategories';

interface CatEntry { id: number; action: string; }

interface Props {
  value: CatEntry[];
  onChange: (v: CatEntry[]) => void;
  actionOptions: { value: string; label: string }[];
  localCategories: { id: number; name: string }[];
  defaultAction?: string;
  maxHeight?: number;
}

// FortiGate-style FortiGuard category table: ALL categories are shown, grouped
// and sorted by group; categories with no explicit config default to `defaultAction`.
// Only categories whose action differs from the default (or were already
// configured) are kept in the model, preserving config round-trip.
export default function CategoryFilterTable({
  value, onChange, actionOptions, localCategories, defaultAction = 'allow', maxHeight = 360,
}: Props) {
  const originalIds = useRef(new Set(value.map((v) => v.id)));
  const actionOf = (id: number) => value.find((v) => v.id === id)?.action ?? defaultAction;

  const setAction = (id: number, action: string) => {
    const m = new Map(value.map((v) => [v.id, v.action]));
    m.set(id, action);
    onChange(
      [...m.entries()]
        .filter(([cid, a]) => a !== defaultAction || originalIds.current.has(cid))
        .map(([cid, a]) => ({ id: cid, action: a })),
    );
  };

  // Build grouped category list (local + all FortiGuard, sorted by id within group)
  const byGroup: Record<string, { id: number; name: string }[]> = {};
  for (const c of localCategories) (byGroup['Local Categories'] ||= []).push({ id: c.id, name: c.name });
  for (const [id, c] of Object.entries(FORTIGUARD_CATEGORIES)) (byGroup[c.group] ||= []).push({ id: +id, name: c.name });
  // any configured id we don't recognize -> "Other" so it's still visible/editable
  const known = new Set([...localCategories.map((c) => c.id), ...Object.keys(FORTIGUARD_CATEGORIES).map(Number)]);
  for (const v of value) if (!known.has(v.id)) (byGroup['Other'] ||= []).push({ id: v.id, name: categoryName(v.id, localCategories) });
  for (const g of Object.keys(byGroup)) byGroup[g].sort((a, b) => a.id - b.id);

  const groupOrder = [...CATEGORY_GROUP_ORDER, 'Other'].filter((g) => byGroup[g]?.length);
  const total = groupOrder.reduce((n, g) => n + byGroup[g].length, 0);

  return (
    <div className="border border-forti-table-border rounded overflow-hidden w-full max-w-[640px]">
      <div style={{ maxHeight, overflowY: 'auto' }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-forti-table-header text-forti-text-secondary">
              <th className="text-left font-semibold px-3 py-1.5 border-b border-forti-table-border">Name</th>
              <th className="text-left font-semibold px-3 py-1.5 border-b border-forti-table-border" style={{ width: '220px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {groupOrder.map((g) => (
              <React.Fragment key={g}>
                <tr className="bg-gray-700 text-white">
                  <td colSpan={2} className="px-3 py-1.5 font-semibold">
                    {g} <span className="ml-1 opacity-80 font-normal">({byGroup[g].length})</span>
                  </td>
                </tr>
                {byGroup[g].map((cat) => (
                  <tr key={cat.id} className="border-b border-forti-table-border last:border-b-0 hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-forti-text-primary">{cat.name}</td>
                    <td className="px-3 py-1">
                      <select
                        className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forti-accent"
                        value={actionOf(cat.id)}
                        onChange={(e) => setAction(cat.id, e.target.value)}
                      >
                        {actionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end px-3 py-1.5 bg-white border-t border-forti-table-border">
        <span className="text-[11px] text-forti-text-secondary">{total} categories</span>
      </div>
    </div>
  );
}
