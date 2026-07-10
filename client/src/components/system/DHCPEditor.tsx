import React, { useState } from 'react';
import EditModal, { FieldDef } from '../shared/EditModal';
import { EditorPage, Card, FormSection, FieldRow, Segmented, InlineTable } from '../shared/forti';
import type { InlineColumn } from '../shared/forti';
import type { DHCPServer } from '../../types/fortigate';

type IpRange = DHCPServer['ipRanges'][number];
type Reserved = DHCPServer['reservedAddresses'][number];
type DhcpOption = DHCPServer['options'][number];

type RowEdit =
  | { kind: 'range'; item: IpRange; index: number }
  | { kind: 'option'; item: DhcpOption; index: number }
  | { kind: 'reservation'; item: Reserved; index: number }
  | null;

interface Props {
  initial: DHCPServer;
  isNew: boolean;
  interfaces: string[];
  onSave: (item: DHCPServer) => void;
  onCancel: () => void;
}

export default function DHCPEditor({ initial, isNew, interfaces, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<DHCPServer>(initial);
  const set = (patch: Partial<DHCPServer>) => setDraft((d) => ({ ...d, ...patch }));
  const [rowEdit, setRowEdit] = useState<RowEdit>(null);

  const nextId = (arr: { id: number }[]) => (arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1);

  // ---- column defs ----
  const rangeCols: InlineColumn<IpRange>[] = [
    { key: 'startIp', label: 'Start IP' },
    { key: 'endIp', label: 'End IP' },
  ];
  const optionCols: InlineColumn<DhcpOption>[] = [
    { key: 'code', label: 'Code', width: '90px' },
    { key: 'type', label: 'Type', width: '110px' },
    { key: 'value', label: 'Value' },
  ];
  const resCols: InlineColumn<Reserved>[] = [
    { key: 'mac', label: 'MAC Address' },
    { key: 'ip', label: 'IP' },
    { key: 'description', label: 'Description', render: (r) => r.description || '-' },
    { key: 'action', label: 'Action', render: (r) => (r.action === 'block' ? 'Block' : 'Reserve IP') },
  ];

  // ---- row modal field defs ----
  const rangeFields: FieldDef[] = [
    { key: 'startIp', label: 'Start IP', type: 'text', placeholder: '192.168.2.50' },
    { key: 'endIp', label: 'End IP', type: 'text', placeholder: '192.168.2.150' },
  ];
  const optionFields: FieldDef[] = [
    { key: 'code', label: 'Code', type: 'number' },
    { key: 'type', label: 'Type', type: 'select', options: [
      { value: 'hex', label: 'Hex' }, { value: 'string', label: 'String' }, { value: 'ip', label: 'IP' }, { value: 'fqdn', label: 'FQDN' },
    ]},
    { key: 'value', label: 'Value', type: 'text', width: 'full' },
  ];
  const resFields: FieldDef[] = [
    { key: 'mac', label: 'MAC Address', type: 'text', placeholder: '00:11:22:33:44:55' },
    { key: 'ip', label: 'Reserved IP', type: 'text', placeholder: '192.168.2.50' },
    { key: 'action', label: 'Action', type: 'select', options: [
      { value: 'assign', label: 'Reserve IP' }, { value: 'block', label: 'Block' },
    ]},
    { key: 'description', label: 'Description', type: 'text', width: 'full' },
  ];

  const saveRow = () => {
    if (!rowEdit) return;
    if (rowEdit.kind === 'range') {
      const list = [...draft.ipRanges];
      if (rowEdit.index < 0) list.push({ ...rowEdit.item, id: nextId(draft.ipRanges) }); else list[rowEdit.index] = rowEdit.item;
      set({ ipRanges: list });
    } else if (rowEdit.kind === 'option') {
      const list = [...draft.options];
      if (rowEdit.index < 0) list.push({ ...rowEdit.item, id: nextId(draft.options) }); else list[rowEdit.index] = rowEdit.item;
      set({ options: list });
    } else {
      const list = [...draft.reservedAddresses];
      if (rowEdit.index < 0) list.push({ ...rowEdit.item, id: nextId(draft.reservedAddresses) }); else list[rowEdit.index] = rowEdit.item;
      set({ reservedAddresses: list });
    }
    setRowEdit(null);
  };

  const rowFields = rowEdit?.kind === 'range' ? rangeFields : rowEdit?.kind === 'option' ? optionFields : resFields;
  const rowTitle = rowEdit?.kind === 'range' ? 'Address Range' : rowEdit?.kind === 'option' ? 'DHCP Option' : 'Reservation';

  return (
    <>
      <EditorPage title={isNew ? 'New DHCP Server' : 'Edit DHCP Server'} onSave={() => onSave(draft)} onCancel={onCancel}>
        <Card title={<><Segmented value={draft.status} onChange={(v) => set({ status: v as 'enable' | 'disable' })}
          options={[{ value: 'enable', label: 'Enabled' }, { value: 'disable', label: 'Disabled', danger: true }]} /> DHCP Server</>}>

          <FieldRow label="Interface">
            <select className="forti-select max-w-[340px]" value={draft.interface} onChange={(e) => set({ interface: e.target.value })}>
              <option value="">-- Select --</option>
              {interfaces.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </FieldRow>

          <FormSection title="Address">
            <FieldRow label="Address range" align="start">
              <InlineTable<IpRange>
                columns={rangeCols}
                data={draft.ipRanges}
                onCreate={() => setRowEdit({ kind: 'range', item: { id: 0, startIp: '', endIp: '' }, index: -1 })}
                onEdit={(item, index) => setRowEdit({ kind: 'range', item: { ...item }, index })}
                onDelete={(_, index) => set({ ipRanges: draft.ipRanges.filter((_, i) => i !== index) })}
              />
            </FieldRow>
            <FieldRow label="Netmask">
              <input className="forti-input max-w-[240px]" value={draft.netmask} onChange={(e) => set({ netmask: e.target.value })} placeholder="255.255.255.0" />
            </FieldRow>
            <FieldRow label="Default gateway">
              <input className="forti-input max-w-[240px]" value={draft.defaultGateway} onChange={(e) => set({ defaultGateway: e.target.value })} placeholder="192.168.2.254" />
            </FieldRow>
            <FieldRow label="DNS servers">
              <div className="flex gap-2 flex-wrap">
                <input className="forti-input max-w-[160px]" value={draft.dnsServer1} onChange={(e) => set({ dnsServer1: e.target.value })} placeholder="DNS 1" />
                <input className="forti-input max-w-[160px]" value={draft.dnsServer2} onChange={(e) => set({ dnsServer2: e.target.value })} placeholder="DNS 2" />
                <input className="forti-input max-w-[160px]" value={draft.dnsServer3} onChange={(e) => set({ dnsServer3: e.target.value })} placeholder="DNS 3" />
              </div>
            </FieldRow>
            <FieldRow label="Lease time">
              <div className="flex items-center gap-2">
                <input type="number" className="forti-input max-w-[160px]" value={draft.leaseTime} onChange={(e) => set({ leaseTime: parseInt(e.target.value) || 604800 })} />
                <span className="text-sm text-forti-text-secondary">second(s)</span>
              </div>
            </FieldRow>
          </FormSection>

          <FormSection title="Advanced">
            <FieldRow label="Domain">
              <input className="forti-input max-w-[240px]" value={draft.domain} onChange={(e) => set({ domain: e.target.value })} />
            </FieldRow>
            <FieldRow label="NTP servers">
              <div className="flex gap-2 flex-wrap">
                <input className="forti-input max-w-[160px]" value={draft.ntpServer1} onChange={(e) => set({ ntpServer1: e.target.value })} placeholder="NTP 1" />
                <input className="forti-input max-w-[160px]" value={draft.ntpServer2} onChange={(e) => set({ ntpServer2: e.target.value })} placeholder="NTP 2" />
              </div>
            </FieldRow>
            <FieldRow label="WINS servers">
              <div className="flex gap-2 flex-wrap">
                <input className="forti-input max-w-[160px]" value={draft.winsServer1} onChange={(e) => set({ winsServer1: e.target.value })} placeholder="WINS 1" />
                <input className="forti-input max-w-[160px]" value={draft.winsServer2} onChange={(e) => set({ winsServer2: e.target.value })} placeholder="WINS 2" />
              </div>
            </FieldRow>
          </FormSection>

          <FormSection title="Additional DHCP Options">
            <FieldRow label="" align="start">
              <InlineTable<DhcpOption>
                columns={optionCols}
                data={draft.options}
                onCreate={() => setRowEdit({ kind: 'option', item: { id: 0, code: 0, type: 'hex', value: '' }, index: -1 })}
                onEdit={(item, index) => setRowEdit({ kind: 'option', item: { ...item }, index })}
                onDelete={(_, index) => set({ options: draft.options.filter((_, i) => i !== index) })}
              />
            </FieldRow>
          </FormSection>

          <FormSection title="IP Address Assignment Rules">
            <FieldRow label="" align="start">
              <InlineTable<Reserved>
                columns={resCols}
                data={draft.reservedAddresses}
                maxHeight={280}
                onCreate={() => setRowEdit({ kind: 'reservation', item: { id: 0, ip: '', mac: '', description: '', action: 'assign' }, index: -1 })}
                onEdit={(item, index) => setRowEdit({ kind: 'reservation', item: { ...item }, index })}
                onDelete={(_, index) => set({ reservedAddresses: draft.reservedAddresses.filter((_, i) => i !== index) })}
              />
            </FieldRow>
          </FormSection>

          <FormSection title="Comments">
            <FieldRow label="" align="start">
              <textarea className="forti-input min-h-[70px] max-w-[420px]" value={draft.comments} onChange={(e) => set({ comments: e.target.value })} rows={2} />
            </FieldRow>
          </FormSection>
        </Card>
      </EditorPage>

      {rowEdit && (
        <EditModal title={rowTitle} fields={rowFields} values={rowEdit.item} isNew={rowEdit.index < 0}
          onChange={(key, val) => setRowEdit({ ...rowEdit, item: { ...rowEdit.item, [key]: val } } as RowEdit)}
          onSave={saveRow} onCancel={() => setRowEdit(null)} />
      )}
    </>
  );
}
