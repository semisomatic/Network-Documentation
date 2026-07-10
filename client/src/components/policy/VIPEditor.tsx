import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { EditorPage, Card, FormSection, FieldRow, InfoDot, Segmented, Toggle, ObjectSelect } from '../shared/forti';
import type { ObjectOption } from '../shared/forti';
import type { FirewallVIP } from '../../types/fortigate';

interface Props {
  initial: FirewallVIP;
  isNew: boolean;
  onSave: (item: FirewallVIP) => void;
  onCancel: () => void;
}

// Small free-text chip list (for arbitrary source IP/range/subnet entries)
function StringChips({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const add = () => { const v = input.trim(); if (v) { onChange([...value, v]); setInput(''); } };
  return (
    <div className="max-w-[360px]">
      <div className="flex flex-wrap gap-1 mb-1.5">
        {value.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-forti-band text-forti-text-primary text-xs rounded border border-forti-table-border">
            {v}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-gray-400 hover:text-forti-deny"><X size={11} /></button>
          </span>
        ))}
      </div>
      <input className="forti-input" value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder} />
    </div>
  );
}

export default function VIPEditor({ initial, isNew, onSave, onCancel }: Props) {
  const config = useProjectStore((s) => s.project.config);
  const [draft, setDraft] = useState<FirewallVIP>(initial);
  const set = (patch: Partial<FirewallVIP>) => setDraft((d) => ({ ...d, ...patch }));
  const [showFilters, setShowFilters] = useState(initial.srcFilter.length > 0 || initial.srcintfFilter.length > 0);

  const intfOptions: ObjectOption[] = config.system.interfaces.map((i) => ({ value: i.name, label: i.name }));
  const mappedText = draft.mappedip.join(', ');

  const handleSave = () => {
    const out = { ...draft };
    if (!showFilters) { out.srcFilter = []; out.srcintfFilter = []; }
    onSave(out);
  };

  return (
    <EditorPage title={isNew ? 'New Virtual IP' : 'Edit Virtual IP'} onSave={handleSave} onCancel={onCancel}>
      <Card>
        <FieldRow label="Name">
          <input className="forti-input max-w-[360px]" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </FieldRow>
        <FieldRow label="Comments" align="start">
          <div className="max-w-[360px]">
            <textarea className="forti-input min-h-[52px]" rows={2} maxLength={255} value={draft.comment} onChange={(e) => set({ comment: e.target.value })} placeholder="Write a comment..." />
            <div className="text-[11px] text-gray-400 text-right">{draft.comment.length}/255</div>
          </div>
        </FieldRow>

        {/* Network */}
        <FormSection title="Network">
          <FieldRow label="Interface">
            <select className="forti-select max-w-[360px]" value={draft.extintf} onChange={(e) => set({ extintf: e.target.value })}>
              <option value="any">any</option>
              {config.system.interfaces.map((i) => <option key={i.name} value={i.name}>{i.name}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Type">
            <select className="forti-select max-w-[360px]" value={draft.type} onChange={(e) => set({ type: e.target.value as FirewallVIP['type'] })}>
              <option value="static-nat">Static NAT</option>
              <option value="load-balance">Load Balance</option>
              <option value="server-load-balance">Server Load Balance</option>
              <option value="dns-translation">DNS Translation</option>
              <option value="fqdn">FQDN</option>
            </select>
          </FieldRow>
          <FieldRow label={<>External IP address/range <InfoDot tip="Public-facing address" /></>}>
            <input className="forti-input max-w-[360px]" value={draft.extip} onChange={(e) => set({ extip: e.target.value })} placeholder="74.9.215.217" />
          </FieldRow>
          <FieldRow label="Map to → IPv4 address/range" indent>
            <input className="forti-input max-w-[360px]" value={mappedText}
              onChange={(e) => set({ mappedip: e.target.value.split(/[,\s]+/).filter(Boolean) })} placeholder="192.168.88.150" />
          </FieldRow>
        </FormSection>

        {/* Optional filters */}
        <FormSection title="Optional filters & restrictions">
          <FieldRow label="Enable filters">
            <Toggle checked={showFilters} onChange={setShowFilters} />
          </FieldRow>
          {showFilters && (
            <>
              <FieldRow label={<>Source address <InfoDot tip="Restrict which sources this VIP applies to" /></>} align="start">
                <StringChips value={draft.srcFilter} onChange={(v) => set({ srcFilter: v })} placeholder="Source IP / range / subnet" />
              </FieldRow>
              <FieldRow label="Restrict listening to interface" align="start">
                <ObjectSelect options={intfOptions} value={draft.srcintfFilter} onChange={(v) => set({ srcintfFilter: v })} placeholder="Select interface" />
              </FieldRow>
            </>
          )}
        </FormSection>

        {/* Port forwarding */}
        <FormSection title="Port Forwarding">
          <FieldRow label="Enable port forwarding">
            <Toggle checked={draft.portforward} onChange={(v) => set({ portforward: v })} />
          </FieldRow>
          {draft.portforward && (
            <>
              <FieldRow label="Protocol">
                <Segmented value={draft.protocol} onChange={(v) => set({ protocol: v as FirewallVIP['protocol'] })}
                  options={[{ value: 'tcp', label: 'TCP' }, { value: 'udp', label: 'UDP' }, { value: 'sctp', label: 'SCTP' }]} />
              </FieldRow>
              <FieldRow label="Port Mapping Type">
                <Segmented value={draft.portmappingType} onChange={(v) => set({ portmappingType: v as FirewallVIP['portmappingType'] })}
                  options={[{ value: 'one-to-one', label: 'One to one' }, { value: 'many-to-many', label: 'Many to many' }]} />
              </FieldRow>
              <FieldRow label="External service port">
                <input className="forti-input max-w-[200px]" value={draft.extport} onChange={(e) => set({ extport: e.target.value })} placeholder="443" />
              </FieldRow>
              <FieldRow label={<>Map to IPv4 port <InfoDot tip="Internal port" /></>}>
                <input className="forti-input max-w-[200px]" value={draft.mappedport} onChange={(e) => set({ mappedport: e.target.value })} placeholder="8443" />
              </FieldRow>
            </>
          )}
        </FormSection>
      </Card>
    </EditorPage>
  );
}
