import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { Administrator } from '../../types/fortigate';

const PATH = 'system.admins';

const defaultAdmin: Administrator = {
  name: '', password: '', accprofile: 'super_admin',
  trusthost1: '0.0.0.0 0.0.0.0', trusthost2: '', trusthost3: '', trusthost4: '', trusthost5: '',
  comments: '', forcePasswordChange: false, twoFactor: 'disable', emailTo: '', smsServer: '',
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Username', type: 'text', required: true, group: 'General' },
  { key: 'password', label: 'Password', type: 'text', group: 'General' },
  { key: 'accprofile', label: 'Admin Profile', type: 'text', group: 'General', placeholder: 'super_admin' },
  { key: 'comments', label: 'Comments', type: 'textarea', group: 'General', width: 'full' },
  { key: 'trusthost1', label: 'Trusted Host 1', type: 'text', group: 'Trusted Hosts', placeholder: '0.0.0.0 0.0.0.0' },
  { key: 'trusthost2', label: 'Trusted Host 2', type: 'text', group: 'Trusted Hosts' },
  { key: 'trusthost3', label: 'Trusted Host 3', type: 'text', group: 'Trusted Hosts' },
  { key: 'trusthost4', label: 'Trusted Host 4', type: 'text', group: 'Trusted Hosts' },
  { key: 'trusthost5', label: 'Trusted Host 5', type: 'text', group: 'Trusted Hosts' },
  { key: 'twoFactor', label: 'Two-Factor Auth', type: 'select', group: 'Authentication', options: [
    { value: 'disable', label: 'Disable' }, { value: 'fortitoken', label: 'FortiToken' },
    { value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' },
  ]},
  { key: 'emailTo', label: 'Email To', type: 'text', group: 'Authentication' },
  { key: 'smsServer', label: 'SMS Server', type: 'text', group: 'Authentication' },
  { key: 'forcePasswordChange', label: 'Force Password Change', type: 'checkbox', group: 'Authentication' },
];

export default function Administrators() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.system.admins;

  const [editing, setEditing] = useState<{ item: Administrator; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<Administrator>[] = [
    { key: 'name', label: 'Name' },
    { key: 'accprofile', label: 'Admin Profile' },
    { key: 'trusthost1', label: 'Trusted Host 1' },
    { key: 'twoFactor', label: 'Two-Factor', render: (a) => <StatusBadge value={a.twoFactor} /> },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="Administrators" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultAdmin }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="Administrator" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Administrator" message={`Delete administrator "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
