import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { PolicyRoute } from '../../types/fortigate';

const PATH = 'router.policy';

const defaultRoute: PolicyRoute = {
  seqNum: 0, inputDevice: [], src: '', srcNegate: false, dst: '', dstNegate: false,
  protocol: 0, startPort: 0, endPort: 0, gateway: '', outputDevice: '',
  status: 'enable', comments: '', tos: '', tosMask: '',
};

const fields: FieldDef[] = [
  { key: 'seqNum', label: 'Sequence Number', type: 'number', required: true, group: 'General' },
  { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'inputDevice', label: 'Input Device', type: 'tagsinput', group: 'Match', placeholder: 'port1' },
  { key: 'src', label: 'Source', type: 'text', group: 'Match', placeholder: '0.0.0.0/0' },
  { key: 'srcNegate', label: 'Negate Source', type: 'checkbox', group: 'Match' },
  { key: 'dst', label: 'Destination', type: 'text', group: 'Match', placeholder: '0.0.0.0/0' },
  { key: 'dstNegate', label: 'Negate Destination', type: 'checkbox', group: 'Match' },
  { key: 'protocol', label: 'Protocol', type: 'number', group: 'Match' },
  { key: 'startPort', label: 'Start Port', type: 'number', group: 'Match' },
  { key: 'endPort', label: 'End Port', type: 'number', group: 'Match' },
  { key: 'gateway', label: 'Gateway', type: 'text', group: 'Action', placeholder: '0.0.0.0' },
  { key: 'outputDevice', label: 'Output Device', type: 'text', group: 'Action' },
  { key: 'tos', label: 'ToS', type: 'text', group: 'Advanced' },
  { key: 'tosMask', label: 'ToS Mask', type: 'text', group: 'Advanced' },
  { key: 'comments', label: 'Comments', type: 'textarea', group: 'Advanced', width: 'full' },
];

export default function PolicyRoutes() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem, reorderItems } = useProjectStore();
  const data = config.router.policy;

  const [editing, setEditing] = useState<{ item: PolicyRoute; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<PolicyRoute>[] = [
    { key: 'seqNum', label: 'Seq #' },
    { key: 'inputDevice', label: 'Input Device', render: (r) => r.inputDevice.join(', ') || '-' },
    { key: 'src', label: 'Source' },
    { key: 'dst', label: 'Destination' },
    { key: 'gateway', label: 'Gateway' },
    { key: 'outputDevice', label: 'Output Device' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="Policy Routes" columns={columns} data={data}
        getRowKey={(item) => String(item.seqNum)}
        onAdd={() => { setEditing({ item: { ...defaultRoute }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, seqNum: item.seqNum + 1 }, index: -1 }); setIsNew(true); }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="Policy Route" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Policy Route" message={`Delete policy route seq #${data[deleting]?.seqNum}?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
