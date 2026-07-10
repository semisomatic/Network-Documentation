import React, { useState } from 'react';
import { X } from 'lucide-react';
import EditModal, { FieldDef } from '../shared/EditModal';
import { EditorPage, Card, FormSection, FieldRow, InfoDot, Segmented, Toggle, CheckboxGrid, InlineTable } from '../shared/forti';
import type { CheckboxOption, InlineColumn, SegmentedOption } from '../shared/forti';
import type { SystemInterface } from '../../types/fortigate';

type SecondaryIP = SystemInterface['secondaryIPs'][number];

const ADMIN_ACCESS: CheckboxOption[] = [
  { value: 'https', label: 'HTTPS' },
  { value: 'http', label: 'HTTP', info: 'Redirects to HTTPS' },
  { value: 'ping', label: 'PING' },
  { value: 'fgfm', label: 'FMG-Access' },
  { value: 'ssh', label: 'SSH' },
  { value: 'snmp', label: 'SNMP' },
  { value: 'ftm', label: 'FTM' },
  { value: 'radius-acct', label: 'RADIUS Accounting' },
  { value: 'fabric', label: 'Security Fabric' },
];

const MODE_OPTS: SegmentedOption<string>[] = [
  { value: 'static', label: 'Manual' },
  { value: 'dhcp', label: 'DHCP' },
  { value: 'pppoe', label: 'PPPoE' },
];

const TYPE_OPTS = ['physical', 'vlan', 'aggregate', 'loopback', 'tunnel', 'redundant', 'switch'];
const ROLE_OPTS = ['lan', 'wan', 'dmz', 'undefined'];
const SPEED_OPTS = ['auto', '10full', '100full', '1000full', '10000full'];

interface Props {
  initial: SystemInterface;
  isNew: boolean;
  onSave: (item: SystemInterface) => void;
  onCancel: () => void;
}

export default function InterfaceEditor({ initial, isNew, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<SystemInterface>(initial);
  const set = (patch: Partial<SystemInterface>) => setDraft((d) => ({ ...d, ...patch }));

  // Secondary IP sub-editor (small modal reusing EditModal)
  const [secEdit, setSecEdit] = useState<{ item: SecondaryIP; index: number } | null>(null);

  // Relay IP chip input
  const [relayInput, setRelayInput] = useState('');

  const ipNetmask = draft.ip && draft.netmask ? `${draft.ip}/${draft.netmask}` : draft.ip || '';
  const setIpNetmask = (v: string) => {
    const [ip, mask] = v.split(/[/\s]+/);
    set({ ip: ip || '', netmask: mask || '' });
  };

  const secColumns: InlineColumn<SecondaryIP>[] = [
    { key: 'ip', label: 'IP/Netmask', render: (r) => (r.ip ? `${r.ip}/${r.netmask}` : '-') },
    { key: 'allowaccess', label: 'Administrative access', render: (r) => r.allowaccess.join(', ') || '-' },
  ];

  const secFields: FieldDef[] = [
    { key: 'ip', label: 'IP Address', type: 'text', placeholder: '192.168.2.253' },
    { key: 'netmask', label: 'Netmask', type: 'text', placeholder: '255.255.255.0' },
    { key: 'allowaccess', label: 'Administrative Access', type: 'tagsinput', width: 'full', placeholder: 'ping https ssh' },
  ];

  const saveSecondary = () => {
    if (!secEdit) return;
    const list = [...draft.secondaryIPs];
    if (secEdit.index < 0) list.push(secEdit.item);
    else list[secEdit.index] = secEdit.item;
    set({ secondaryIPs: list, secondaryIP: list.length > 0 });
    setSecEdit(null);
  };

  const addRelay = () => {
    const v = relayInput.trim();
    if (v) { set({ dhcpRelayIp: [...draft.dhcpRelayIp, v] }); setRelayInput(''); }
  };

  return (
    <>
      <EditorPage title={isNew ? 'New Interface' : 'Edit Interface'} onSave={() => onSave(draft)} onCancel={onCancel}>
        <Card>
          {/* Interface identity */}
          <FieldRow label="Name">
            <input className="forti-input max-w-[340px]" value={draft.name} onChange={(e) => set({ name: e.target.value })} disabled={!isNew} />
          </FieldRow>
          <FieldRow label="Alias">
            <input className="forti-input max-w-[340px]" value={draft.alias} onChange={(e) => set({ alias: e.target.value })} />
          </FieldRow>
          <FieldRow label="Type">
            <select className="forti-select max-w-[340px]" value={draft.type} onChange={(e) => set({ type: e.target.value as SystemInterface['type'] })}>
              {TYPE_OPTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FieldRow>
          <FieldRow label={<>Role <InfoDot tip="Interface role" /></>}>
            <select className="forti-select max-w-[340px]" value={draft.role} onChange={(e) => set({ role: e.target.value as SystemInterface['role'] })}>
              {ROLE_OPTS.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Status">
            <Segmented value={draft.status} onChange={(v) => set({ status: v as 'up' | 'down' })}
              options={[{ value: 'up', label: 'Up' }, { value: 'down', label: 'Down', danger: true }]} />
          </FieldRow>

          {/* Address */}
          <FormSection title="Address">
            <FieldRow label="Addressing mode">
              <Segmented value={draft.mode} onChange={(v) => set({ mode: v as SystemInterface['mode'] })} options={MODE_OPTS} />
            </FieldRow>
            {draft.mode === 'static' && (
              <FieldRow label="IP/Netmask">
                <input className="forti-input max-w-[340px]" value={ipNetmask} onChange={(e) => setIpNetmask(e.target.value)} placeholder="192.168.2.254/255.255.255.0" />
              </FieldRow>
            )}
            <FieldRow label="Secondary IP address">
              <Toggle checked={draft.secondaryIP} onChange={(v) => set({ secondaryIP: v })} />
            </FieldRow>
            {draft.secondaryIP && (
              <FieldRow label="" align="start">
                <InlineTable<SecondaryIP>
                  columns={secColumns}
                  data={draft.secondaryIPs}
                  onCreate={() => setSecEdit({ item: { ip: '', netmask: '', allowaccess: [] }, index: -1 })}
                  onEdit={(item, index) => setSecEdit({ item: { ...item }, index })}
                  onDelete={(_, index) => set({ secondaryIPs: draft.secondaryIPs.filter((_, i) => i !== index) })}
                />
              </FieldRow>
            )}
          </FormSection>

          {/* Administrative access */}
          <FormSection title="Administrative Access">
            <FieldRow label="IPv4" align="start">
              <CheckboxGrid options={ADMIN_ACCESS} value={draft.allowaccess} onChange={(v) => set({ allowaccess: v })} />
            </FieldRow>
          </FormSection>

          {/* Network */}
          <FormSection title="Network">
            {(draft.type === 'vlan') && (
              <>
                <FieldRow label="Parent Interface">
                  <input className="forti-input max-w-[340px]" value={draft.interface} onChange={(e) => set({ interface: e.target.value })} />
                </FieldRow>
                <FieldRow label="VLAN ID">
                  <input type="number" className="forti-input max-w-[150px]" value={draft.vlanid || ''} onChange={(e) => set({ vlanid: parseInt(e.target.value) || 0 })} />
                </FieldRow>
              </>
            )}
            <FieldRow label="DHCP Relay">
              <Toggle checked={draft.dhcpRelayService} onChange={(v) => set({ dhcpRelayService: v })} />
            </FieldRow>
            {draft.dhcpRelayService && (
              <FieldRow label="Relay Server IPs" align="start">
                <div className="max-w-[340px]">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {draft.dhcpRelayIp.map((ip, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-forti-accent-soft text-forti-accent-hover text-xs rounded">
                        {ip}
                        <button type="button" onClick={() => set({ dhcpRelayIp: draft.dhcpRelayIp.filter((_, j) => j !== i) })} className="hover:text-forti-deny">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input className="forti-input" value={relayInput} onChange={(e) => setRelayInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRelay(); } }} placeholder="Type a server IP and press Enter" />
                </div>
              </FieldRow>
            )}
          </FormSection>

          {/* Advanced */}
          <FormSection title="Advanced">
            <FieldRow label="Speed">
              <select className="forti-select max-w-[200px]" value={draft.speed} onChange={(e) => set({ speed: e.target.value })}>
                {SPEED_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="MTU Override">
              <div className="flex items-center gap-3">
                <Toggle checked={draft.mtuOverride} onChange={(v) => set({ mtuOverride: v })} />
                {draft.mtuOverride && (
                  <input type="number" className="forti-input max-w-[120px]" value={draft.mtu} onChange={(e) => set({ mtu: parseInt(e.target.value) || 1500 })} />
                )}
              </div>
            </FieldRow>
            <FieldRow label="Description" align="start">
              <textarea className="forti-input min-h-[70px] max-w-[340px]" value={draft.description} onChange={(e) => set({ description: e.target.value })} rows={2} />
            </FieldRow>
          </FormSection>
        </Card>
      </EditorPage>

      {secEdit && (
        <EditModal title="Secondary IP" fields={secFields} values={secEdit.item} isNew={secEdit.index < 0}
          onChange={(key, val) => setSecEdit({ ...secEdit, item: { ...secEdit.item, [key]: val } })}
          onSave={saveSecondary} onCancel={() => setSecEdit(null)} />
      )}
    </>
  );
}
