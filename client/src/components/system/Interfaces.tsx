import React, { useState, useMemo } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { SystemInterface } from '../../types/fortigate';

const PATH = 'system.interfaces';

// Build a grouped interface list: parents first, then sub-interfaces sorted alphabetically
interface DisplayInterface extends SystemInterface {
  _isChild: boolean;
  _originalIndex: number;
}

function buildGroupedInterfaces(interfaces: SystemInterface[]): DisplayInterface[] {
  // Track which interfaces are parents (referenced by other interfaces' "interface" field)
  const childrenByParent = new Map<string, { iface: SystemInterface; origIdx: number }[]>();
  const parentSet = new Set<string>();
  const topLevel: { iface: SystemInterface; origIdx: number }[] = [];

  // First pass: identify children and group them
  interfaces.forEach((iface, idx) => {
    const parentName = iface.interface;
    if (parentName && parentName !== iface.name) {
      // This is a sub-interface (e.g. VLAN on a parent)
      parentSet.add(parentName);
      if (!childrenByParent.has(parentName)) {
        childrenByParent.set(parentName, []);
      }
      childrenByParent.get(parentName)!.push({ iface, origIdx: idx });
    } else {
      topLevel.push({ iface, origIdx: idx });
    }
  });

  // Sort children alphabetically by name
  for (const children of childrenByParent.values()) {
    children.sort((a, b) => a.iface.name.localeCompare(b.iface.name, undefined, { numeric: true }));
  }

  // Sort top-level: parents that have children first, then remaining, alphabetically
  topLevel.sort((a, b) => {
    const aHasChildren = childrenByParent.has(a.iface.name);
    const bHasChildren = childrenByParent.has(b.iface.name);
    if (aHasChildren && !bHasChildren) return -1;
    if (!aHasChildren && bHasChildren) return 1;
    return a.iface.name.localeCompare(b.iface.name, undefined, { numeric: true });
  });

  // Build result: parent followed by its children
  const result: DisplayInterface[] = [];
  for (const { iface, origIdx } of topLevel) {
    result.push({ ...iface, _isChild: false, _originalIndex: origIdx });
    const children = childrenByParent.get(iface.name);
    if (children) {
      for (const { iface: child, origIdx: childIdx } of children) {
        result.push({ ...child, _isChild: true, _originalIndex: childIdx });
      }
    }
  }

  // Add any orphaned children whose parent wasn't found in the list
  for (const [parentName, children] of childrenByParent.entries()) {
    if (!topLevel.some((t) => t.iface.name === parentName)) {
      for (const { iface: child, origIdx: childIdx } of children) {
        result.push({ ...child, _isChild: true, _originalIndex: childIdx });
      }
    }
  }

  return result;
}

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

  // Group interfaces: parent first, sub-interfaces alphabetically underneath
  const groupedData = useMemo(() => buildGroupedInterfaces(data), [data]);

  const columns: Column<DisplayInterface>[] = [
    { key: 'name', label: 'Name', sortable: false, render: (i) => (
      <span className={i._isChild ? 'pl-6 text-gray-700' : 'font-medium'}>
        {i._isChild && <span className="text-gray-400 mr-1">&#x2514;</span>}
        {i.name}
      </span>
    )},
    { key: 'alias', label: 'Alias' },
    { key: 'type', label: 'Type', render: (i) => (
      <span>{i.type}{i.type === 'vlan' && i.vlanid ? ` (ID: ${i.vlanid})` : ''}</span>
    )},
    { key: 'ip', label: 'IP / Netmask', render: (i) => i.ip ? `${i.ip} / ${i.netmask}` : '-' },
    { key: 'interface', label: 'Parent', render: (i) => i.interface || '-' },
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
        data={groupedData}
        getRowKey={(item) => item.name}
        onAdd={() => { setEditing({ item: { ...defaultInterface }, index: -1 }); setIsNew(true); }}
        onEdit={(item) => {
          // Use the original index so we update the right item in the store
          const di = item as DisplayInterface;
          const { _isChild, _originalIndex, ...cleanItem } = di;
          setEditing({ item: cleanItem as SystemInterface, index: _originalIndex });
          setIsNew(false);
        }}
        onDelete={(item) => {
          const di = item as DisplayInterface;
          setDeleting(di._originalIndex);
        }}
        onClone={(item) => {
          const { _isChild, _originalIndex, ...cleanItem } = item as DisplayInterface;
          setEditing({ item: { ...(cleanItem as SystemInterface), name: cleanItem.name + '_copy' }, index: -1 });
          setIsNew(true);
        }}
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
