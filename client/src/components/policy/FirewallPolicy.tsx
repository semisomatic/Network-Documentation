import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
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

export default function FirewallPolicy() {
  const config = useProjectStore((s) => s.project.config);
  const { addItem, updateItem, removeItem, reorderItems } = useProjectStore();
  const data = config.firewallPolicy;

  const [editing, setEditing] = useState<{ item: FWPolicy; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const intfOptions = config.system.interfaces.map(i => ({ value: i.name, label: i.name }));
  const addrOptions = [
    { value: 'all', label: 'all' },
    ...config.firewallAddress.map(a => ({ value: a.name, label: a.name })),
    ...config.firewallAddrgrp.map(g => ({ value: g.name, label: `[G] ${g.name}` })),
  ];
  const svcOptions = [
    { value: 'ALL', label: 'ALL' },
    ...config.firewallService.map(s => ({ value: s.name, label: s.name })),
    ...config.firewallServiceGroup.map(g => ({ value: g.name, label: `[G] ${g.name}` })),
  ];
  const schedOptions = [
    { value: 'always', label: 'always' },
    ...config.firewallSchedule.map(s => ({ value: s.name, label: s.name })),
  ];
  const secProfiles = (arr: any[], label: string) => arr.map(p => ({ value: p.name, label: `${label}: ${p.name}` }));

  const fields: FieldDef[] = [
    { key: 'policyid', label: 'Policy ID', type: 'number', required: true, group: 'General' },
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
    { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
      { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
    ]},
    { key: 'action', label: 'Action', type: 'select', group: 'General', options: [
      { value: 'accept', label: 'ACCEPT' }, { value: 'deny', label: 'DENY' },
    ]},
    { key: 'srcintf', label: 'Source Interface', type: 'multiselect', group: 'Source', options: intfOptions },
    { key: 'srcaddr', label: 'Source Address', type: 'multiselect', group: 'Source', options: addrOptions },
    { key: 'srcaddrNegate', label: 'Negate Source', type: 'checkbox', group: 'Source' },
    { key: 'dstintf', label: 'Destination Interface', type: 'multiselect', group: 'Destination', options: intfOptions },
    { key: 'dstaddr', label: 'Destination Address', type: 'multiselect', group: 'Destination', options: addrOptions },
    { key: 'dstaddrNegate', label: 'Negate Destination', type: 'checkbox', group: 'Destination' },
    { key: 'service', label: 'Service', type: 'multiselect', group: 'Service', options: svcOptions },
    { key: 'schedule', label: 'Schedule', type: 'select', group: 'Service', options: schedOptions },
    { key: 'nat', label: 'NAT', type: 'checkbox', group: 'NAT' },
    { key: 'ippool', label: 'Use IP Pool', type: 'checkbox', group: 'NAT' },
    { key: 'poolname', label: 'IP Pool', type: 'multiselect', group: 'NAT',
      options: config.firewallIppool.map(p => ({ value: p.name, label: p.name })) },
    { key: 'fixedport', label: 'Fixed Port', type: 'checkbox', group: 'NAT' },
    { key: 'inspectionMode', label: 'Inspection Mode', type: 'select', group: 'Inspection', options: [
      { value: 'flow', label: 'Flow-based' }, { value: 'proxy', label: 'Proxy-based' },
    ]},
    { key: 'utmStatus', label: 'Enable Security Profiles', type: 'checkbox', group: 'Security Profiles' },
    { key: 'avProfile', label: 'Antivirus Profile', type: 'select', group: 'Security Profiles',
      options: [{ value: '', label: 'None' }, ...config.securityProfiles.antivirus.map(p => ({ value: p.name, label: p.name }))] },
    { key: 'webfilterProfile', label: 'Web Filter Profile', type: 'select', group: 'Security Profiles',
      options: [{ value: '', label: 'None' }, ...config.securityProfiles.webFilter.map(p => ({ value: p.name, label: p.name }))] },
    { key: 'ipsSensor', label: 'IPS Sensor', type: 'select', group: 'Security Profiles',
      options: [{ value: '', label: 'None' }, ...config.securityProfiles.ips.map(p => ({ value: p.name, label: p.name }))] },
    { key: 'applicationList', label: 'Application Control', type: 'select', group: 'Security Profiles',
      options: [{ value: '', label: 'None' }, ...config.securityProfiles.applicationControl.map(p => ({ value: p.name, label: p.name }))] },
    { key: 'sslSshProfile', label: 'SSL/SSH Inspection', type: 'select', group: 'Security Profiles',
      options: [{ value: '', label: 'None' }, ...config.securityProfiles.sslInspection.map(p => ({ value: p.name, label: p.name }))] },
    { key: 'logtraffic', label: 'Log Traffic', type: 'select', group: 'Logging', options: [
      { value: 'all', label: 'All Sessions' }, { value: 'utm', label: 'Security Events' }, { value: 'disable', label: 'Disable' },
    ]},
    { key: 'logtrafficStart', label: 'Log at Session Start', type: 'checkbox', group: 'Logging' },
    { key: 'groups', label: 'User Groups', type: 'multiselect', group: 'Authentication',
      options: config.user.group.map(g => ({ value: g.name, label: g.name })) },
    { key: 'users', label: 'Users', type: 'multiselect', group: 'Authentication',
      options: config.user.local.map(u => ({ value: u.name, label: u.name })) },
    { key: 'comments', label: 'Comments', type: 'textarea', group: 'Other', width: 'full' },
  ];

  const columns: Column<FWPolicy>[] = [
    { key: 'policyid', label: 'ID', width: '60px' },
    { key: 'name', label: 'Name' },
    { key: 'srcintf', label: 'Src Intf', render: (p) => p.srcintf.join(', ') },
    { key: 'dstintf', label: 'Dst Intf', render: (p) => p.dstintf.join(', ') },
    { key: 'srcaddr', label: 'Source', render: (p) => p.srcaddr.join(', ') },
    { key: 'dstaddr', label: 'Destination', render: (p) => p.dstaddr.join(', ') },
    { key: 'service', label: 'Service', render: (p) => p.service.join(', ') },
    { key: 'action', label: 'Action', render: (p) => <StatusBadge value={p.action} /> },
    { key: 'nat', label: 'NAT', render: (p) => p.nat ? 'Yes' : '-' },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge value={p.status} /> },
  ];

  const handleSave = () => {
    if (!editing) return;
    const item = { ...editing.item };
    if (isNew && !item.policyid) {
      item.policyid = data.length > 0 ? Math.max(...data.map(p => p.policyid)) + 1 : 1;
    }
    if (isNew) addItem(PATH, item);
    else updateItem(PATH, editing.index, item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="Firewall Policy" columns={columns} data={data}
        getRowKey={(item) => String(item.policyid)}
        onAdd={() => {
          const nextId = data.length > 0 ? Math.max(...data.map(p => p.policyid)) + 1 : 1;
          setEditing({ item: { ...defaultPolicy, policyid: nextId }, index: -1 });
          setIsNew(true);
        }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => {
          const nextId = data.length > 0 ? Math.max(...data.map(p => p.policyid)) + 1 : 1;
          setEditing({ item: { ...item, policyid: nextId, name: item.name + '_copy' }, index: -1 });
          setIsNew(true);
        }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="Firewall Policy" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Policy" message={`Delete policy #${data[deleting]?.policyid} "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
