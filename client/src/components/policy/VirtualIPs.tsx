import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import VIPEditor from './VIPEditor';
import { useProjectStore } from '../../store/projectStore';
import type { FirewallVIP } from '../../types/fortigate';

const PATH = 'firewallVip';

const defaultVIP: FirewallVIP = {
  name: '', extip: '', mappedip: [], extintf: 'any', portforward: false,
  protocol: 'tcp', extport: '', mappedport: '', comment: '', color: 0,
  type: 'static-nat', srcintfFilter: [], srcFilter: [], natSourceVip: false,
  arpReply: true, portmappingType: 'one-to-one', gratuitousArpInterval: 0,
};

export default function VirtualIPs() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.firewallVip;

  const [editorState, setEditorState] = useState<{ item: FirewallVIP; index: number; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<FirewallVIP>[] = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (v) => v.type === 'static-nat' ? 'Static NAT' : v.type },
    { key: 'extip', label: 'External IP' },
    { key: 'mappedip', label: 'Mapped IP', render: (v) => v.mappedip.join(', ') || '-' },
    { key: 'extintf', label: 'Interface' },
    { key: 'portforward', label: 'Port Forward', render: (v) => v.portforward ? `${v.protocol.toUpperCase()} ${v.extport}→${v.mappedport}` : '-' },
    { key: 'comment', label: 'Comment' },
  ];

  const saveVIP = (item: FirewallVIP) => {
    if (!editorState) return;
    if (editorState.isNew) addItem(PATH, item);
    else updateItem(PATH, editorState.index, item);
    setEditorState(null);
  };

  if (editorState) {
    return (
      <VIPEditor
        initial={editorState.item}
        isNew={editorState.isNew}
        onSave={saveVIP}
        onCancel={() => setEditorState(null)}
      />
    );
  }

  return (
    <>
      <DataTable title="Virtual IPs (DNAT)" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => setEditorState({ item: { ...defaultVIP }, index: -1, isNew: true })}
        onEdit={(item, index) => setEditorState({ item: { ...item }, index, isNew: false })}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => setEditorState({ item: { ...item, name: item.name + '_copy' }, index: -1, isNew: true })}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {deleting !== null && (
        <ConfirmDialog title="Delete VIP" message={`Delete VIP "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
