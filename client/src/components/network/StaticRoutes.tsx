import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { StaticRoute } from '../../types/fortigate';

const PATH = 'router.static';

const defaultRoute: StaticRoute = {
  seqNum: 0, dst: '', dstaddr: '', gateway: '', device: '', distance: 10, weight: 0,
  priority: 1, status: 'enable', comment: '', blackhole: false, sdwan: false, sdwanZone: '',
};

// "10.0.0.0 255.0.0.0" -> "10.0.0.0/8"; empty / all-zero -> "0.0.0.0/0"
function toCidr(dst: string): string {
  const t = (dst || '').trim();
  if (!t || t === '0.0.0.0 0.0.0.0' || t === '0.0.0.0/0') return '0.0.0.0/0';
  const parts = t.split(/\s+/);
  if (parts.length === 2 && /^\d+\.\d+\.\d+\.\d+$/.test(parts[1])) {
    const bits = parts[1].split('.').reduce((a, o) => a + ((parseInt(o) >>> 0).toString(2).match(/1/g) || []).length, 0);
    return `${parts[0]}/${bits}`;
  }
  return t;
}

export default function StaticRoutes() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.router.static;

  const [editing, setEditing] = useState<{ item: StaticRoute; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const sdwanZoneNames = new Set((config.sdwan?.zones || []).map((z) => z.name));

  // Interface / SD-WAN zone / tunnel selector. SD-WAN zones are stored in a
  // separate field (sdwanZone) so they export as `set sdwan-zone`; everything
  // else stores into `device` (`set device`).
  const deviceOptions = [
    { value: '', label: '-- None --' },
    ...(config.sdwan?.zones || []).map((z) => ({ value: z.name, label: `SD-WAN Zone: ${z.name}` })),
    ...config.system.interfaces.map((i) => ({ value: i.name, label: i.name })),
    ...config.system.zones.map((z) => ({ value: z.name, label: `[Zone] ${z.name}` })),
    ...config.vpnIpsec.phase1.map((p) => ({ value: p.name, label: `[IPsec] ${p.name}` })),
  ];

  const addrOptions = [
    { value: '', label: '-- None (use CIDR destination) --' },
    ...config.firewallAddress.map((a) => ({ value: a.name, label: a.name })),
  ];

  const fields: FieldDef[] = [
    { key: 'seqNum', label: 'Sequence Number', type: 'number', required: true, group: 'General' },
    { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
      { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
    ]},
    { key: 'dst', label: 'Destination (CIDR)', type: 'text', group: 'Destination', placeholder: '10.0.0.0 255.255.0.0',
      helpText: 'Leave blank for a default route (0.0.0.0/0). Ignored if a named address is selected below.' },
    { key: 'dstaddr', label: 'Destination Address Object', type: 'select', group: 'Destination', options: addrOptions,
      helpText: 'Named address object (overrides CIDR destination when set)' },
    { key: 'device', label: 'Interface', type: 'select', group: 'Gateway', options: deviceOptions,
      helpText: 'Choose a physical/VLAN interface, IPsec tunnel, or SD-WAN zone.' },
    { key: 'gateway', label: 'Gateway', type: 'text', group: 'Gateway', placeholder: '192.168.1.254',
      helpText: 'Leave blank for SD-WAN zone routes (gateways come from the SD-WAN members).' },
    { key: 'distance', label: 'Administrative Distance', type: 'number', group: 'Advanced', defaultValue: 10 },
    { key: 'weight', label: 'Weight', type: 'number', group: 'Advanced', defaultValue: 0 },
    { key: 'priority', label: 'Priority', type: 'number', group: 'Advanced', defaultValue: 1 },
    { key: 'blackhole', label: 'Blackhole Route', type: 'checkbox', group: 'Advanced' },
    { key: 'comment', label: 'Comment', type: 'textarea', group: 'Other', width: 'full' },
  ];

  const destCell = (r: StaticRoute) => {
    if (r.dstaddr) return <span className="text-purple-700 font-medium" title="Named address object">{r.dstaddr}</span>;
    return <span>{toCidr(r.dst)}</span>;
  };

  const interfaceCell = (r: StaticRoute) => {
    if (r.sdwanZone) return <span className="text-green-700 font-medium" title="SD-WAN zone">SD-WAN: {r.sdwanZone}</span>;
    if (r.blackhole) return <span className="text-gray-500 italic">Blackhole</span>;
    return <span>{r.device || '-'}</span>;
  };

  const columns: Column<StaticRoute>[] = [
    { key: 'seqNum', label: 'Seq #', width: '70px' },
    { key: 'dst', label: 'Destination', render: destCell },
    { key: 'gateway', label: 'Gateway', render: (r) => r.gateway || '-' },
    { key: 'device', label: 'Interface', render: interfaceCell },
    { key: 'distance', label: 'Dist', width: '60px' },
    { key: 'priority', label: 'Pri', width: '50px' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'comment', label: 'Comment' },
  ];

  // The modal's Interface dropdown binds to `device`; surface the SD-WAN zone
  // there so an SD-WAN route shows its zone as the selected interface.
  const modalValues = editing ? { ...editing.item, device: editing.item.sdwanZone || editing.item.device } : editing;

  const handleFieldChange = (key: string, val: any) => {
    if (!editing) return;
    let patch: Partial<StaticRoute>;
    if (key === 'device') {
      // Route the choice to the correct field so it exports as sdwan-zone vs device.
      patch = sdwanZoneNames.has(val)
        ? { device: '', sdwanZone: val, sdwan: false }
        : { device: val, sdwanZone: '' };
    } else {
      patch = { [key]: val } as Partial<StaticRoute>;
    }
    setEditing({ ...editing, item: { ...editing.item, ...patch } });
  };

  const handleSave = () => {
    if (!editing) return;
    if (isNew) {
      const item = { ...editing.item };
      if (!item.seqNum) item.seqNum = data.length > 0 ? Math.max(...data.map((r) => r.seqNum)) + 1 : 1;
      addItem(PATH, item);
    } else {
      updateItem(PATH, editing.index, editing.item);
    }
    setEditing(null);
  };

  return (
    <>
      <DataTable
        title="Static Routes"
        columns={columns}
        data={data}
        getRowKey={(item) => String(item.seqNum)}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultRoute, seqNum: data.length > 0 ? Math.max(...data.map((r) => r.seqNum)) + 1 : 1 }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />

      {editing && modalValues && (
        <EditModal
          title="Static Route"
          fields={fields}
          values={modalValues}
          isNew={isNew}
          onChange={handleFieldChange}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting !== null && (
        <ConfirmDialog
          title="Delete Route"
          message={`Are you sure you want to delete route #${data[deleting]?.seqNum}?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
