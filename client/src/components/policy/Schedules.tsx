import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { FirewallSchedule } from '../../types/fortigate';

const PATH = 'firewallSchedule';

const defaultSched: FirewallSchedule = {
  name: '', type: 'always', start: '', end: '', day: [], color: 0,
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'type', label: 'Type', type: 'select', options: [
    { value: 'always', label: 'Always' }, { value: 'onetime', label: 'One-time' },
    { value: 'recurring', label: 'Recurring' },
  ]},
  { key: 'day', label: 'Days', type: 'multiselect', options: [
    { value: 'sunday', label: 'Sunday' }, { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' }, { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' }, { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
  ]},
  { key: 'start', label: 'Start Time', type: 'text', placeholder: '08:00' },
  { key: 'end', label: 'End Time', type: 'text', placeholder: '17:00' },
  { key: 'color', label: 'Color', type: 'number' },
];

export default function Schedules() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.firewallSchedule;

  const [editing, setEditing] = useState<{ item: FirewallSchedule; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<FirewallSchedule>[] = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (s) => <StatusBadge value={s.type} customColors={{ bg: 'bg-indigo-100', text: 'text-indigo-800' }} /> },
    { key: 'day', label: 'Days', render: (s) => s.day.join(', ') || '-' },
    { key: 'start', label: 'Start' },
    { key: 'end', label: 'End' },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="Schedules" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultSched }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="Schedule" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Schedule" message={`Delete schedule "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
