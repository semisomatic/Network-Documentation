import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { IPSProfile } from '../../types/fortigate';

const PATH = 'securityProfiles.ips';

const defaultProfile: IPSProfile = {
  name: '', comment: '', entries: [],
  blockMaliciousUrl: true, scanBotnetConnections: 'disable',
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'comment', label: 'Comment', type: 'textarea', group: 'General', width: 'full' },
  { key: 'blockMaliciousUrl', label: 'Block Malicious URLs', type: 'checkbox', group: 'Options' },
  { key: 'scanBotnetConnections', label: 'Scan Botnet Connections', type: 'select', group: 'Options', options: [
    { value: 'disable', label: 'Disable' }, { value: 'block', label: 'Block' }, { value: 'monitor', label: 'Monitor' },
  ]},
];

export default function IPS() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem, reorderItems } = useProjectStore();
  const data = config.securityProfiles.ips;

  const [editing, setEditing] = useState<{ item: IPSProfile; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<IPSProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'blockMaliciousUrl', label: 'Block Malicious URLs', render: (p) => <StatusBadge value={p.blockMaliciousUrl ? 'enabled' : 'disabled'} /> },
    { key: 'scanBotnetConnections', label: 'Scan Botnet', render: (p) => <StatusBadge value={p.scanBotnetConnections} /> },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="Intrusion Prevention Profiles" columns={columns} data={data}
        getRowKey={(item) => item.name}
        onAdd={() => { setEditing({ item: { ...defaultProfile }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="IPS Profile" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete IPS Profile" message={`Delete IPS profile "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
