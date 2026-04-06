import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { FirewallService } from '../../types/fortigate';

const PATH = 'firewallService';

const defaultService: FirewallService = {
  name: '', category: '', protocol: 'TCP/UDP/SCTP', tcpPortrange: '', udpPortrange: '',
  sctpPortrange: '', protocolNumber: 0, icmptype: 0, icmpcode: 0, comment: '',
  visibility: true, color: 0, sessionTtl: 0, proxy: false, iprange: '', fqdn: '',
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'category', label: 'Category', type: 'text', group: 'General' },
  { key: 'protocol', label: 'Protocol', type: 'select', group: 'General', options: [
    { value: 'TCP/UDP/SCTP', label: 'TCP/UDP/SCTP' }, { value: 'ICMP', label: 'ICMP' },
    { value: 'ICMP6', label: 'ICMP6' }, { value: 'IP', label: 'IP' },
  ]},
  { key: 'tcpPortrange', label: 'TCP Port Range', type: 'text', group: 'Ports', placeholder: '80 443 8080' },
  { key: 'udpPortrange', label: 'UDP Port Range', type: 'text', group: 'Ports', placeholder: '53 123' },
  { key: 'sctpPortrange', label: 'SCTP Port Range', type: 'text', group: 'Ports' },
  { key: 'protocolNumber', label: 'IP Protocol Number', type: 'number', group: 'Ports' },
  { key: 'icmptype', label: 'ICMP Type', type: 'number', group: 'Ports' },
  { key: 'icmpcode', label: 'ICMP Code', type: 'number', group: 'Ports' },
  { key: 'sessionTtl', label: 'Session TTL (seconds)', type: 'number', group: 'Options' },
  { key: 'color', label: 'Color', type: 'number', group: 'Options' },
  { key: 'comment', label: 'Comment', type: 'textarea', group: 'Options', width: 'full' },
];

export default function Services() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem } = useProjectStore();
  const data = config.firewallService;

  const [editing, setEditing] = useState<{ item: FirewallService; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<FirewallService>[] = [
    { key: 'name', label: 'Name' },
    { key: 'protocol', label: 'Protocol', render: (s) => <StatusBadge value={s.protocol} customColors={{ bg: 'bg-purple-100', text: 'text-purple-800' }} /> },
    { key: 'tcpPortrange', label: 'TCP Ports' },
    { key: 'udpPortrange', label: 'UDP Ports' },
    { key: 'category', label: 'Category' },
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
      <DataTable title="Firewall Services" columns={columns} data={data}
        getRowKey={(item) => item.name}
        onAdd={() => { setEditing({ item: { ...defaultService }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
      />
      {editing && (
        <EditModal title="Service" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Service" message={`Delete service "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
