import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import SSLInspectionEditor from './SSLInspectionEditor';
import { useProjectStore } from '../../store/projectStore';
import type { SSLInspectionProfile, SSLProtoBlock } from '../../types/fortigate';

const PATH = 'securityProfiles.sslInspection';

const emptyBlock = (): SSLProtoBlock => ({ status: 'disable', ports: '', quic: '', unsupportedSslVersion: '', expiredCert: '', revokedCert: '', certValidationFailure: '' });

const defaultProfile: SSLInspectionProfile = {
  name: '', comment: '', caCert: 'Fortinet_CA_SSL', serverCertMode: '',
  inspectAll: '', sslExpiredCert: 'block', sslRevokedCert: 'block', sslCertValidationFailure: 'block',
  https: { ...emptyBlock(), status: 'deep-inspection', ports: '443', quic: 'inspect' },
  ftps: { ...emptyBlock(), ports: '990' }, imaps: { ...emptyBlock(), ports: '993' },
  pop3s: { ...emptyBlock(), ports: '995' }, smtps: { ...emptyBlock(), ports: '465' },
  dot: { ...emptyBlock(), quic: 'inspect' }, ssh: { ...emptyBlock(), status: 'deep-inspection', ports: '22' },
  sslExempt: [], logSslAnomalies: true,
};

const methodLabel = (p: SSLInspectionProfile) => p.inspectAll
  ? (p.inspectAll === 'deep-inspection' ? 'Full (all ports)' : 'Certificate (all ports)')
  : (p.https.status === 'deep-inspection' ? 'Full SSL Inspection' : p.https.status === 'certificate-inspection' ? 'Certificate Inspection' : 'Disabled');

export default function SSLInspection() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.securityProfiles.sslInspection;

  const [editorState, setEditorState] = useState<{ item: SSLInspectionProfile; index: number; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<SSLInspectionProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'method', label: 'Inspection', render: methodLabel },
    { key: 'caCert', label: 'CA Certificate', render: (p) => p.caCert || '-' },
    { key: 'sshStatus', label: 'SSH Deep Scan', render: (p) => p.ssh.status === 'deep-inspection' ? 'Yes' : 'No' },
    { key: 'sslExempt', label: 'Exemptions', render: (p) => p.sslExempt.length || '-' },
    { key: 'comment', label: 'Comment' },
  ];

  const saveProfile = (item: SSLInspectionProfile) => {
    if (!editorState) return;
    if (editorState.isNew) addItem(PATH, item);
    else updateItem(PATH, editorState.index, item);
    setEditorState(null);
  };

  if (editorState) {
    return (
      <SSLInspectionEditor
        initial={editorState.item}
        isNew={editorState.isNew}
        onSave={saveProfile}
        onCancel={() => setEditorState(null)}
      />
    );
  }

  return (
    <>
      <DataTable title="SSL/SSH Inspection" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => setEditorState({ item: { ...defaultProfile }, index: -1, isNew: true })}
        onEdit={(item, index) => setEditorState({ item: { ...item }, index, isNew: false })}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => setEditorState({ item: { ...item, name: item.name + '_copy' }, index: -1, isNew: true })}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {deleting !== null && (
        <ConfirmDialog title="Delete SSL/SSH Inspection Profile" message={`Delete SSL/SSH inspection profile "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
