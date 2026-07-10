import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { EditorPage, Card, FormSection, FieldRow, InfoDot, Segmented, Toggle, ObjectSelect, StringChips } from '../shared/forti';
import type { ObjectOption } from '../shared/forti';
import type { SDWANHealthCheck } from '../../types/fortigate';

interface Props {
  initial: SDWANHealthCheck;
  isNew: boolean;
  onSave: (item: SDWANHealthCheck) => void;
  onCancel: () => void;
}

export default function SLAEditor({ initial, isNew, onSave, onCancel }: Props) {
  const config = useProjectStore((s) => s.project.config);
  const [draft, setDraft] = useState<SDWANHealthCheck>(initial);
  const set = (patch: Partial<SDWANHealthCheck>) => setDraft((d) => ({ ...d, ...patch }));

  const [participantsAll, setParticipantsAll] = useState(initial.members.length === 0);
  const slaOn = draft.slaTargets.length > 0;
  const sla = draft.slaTargets[0] || { id: 1, latencyThreshold: 0, jitterThreshold: 0, packetlossThreshold: 0 };
  const setSla = (patch: Partial<typeof sla>) => set({ slaTargets: [{ ...sla, ...patch }] });

  // SD-WAN members as participant options (value = seq number)
  const memberOptions: ObjectOption[] = config.sdwan.members.map((m) => ({
    value: String(m.seqNum),
    label: m.interface + (m.zone ? ` (${m.zone})` : ''),
  }));

  const handleSave = () => {
    onSave({ ...draft, members: participantsAll ? [] : draft.members });
  };

  return (
    <EditorPage title={isNew ? 'New Performance SLA' : 'Edit Performance SLA'} onSave={handleSave} onCancel={onCancel}>
      <Card>
        <FieldRow label="Name">
          <input className="forti-input max-w-[360px]" value={draft.name} onChange={(e) => set({ name: e.target.value })} disabled={!isNew} />
        </FieldRow>
        <FieldRow label={<>Probe mode <InfoDot tip="Active sends probes; passive infers from traffic" /></>}>
          <Segmented value={draft.probeMode} onChange={(v) => set({ probeMode: v as SDWANHealthCheck['probeMode'] })}
            options={[{ value: 'active', label: 'Active' }, { value: 'passive', label: 'Passive' }, { value: 'prefer-passive', label: 'Prefer Passive' }]} />
        </FieldRow>
        <FieldRow label="Protocol">
          <Segmented value={draft.protocol} onChange={(v) => set({ protocol: v as SDWANHealthCheck['protocol'] })}
            options={[{ value: 'ping', label: 'Ping' }, { value: 'http', label: 'HTTP' }, { value: 'dns', label: 'DNS' }]} />
        </FieldRow>
        <FieldRow label="Server" align="start">
          <StringChips value={draft.server} onChange={(v) => set({ server: v })} placeholder="10.10.200.1" />
        </FieldRow>
        <FieldRow label="Participants" align="start">
          <div>
            <Segmented value={participantsAll ? 'all' : 'specify'} onChange={(v) => setParticipantsAll(v === 'all')}
              options={[{ value: 'all', label: 'All SD-WAN Members' }, { value: 'specify', label: 'Specify' }]} />
            {!participantsAll && (
              <div className="mt-2">
                <ObjectSelect options={memberOptions} value={draft.members.map(String)}
                  onChange={(v) => set({ members: v.map((x) => parseInt(x, 10)) })} placeholder="Select member" />
              </div>
            )}
          </div>
        </FieldRow>

        {/* SLA Target */}
        <FormSection title="SLA Target">
          <FieldRow label={<>Enable SLA target <InfoDot tip="Define latency/jitter/packet-loss targets" /></>}>
            <Toggle checked={slaOn} onChange={(on) => set({ slaTargets: on ? [{ id: 1, latencyThreshold: 5, jitterThreshold: 5, packetlossThreshold: 0 }] : [] })} />
          </FieldRow>
          {slaOn && (
            <>
              <FieldRow label="Latency threshold">
                <div className="flex items-center gap-2">
                  <input type="number" className="forti-input max-w-[160px]" value={sla.latencyThreshold} onChange={(e) => setSla({ latencyThreshold: parseInt(e.target.value) || 0 })} />
                  <span className="text-sm text-forti-text-secondary">ms</span>
                </div>
              </FieldRow>
              <FieldRow label="Jitter threshold">
                <div className="flex items-center gap-2">
                  <input type="number" className="forti-input max-w-[160px]" value={sla.jitterThreshold} onChange={(e) => setSla({ jitterThreshold: parseInt(e.target.value) || 0 })} />
                  <span className="text-sm text-forti-text-secondary">ms</span>
                </div>
              </FieldRow>
              <FieldRow label="Packet Loss threshold">
                <div className="flex items-center gap-2">
                  <input type="number" className="forti-input max-w-[160px]" value={sla.packetlossThreshold} onChange={(e) => setSla({ packetlossThreshold: parseInt(e.target.value) || 0 })} />
                  <span className="text-sm text-forti-text-secondary">%</span>
                </div>
              </FieldRow>
            </>
          )}
        </FormSection>

        {/* Link Status */}
        <FormSection title="Link Status">
          <FieldRow label="Check interval">
            <div className="flex items-center gap-2">
              <input type="number" className="forti-input max-w-[160px]" value={draft.interval} onChange={(e) => set({ interval: parseInt(e.target.value) || 500 })} />
              <span className="text-sm text-forti-text-secondary">ms</span>
            </div>
          </FieldRow>
          <FieldRow label={<>Failures before inactive <InfoDot tip="Consecutive failed probes before the link is down" /></>}>
            <input type="number" className="forti-input max-w-[160px]" value={draft.failtime} onChange={(e) => set({ failtime: parseInt(e.target.value) || 5 })} />
          </FieldRow>
          <FieldRow label={<>Restore link after <InfoDot tip="Consecutive successful probes before the link recovers" /></>}>
            <div className="flex items-center gap-2">
              <input type="number" className="forti-input max-w-[160px]" value={draft.recovertime} onChange={(e) => set({ recovertime: parseInt(e.target.value) || 5 })} />
              <span className="text-sm text-forti-text-secondary">check(s)</span>
            </div>
          </FieldRow>
        </FormSection>
      </Card>
    </EditorPage>
  );
}
