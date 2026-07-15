import React, { useState } from 'react';
import { EditorPage, Card, FormSection, FieldRow, Segmented, Toggle, CheckboxGrid, StringChips } from '../shared/forti';
import type { WirelessVAP } from '../../types/fortigate';

interface Props {
  initial: WirelessVAP;
  isNew: boolean;
  onSave: (item: WirelessVAP) => void;
  onCancel: () => void;
}

const SECURITY_OPTS = [
  { value: 'open', label: 'Open' },
  { value: 'wpa2-personal', label: 'WPA2 Personal' },
  { value: 'wpa2-enterprise', label: 'WPA2 Enterprise' },
  { value: 'wpa3-sae', label: 'WPA3 SAE' },
  { value: 'wpa3-enterprise', label: 'WPA3 Enterprise' },
  { value: 'captive-portal', label: 'Captive Portal' },
];
const BEACON_OPTS = [
  { value: 'name', label: 'Name' },
  { value: 'model', label: 'Model' },
  { value: 'serial-number', label: 'Serial number' },
];

export default function VAPEditor({ initial, isNew, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<WirelessVAP>(initial);
  const set = (patch: Partial<WirelessVAP>) => setDraft((d) => ({ ...d, ...patch }));
  const isEnterprise = draft.securityMode.includes('enterprise');
  const isPersonal = draft.securityMode.includes('personal') || draft.securityMode.includes('sae');
  const encPass = /^ENC\s/.test(draft.passphrase);

  return (
    <EditorPage title={isNew ? 'New SSID' : `Edit SSID — ${draft.name}`} onSave={() => onSave(draft)} onCancel={onCancel}>
      <Card>
        <FieldRow label="Name">
          <input className="forti-input max-w-[360px]" value={draft.name} onChange={(e) => set({ name: e.target.value })} disabled={!isNew} />
        </FieldRow>
        <FieldRow label="SSID">
          <input className="forti-input max-w-[360px]" value={draft.ssid} onChange={(e) => set({ ssid: e.target.value })} />
        </FieldRow>
        <FieldRow label="Alias">
          <input className="forti-input max-w-[240px]" value={draft.alias} onChange={(e) => set({ alias: e.target.value })} />
        </FieldRow>
        <FieldRow label="Comments" align="start">
          <textarea className="forti-input min-h-[52px] max-w-[360px]" rows={2} value={draft.comment} onChange={(e) => set({ comment: e.target.value })} />
        </FieldRow>

        <FormSection title="Security">
          <FieldRow label="Security mode">
            <select className="forti-select max-w-[260px]" value={draft.securityMode} onChange={(e) => set({ securityMode: e.target.value as WirelessVAP['securityMode'] })}>
              {SECURITY_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FieldRow>
          {isPersonal && (
            <FieldRow label="Pre-shared key" help={encPass ? 'Stored encrypted (ENC) — preserved verbatim from the imported config.' : undefined}>
              <input className="forti-input max-w-[420px]" value={draft.passphrase} onChange={(e) => set({ passphrase: e.target.value })}
                placeholder="passphrase" />
            </FieldRow>
          )}
          {isEnterprise && (
            <FieldRow label="RADIUS / auth server">
              <input className="forti-input max-w-[260px]" value={draft.authServer} onChange={(e) => set({ authServer: e.target.value })} />
            </FieldRow>
          )}
        </FormSection>

        <FormSection title="Network">
          <FieldRow label="Traffic mode">
            <Segmented value={draft.localBridging ? 'bridge' : 'tunnel'} onChange={(v) => set({ localBridging: v === 'bridge' })}
              options={[{ value: 'tunnel', label: 'Tunnel' }, { value: 'bridge', label: 'Bridge (local)' }]} />
          </FieldRow>
          <FieldRow label="VLAN ID">
            <input type="number" className="forti-input max-w-[120px]" value={draft.vlanid || ''} onChange={(e) => set({ vlanid: parseInt(e.target.value) || 0 })} />
          </FieldRow>
          <FieldRow label="Broadcast SSID">
            <Toggle checked={draft.broadcast} onChange={(v) => set({ broadcast: v })} />
          </FieldRow>
          <FieldRow label="Max clients" help="0 = unlimited">
            <input type="number" className="forti-input max-w-[120px]" value={draft.maxClients || ''} onChange={(e) => set({ maxClients: parseInt(e.target.value) || 0 })} />
          </FieldRow>
          <FieldRow label="MAC filter">
            <Toggle checked={draft.macFilter} onChange={(v) => set({ macFilter: v })} />
          </FieldRow>
          <FieldRow label="Schedule">
            <input className="forti-input max-w-[200px]" value={draft.schedule} onChange={(e) => set({ schedule: e.target.value })} placeholder="always" />
          </FieldRow>
        </FormSection>

        <FormSection title="Roaming & Steering">
          <FieldRow label="802.11k (radio measurement)">
            <Toggle checked={draft.dot11k} onChange={(v) => set({ dot11k: v })} />
          </FieldRow>
          <FieldRow label="802.11v (BSS transition)">
            <Toggle checked={draft.dot11v} onChange={(v) => set({ dot11v: v })} />
          </FieldRow>
          <FieldRow label="Sticky client removal">
            <Toggle checked={draft.stickyClientRemove} onChange={(v) => set({ stickyClientRemove: v })} />
          </FieldRow>
          {draft.stickyClientRemove && (
            <FieldRow label="Sticky threshold (2.4G / 5G dBm)">
              <div className="flex items-center gap-2">
                <input className="forti-input max-w-[100px]" value={draft.stickyClient2g} onChange={(e) => set({ stickyClient2g: e.target.value })} placeholder="-72" />
                <span className="text-gray-400">/</span>
                <input className="forti-input max-w-[100px]" value={draft.stickyClient5g} onChange={(e) => set({ stickyClient5g: e.target.value })} placeholder="-72" />
              </div>
            </FieldRow>
          )}
          <FieldRow label="Beacon advertising" align="start">
            <CheckboxGrid columns={3} options={BEACON_OPTS} value={draft.beaconAdvertising} onChange={(beaconAdvertising) => set({ beaconAdvertising })} />
          </FieldRow>
        </FormSection>

        <FormSection title="Data Rates">
          <FieldRow label="Rates 802.11a" align="start" help="e.g. 12-basic, 18, 24-basic, 36, 48, 54">
            <StringChips value={draft.rates11a} onChange={(rates11a) => set({ rates11a })} placeholder="Add rate" />
          </FieldRow>
          <FieldRow label="Rates 802.11bg" align="start">
            <StringChips value={draft.rates11bg} onChange={(rates11bg) => set({ rates11bg })} placeholder="Add rate" />
          </FieldRow>
          <FieldRow label="802.11ac MCS map">
            <input className="forti-input max-w-[240px]" value={draft.rates11acMcsMap} onChange={(e) => set({ rates11acMcsMap: e.target.value })} placeholder="9,9,9,9,9,9,9,9" />
          </FieldRow>
          <FieldRow label="802.11ax MCS map">
            <input className="forti-input max-w-[240px]" value={draft.rates11axMcsMap} onChange={(e) => set({ rates11axMcsMap: e.target.value })} placeholder="9,9,9,9,9,9,9,9" />
          </FieldRow>
        </FormSection>
      </Card>
    </EditorPage>
  );
}
