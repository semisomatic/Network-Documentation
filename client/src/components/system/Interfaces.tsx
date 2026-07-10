import React, { useState, useMemo } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import InterfaceEditor from './InterfaceEditor';
import { useProjectStore } from '../../store/projectStore';
import type { SystemInterface, SystemZone } from '../../types/fortigate';

const PATH = 'system.interfaces';
const ZONE_PATH = 'system.zones';

// Build a grouped interface list: parents first, then sub-interfaces sorted alphabetically
interface DisplayInterface extends SystemInterface {
  _isChild: boolean;
  _originalIndex: number;
}

function buildGroupedInterfaces(interfaces: SystemInterface[]): DisplayInterface[] {
  const childrenByParent = new Map<string, { iface: SystemInterface; origIdx: number }[]>();
  const topLevel: { iface: SystemInterface; origIdx: number }[] = [];

  interfaces.forEach((iface, idx) => {
    const parentName = iface.interface;
    if (parentName && parentName !== iface.name) {
      if (!childrenByParent.has(parentName)) {
        childrenByParent.set(parentName, []);
      }
      childrenByParent.get(parentName)!.push({ iface, origIdx: idx });
    } else {
      topLevel.push({ iface, origIdx: idx });
    }
  });

  for (const children of childrenByParent.values()) {
    children.sort((a, b) => a.iface.name.localeCompare(b.iface.name, undefined, { numeric: true }));
  }

  topLevel.sort((a, b) => {
    const aHasChildren = childrenByParent.has(a.iface.name);
    const bHasChildren = childrenByParent.has(b.iface.name);
    if (aHasChildren && !bHasChildren) return -1;
    if (!aHasChildren && bHasChildren) return 1;
    return a.iface.name.localeCompare(b.iface.name, undefined, { numeric: true });
  });

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

const defaultZone: SystemZone = {
  name: '', interface: [], intrazone: 'deny', description: '',
};

const zoneFields: FieldDef[] = [
  { key: 'name', label: 'Zone Name', type: 'text', required: true },
  { key: 'interface', label: 'Member Interfaces', type: 'tagsinput', placeholder: 'Type interface name and press Enter', width: 'full' },
  { key: 'intrazone', label: 'Intrazone Traffic', type: 'select', options: [
    { value: 'allow', label: 'Allow' }, { value: 'deny', label: 'Deny' },
  ]},
  { key: 'description', label: 'Description', type: 'text' },
];

export default function Interfaces() {
  const config = useProjectStore((s) => s.project.config);
  const intfHighlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const zoneHighlights = useProjectStore((s) => s.project.highlights[ZONE_PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.system.interfaces;
  const zones = config.system.zones || [];

  // Interface editor state (full-page)
  const [editorState, setEditorState] = useState<{ item: SystemInterface; index: number; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Zone state
  const [editingZone, setEditingZone] = useState<{ item: SystemZone; index: number } | null>(null);
  const [isNewZone, setIsNewZone] = useState(false);
  const [deletingZone, setDeletingZone] = useState<number | null>(null);

  const groupedData = useMemo(() => buildGroupedInterfaces(data), [data]);

  const interfaceColumns: Column<DisplayInterface>[] = [
    { key: 'name', label: 'Name', sortable: false, render: (i) => (
      <span className={i._isChild ? 'pl-6 text-gray-700' : 'font-medium'}>
        {i._isChild && <span className="text-gray-400 mr-1">&#x2514;</span>}
        {i.name}
      </span>
    )},
    { key: 'alias', label: 'Alias' },
    { key: 'type', label: 'Type' },
    { key: 'vlanid', label: 'VLAN ID', width: '90px', render: (i) => (i.vlanid ? String(i.vlanid) : '-') },
    { key: 'ip', label: 'IP / Netmask', render: (i) => i.ip ? `${i.ip} / ${i.netmask}` : '-' },
    { key: 'interface', label: 'Parent', render: (i) => i.interface || '-' },
    { key: 'status', label: 'Status', render: (i) => <StatusBadge value={i.status} /> },
    { key: 'allowaccess', label: 'Admin Access', render: (i) => i.allowaccess.join(', ') || '-' },
  ];

  const zoneColumns: Column<SystemZone>[] = [
    { key: 'name', label: 'Zone Name', render: (z) => (
      <span className="font-medium">{z.name}</span>
    )},
    { key: 'interface', label: 'Member Interfaces', render: (z) => (
      <div className="flex flex-wrap gap-1">
        {z.interface.map((intf) => (
          <span key={intf} className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
            {intf}
          </span>
        ))}
        {z.interface.length === 0 && <span className="text-gray-400">None</span>}
      </div>
    )},
    { key: 'intrazone', label: 'Intrazone Traffic', render: (z) => <StatusBadge value={z.intrazone} /> },
    { key: 'description', label: 'Description' },
  ];

  const saveInterface = (item: SystemInterface) => {
    if (!editorState) return;
    if (editorState.isNew) addItem(PATH, item);
    else updateItem(PATH, editorState.index, item);
    setEditorState(null);
  };

  const handleSaveZone = () => {
    if (!editingZone) return;
    if (isNewZone) addItem(ZONE_PATH, editingZone.item);
    else updateItem(ZONE_PATH, editingZone.index, editingZone.item);
    setEditingZone(null);
  };

  if (editorState) {
    return (
      <InterfaceEditor
        initial={editorState.item}
        isNew={editorState.isNew}
        onSave={saveInterface}
        onCancel={() => setEditorState(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* System Zones */}
      <div className="border-l-4 border-purple-500">
        <DataTable
          title="System Zones"
          columns={zoneColumns}
          data={zones}
          getRowKey={(z) => z.name}
          onAdd={() => { setEditingZone({ item: { ...defaultZone }, index: -1 }); setIsNewZone(true); }}
          onEdit={(item, index) => { setEditingZone({ item: { ...item }, index }); setIsNewZone(false); }}
          onDelete={(_, index) => setDeletingZone(index)}
          onReorder={(from, to) => reorderItems(ZONE_PATH, from, to)}
          emptyMessage="No zones configured."
          highlights={zoneHighlights}
          onHighlight={(key, color) => setHighlight(ZONE_PATH, key, color)}
        />
      </div>

      {/* Network Interfaces */}
      <DataTable
        title="Network Interfaces"
        columns={interfaceColumns}
        data={groupedData}
        getRowKey={(item) => item.name}
        onAdd={() => setEditorState({ item: { ...defaultInterface }, index: -1, isNew: true })}
        onEdit={(item) => {
          const { _isChild, _originalIndex, ...cleanItem } = item as DisplayInterface;
          setEditorState({ item: cleanItem as SystemInterface, index: _originalIndex, isNew: false });
        }}
        onDelete={(item) => {
          const di = item as DisplayInterface;
          setDeleting(di._originalIndex);
        }}
        onClone={(item) => {
          const { _isChild, _originalIndex, ...cleanItem } = item as DisplayInterface;
          setEditorState({ item: { ...(cleanItem as SystemInterface), name: cleanItem.name + '_copy' }, index: -1, isNew: true });
        }}
        highlights={intfHighlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
      />

      {/* Zone Edit Modal */}
      {editingZone && (
        <EditModal
          title="Zone"
          fields={zoneFields}
          values={editingZone.item}
          isNew={isNewZone}
          onChange={(key, val) => setEditingZone({ ...editingZone, item: { ...editingZone.item, [key]: val } })}
          onSave={handleSaveZone}
          onCancel={() => setEditingZone(null)}
        />
      )}

      {/* Interface Delete Confirm */}
      {deleting !== null && (
        <ConfirmDialog
          title="Delete Interface"
          message={`Are you sure you want to delete interface "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}

      {/* Zone Delete Confirm */}
      {deletingZone !== null && (
        <ConfirmDialog
          title="Delete Zone"
          message={`Are you sure you want to delete zone "${zones[deletingZone]?.name}"?`}
          onConfirm={() => { removeItem(ZONE_PATH, deletingZone); setDeletingZone(null); }}
          onCancel={() => setDeletingZone(null)}
        />
      )}
    </div>
  );
}
