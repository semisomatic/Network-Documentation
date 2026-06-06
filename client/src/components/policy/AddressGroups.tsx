import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useProjectStore } from '../../store/projectStore';
import type { FirewallAddressGroup } from '../../types/fortigate';

const PATH = 'firewallAddrgrp';

const defaultGroup: FirewallAddressGroup = {
  name: '', member: [], comment: '', visibility: true, color: 0, exclude: false, excludeMember: [],
};

export default function AddressGroups() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.firewallAddrgrp;
  const addresses = config.firewallAddress;

  const [editing, setEditing] = useState<{ item: FirewallAddressGroup; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fields: FieldDef[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'member', label: 'Members', type: 'multiselect', width: 'full',
      options: addresses.map((a) => ({ value: a.name, label: a.name })) },
    { key: 'exclude', label: 'Enable Exclude', type: 'checkbox' },
    { key: 'excludeMember', label: 'Exclude Members', type: 'multiselect', width: 'full',
      options: addresses.map((a) => ({ value: a.name, label: a.name })) },
    { key: 'color', label: 'Color', type: 'number' },
    { key: 'comment', label: 'Comment', type: 'textarea', width: 'full' },
  ];

  const columns: Column<FirewallAddressGroup>[] = [
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
      <DataTable title="Address Groups" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultGroup }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="Address Group" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Group" message={`Delete group "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
