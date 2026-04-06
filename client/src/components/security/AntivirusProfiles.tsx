import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { AntivirusProfile } from '../../types/fortigate';

const PATH = 'securityProfiles.antivirus';

const defaultProfile: AntivirusProfile = {
  name: '', comment: '', httpAction: 'block', ftpAction: 'block',
  imapAction: 'block', pop3Action: 'block', smtpAction: 'block',
  nntp: 'block', mapi: 'block', ssh: 'block',
  scanMode: 'quick', ftgdAnalytics: 'disable', analytics_max_upload: 10,
  emThreatFeed: true, outbreakPrevention: 'disable', contentDisarm: false,
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'comment', label: 'Comment', type: 'textarea', group: 'General', width: 'full' },
  { key: 'scanMode', label: 'Scan Mode', type: 'select', group: 'General', options: [
    { value: 'quick', label: 'Quick' }, { value: 'full', label: 'Full' }, { value: 'legacy', label: 'Legacy' },
  ]},
  { key: 'httpAction', label: 'HTTP Action', type: 'select', group: 'Protocol Actions', options: [
    { value: 'block', label: 'Block' }, { value: 'monitor', label: 'Monitor' },
  ]},
  { key: 'ftpAction', label: 'FTP Action', type: 'select', group: 'Protocol Actions', options: [
    { value: 'block', label: 'Block' }, { value: 'monitor', label: 'Monitor' },
  ]},
  { key: 'imapAction', label: 'IMAP Action', type: 'select', group: 'Protocol Actions', options: [
    { value: 'block', label: 'Block' }, { value: 'monitor', label: 'Monitor' },
  ]},
  { key: 'pop3Action', label: 'POP3 Action', type: 'select', group: 'Protocol Actions', options: [
    { value: 'block', label: 'Block' }, { value: 'monitor', label: 'Monitor' },
  ]},
  { key: 'smtpAction', label: 'SMTP Action', type: 'select', group: 'Protocol Actions', options: [
    { value: 'block', label: 'Block' }, { value: 'monitor', label: 'Monitor' },
  ]},
  { key: 'nntp', label: 'NNTP Action', type: 'select', group: 'Protocol Actions', options: [
    { value: 'block', label: 'Block' }, { value: 'monitor', label: 'Monitor' },
  ]},
  { key: 'mapi', label: 'MAPI Action', type: 'select', group: 'Protocol Actions', options: [
    { value: 'block', label: 'Block' }, { value: 'monitor', label: 'Monitor' },
  ]},
  { key: 'ssh', label: 'SSH Action', type: 'select', group: 'Protocol Actions', options: [
    { value: 'block', label: 'Block' }, { value: 'monitor', label: 'Monitor' },
  ]},
  { key: 'ftgdAnalytics', label: 'FortiGuard Analytics', type: 'select', group: 'Advanced', options: [
    { value: 'disable', label: 'Disable' }, { value: 'suspicious', label: 'Suspicious' }, { value: 'everything', label: 'Everything' },
  ]},
  { key: 'analytics_max_upload', label: 'Max Upload Size (MB)', type: 'number', group: 'Advanced' },
  { key: 'emThreatFeed', label: 'EMS Threat Feed', type: 'checkbox', group: 'Advanced' },
  { key: 'outbreakPrevention', label: 'Outbreak Prevention', type: 'select', group: 'Advanced', options: [
    { value: 'disable', label: 'Disable' }, { value: 'files', label: 'Files' }, { value: 'full-archive', label: 'Full Archive' },
  ]},
  { key: 'contentDisarm', label: 'Content Disarm', type: 'checkbox', group: 'Advanced' },
];

export default function AntivirusProfiles() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem } = useProjectStore();
  const data = config.securityProfiles.antivirus;

  const [editing, setEditing] = useState<{ item: AntivirusProfile; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<AntivirusProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'scanMode', label: 'Scan Mode', render: (p) => <StatusBadge value={p.scanMode} /> },
    { key: 'httpAction', label: 'HTTP', render: (p) => <StatusBadge value={p.httpAction} /> },
    { key: 'ftpAction', label: 'FTP', render: (p) => <StatusBadge value={p.ftpAction} /> },
    { key: 'smtpAction', label: 'SMTP', render: (p) => <StatusBadge value={p.smtpAction} /> },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="Antivirus Profiles" columns={columns} data={data}
        getRowKey={(item) => item.name}
        onAdd={() => { setEditing({ item: { ...defaultProfile }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
      />
      {editing && (
        <EditModal title="Antivirus Profile" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Antivirus Profile" message={`Delete antivirus profile "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
