import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { SystemInterface } from '../../types/fortigate';

const PATH = 'system.interfaces';

const defaultInterface: SystemInterface = {
  name: '', ip: '', netmask: '', allowaccess: [], type: 'physical', vlanid: 0,
  interface: '', alias: '', status: 'up', speed: 'auto', mtu: 1500, mtuOverride: false,
  role: 'undefined', description: '', mode: 'static', secondaryIP: false, secondaryIPs: [],
  dhcpRelayService: false, dhcpRelayIp: [], defaultgw: true, distance: 10, weight: 0,
  lldpTransmission: 'enable', lldpReception: 'enable', deviceIdentification: false,
  estimatedUpstreamBandwidth: 0, estimatedDownstreamBandwidth: 0, inbandwidth: 0, outbandwidth: 0,
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'alias', label: 'Alias', type: 'text', group: 'General' },
  { key: 'type', label: 'Type', type: 'select', group: 'General', options: [
    { value: 'physical', label: 'Physical' }, { value: 'vlan', label: 'VLAN' },
    { value: 'aggregate', label: 'Aggregate' }, { value: 'loopback', label: 'Loopback' },
    { value: 'tunnel', label: 'Tunnel' }, { value: 'redundant', label: 'Redundant' },
    { value: 'switch', label: 'Switch' },
  ]},
  { key: 'role', label: 'Role', type: 'select', group: 'General', options: [
    { value: 'lan', label: 'LAN' }, { value: 'wan', label: 'WAN' },
    { value: 'dmz', label: 'DMZ' }, { value: 'undefined', label: 'Undefined' },
  ]},
  { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
    { value: 'up', label: 'Up' }, { value: 'down', label: 'Down' },
  ]},
  { key: 'mode', label: 'Addressing Mode', type: 'select', group: 'IP Configuration', options: [
    { value: 'static', label: 'Static' }, { value: 'dhcp', label: 'DHCP' }, { value: 'pppoe', label: 'PPPoE' },
  ]},
  { key: 'ip', label: 'IP Address', type: 'text', group: 'IP Configuration', placeholder: '192.168.1.1' },
  { key: 'netmask', label: 'Subnet Mask', type: 'text', group: 'IP Configuration', placeholder: '255.255.255.0' },
  { key: 'allowaccess', label: 'Administrative Access', type: 'tagsinput', group: 'IP Configuration', placeholder: 'ping https ssh http fgfm', width: 'full' },
  { key: 'interface', label: 'Parent Interface (for VLAN)', type: 'text', group: 'VLAN' },
  { key: 'vlanid', label: 'VLAN ID', type: 'number', group: 'VLAN' },
  { key: 'speed', label: 'Speed', type: 'select', group: 'Physical', options: [
    { value: 'auto', label: 'Auto' }, { value: '10full', label: '10 Full' },
    { value: '100full', label: '100 Full' }, { value: '1000full', label: '1000 Full' },
    { value: '10000full', label: '10000 Full' },
  ]},
  { key: 'mtu', label: 'MTU', type: 'number', group: 'Physical', defaultValue: 1500 },
  { key: 'mtuOverride', label: 'MTU Override', type: 'checkbox', group: 'Physical' },
  { key: 'estimatedUpstreamBandwidth', label: 'Estimated Upstream Bandwidth (kbps)', type: 'number', group: 'Bandwidth' },
  { key: 'estimatedDownstreamBandwidth', label: 'Estimated Downstream Bandwidth (kbps)', type: 'number', group: 'Bandwidth' },
  { key: 'description', label: 'Description', type: 'textarea', group: 'Other', width: 'full' },
];

export default function Interfaces() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem } = useProjectStore();
  const data = config.system.interfaces;

  const [editing, setEditing] = useState<{ item: SystemInterface; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<SystemInterface>[] = [
    { key: 'name', label: 'Name' },
    { key: 'alias', label: 'Alias' },
    { key: 'type', label: 'Type' },
    { key: 'ip', label: 'IP / Netmask', render: (i) => i.ip ? `${i.ip} / ${i.netmask}` : '-' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status', render: (i) => <StatusBadge value={i.status} /> },
    { key: 'allowaccess', label: 'Admin Access', render: (i) => i.allowaccess.join(', ') || '-' },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable
        title="Network Interfaces"
        columns={columns}
        data={data}
        getRowKey={(item) => item.name}
        onAdd={() => { setEditing({ item: { ...defaultInterface }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
      />

      {editing && (
        <EditModal
          title="Interface"
          fields={fields}
          values={editing.item}
          isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting !== null && (
        <ConfirmDialog
          title="Delete Interface"
          message={`Are you sure you want to delete interface "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
