import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useProjectStore } from '../../store/projectStore';
import type { FSSOServer } from '../../types/fortigate';

const PATH = 'user.fsso';

const defaultServer: FSSOServer = {
  name: '', type: 'default', server: '', server2: '', server3: '',
  port: 8000, password: '', ldapServer: '', groupPollInterval: 0, sourceIp: '',
};

export default function FSSO() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.user.fsso;

  const [editing, setEditing] = useState<{ item: FSSOServer; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const ldapOptions = [
    { value: '', label: '-- None --' },
    ...config.user.ldap.map((l) => ({ value: l.name, label: l.name })),
  ];

  const fields: FieldDef[] = [
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
    { key: 'type', label: 'Type', type: 'select', group: 'General', options: [
      { value: 'default', label: 'Collector Agent (poll)' },
      { value: 'fortinac', label: 'FortiNAC' },
    ]},
    { key: 'server', label: 'Primary Collector Agent', type: 'text', required: true, group: 'Collector Agents', placeholder: '10.0.0.5' },
    { key: 'server2', label: 'Secondary Collector Agent', type: 'text', group: 'Collector Agents' },
    { key: 'server3', label: 'Tertiary Collector Agent', type: 'text', group: 'Collector Agents' },
    { key: 'port', label: 'Port', type: 'number', group: 'Collector Agents', defaultValue: 8000 },
    { key: 'password', label: 'Password', type: 'text', group: 'Collector Agents' },
    { key: 'ldapServer', label: 'LDAP Server (group lookup)', type: 'select', group: 'Options', options: ldapOptions },
    { key: 'groupPollInterval', label: 'Group Poll Interval (min)', type: 'number', group: 'Options' },
    { key: 'sourceIp', label: 'Source IP', type: 'text', group: 'Options' },
  ];

  const columns: Column<FSSOServer>[] = [
    { key: 'name', label: 'Name' },
    { key: 'server', label: 'Primary Server' },
    { key: 'server2', label: 'Secondary', render: (s) => s.server2 || '-' },
    { key: 'port', label: 'Port', width: '80px' },
    { key: 'ldapServer', label: 'LDAP Server', render: (s) => s.ldapServer || '-' },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="FSSO (Single Sign-On)" columns={columns} data={data}
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
        <EditModal title="FSSO Server" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete FSSO Server" message={`Delete FSSO server "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
