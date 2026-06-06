import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { FirewallVIP } from '../../types/fortigate';

const PATH = 'firewallVip';

const defaultVIP: FirewallVIP = {
  name: '', extip: '', mappedip: [], extintf: 'any', portforward: false,
  protocol: 'tcp', extport: '', mappedport: '', comment: '', color: 0,
  type: 'static-nat', srcintfFilter: [], srcFilter: [], natSourceVip: false,
  arpReply: true, portmappingType: 'one-to-one', gratuitousArpInterval: 0,
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'type', label: 'Type', type: 'select', group: 'General', options: [
    { value: 'static-nat', label: 'Static NAT' }, { value: 'load-balance', label: 'Load Balance' },
    { value: 'server-load-balance', label: 'Server Load Balance' },
    { value: 'dns-translation', label: 'DNS Translation' }, { value: 'fqdn', label: 'FQDN' },
  ]},
  { key: 'extip', label: 'External IP', type: 'text', group: 'Mapping', placeholder: '203.0.113.10' },
  { key: 'mappedip', label: 'Mapped IP(s)', type: 'tagsinput', group: 'Mapping', placeholder: '192.168.1.10' },
  { key: 'extintf', label: 'External Interface', type: 'text', group: 'Mapping', placeholder: 'any' },
  { key: 'portforward', label: 'Port Forwarding', type: 'checkbox', group: 'Port Forward' },
  { key: 'protocol', label: 'Protocol', type: 'select', group: 'Port Forward', options: [
    { value: 'tcp', label: 'TCP' }, { value: 'udp', label: 'UDP' },
    { value: 'sctp', label: 'SCTP' }, { value: 'icmp', label: 'ICMP' },
  ]},
  { key: 'extport', label: 'External Port', type: 'text', group: 'Port Forward', placeholder: '443' },
  { key: 'mappedport', label: 'Mapped Port', type: 'text', group: 'Port Forward', placeholder: '8443' },
  { key: 'arpReply', label: 'ARP Reply', type: 'checkbox', group: 'Options' },
  { key: 'natSourceVip', label: 'NAT Source VIP', type: 'checkbox', group: 'Options' },
  { key: 'comment', label: 'Comment', type: 'textarea', group: 'Options', width: 'full' },
];

export default function VirtualIPs() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.firewallVip;

  const [editing, setEditing] = useState<{ item: FirewallVIP; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<FirewallVIP>[] = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'extip', label: 'External IP' },
    { key: 'mappedip', label: 'Mapped IP', render: (v) => v.mappedip.join(', ') },
    { key: 'extintf', label: 'Interface' },
    { key: 'portforward', label: 'Port Fwd', render: (v) => v.portforward ? `${v.protocol} ${v.extport}→${v.mappedport}` : '-' },
    { key: 'comment', label: 'Comment' },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="Virtual IPs (DNAT)" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultVIP }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="Virtual IP" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete VIP" message={`Delete VIP "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
