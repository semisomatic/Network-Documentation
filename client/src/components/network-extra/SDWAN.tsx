import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { SDWANMember, SDWANRule } from '../../types/fortigate';

const PATH_MEMBERS = 'sdwan.members';
const PATH_RULES = 'sdwan.rules';

const defaultMember: SDWANMember = {
  seqNum: 0, interface: '', zone: '', gateway: '', source: '',
  cost: 0, weight: 1, priority: 1, status: 'enable', comment: '', volumeRatio: 1,
};

const defaultRule: SDWANRule = {
  id: 0, name: '', srcAddr: [], dstAddr: [], srcIntf: [], service: [],
  mode: 'sla', healthCheck: '', slaId: 0, members: [], protocol: 0,
  startPort: 0, endPort: 0, routeTag: 0, status: 'enable', tieBreak: 'zone',
  internetService: false, internetServiceName: [],
};

const memberFields: FieldDef[] = [
  { key: 'seqNum', label: 'Sequence Number', type: 'number', required: true, group: 'General' },
  { key: 'interface', label: 'Interface', type: 'text', required: true, group: 'General' },
  { key: 'zone', label: 'Zone', type: 'text', group: 'General' },
  { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'gateway', label: 'Gateway', type: 'text', group: 'Network', placeholder: '0.0.0.0' },
  { key: 'source', label: 'Source', type: 'text', group: 'Network' },
  { key: 'cost', label: 'Cost', type: 'number', group: 'Weights' },
  { key: 'weight', label: 'Weight', type: 'number', group: 'Weights' },
  { key: 'priority', label: 'Priority', type: 'number', group: 'Weights' },
  { key: 'volumeRatio', label: 'Volume Ratio', type: 'number', group: 'Weights' },
  { key: 'comment', label: 'Comment', type: 'textarea', group: 'Other', width: 'full' },
];

const ruleFields: FieldDef[] = [
  { key: 'id', label: 'ID', type: 'number', required: true, group: 'General' },
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'mode', label: 'Mode', type: 'select', group: 'General', options: [
    { value: 'sla', label: 'SLA' }, { value: 'priority', label: 'Priority' }, { value: 'manual', label: 'Manual' },
  ]},
  { key: 'srcAddr', label: 'Source Address', type: 'tagsinput', group: 'Match', placeholder: 'all' },
  { key: 'dstAddr', label: 'Destination Address', type: 'tagsinput', group: 'Match', placeholder: 'all' },
  { key: 'service', label: 'Service', type: 'tagsinput', group: 'Match', placeholder: 'ALL' },
  { key: 'srcIntf', label: 'Source Interface', type: 'tagsinput', group: 'Match' },
  { key: 'healthCheck', label: 'Health Check', type: 'text', group: 'SLA' },
  { key: 'slaId', label: 'SLA ID', type: 'number', group: 'SLA' },
  { key: 'tieBreak', label: 'Tie Break', type: 'select', group: 'Advanced', options: [
    { value: 'zone', label: 'Zone' }, { value: 'cfg-order', label: 'Config Order' }, { value: 'fib-best-match', label: 'FIB Best Match' },
  ]},
];

export default function SDWAN() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem } = useProjectStore();
  const membersData = config.sdwan.members;
  const rulesData = config.sdwan.rules;

  const [editingMember, setEditingMember] = useState<{ item: SDWANMember; index: number } | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);
  const [deletingMember, setDeletingMember] = useState<number | null>(null);

  const [editingRule, setEditingRule] = useState<{ item: SDWANRule; index: number } | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);
  const [deletingRule, setDeletingRule] = useState<number | null>(null);

  const memberColumns: Column<SDWANMember>[] = [
    { key: 'seqNum', label: 'Seq #' },
    { key: 'interface', label: 'Interface' },
    { key: 'zone', label: 'Zone' },
    { key: 'gateway', label: 'Gateway' },
    { key: 'weight', label: 'Weight' },
    { key: 'status', label: 'Status', render: (m) => <StatusBadge value={m.status} /> },
  ];

  const ruleColumns: Column<SDWANRule>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'mode', label: 'Mode', render: (r) => <StatusBadge value={r.mode} /> },
    { key: 'srcAddr', label: 'Source', render: (r) => r.srcAddr.join(', ') || '-' },
    { key: 'dstAddr', label: 'Destination', render: (r) => r.dstAddr.join(', ') || '-' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];

  const handleSaveMember = () => {
    if (!editingMember) return;
    if (isNewMember) addItem(PATH_MEMBERS, editingMember.item);
    else updateItem(PATH_MEMBERS, editingMember.index, editingMember.item);
    setEditingMember(null);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;
    if (isNewRule) addItem(PATH_RULES, editingRule.item);
    else updateItem(PATH_RULES, editingRule.index, editingRule.item);
    setEditingRule(null);
  };

  return (
    <>
      <DataTable title="SD-WAN Members" columns={memberColumns} data={membersData}
        getRowKey={(item) => String(item.seqNum)}
        onAdd={() => { setEditingMember({ item: { ...defaultMember }, index: -1 }); setIsNewMember(true); }}
        onEdit={(item, index) => { setEditingMember({ item: { ...item }, index }); setIsNewMember(false); }}
        onDelete={(_, index) => setDeletingMember(index)}
        onClone={(item) => { setEditingMember({ item: { ...item, seqNum: item.seqNum + 1 }, index: -1 }); setIsNewMember(true); }}
      />
      {editingMember && (
        <EditModal title="SD-WAN Member" fields={memberFields} values={editingMember.item} isNew={isNewMember}
          onChange={(key, val) => setEditingMember({ ...editingMember, item: { ...editingMember.item, [key]: val } })}
          onSave={handleSaveMember} onCancel={() => setEditingMember(null)} />
      )}
      {deletingMember !== null && (
        <ConfirmDialog title="Delete SD-WAN Member" message={`Delete SD-WAN member #${membersData[deletingMember]?.seqNum}?`}
          onConfirm={() => { removeItem(PATH_MEMBERS, deletingMember); setDeletingMember(null); }} onCancel={() => setDeletingMember(null)} />
      )}

      <div className="mt-6">
        <DataTable title="SD-WAN Rules" columns={ruleColumns} data={rulesData}
          getRowKey={(item) => String(item.id)}
          onAdd={() => { setEditingRule({ item: { ...defaultRule }, index: -1 }); setIsNewRule(true); }}
          onEdit={(item, index) => { setEditingRule({ item: { ...item }, index }); setIsNewRule(false); }}
          onDelete={(_, index) => setDeletingRule(index)}
          onClone={(item) => { setEditingRule({ item: { ...item, id: item.id + 1, name: item.name + '_copy' }, index: -1 }); setIsNewRule(true); }}
        />
      </div>
      {editingRule && (
        <EditModal title="SD-WAN Rule" fields={ruleFields} values={editingRule.item} isNew={isNewRule}
          onChange={(key, val) => setEditingRule({ ...editingRule, item: { ...editingRule.item, [key]: val } })}
          onSave={handleSaveRule} onCancel={() => setEditingRule(null)} />
      )}
      {deletingRule !== null && (
        <ConfirmDialog title="Delete SD-WAN Rule" message={`Delete SD-WAN rule "${rulesData[deletingRule]?.name}"?`}
          onConfirm={() => { removeItem(PATH_RULES, deletingRule); setDeletingRule(null); }} onCancel={() => setDeletingRule(null)} />
      )}
    </>
  );
}
