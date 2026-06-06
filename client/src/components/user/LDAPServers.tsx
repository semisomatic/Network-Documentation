import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { LDAPServer } from '../../types/fortigate';

const PATH = 'user.ldap';

const defaultServer: LDAPServer = {
  name: '', server: '', secondaryServer: '', tertiaryServer: '',
  port: 389, cnid: 'cn', dn: '', type: 'simple', username: '', password: '',
  secure: 'disable', caCert: '', passwordExpiryWarning: false, passwordRenewal: false,
  memberAttr: '', groupMemberCheck: 'user-attr', groupFilter: '', groupSearchBase: '',
  interface: '', sourceIp: '',
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'server', label: 'Server', type: 'text', required: true, group: 'General', placeholder: '10.0.0.1' },
  { key: 'secondaryServer', label: 'Secondary Server', type: 'text', group: 'General' },
  { key: 'tertiaryServer', label: 'Tertiary Server', type: 'text', group: 'General' },
  { key: 'port', label: 'Port', type: 'number', group: 'General' },
  { key: 'cnid', label: 'Common Name Identifier', type: 'text', group: 'LDAP', placeholder: 'cn' },
  { key: 'dn', label: 'Distinguished Name', type: 'text', required: true, group: 'LDAP', placeholder: 'dc=example,dc=com' },
  { key: 'type', label: 'Bind Type', type: 'select', group: 'LDAP', options: [
    { value: 'simple', label: 'Simple' }, { value: 'anonymous', label: 'Anonymous' }, { value: 'regular', label: 'Regular' },
  ]},
  { key: 'username', label: 'Username', type: 'text', group: 'Authentication' },
  { key: 'password', label: 'Password', type: 'text', group: 'Authentication' },
  { key: 'secure', label: 'Secure Connection', type: 'select', group: 'Security', options: [
    { value: 'disable', label: 'Disable' }, { value: 'starttls', label: 'STARTTLS' }, { value: 'ldaps', label: 'LDAPS' },
  ]},
  { key: 'caCert', label: 'CA Certificate', type: 'text', group: 'Security' },
  { key: 'memberAttr', label: 'Member Attribute', type: 'text', group: 'Group' },
  { key: 'groupMemberCheck', label: 'Group Member Check', type: 'select', group: 'Group', options: [
    { value: 'user-attr', label: 'User Attribute' }, { value: 'group-object', label: 'Group Object' },
    { value: 'posix-group-object', label: 'POSIX Group Object' },
  ]},
  { key: 'groupFilter', label: 'Group Filter', type: 'text', group: 'Group' },
  { key: 'groupSearchBase', label: 'Group Search Base', type: 'text', group: 'Group' },
  { key: 'interface', label: 'Interface', type: 'text', group: 'Network' },
  { key: 'sourceIp', label: 'Source IP', type: 'text', group: 'Network' },
];

export default function LDAPServers() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.user.ldap;

  const [editing, setEditing] = useState<{ item: LDAPServer; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<LDAPServer>[] = [
    { key: 'name', label: 'Name' },
    { key: 'server', label: 'Server' },
    { key: 'port', label: 'Port' },
    { key: 'dn', label: 'Distinguished Name' },
    { key: 'secure', label: 'Secure', render: (s) => <StatusBadge value={s.secure} /> },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="LDAP Servers" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultServer }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="LDAP Server" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete LDAP Server" message={`Delete LDAP server "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
