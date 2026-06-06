import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
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

  const [editing, setEditing] = useState<{ item: DHCPServer; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const intfOptions = [
    { value: '', label: '-- Select --' },
    ...config.system.interfaces.map(i => ({ value: i.name, label: i.name })),
  ];

  const fields: FieldDef[] = [
    { key: 'id', label: 'ID', type: 'number', required: true, group: 'General' },
    { key: 'interface', label: 'Interface', type: 'select', required: true, group: 'General', options: intfOptions },
    { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
      { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
    ]},
    { key: 'leaseTime', label: 'Lease Time (seconds)', type: 'number', group: 'General' },
    { key: 'defaultGateway', label: 'Default Gateway', type: 'text', group: 'Network', placeholder: '192.168.1.1' },
    { key: 'netmask', label: 'Netmask', type: 'text', group: 'Network', placeholder: '255.255.255.0' },
    { key: '_ipRangeText', label: 'IP Ranges (one per line: startIP-endIP)', type: 'textarea', group: 'Network', width: 'full',
      placeholder: '192.168.1.100-192.168.1.200\n192.168.1.210-192.168.1.250',
      helpText: 'Format: startIP-endIP, one range per line' },
    { key: 'dnsServer1', label: 'DNS Server 1', type: 'text', group: 'DNS' },
    { key: 'dnsServer2', label: 'DNS Server 2', type: 'text', group: 'DNS' },
    { key: 'dnsServer3', label: 'DNS Server 3', type: 'text', group: 'DNS' },
    { key: 'domain', label: 'Domain', type: 'text', group: 'DNS' },
    { key: 'winsServer1', label: 'WINS Server 1', type: 'text', group: 'Advanced' },
    { key: 'winsServer2', label: 'WINS Server 2', type: 'text', group: 'Advanced' },
    { key: 'ntpServer1', label: 'NTP Server 1', type: 'text', group: 'Advanced' },
    { key: 'ntpServer2', label: 'NTP Server 2', type: 'text', group: 'Advanced' },
    { key: 'comments', label: 'Comments', type: 'textarea', group: 'Other', width: 'full' },
  ];

  const columns: Column<DHCPServer>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'interface', label: 'Interface' },
    { key: 'status', label: 'Status', render: (s) => <StatusBadge value={s.status} /> },
    { key: 'ipRanges', label: 'IP Range', render: (s) => {
      if (s.ipRanges.length === 0) return '-';
      return s.ipRanges.map(r => `${r.startIp} - ${r.endIp}`).join(', ');
    }},
    { key: 'defaultGateway', label: 'Gateway' },
    { key: 'netmask', label: 'Netmask' },
    { key: 'dnsServer1', label: 'DNS 1' },
    { key: 'comments', label: 'Comments' },
  ];

  const ipRangesToText = (ranges: DHCPServer['ipRanges']): string => {
    return ranges.map(r => `${r.startIp}-${r.endIp}`).join('\n');
  };

  const textToIpRanges = (text: string): DHCPServer['ipRanges'] => {
    return text.split('\n').filter(l => l.trim()).map((line, i) => {
      const [start, end] = line.trim().split('-').map(s => s.trim());
      return { id: i + 1, startIp: start || '', endIp: end || '' };
    });
  };

  const handleEdit = (item: DHCPServer, index: number) => {
    setEditing({
      item: { ...item, _ipRangeText: ipRangesToText(item.ipRanges) } as any,
      index,
    });
    setIsNew(false);
  };

  const handleSave = () => {
    if (!editing) return;
    const { _ipRangeText, ...item } = editing.item as any;
    item.ipRanges = textToIpRanges(_ipRangeText || '');
    if (isNew) addItem(PATH, item);
    else updateItem(PATH, editing.index, item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="DHCP Servers" columns={columns} data={data}
        getRowKey={(item) => String(item.id)}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultServer, _ipRangeText: '' } as any, index: -1 }); setIsNew(true); }}
        onEdit={handleEdit}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => {
          setEditing({ item: { ...item, id: item.id + 1, _ipRangeText: ipRangesToText(item.ipRanges) } as any, index: -1 });
          setIsNew(true);
        }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="DHCP Server" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete DHCP Server" message={`Delete DHCP server #${data[deleting]?.id}?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
