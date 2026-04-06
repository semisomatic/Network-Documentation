import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useProjectStore } from '../../store/projectStore';
import type { FirewallServiceGroup } from '../../types/fortigate';

const PATH = 'firewallServiceGroup';

const defaultGroup: FirewallServiceGroup = { name: '', member: [], comment: '', color: 0 };

export default function ServiceGroups() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem } = useProjectStore();
  const data = config.firewallServiceGroup;
  const services = config.firewallService;

  const [editing, setEditing] = useState<{ item: FirewallServiceGroup; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fields: FieldDef[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'member', label: 'Members', type: 'multiselect', width: 'full',
      options: services.map((s) => ({ value: s.name, label: `${s.name} (${s.tcpPortrange || s.udpPortrange || s.protocol})` })) },
    { key: 'color', label: 'Color', type: 'number' },
    { key: 'comment', label: 'Comment', type: 'textarea', width: 'full' },
  ];

  const columns: Column<FirewallServiceGroup>[] = [
    { key: 'name', label: 'Name' },
    { key: 'member', label: 'Members', render: (g) => g.member.join(', ') || '-' },
    { key: 'comment', label: 'Comment' },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="Service Groups" columns={columns} data={data}
        getRowKey={(item) => item.name}
        onAdd={() => { setEditing({ item: { ...defaultGroup }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
      />
      {editing && (
        <EditModal title="Service Group" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Group" message={`Delete service group "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
