import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { LocalUser } from '../../types/fortigate';

const PATH = 'user.local';

const defaultUser: LocalUser = {
  name: '', status: 'enable', type: 'password', passwd: '',
  ldapServer: '', radiusServer: '', twoFactor: 'disable',
  emailTo: '', smsServer: '', fortitoken: '',
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Username', type: 'text', required: true, group: 'General' },
  { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'type', label: 'Type', type: 'select', group: 'General', options: [
    { value: 'password', label: 'Password' }, { value: 'ldap', label: 'LDAP' },
    { value: 'radius', label: 'RADIUS' }, { value: 'tacacs+', label: 'TACACS+' },
    { value: 'email', label: 'Email' },
  ]},
  { key: 'passwd', label: 'Password', type: 'text', group: 'Authentication' },
  { key: 'ldapServer', label: 'LDAP Server', type: 'text', group: 'Authentication' },
  { key: 'radiusServer', label: 'RADIUS Server', type: 'text', group: 'Authentication' },
  { key: 'twoFactor', label: 'Two-Factor Auth', type: 'select', group: 'Two-Factor', options: [
    { value: 'disable', label: 'Disable' }, { value: 'fortitoken', label: 'FortiToken' },
    { value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' },
  ]},
  { key: 'fortitoken', label: 'FortiToken Serial', type: 'text', group: 'Two-Factor' },
  { key: 'emailTo', label: 'Email To', type: 'text', group: 'Two-Factor' },
  { key: 'smsServer', label: 'SMS Server', type: 'text', group: 'Two-Factor' },
];

export default function LocalUsers() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem } = useProjectStore();
  const data = config.user.local;

  const [editing, setEditing] = useState<{ item: LocalUser; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<LocalUser>[] = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (u) => <StatusBadge value={u.type} /> },
    { key: 'status', label: 'Status', render: (u) => <StatusBadge value={u.status} /> },
    { key: 'twoFactor', label: 'Two-Factor', render: (u) => <StatusBadge value={u.twoFactor} /> },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="Local Users" columns={columns} data={data}
        getRowKey={(item) => item.name}
        onAdd={() => { setEditing({ item: { ...defaultUser }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
      />
      {editing && (
        <EditModal title="Local User" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Local User" message={`Delete local user "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
