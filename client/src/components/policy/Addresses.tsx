import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { FirewallAddress } from '../../types/fortigate';

const PATH = 'firewallAddress';

const defaultAddr: FirewallAddress = {
  name: '', type: 'ipmask', subnet: '', startIp: '', endIp: '', fqdn: '',
  country: '', wildcardFqdn: '', interface: '', comment: '', visibility: true,
  color: 0, allowRouting: false, associatedInterface: '', macaddr: [],
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'type', label: 'Type', type: 'select', required: true, group: 'General', options: [
    { value: 'ipmask', label: 'Subnet' }, { value: 'iprange', label: 'IP Range' },
    { value: 'fqdn', label: 'FQDN' }, { value: 'geography', label: 'Geography' },
    { value: 'wildcard', label: 'Wildcard FQDN' }, { value: 'mac', label: 'MAC Address' },
  ]},
  { key: 'subnet', label: 'Subnet / IP Mask', type: 'text', group: 'Address', placeholder: '192.168.1.0 255.255.255.0' },
  { key: 'startIp', label: 'Start IP', type: 'text', group: 'Address', placeholder: '10.0.0.1' },
  { key: 'endIp', label: 'End IP', type: 'text', group: 'Address', placeholder: '10.0.0.254' },
  { key: 'fqdn', label: 'FQDN', type: 'text', group: 'Address', placeholder: 'www.example.com' },
  { key: 'country', label: 'Country Code', type: 'text', group: 'Address', placeholder: 'US' },
  { key: 'wildcardFqdn', label: 'Wildcard FQDN', type: 'text', group: 'Address', placeholder: '*.example.com' },
  { key: 'associatedInterface', label: 'Associated Interface', type: 'text', group: 'Options' },
  { key: 'allowRouting', label: 'Allow Routing', type: 'checkbox', group: 'Options' },
  { key: 'color', label: 'Color', type: 'number', group: 'Options' },
  { key: 'comment', label: 'Comment', type: 'textarea', group: 'Options', width: 'full' },
];

export default function Addresses() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.firewallAddress;

  const [editing, setEditing] = useState<{ item: FirewallAddress; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const getDetail = (a: FirewallAddress) => {
    switch (a.type) {
      case 'ipmask': return a.subnet || '-';
      case 'iprange': return `${a.startIp} - ${a.endIp}`;
      case 'fqdn': return a.fqdn || '-';
      case 'geography': return a.country || '-';
      case 'wildcard': return a.wildcardFqdn || '-';
      case 'mac': return a.macaddr?.join(', ') || '-';
      default: return '-';
    }
  };

  const columns: Column<FirewallAddress>[] = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (a) => <StatusBadge value={a.type} customColors={{ bg: 'bg-blue-100', text: 'text-blue-800' }} /> },
    { key: 'detail', label: 'Details', render: (a) => getDetail(a) },
    { key: 'associatedInterface', label: 'Interface' },
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
      <DataTable title="Firewall Addresses" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultAddr }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="Address" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Address" message={`Delete address "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
