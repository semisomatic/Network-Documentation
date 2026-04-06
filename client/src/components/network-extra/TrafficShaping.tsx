import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { TrafficShaper, TrafficShapingPolicy } from '../../types/fortigate';

const PATH_SHAPERS = 'trafficShaping.shapers';
const PATH_POLICIES = 'trafficShaping.shapingPolicies';

const defaultShaper: TrafficShaper = {
  name: '', guaranteedBandwidth: 0, maximumBandwidth: 0,
  bandwidthUnit: 'kbps', priority: 'medium', perPolicy: false,
  diffserv: false, diffservcode: '',
};

const defaultPolicy: TrafficShapingPolicy = {
  id: 0, name: '', srcaddr: [], dstaddr: [], service: [], srcintf: [], dstintf: [],
  trafficShaper: '', trafficShaperReverse: '', perIpShaper: '',
  status: 'enable', classId: 0, comment: '',
};

const shaperFields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'guaranteedBandwidth', label: 'Guaranteed Bandwidth', type: 'number', group: 'Bandwidth' },
  { key: 'maximumBandwidth', label: 'Maximum Bandwidth', type: 'number', group: 'Bandwidth' },
  { key: 'bandwidthUnit', label: 'Bandwidth Unit', type: 'select', group: 'Bandwidth', options: [
    { value: 'kbps', label: 'Kbps' }, { value: 'mbps', label: 'Mbps' }, { value: 'gbps', label: 'Gbps' },
  ]},
  { key: 'priority', label: 'Priority', type: 'select', group: 'Options', options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
  ]},
  { key: 'perPolicy', label: 'Per Policy', type: 'checkbox', group: 'Options' },
  { key: 'diffserv', label: 'DiffServ', type: 'checkbox', group: 'Advanced' },
  { key: 'diffservcode', label: 'DiffServ Code', type: 'text', group: 'Advanced' },
];

const policyFields: FieldDef[] = [
  { key: 'id', label: 'ID', type: 'number', required: true, group: 'General' },
  { key: 'name', label: 'Name', type: 'text', group: 'General' },
  { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'srcaddr', label: 'Source Address', type: 'tagsinput', group: 'Match', placeholder: 'all' },
  { key: 'dstaddr', label: 'Destination Address', type: 'tagsinput', group: 'Match', placeholder: 'all' },
  { key: 'service', label: 'Service', type: 'tagsinput', group: 'Match', placeholder: 'ALL' },
  { key: 'srcintf', label: 'Source Interface', type: 'tagsinput', group: 'Match' },
  { key: 'dstintf', label: 'Destination Interface', type: 'tagsinput', group: 'Match' },
  { key: 'trafficShaper', label: 'Traffic Shaper', type: 'text', group: 'Shapers' },
  { key: 'trafficShaperReverse', label: 'Traffic Shaper Reverse', type: 'text', group: 'Shapers' },
  { key: 'perIpShaper', label: 'Per-IP Shaper', type: 'text', group: 'Shapers' },
  { key: 'classId', label: 'Class ID', type: 'number', group: 'Advanced' },
  { key: 'comment', label: 'Comment', type: 'textarea', group: 'Advanced', width: 'full' },
];

export default function TrafficShaping() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem } = useProjectStore();
  const shapersData = config.trafficShaping.shapers;
  const policiesData = config.trafficShaping.shapingPolicies;

  const [editingShaper, setEditingShaper] = useState<{ item: TrafficShaper; index: number } | null>(null);
  const [isNewShaper, setIsNewShaper] = useState(false);
  const [deletingShaper, setDeletingShaper] = useState<number | null>(null);

  const [editingPolicy, setEditingPolicy] = useState<{ item: TrafficShapingPolicy; index: number } | null>(null);
  const [isNewPolicy, setIsNewPolicy] = useState(false);
  const [deletingPolicy, setDeletingPolicy] = useState<number | null>(null);

  const shaperColumns: Column<TrafficShaper>[] = [
    { key: 'name', label: 'Name' },
    { key: 'guaranteedBandwidth', label: 'Guaranteed BW', render: (s) => `${s.guaranteedBandwidth} ${s.bandwidthUnit}` },
    { key: 'maximumBandwidth', label: 'Maximum BW', render: (s) => `${s.maximumBandwidth} ${s.bandwidthUnit}` },
    { key: 'priority', label: 'Priority', render: (s) => <StatusBadge value={s.priority} /> },
  ];

  const policyColumns: Column<TrafficShapingPolicy>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'trafficShaper', label: 'Shaper' },
    { key: 'srcaddr', label: 'Source', render: (p) => p.srcaddr.join(', ') || '-' },
    { key: 'dstaddr', label: 'Destination', render: (p) => p.dstaddr.join(', ') || '-' },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge value={p.status} /> },
  ];

  const handleSaveShaper = () => {
    if (!editingShaper) return;
    if (isNewShaper) addItem(PATH_SHAPERS, editingShaper.item);
    else updateItem(PATH_SHAPERS, editingShaper.index, editingShaper.item);
    setEditingShaper(null);
  };

  const handleSavePolicy = () => {
    if (!editingPolicy) return;
    if (isNewPolicy) addItem(PATH_POLICIES, editingPolicy.item);
    else updateItem(PATH_POLICIES, editingPolicy.index, editingPolicy.item);
    setEditingPolicy(null);
  };

  return (
    <>
      <DataTable title="Traffic Shapers" columns={shaperColumns} data={shapersData}
        getRowKey={(item) => item.name}
        onAdd={() => { setEditingShaper({ item: { ...defaultShaper }, index: -1 }); setIsNewShaper(true); }}
        onEdit={(item, index) => { setEditingShaper({ item: { ...item }, index }); setIsNewShaper(false); }}
        onDelete={(_, index) => setDeletingShaper(index)}
        onClone={(item) => { setEditingShaper({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNewShaper(true); }}
      />
      {editingShaper && (
        <EditModal title="Traffic Shaper" fields={shaperFields} values={editingShaper.item} isNew={isNewShaper}
          onChange={(key, val) => setEditingShaper({ ...editingShaper, item: { ...editingShaper.item, [key]: val } })}
          onSave={handleSaveShaper} onCancel={() => setEditingShaper(null)} />
      )}
      {deletingShaper !== null && (
        <ConfirmDialog title="Delete Traffic Shaper" message={`Delete traffic shaper "${shapersData[deletingShaper]?.name}"?`}
          onConfirm={() => { removeItem(PATH_SHAPERS, deletingShaper); setDeletingShaper(null); }} onCancel={() => setDeletingShaper(null)} />
      )}

      <div className="mt-6">
        <DataTable title="Traffic Shaping Policies" columns={policyColumns} data={policiesData}
          getRowKey={(item) => String(item.id)}
          onAdd={() => { setEditingPolicy({ item: { ...defaultPolicy }, index: -1 }); setIsNewPolicy(true); }}
          onEdit={(item, index) => { setEditingPolicy({ item: { ...item }, index }); setIsNewPolicy(false); }}
          onDelete={(_, index) => setDeletingPolicy(index)}
          onClone={(item) => { setEditingPolicy({ item: { ...item, id: item.id + 1, name: item.name + '_copy' }, index: -1 }); setIsNewPolicy(true); }}
        />
      </div>
      {editingPolicy && (
        <EditModal title="Traffic Shaping Policy" fields={policyFields} values={editingPolicy.item} isNew={isNewPolicy}
          onChange={(key, val) => setEditingPolicy({ ...editingPolicy, item: { ...editingPolicy.item, [key]: val } })}
          onSave={handleSavePolicy} onCancel={() => setEditingPolicy(null)} />
      )}
      {deletingPolicy !== null && (
        <ConfirmDialog title="Delete Traffic Shaping Policy" message={`Delete shaping policy "${policiesData[deletingPolicy]?.name}"?`}
          onConfirm={() => { removeItem(PATH_POLICIES, deletingPolicy); setDeletingPolicy(null); }} onCancel={() => setDeletingPolicy(null)} />
      )}
    </>
  );
}
