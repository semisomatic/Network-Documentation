import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { FirewallIPPool } from '../../types/fortigate';

const PATH = 'firewallIppool';

const defaultPool: FirewallIPPool = {
  name: '', type: 'overload', startip: '', endip: '', sourceStartip: '', sourceEndip: '',
  arpIntf: '', arpReply: true, comments: '', blockSize: 128, numBlocksPerUser: 8,
  associatedInterface: '',
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'type', label: 'Type', type: 'select', group: 'General', options: [
    { value: 'overload', label: 'Overload' }, { value: 'one-to-one', label: 'One-to-One' },
    { value: 'fixed-port-range', label: 'Fixed Port Range' },
    { value: 'port-block-allocation', label: 'Port Block Allocation' },
  ]},
  { key: 'startip', label: 'Start IP', type: 'text', group: 'IP Range', placeholder: '203.0.113.100' },
  { key: 'endip', label: 'End IP', type: 'text', group: 'IP Range', placeholder: '203.0.113.110' },
  { key: 'sourceStartip', label: 'Source Start IP', type: 'text', group: 'IP Range' },
  { key: 'sourceEndip', label: 'Source End IP', type: 'text', group: 'IP Range' },
  { key: 'arpIntf', label: 'ARP Interface', type: 'text', group: 'Options' },
  { key: 'arpReply', label: 'ARP Reply', type: 'checkbox', group: 'Options' },
  { key: 'associatedInterface', label: 'Associated Interface', type: 'text', group: 'Options' },
  { key: 'blockSize', label: 'Block Size', type: 'number', group: 'Port Block' },
  { key: 'numBlocksPerUser', label: 'Blocks per User', type: 'number', group: 'Port Block' },
  { key: 'comments', label: 'Comments', type: 'textarea', group: 'Options', width: 'full' },
];

export default function IPPools() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem } = useProjectStore();
  const data = config.firewallIppool;

  const [editing, setEditing] = useState<{ item: FirewallIPPool; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<FirewallIPPool>[] = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (p) => <StatusBadge value={p.type} customColors={{ bg: 'bg-teal-100', text: 'text-teal-800' }} /> },
    { key: 'startip', label: 'Start IP' },
    { key: 'endip', label: 'End IP' },
    { key: 'arpIntf', label: 'ARP Interface' },
    { key: 'comments', label: 'Comments' },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="IP Pools (SNAT)" columns={columns} data={data}
        getRowKey={(item) => item.name}
        onAdd={() => { setEditing({ item: { ...defaultPool }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
      />
      {editing && (
        <EditModal title="IP Pool" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete IP Pool" message={`Delete pool "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
