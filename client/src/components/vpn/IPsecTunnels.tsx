import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { VPNPhase1, VPNPhase2 } from '../../types/fortigate';

const PATH_P1 = 'vpnIpsec.phase1';
const PATH_P2 = 'vpnIpsec.phase2';

const defaultPhase1: VPNPhase1 = {
  name: '', type: 'static', interface: '', ikeVersion: '2', remoteGw: '', localGw: '',
  psksecret: '', peertype: 'any', peerid: '', proposal: ['aes256-sha256'], dhgrp: ['14'],
  natTraversal: 'enable', keepalive: 10, dpd: 'on-demand', dpdRetrycount: 3,
  dpdRetryinterval: 20, comments: '', localid: '', localidType: 'auto',
  authMethod: 'psk', certificate: [], keylife: 86400, xauthtype: 'disable',
  mode: 'main', modeConfig: 'disable', ipv4Dns: '', ipv4Wins: '',
  ipv4StartIp: '', ipv4EndIp: '', ipv4Netmask: '', splitIncludeService: '',
  splitIncludeAccess: [], networkOverlay: 'disable', networkId: 0,
};

const defaultPhase2: VPNPhase2 = {
  name: '', phase1name: '', proposal: ['aes256-sha256'], pfs: 'enable', dhgrp: ['14'],
  replay: 'enable', keepalive: 'disable', autoNegotiate: 'enable',
  keylifeseconds: 43200, keylifekbs: 5120, srcSubnet: '0.0.0.0 0.0.0.0',
  dstSubnet: '0.0.0.0 0.0.0.0', srcName: '', dstName: '',
  srcAddrType: 'subnet', dstAddrType: 'subnet', comments: '',
  protocol: 'esp', encapsulation: 'tunnel-mode',
};

const phase1Fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'type', label: 'Type', type: 'select', group: 'General', options: [
    { value: 'static', label: 'Static' }, { value: 'dynamic', label: 'Dynamic' },
  ]},
  { key: 'interface', label: 'Interface', type: 'text', group: 'General' },
  { key: 'ikeVersion', label: 'IKE Version', type: 'select', group: 'General', options: [
    { value: '1', label: 'IKEv1' }, { value: '2', label: 'IKEv2' },
  ]},
  { key: 'remoteGw', label: 'Remote Gateway', type: 'text', group: 'Network', placeholder: '0.0.0.0' },
  { key: 'localGw', label: 'Local Gateway', type: 'text', group: 'Network', placeholder: '0.0.0.0' },
  { key: 'authMethod', label: 'Auth Method', type: 'select', group: 'Authentication', options: [
    { value: 'psk', label: 'Pre-shared Key' }, { value: 'signature', label: 'Signature' },
  ]},
  { key: 'psksecret', label: 'Pre-shared Key', type: 'text', group: 'Authentication' },
  { key: 'proposal', label: 'Proposal', type: 'tagsinput', group: 'Crypto', placeholder: 'aes256-sha256' },
  { key: 'dhgrp', label: 'DH Group', type: 'tagsinput', group: 'Crypto', placeholder: '14 5' },
  { key: 'keylife', label: 'Key Lifetime (seconds)', type: 'number', group: 'Crypto' },
  { key: 'natTraversal', label: 'NAT Traversal', type: 'select', group: 'Advanced', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' }, { value: 'forced', label: 'Forced' },
  ]},
  { key: 'dpd', label: 'Dead Peer Detection', type: 'select', group: 'Advanced', options: [
    { value: 'disable', label: 'Disable' }, { value: 'on-idle', label: 'On Idle' }, { value: 'on-demand', label: 'On Demand' },
  ]},
  { key: 'comments', label: 'Comments', type: 'textarea', group: 'Advanced', width: 'full' },
];

const phase2Fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'phase1name', label: 'Phase 1 Name', type: 'text', required: true, group: 'General' },
  { key: 'proposal', label: 'Proposal', type: 'tagsinput', group: 'Crypto', placeholder: 'aes256-sha256' },
  { key: 'pfs', label: 'PFS', type: 'select', group: 'Crypto', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'dhgrp', label: 'DH Group', type: 'tagsinput', group: 'Crypto', placeholder: '14 5' },
  { key: 'keylifeseconds', label: 'Key Lifetime (seconds)', type: 'number', group: 'Crypto' },
  { key: 'srcSubnet', label: 'Source Subnet', type: 'text', group: 'Selectors', placeholder: '0.0.0.0 0.0.0.0' },
  { key: 'dstSubnet', label: 'Destination Subnet', type: 'text', group: 'Selectors', placeholder: '0.0.0.0 0.0.0.0' },
  { key: 'protocol', label: 'Protocol', type: 'select', group: 'Advanced', options: [
    { value: 'esp', label: 'ESP' }, { value: 'ah', label: 'AH' },
  ]},
  { key: 'encapsulation', label: 'Encapsulation', type: 'select', group: 'Advanced', options: [
    { value: 'tunnel-mode', label: 'Tunnel Mode' }, { value: 'transport-mode', label: 'Transport Mode' },
  ]},
  { key: 'replay', label: 'Replay Detection', type: 'select', group: 'Advanced', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'autoNegotiate', label: 'Auto-negotiate', type: 'select', group: 'Advanced', options: [
    { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'comments', label: 'Comments', type: 'textarea', group: 'Advanced', width: 'full' },
];

export default function IPsecTunnels() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem, reorderItems } = useProjectStore();
  const phase1Data = config.vpnIpsec.phase1;
  const phase2Data = config.vpnIpsec.phase2;

  const [editingP1, setEditingP1] = useState<{ item: VPNPhase1; index: number } | null>(null);
  const [isNewP1, setIsNewP1] = useState(false);
  const [deletingP1, setDeletingP1] = useState<number | null>(null);

  const [editingP2, setEditingP2] = useState<{ item: VPNPhase2; index: number } | null>(null);
  const [isNewP2, setIsNewP2] = useState(false);
  const [deletingP2, setDeletingP2] = useState<number | null>(null);

  const phase1Columns: Column<VPNPhase1>[] = [
    { key: 'name', label: 'Name' },
    { key: 'interface', label: 'Interface' },
    { key: 'remoteGw', label: 'Remote Gateway' },
    { key: 'ikeVersion', label: 'IKE Version', render: (p) => <StatusBadge value={`IKEv${p.ikeVersion}`} /> },
    { key: 'proposal', label: 'Proposal', render: (p) => p.proposal.join(', ') || '-' },
  ];

  const phase2Columns: Column<VPNPhase2>[] = [
    { key: 'name', label: 'Name' },
    { key: 'phase1name', label: 'Phase 1' },
    { key: 'proposal', label: 'Proposal', render: (p) => p.proposal.join(', ') || '-' },
    { key: 'srcSubnet', label: 'Source Subnet' },
    { key: 'dstSubnet', label: 'Destination Subnet' },
  ];

  const handleSaveP1 = () => {
    if (!editingP1) return;
    if (isNewP1) addItem(PATH_P1, editingP1.item);
    else updateItem(PATH_P1, editingP1.index, editingP1.item);
    setEditingP1(null);
  };

  const handleSaveP2 = () => {
    if (!editingP2) return;
    if (isNewP2) addItem(PATH_P2, editingP2.item);
    else updateItem(PATH_P2, editingP2.index, editingP2.item);
    setEditingP2(null);
  };

  return (
    <>
      <DataTable title="IPsec Phase 1" columns={phase1Columns} data={phase1Data}
        getRowKey={(item) => item.name}
        onAdd={() => { setEditingP1({ item: { ...defaultPhase1 }, index: -1 }); setIsNewP1(true); }}
        onEdit={(item, index) => { setEditingP1({ item: { ...item }, index }); setIsNewP1(false); }}
        onDelete={(_, index) => setDeletingP1(index)}
        onClone={(item) => { setEditingP1({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNewP1(true); }}
        onReorder={(from, to) => reorderItems(PATH_P1, from, to)}
      />
      {editingP1 && (
        <EditModal title="IPsec Phase 1" fields={phase1Fields} values={editingP1.item} isNew={isNewP1}
          onChange={(key, val) => setEditingP1({ ...editingP1, item: { ...editingP1.item, [key]: val } })}
          onSave={handleSaveP1} onCancel={() => setEditingP1(null)} />
      )}
      {deletingP1 !== null && (
        <ConfirmDialog title="Delete Phase 1" message={`Delete phase 1 "${phase1Data[deletingP1]?.name}"?`}
          onConfirm={() => { removeItem(PATH_P1, deletingP1); setDeletingP1(null); }} onCancel={() => setDeletingP1(null)} />
      )}

      <div className="mt-6">
        <DataTable title="IPsec Phase 2" columns={phase2Columns} data={phase2Data}
          getRowKey={(item) => item.name}
          onAdd={() => { setEditingP2({ item: { ...defaultPhase2 }, index: -1 }); setIsNewP2(true); }}
          onEdit={(item, index) => { setEditingP2({ item: { ...item }, index }); setIsNewP2(false); }}
          onDelete={(_, index) => setDeletingP2(index)}
          onClone={(item) => { setEditingP2({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNewP2(true); }}
          onReorder={(from, to) => reorderItems(PATH_P2, from, to)}
        />
      </div>
      {editingP2 && (
        <EditModal title="IPsec Phase 2" fields={phase2Fields} values={editingP2.item} isNew={isNewP2}
          onChange={(key, val) => setEditingP2({ ...editingP2, item: { ...editingP2.item, [key]: val } })}
          onSave={handleSaveP2} onCancel={() => setEditingP2(null)} />
      )}
      {deletingP2 !== null && (
        <ConfirmDialog title="Delete Phase 2" message={`Delete phase 2 "${phase2Data[deletingP2]?.name}"?`}
          onConfirm={() => { removeItem(PATH_P2, deletingP2); setDeletingP2(null); }} onCancel={() => setDeletingP2(null)} />
      )}
    </>
  );
}
