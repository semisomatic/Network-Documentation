import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { StaticRoute } from '../../types/fortigate';

const PATH = 'router.static';

const defaultRoute: StaticRoute = {
  seqNum: 0, dst: '', gateway: '', device: '', distance: 10, weight: 0,
  priority: 1, status: 'enable', comment: '', blackhole: false, sdwan: false, sdwanZone: '',
};

const fields: FieldDef[] = [
  { key: 'seqNum', label: 'Sequence Number', type: 'number', required: true },
  { key: 'dst', label: 'Destination', type: 'text', required: true, placeholder: '10.0.0.0 255.255.0.0' },
  { key: 'gateway', label: 'Gateway', type: 'text', placeholder: '192.168.1.254' },
  { key: 'device', label: 'Interface', type: 'text', placeholder: 'port1' },
  { key: 'distance', label: 'Administrative Distance', type: 'number', defaultValue: 10 },
  { key: 'weight', label: 'Weight', type: 'number', defaultValue: 0 },
  { key: 'priority', label: 'Priority', type: 'number', defaultValue: 1 },
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'blackhole', label: 'Blackhole Route', type: 'checkbox' },
  { key: 'comment', label: 'Comment', type: 'textarea', width: 'full' },
];

export default function StaticRoutes() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.router.static;

  const [editing, setEditing] = useState<{ item: StaticRoute; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<StaticRoute>[] = [
    { key: 'seqNum', label: 'Seq #', width: '80px' },
    { key: 'dst', label: 'Destination' },
    { key: 'gateway', label: 'Gateway' },
    { key: 'device', label: 'Interface' },
    { key: 'distance', label: 'Distance' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'comment', label: 'Comment' },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) {
      const item = { ...editing.item };
      if (!item.seqNum) item.seqNum = data.length > 0 ? Math.max(...data.map(r => r.seqNum)) + 1 : 1;
      addItem(PATH, item);
    } else {
      updateItem(PATH, editing.index, editing.item);
    }
    setEditing(null);
  };

  return (
    <>
      <DataTable
        title="Static Routes"
        columns={columns}
        data={data}
        getRowKey={(item) => String(item.seqNum)}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultRoute, seqNum: data.length > 0 ? Math.max(...data.map(r => r.seqNum)) + 1 : 1 }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />

      {editing && (
        <EditModal
          title="Static Route"
          fields={fields}
          values={editing.item}
          isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting !== null && (
        <ConfirmDialog
          title="Delete Route"
          message={`Are you sure you want to delete route #${data[deleting]?.seqNum}?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
