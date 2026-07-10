import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import PolicyEditor from './PolicyEditor';
import { useProjectStore } from '../../store/projectStore';
import type { FirewallPolicy as FWPolicy } from '../../types/fortigate';

const PATH = 'firewallPolicy';

const defaultPolicy: FWPolicy = {
  policyid: 0, name: '', srcintf: [], dstintf: [], srcaddr: ['all'], dstaddr: ['all'],
  srcaddrNegate: false, dstaddrNegate: false, action: 'accept', service: ['ALL'],
  serviceNegate: false, schedule: 'always', nat: false, ippool: false, poolname: [],
  fixedport: false, status: 'enable', logtraffic: 'utm', logtrafficStart: false,
  comments: '', utmStatus: false, avProfile: '', webfilterProfile: '',
  dnsfilterProfile: '', ipsSensor: '', applicationList: '', sslSshProfile: '',
  inspectionMode: 'flow', groups: [], users: [],
  internet_service: false, internet_service_name: [], internet_service_negate: false,
  captivePortalExempt: false, wccp: false, tcpMssSender: 0, tcpMssReceiver: 0,
  sessionTtl: 0, antiReplay: true, matchVip: false, diffservForward: false,
  diffservReverse: false, diffservcodeForward: '', diffservcodeReverse: '',
};

// Small colored UTM badge (AV / WEB / IPS / SSL ...)
const utmBadge = (label: string, name: string, cls: string) => (
  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white ${cls}`}>
    <span className="font-semibold">{label}</span><span>{name}</span>
  </span>
);

const renderUTM = (p: FWPolicy) => {
  const chips: React.ReactNode[] = [];
  if (p.avProfile) chips.push(utmBadge('AV', p.avProfile, 'bg-orange-500'));
  if (p.webfilterProfile) chips.push(utmBadge('WEB', p.webfilterProfile, 'bg-sky-500'));
  if (p.dnsfilterProfile) chips.push(utmBadge('DNS', p.dnsfilterProfile, 'bg-teal-500'));
  if (p.applicationList) chips.push(utmBadge('APP', p.applicationList, 'bg-indigo-500'));
  if (p.ipsSensor) chips.push(utmBadge('IPS', p.ipsSensor, 'bg-lime-600'));
  if (p.sslSshProfile) chips.push(utmBadge('SSL', p.sslSshProfile, 'bg-amber-600'));
  if (!chips.length) return <span className="text-gray-400">-</span>;
  return <div className="flex flex-col gap-0.5 items-start">{chips.map((c, i) => <span key={i}>{c}</span>)}</div>;
};

export default function FirewallPolicy() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.firewallPolicy;

  const [editorState, setEditorState] = useState<{ item: FWPolicy; index: number; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const nextId = () => (data.length ? Math.max(...data.map((p) => p.policyid)) + 1 : 1);

  const columns: Column<FWPolicy>[] = [
    { key: 'policyid', label: 'ID', width: '55px' },
    { key: 'name', label: 'Name', render: (p) => <span className={p.status === 'disable' ? 'text-gray-400' : 'font-medium'}>{p.name || `Policy ${p.policyid}`}</span> },
    { key: 'srcintf', label: 'From', render: (p) => p.srcintf.join(', ') || 'any' },
    { key: 'dstintf', label: 'To', render: (p) => p.dstintf.join(', ') || 'any' },
    { key: 'srcaddr', label: 'Source', render: (p) => p.srcaddr.join(', ') || '-' },
    { key: 'dstaddr', label: 'Destination', render: (p) => p.dstaddr.join(', ') || '-' },
    { key: 'service', label: 'Service', render: (p) => p.service.join(', ') || '-' },
    { key: 'action', label: 'Action', render: (p) => <StatusBadge value={p.action} /> },
    { key: 'poolname', label: 'IP Pool', render: (p) => (p.ippool && p.poolname.length ? p.poolname.join(', ') : '-') },
    { key: 'nat', label: 'NAT', render: (p) => p.nat ? <span className="text-forti-accent font-medium">NAT</span> : <span className="text-gray-400">Disabled</span> },
    { key: 'utm', label: 'UTM', render: renderUTM },
  ];

  const savePolicy = (item: FWPolicy) => {
    if (!editorState) return;
    const finalItem = { ...item };
    if (editorState.isNew && !finalItem.policyid) finalItem.policyid = nextId();
    if (editorState.isNew) addItem(PATH, finalItem);
    else updateItem(PATH, editorState.index, finalItem);
    setEditorState(null);
  };

  if (editorState) {
    return (
      <PolicyEditor
        initial={editorState.item}
        isNew={editorState.isNew}
        onSave={savePolicy}
        onCancel={() => setEditorState(null)}
      />
    );
  }

  return (
    <>
      <DataTable title="Firewall Policy" columns={columns} data={data}
        getRowKey={(item) => String(item.policyid)}
        onAdd={() => setEditorState({ item: { ...defaultPolicy, policyid: nextId() }, index: -1, isNew: true })}
        onEdit={(item, index) => setEditorState({ item: { ...item }, index, isNew: false })}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => setEditorState({ item: { ...item, policyid: nextId(), name: item.name + '_copy' }, index: -1, isNew: true })}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
      />
      {deleting !== null && (
        <ConfirmDialog title="Delete Policy" message={`Delete policy #${data[deleting]?.policyid} "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
