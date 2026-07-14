import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import IPSEditor from './IPSEditor';
import { useProjectStore } from '../../store/projectStore';
import type { IPSProfile } from '../../types/fortigate';

const PATH = 'securityProfiles.ips';

const defaultProfile: IPSProfile = {
  name: '', comment: '', blockMaliciousUrl: false, scanBotnetConnections: 'disable', entries: [],
};

export default function IPS() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.securityProfiles.ips;

  const [editorState, setEditorState] = useState<{ item: IPSProfile; index: number; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<IPSProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'entries', label: 'Signatures & Filters', render: (p) => p.entries.length ? `${p.entries.length} entr${p.entries.length === 1 ? 'y' : 'ies'}` : '-' },
    { key: 'blockMaliciousUrl', label: 'Block Malicious URL', render: (p) => <StatusBadge value={p.blockMaliciousUrl ? 'enable' : 'disable'} /> },
    { key: 'scanBotnetConnections', label: 'Botnet C&C', render: (p) => p.scanBotnetConnections },
    { key: 'comment', label: 'Comment' },
  ];

  const saveProfile = (item: IPSProfile) => {
    if (!editorState) return;
    if (editorState.isNew) addItem(PATH, item);
    else updateItem(PATH, editorState.index, item);
    setEditorState(null);
  };

  if (editorState) {
    return (
      <IPSEditor
        initial={editorState.item}
        isNew={editorState.isNew}
        onSave={saveProfile}
        onCancel={() => setEditorState(null)}
      />
    );
  }

  return (
    <>
      <DataTable title="IPS Sensors" columns={columns} data={data}
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
        <ConfirmDialog title="Delete IPS Sensor" message={`Delete IPS sensor "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
