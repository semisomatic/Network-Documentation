import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { RADIUSServer } from '../../types/fortigate';

const PATH = 'user.radius';

const defaultServer: RADIUSServer = {
  name: '', server: '', secondaryServer: '', tertiaryServer: '',
  secret: '', secondarySecret: '', tertiarySecret: '',
  port: 1812, acctPort: 1813, sourceIp: '', allUsergroup: false,
  nasIp: '', authType: 'auto', radiusCoa: false, interface: '',
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'server', label: 'Primary Server', type: 'text', required: true, group: 'General', placeholder: '10.0.0.1' },
  { key: 'secondaryServer', label: 'Secondary Server', type: 'text', group: 'General' },
  { key: 'tertiaryServer', label: 'Tertiary Server', type: 'text', group: 'General' },
  { key: 'port', label: 'Auth Port', type: 'number', group: 'General' },
  { key: 'acctPort', label: 'Accounting Port', type: 'number', group: 'General' },
  { key: 'secret', label: 'Primary Secret', type: 'text', group: 'Authentication' },
  { key: 'secondarySecret', label: 'Secondary Secret', type: 'text', group: 'Authentication' },
  { key: 'tertiarySecret', label: 'Tertiary Secret', type: 'text', group: 'Authentication' },
  { key: 'authType', label: 'Auth Type', type: 'select', group: 'Authentication', options: [
    { value: 'auto', label: 'Auto' }, { value: 'ms_chap_v2', label: 'MS-CHAPv2' },
    { value: 'ms_chap', label: 'MS-CHAP' }, { value: 'chap', label: 'CHAP' }, { value: 'pap', label: 'PAP' },
  ]},
  { key: 'nasIp', label: 'NAS IP', type: 'text', group: 'Options' },
  { key: 'sourceIp', label: 'Source IP', type: 'text', group: 'Options' },
  { key: 'interface', label: 'Interface', type: 'text', group: 'Options' },
  { key: 'allUsergroup', label: 'All User Groups', type: 'checkbox', group: 'Options' },
  { key: 'radiusCoa', label: 'RADIUS CoA', type: 'checkbox', group: 'Options' },
];

export default function RADIUSServers() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.user.radius;

  const [editing, setEditing] = useState<{ item: RADIUSServer; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<RADIUSServer>[] = [
    { key: 'name', label: 'Name' },
    { key: 'server', label: 'Server' },
    { key: 'port', label: 'Port' },
    { key: 'authType', label: 'Auth Type', render: (s) => <StatusBadge value={s.authType} /> },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="RADIUS Servers" columns={columns} data={data}
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
        <EditModal title="RADIUS Server" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete RADIUS Server" message={`Delete RADIUS server "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
