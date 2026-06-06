import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { UserGroup } from '../../types/fortigate';

const PATH = 'user.group';

const defaultGroup: UserGroup = {
  name: '', groupType: 'firewall', member: [], match: [],
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'groupType', label: 'Group Type', type: 'select', group: 'General', options: [
    { value: 'firewall', label: 'Firewall' }, { value: 'fsso-service', label: 'FSSO' },
    { value: 'rsso', label: 'RSSO' }, { value: 'guest', label: 'Guest' },
  ]},
  { key: 'member', label: 'Members', type: 'tagsinput', group: 'Members', placeholder: 'user1 user2', width: 'full' },
];

export default function UserGroups() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.user.group;

  const [editing, setEditing] = useState<{ item: UserGroup; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<UserGroup>[] = [
    { key: 'name', label: 'Name' },
    { key: 'groupType', label: 'Group Type', render: (g) => <StatusBadge value={g.groupType} /> },
    { key: 'member', label: 'Members', render: (g) => g.member.join(', ') || '-' },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="User Groups" columns={columns} data={data}
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
        <EditModal title="User Group" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete User Group" message={`Delete user group "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
