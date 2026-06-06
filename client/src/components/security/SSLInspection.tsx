import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { SSLInspectionProfile } from '../../types/fortigate';

const PATH = 'securityProfiles.sslInspection';

const defaultProfile: SSLInspectionProfile = {
  name: '', comment: '', inspectionMode: 'certificate-inspection',
  serverCert: '', serverCertMode: 're-sign', caname: '', untrustedCaname: '',
  mitmMode: 'disable', allowInvalidServerCert: false,
  untrustedServerCertAction: 'allow', sniServerCertCheck: false,
  https: { status: 'certificate-inspection', ports: '443' },
  ftps: { status: 'certificate-inspection', ports: '990' },
  imaps: { status: 'certificate-inspection', ports: '993' },
  pop3s: { status: 'certificate-inspection', ports: '995' },
  smtps: { status: 'certificate-inspection', ports: '465' },
  ssh: { status: 'deep-inspection', ports: '22' },
  exemptedAddresses: [], whitelistedAddresses: [],
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'comment', label: 'Comment', type: 'textarea', group: 'General', width: 'full' },
  { key: 'inspectionMode', label: 'Inspection Mode', type: 'select', group: 'General', options: [
    { value: 'certificate-inspection', label: 'Certificate Inspection' },
    { value: 'deep-inspection', label: 'Deep Inspection' },
  ]},
  { key: 'serverCertMode', label: 'Server Cert Mode', type: 'select', group: 'Certificates', options: [
    { value: 're-sign', label: 'Re-sign' }, { value: 'replace', label: 'Replace' },
  ]},
  { key: 'caname', label: 'CA Certificate', type: 'text', group: 'Certificates' },
  { key: 'untrustedCaname', label: 'Untrusted CA Certificate', type: 'text', group: 'Certificates' },
  { key: 'serverCert', label: 'Server Certificate', type: 'text', group: 'Certificates' },
  { key: 'mitmMode', label: 'MITM Mode', type: 'select', group: 'Advanced', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'allowInvalidServerCert', label: 'Allow Invalid Server Cert', type: 'checkbox', group: 'Advanced' },
  { key: 'untrustedServerCertAction', label: 'Untrusted Server Cert Action', type: 'select', group: 'Advanced', options: [
    { value: 'allow', label: 'Allow' }, { value: 'block', label: 'Block' }, { value: 'ignore', label: 'Ignore' },
  ]},
  { key: 'sniServerCertCheck', label: 'SNI Server Cert Check', type: 'checkbox', group: 'Advanced' },
];

export default function SSLInspection() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.securityProfiles.sslInspection;

  const [editing, setEditing] = useState<{ item: SSLInspectionProfile; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<SSLInspectionProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'inspectionMode', label: 'Inspection Mode', render: (p) => <StatusBadge value={p.inspectionMode} /> },
    { key: 'serverCertMode', label: 'Server Cert Mode', render: (p) => <StatusBadge value={p.serverCertMode} /> },
    { key: 'caname', label: 'CA Name' },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="SSL/SSH Inspection Profiles" columns={columns} data={data}
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
        <EditModal title="SSL/SSH Inspection Profile" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete SSL/SSH Inspection Profile" message={`Delete SSL inspection profile "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
