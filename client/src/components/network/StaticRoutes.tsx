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

export default function StaticRoutes() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.router.static;

  const [editing, setEditing] = useState<{ item: StaticRoute; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const deviceOptions = [
    { value: '', label: '-- None --' },
    ...config.system.interfaces.map(i => ({ value: i.name, label: i.name })),
    ...config.system.zones.map(z => ({ value: z.name, label: `[Zone] ${z.name}` })),
    ...(config.sdwan?.zones || []).map(z => ({ value: z.name, label: `[SD-WAN] ${z.name}` })),
    ...config.vpnIpsec.phase1.map(p => ({ value: p.name, label: `[IPsec] ${p.name}` })),
  ];

  const addrOptions = [
    { value: '', label: '-- None (use CIDR destination) --' },
    ...config.firewallAddress.map(a => ({ value: a.name, label: a.name })),
  ];

  const fields: FieldDef[] = [
    { key: 'seqNum', label: 'Sequence Number', type: 'number', required: true, group: 'General' },
    { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
      { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
    ]},
    { key: 'dst', label: 'Destination (CIDR)', type: 'text', group: 'Destination', placeholder: '10.0.0.0 255.255.0.0',
      helpText: 'Leave blank if using a named destination address below' },
    { key: 'dstaddr', label: 'Destination Address Object', type: 'select', group: 'Destination', options: addrOptions,
      helpText: 'Named address object (overrides CIDR destination when set)' },
    { key: 'gateway', label: 'Gateway', type: 'text', group: 'Gateway', placeholder: '192.168.1.254' },
    { key: 'device', label: 'Interface / Tunnel', type: 'select', group: 'Gateway', options: deviceOptions },
    { key: 'distance', label: 'Administrative Distance', type: 'number', group: 'Advanced', defaultValue: 10 },
    { key: 'weight', label: 'Weight', type: 'number', group: 'Advanced', defaultValue: 0 },
    { key: 'priority', label: 'Priority', type: 'number', group: 'Advanced', defaultValue: 1 },
    { key: 'blackhole', label: 'Blackhole Route', type: 'checkbox', group: 'Advanced' },
    { key: 'sdwan', label: 'SD-WAN Route', type: 'checkbox', group: 'Advanced' },
    { key: 'comment', label: 'Comment', type: 'textarea', group: 'Other', width: 'full' },
  ];

  const columns: Column<StaticRoute>[] = [
    { key: 'seqNum', label: 'Seq #', width: '70px' },
    { key: 'dst', label: 'Destination', render: (r) => {
      if (r.dstaddr) return <span className="text-purple-700 font-medium" title="Named address object">{r.dstaddr}</span>;
      return r.dst || '-';
    }},
    { key: 'gateway', label: 'Gateway', render: (r) => r.gateway || '-' },
    { key: 'device', label: 'Interface', render: (r) => r.device || '-' },
    { key: 'distance', label: 'Dist', width: '60px' },
    { key: 'priority', label: 'Pri', width: '50px' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'comment', label: 'Comment' },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) {
      const item = { ...editing.item };
      if (!item.seqNum) item.seqNum = data.length > 0 ? Math.max(...data.map(r => r.seqNum)) + 1 : 1;
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
        onAdd={() => { setEditing({ item: { ...defaultRoute, seqNum: data.length > 0 ? Math.max(...data.map(r => r.seqNum)) + 1 : 1 }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />

      {editing && (
        <EditModal
          title="Static Route"
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
          title="Delete Route"
          message={`Are you sure you want to delete route #${data[deleting]?.seqNum}?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
