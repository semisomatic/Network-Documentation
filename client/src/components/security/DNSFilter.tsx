import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { DNSFilterProfile } from '../../types/fortigate';

const PATH = 'securityProfiles.dnsFilter';

const defaultProfile: DNSFilterProfile = {
  name: '', comment: '', domainFilter: [], ftgdDnsCategories: [],
  blockBotnet: true, safeSearch: false, youtubeRestrict: 'none',
  externalIpBlocklist: [], redirectPortal: '', logAllDomain: false,
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'comment', label: 'Comment', type: 'textarea', group: 'General', width: 'full' },
  { key: 'blockBotnet', label: 'Block Botnet', type: 'checkbox', group: 'Options' },
  { key: 'safeSearch', label: 'Safe Search', type: 'checkbox', group: 'Options' },
  { key: 'youtubeRestrict', label: 'YouTube Restrict', type: 'select', group: 'Options', options: [
    { value: 'none', label: 'None' }, { value: 'strict', label: 'Strict' }, { value: 'moderate', label: 'Moderate' },
  ]},
  { key: 'redirectPortal', label: 'Redirect Portal', type: 'text', group: 'Advanced' },
  { key: 'logAllDomain', label: 'Log All Domains', type: 'checkbox', group: 'Advanced' },
];

export default function DNSFilter() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.securityProfiles.dnsFilter;

  const [editing, setEditing] = useState<{ item: DNSFilterProfile; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<DNSFilterProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'blockBotnet', label: 'Block Botnet', render: (p) => <StatusBadge value={p.blockBotnet ? 'enabled' : 'disabled'} /> },
    { key: 'safeSearch', label: 'Safe Search', render: (p) => <StatusBadge value={p.safeSearch ? 'enabled' : 'disabled'} /> },
    { key: 'youtubeRestrict', label: 'YouTube Restrict', render: (p) => <StatusBadge value={p.youtubeRestrict} /> },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="DNS Filter Profiles" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultProfile }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="DNS Filter Profile" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete DNS Filter Profile" message={`Delete DNS filter profile "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
