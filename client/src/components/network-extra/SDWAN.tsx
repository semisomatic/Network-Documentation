import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import SLAEditor from './SLAEditor';
import SDWANRuleEditor from './SDWANRuleEditor';
import { useProjectStore } from '../../store/projectStore';
import type { SDWANMember, SDWANRule, SDWANHealthCheck } from '../../types/fortigate';

const PATH_MEMBERS = 'sdwan.members';
const PATH_HEALTH = 'sdwan.healthChecks';
const PATH_RULES = 'sdwan.rules';

const defaultMember: SDWANMember = {
  seqNum: 0, interface: '', zone: '', gateway: '', source: '',
  cost: 0, weight: 1, priority: 1, status: 'enable', comment: '', volumeRatio: 1,
};

const defaultHealthCheck: SDWANHealthCheck = {
  name: '', server: [], protocol: 'ping', probeMode: 'active', port: 0,
  interval: 500, failtime: 5, recovertime: 5,
  thresholdWarningJitter: 0, thresholdWarningLatency: 0, thresholdWarningPacketloss: 0,
  thresholdAlertJitter: 0, thresholdAlertLatency: 0, thresholdAlertPacketloss: 0,
  members: [], slaTargets: [],
};

const defaultRule: SDWANRule = {
  id: 0, name: '', comment: '', srcAddr: [], dstAddr: [], srcIntf: [], service: [],
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

const protoLabel = (n: number) => (n === 6 ? 'TCP' : n === 17 ? 'UDP' : n === 0 ? 'Any' : String(n));
const criteriaLabel = (m: SDWANRule['mode']) => (m === 'sla' ? 'Lowest Cost (SLA)' : m === 'priority' ? 'Best Quality' : 'Manual');

export default function SDWAN() {
  const config = useProjectStore((s) => s.project.config);
  const hlMembers = useProjectStore((s) => s.project.highlights[PATH_MEMBERS] || {});
  const hlHealth = useProjectStore((s) => s.project.highlights[PATH_HEALTH] || {});
  const hlRules = useProjectStore((s) => s.project.highlights[PATH_RULES] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const membersData = config.sdwan.members;
  const healthData = config.sdwan.healthChecks;
  const rulesData = config.sdwan.rules;

  const memberLabel = (seq: number) => membersData.find((m) => m.seqNum === seq)?.interface || String(seq);

  // Member modal (kept as simple modal)
  const [editingMember, setEditingMember] = useState<{ item: SDWANMember; index: number } | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);
  const [deletingMember, setDeletingMember] = useState<number | null>(null);

  // Full-page editors
  const [slaEditor, setSlaEditor] = useState<{ item: SDWANHealthCheck; index: number; isNew: boolean } | null>(null);
  const [deletingHealth, setDeletingHealth] = useState<number | null>(null);
  const [ruleEditor, setRuleEditor] = useState<{ item: SDWANRule; index: number; isNew: boolean } | null>(null);
  const [deletingRule, setDeletingRule] = useState<number | null>(null);

  const memberColumns: Column<SDWANMember>[] = [
    { key: 'seqNum', label: 'Seq #', width: '70px' },
    { key: 'interface', label: 'Interface' },
    { key: 'zone', label: 'Zone' },
    { key: 'gateway', label: 'Gateway' },
    { key: 'cost', label: 'Cost', width: '80px' },
    { key: 'priority', label: 'Priority', width: '80px' },
    { key: 'status', label: 'Status', render: (m) => <StatusBadge value={m.status} /> },
  ];

  const healthColumns: Column<SDWANHealthCheck>[] = [
    { key: 'name', label: 'Name' },
    { key: 'protocol', label: 'Protocol', render: (h) => h.protocol.toUpperCase() },
    { key: 'server', label: 'Server', render: (h) => h.server.join(', ') || '-' },
    { key: 'members', label: 'Participants', render: (h) => h.members.length ? h.members.map(memberLabel).join(', ') : 'All members' },
    { key: 'slaTargets', label: 'SLA Target', render: (h) => {
      const t = h.slaTargets[0];
      if (!t) return '-';
      return `${t.latencyThreshold}ms / ${t.jitterThreshold}ms / ${t.packetlossThreshold}%`;
    }},
  ];

  const ruleColumns: Column<SDWANRule>[] = [
    { key: 'id', label: 'ID', width: '55px' },
    { key: 'name', label: 'Name', render: (r) => <span className={r.status === 'disable' ? 'text-gray-400' : ''}>{r.name}</span> },
    { key: 'srcAddr', label: 'Source', render: (r) => r.srcAddr.join(', ') || 'all' },
    { key: 'dstAddr', label: 'Destination', render: (r) => r.dstAddr.join(', ') || 'all' },
    { key: 'members', label: 'Members', render: (r) => r.members.length ? r.members.map(memberLabel).join(', ') : '-' },
    { key: 'mode', label: 'Criteria', render: (r) => criteriaLabel(r.mode) },
    { key: 'healthCheck', label: 'Performance SLA', render: (r) => r.healthCheck || '-' },
    { key: 'protocol', label: 'Protocol', render: (r) => protoLabel(r.protocol) },
  ];

  const nextSeq = () => (membersData.length ? Math.max(...membersData.map((m) => m.seqNum)) + 1 : 1);
  const nextRuleId = () => (rulesData.length ? Math.max(...rulesData.map((r) => r.id)) + 1 : 1);

  // ---- full-page editor early returns ----
  if (slaEditor) {
    return (
      <SLAEditor initial={slaEditor.item} isNew={slaEditor.isNew}
        onSave={(item) => { if (slaEditor.isNew) addItem(PATH_HEALTH, item); else updateItem(PATH_HEALTH, slaEditor.index, item); setSlaEditor(null); }}
        onCancel={() => setSlaEditor(null)} />
    );
  }
  if (ruleEditor) {
    return (
      <SDWANRuleEditor initial={ruleEditor.item} isNew={ruleEditor.isNew}
        onSave={(item) => {
          const final = { ...item };
          if (ruleEditor.isNew && !final.id) final.id = nextRuleId();
          if (ruleEditor.isNew) addItem(PATH_RULES, final); else updateItem(PATH_RULES, ruleEditor.index, final);
          setRuleEditor(null);
        }}
        onCancel={() => setRuleEditor(null)} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Members */}
      <DataTable title="SD-WAN Members" columns={memberColumns} data={membersData}
        getRowKey={(item) => String(item.seqNum)}
        highlights={hlMembers}
        onHighlight={(key, color) => setHighlight(PATH_MEMBERS, key, color)}
        onAdd={() => { setEditingMember({ item: { ...defaultMember, seqNum: nextSeq() }, index: -1 }); setIsNewMember(true); }}
        onEdit={(item, index) => { setEditingMember({ item: { ...item }, index }); setIsNewMember(false); }}
        onDelete={(_, index) => setDeletingMember(index)}
        onClone={(item) => { setEditingMember({ item: { ...item, seqNum: nextSeq() }, index: -1 }); setIsNewMember(true); }}
        onReorder={(from, to) => reorderItems(PATH_MEMBERS, from, to)}
      />

      {/* Performance SLAs */}
      <DataTable title="Performance SLAs" columns={healthColumns} data={healthData}
        getRowKey={(item) => item.name}
        highlights={hlHealth}
        onHighlight={(key, color) => setHighlight(PATH_HEALTH, key, color)}
        onAdd={() => setSlaEditor({ item: { ...defaultHealthCheck }, index: -1, isNew: true })}
        onEdit={(item, index) => setSlaEditor({ item: { ...item }, index, isNew: false })}
        onDelete={(_, index) => setDeletingHealth(index)}
        onClone={(item) => setSlaEditor({ item: { ...item, name: item.name + '_copy' }, index: -1, isNew: true })}
        onReorder={(from, to) => reorderItems(PATH_HEALTH, from, to)}
      />

      {/* Rules */}
      <DataTable title="SD-WAN Rules" columns={ruleColumns} data={rulesData}
        getRowKey={(item) => String(item.id)}
        highlights={hlRules}
        onHighlight={(key, color) => setHighlight(PATH_RULES, key, color)}
        onAdd={() => setRuleEditor({ item: { ...defaultRule, id: nextRuleId() }, index: -1, isNew: true })}
        onEdit={(item, index) => setRuleEditor({ item: { ...item }, index, isNew: false })}
        onDelete={(_, index) => setDeletingRule(index)}
        onClone={(item) => setRuleEditor({ item: { ...item, id: nextRuleId(), name: item.name + '_copy' }, index: -1, isNew: true })}
        onReorder={(from, to) => reorderItems(PATH_RULES, from, to)}
      />

      {/* Member modal */}
      {editingMember && (
        <EditModal title="SD-WAN Member" fields={memberFields} values={editingMember.item} isNew={isNewMember}
          onChange={(key, val) => setEditingMember({ ...editingMember, item: { ...editingMember.item, [key]: val } })}
          onSave={() => { if (isNewMember) addItem(PATH_MEMBERS, editingMember.item); else updateItem(PATH_MEMBERS, editingMember.index, editingMember.item); setEditingMember(null); }}
          onCancel={() => setEditingMember(null)} />
      )}

      {/* Deletes */}
      {deletingMember !== null && (
        <ConfirmDialog title="Delete SD-WAN Member" message={`Delete SD-WAN member #${membersData[deletingMember]?.seqNum}?`}
          onConfirm={() => { removeItem(PATH_MEMBERS, deletingMember); setDeletingMember(null); }} onCancel={() => setDeletingMember(null)} />
      )}
      {deletingHealth !== null && (
        <ConfirmDialog title="Delete Performance SLA" message={`Delete Performance SLA "${healthData[deletingHealth]?.name}"?`}
          onConfirm={() => { removeItem(PATH_HEALTH, deletingHealth); setDeletingHealth(null); }} onCancel={() => setDeletingHealth(null)} />
      )}
      {deletingRule !== null && (
        <ConfirmDialog title="Delete SD-WAN Rule" message={`Delete SD-WAN rule "${rulesData[deletingRule]?.name}"?`}
          onConfirm={() => { removeItem(PATH_RULES, deletingRule); setDeletingRule(null); }} onCancel={() => setDeletingRule(null)} />
      )}
    </div>
  );
}
