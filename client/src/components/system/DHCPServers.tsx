import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import DHCPEditor from './DHCPEditor';
import { useProjectStore } from '../../store/projectStore';
import type { DHCPServer } from '../../types/fortigate';

const PATH = 'system.dhcpServers';

const defaultServer: DHCPServer = {
  id: 0, interface: '', status: 'enable', leaseTime: 604800,
  defaultGateway: '', netmask: '255.255.255.0', dnsServer1: '', dnsServer2: '', dnsServer3: '',
  domain: '', winsServer1: '', winsServer2: '', ntpServer1: '', ntpServer2: '', comments: '',
  ipRanges: [], reservedAddresses: [], options: [],
};

export default function DHCPServers() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.system.dhcpServers;
  const interfaces = config.system.interfaces.map((i) => i.name);

  const [editorState, setEditorState] = useState<{ item: DHCPServer; index: number; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<DHCPServer>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'interface', label: 'Interface' },
    { key: 'status', label: 'Status', render: (s) => <StatusBadge value={s.status} /> },
    { key: 'ipRanges', label: 'IP Range', render: (s) => s.ipRanges.length === 0 ? '-' : s.ipRanges.map((r) => `${r.startIp} - ${r.endIp}`).join(', ') },
    { key: 'defaultGateway', label: 'Gateway' },
    { key: 'netmask', label: 'Netmask' },
    { key: 'dnsServer1', label: 'DNS 1' },
    { key: 'reservedAddresses', label: 'Reservations', width: '100px', render: (s) => s.reservedAddresses.length || '-' },
    { key: 'comments', label: 'Comments' },
  ];

  const nextServerId = () => (data.length ? Math.max(...data.map((d) => d.id)) + 1 : 1);

  const saveServer = (item: DHCPServer) => {
    if (!editorState) return;
    if (editorState.isNew) addItem(PATH, item);
    else updateItem(PATH, editorState.index, item);
    setEditorState(null);
  };

  if (editorState) {
    return (
      <DHCPEditor
        initial={editorState.item}
        isNew={editorState.isNew}
        interfaces={interfaces}
        onSave={saveServer}
        onCancel={() => setEditorState(null)}
      />
    );
  }

  return (
    <>
      <DataTable title="DHCP Servers" columns={columns} data={data}
        getRowKey={(item) => String(item.id)}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => setEditorState({ item: { ...defaultServer, id: nextServerId() }, index: -1, isNew: true })}
        onEdit={(item, index) => setEditorState({ item: { ...item }, index, isNew: false })}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => setEditorState({ item: { ...item, id: nextServerId() }, index: -1, isNew: true })}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {deleting !== null && (
        <ConfirmDialog title="Delete DHCP Server" message={`Delete DHCP server #${data[deleting]?.id}?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
