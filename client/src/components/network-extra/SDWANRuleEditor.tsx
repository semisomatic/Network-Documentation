import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { EditorPage, Card, FormSection, FieldRow, Segmented, ObjectSelect, StringChips } from '../shared/forti';
import type { ObjectOption } from '../shared/forti';
import type { SDWANRule } from '../../types/fortigate';

interface Props {
  initial: SDWANRule;
  isNew: boolean;
  onSave: (item: SDWANRule) => void;
  onCancel: () => void;
}

const STRATEGIES = [
  { value: 'manual', label: 'Manual', desc: 'Manually assign outgoing interfaces.' },
  { value: 'priority', label: 'Best quality', desc: 'The interface with the best measured performance is selected.' },
  { value: 'sla', label: 'Lowest cost (SLA)', desc: 'The interface that meets SLA targets is selected; ties break by lowest assigned cost.' },
];

// map protocol number <-> segmented value
const protoToSeg = (n: number) => (n === 6 ? 'tcp' : n === 17 ? 'udp' : n === 0 ? 'any' : 'specify');

export default function SDWANRuleEditor({ initial, isNew, onSave, onCancel }: Props) {
  const config = useProjectStore((s) => s.project.config);
  const [draft, setDraft] = useState<SDWANRule>(initial);
  const set = (patch: Partial<SDWANRule>) => setDraft((d) => ({ ...d, ...patch }));

  const addrOptions: ObjectOption[] = [
    { value: 'all', label: 'all' },
    ...config.firewallAddress.map((a) => ({ value: a.name, label: a.name })),
    ...config.firewallAddrgrp.map((g) => ({ value: g.name, label: `[Group] ${g.name}` })),
  ];
  const memberOptions: ObjectOption[] = config.sdwan.members.map((m) => ({
    value: String(m.seqNum),
    label: m.interface + (m.zone ? ` (${m.zone})` : ''),
  }));
  const healthCheckNames = config.sdwan.healthChecks.map((h) => h.name);
  const selectedHc = config.sdwan.healthChecks.find((h) => h.name === draft.healthCheck);

  const protoSeg = protoToSeg(draft.protocol);
  const setProto = (v: string) => {
    if (v === 'tcp') set({ protocol: 6 });
    else if (v === 'udp') set({ protocol: 17 });
    else if (v === 'any') set({ protocol: 0 });
    else set({ protocol: draft.protocol && draft.protocol !== 6 && draft.protocol !== 17 ? draft.protocol : 1 });
  };

  return (
    <EditorPage title="Priority Rule" onSave={() => onSave(draft)} onCancel={onCancel}>
      <Card>
        <FieldRow label="Name">
          <input className="forti-input max-w-[360px]" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </FieldRow>
        <FieldRow label="Status">
          <Segmented value={draft.status} onChange={(v) => set({ status: v as SDWANRule['status'] })}
            options={[{ value: 'enable', label: 'Enabled' }, { value: 'disable', label: 'Disabled', danger: true }]} />
        </FieldRow>
        <FieldRow label="Comment" align="start">
          <textarea className="forti-input min-h-[52px] max-w-[360px]" rows={2} value={draft.comment} onChange={(e) => set({ comment: e.target.value })} />
        </FieldRow>

        {/* Source */}
        <FormSection title="Source">
          <FieldRow label="Address" align="start">
            <ObjectSelect options={addrOptions} value={draft.srcAddr} onChange={(v) => set({ srcAddr: v })} placeholder="Select address" />
          </FieldRow>
        </FormSection>

        {/* Destination */}
        <FormSection title="Destination">
          <FieldRow label="Address" align="start">
            <ObjectSelect options={addrOptions} value={draft.dstAddr} onChange={(v) => set({ dstAddr: v })} placeholder="Select address" />
          </FieldRow>
          <FieldRow label="Protocol">
            <Segmented value={protoSeg} onChange={setProto}
              options={[{ value: 'tcp', label: 'TCP' }, { value: 'udp', label: 'UDP' }, { value: 'any', label: 'ANY' }, { value: 'specify', label: 'Specify' }]} />
          </FieldRow>
          {protoSeg === 'specify' && (
            <>
              <FieldRow label="Protocol number">
                <input type="number" className="forti-input max-w-[140px]" value={draft.protocol} onChange={(e) => set({ protocol: parseInt(e.target.value) || 0 })} />
              </FieldRow>
              <FieldRow label="Port range">
                <div className="flex items-center gap-2">
                  <input type="number" className="forti-input max-w-[120px]" value={draft.startPort} onChange={(e) => set({ startPort: parseInt(e.target.value) || 0 })} placeholder="Start" />
                  <span className="text-forti-text-secondary">-</span>
                  <input type="number" className="forti-input max-w-[120px]" value={draft.endPort} onChange={(e) => set({ endPort: parseInt(e.target.value) || 0 })} placeholder="End" />
                </div>
              </FieldRow>
            </>
          )}
          <FieldRow label="Internet service" align="start">
            <StringChips value={draft.internetServiceName} onChange={(v) => set({ internetServiceName: v, internetService: v.length > 0 })} placeholder="ISDB service name" />
          </FieldRow>
        </FormSection>

        {/* Outgoing Interfaces */}
        <FormSection title="Outgoing Interfaces">
          <FieldRow label="Interface selection strategy" align="start">
            <div className="space-y-2">
              {STRATEGIES.map((s) => (
                <label key={s.value} className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="strategy" className="mt-1 accent-forti-accent" checked={draft.mode === s.value} onChange={() => set({ mode: s.value as SDWANRule['mode'] })} />
                  <span>
                    <span className="text-sm text-forti-text-primary">{s.label}</span>
                    <span className="block text-xs text-forti-text-secondary">{s.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </FieldRow>
          <FieldRow label="Interface preference" align="start">
            <ObjectSelect options={memberOptions} value={draft.members.map(String)}
              onChange={(v) => set({ members: v.map((x) => parseInt(x, 10)) })} placeholder="Select interface" />
          </FieldRow>
          {draft.mode === 'sla' && (
            <>
              <FieldRow label="Performance SLA">
                <select className="forti-select max-w-[300px]" value={draft.healthCheck} onChange={(e) => set({ healthCheck: e.target.value, slaId: 0 })}>
                  <option value="">-- Select --</option>
                  {healthCheckNames.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </FieldRow>
              {selectedHc && selectedHc.slaTargets.length > 0 && (
                <FieldRow label="Required SLA target">
                  <select className="forti-select max-w-[200px]" value={draft.slaId} onChange={(e) => set({ slaId: parseInt(e.target.value) || 0 })}>
                    {selectedHc.slaTargets.map((t) => <option key={t.id} value={t.id}>SLA #{t.id}</option>)}
                  </select>
                </FieldRow>
              )}
            </>
          )}
        </FormSection>
      </Card>
    </EditorPage>
  );
}
