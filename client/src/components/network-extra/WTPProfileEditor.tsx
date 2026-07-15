import React, { useState } from 'react';
import { EditorPage, Card, FormSection, FieldRow, Segmented, Toggle, CheckboxGrid, StringChips } from '../shared/forti';
import type { WirelessWTPProfile, WirelessRadio } from '../../types/fortigate';

interface Props {
  initial: WirelessWTPProfile;
  isNew: boolean;
  vapNames: string[];
  onSave: (item: WirelessWTPProfile) => void;
  onCancel: () => void;
}

const BAND_2G = [
  { value: '802.11b', label: '802.11b' },
  { value: '802.11g', label: '802.11g' },
  { value: '802.11n-2G', label: '802.11n (2.4G)' },
  { value: '802.11ax-2G', label: '802.11ax (2.4G)' },
];
const BAND_5G = [
  { value: '802.11a', label: '802.11a' },
  { value: '802.11n-5G', label: '802.11n (5G)' },
  { value: '802.11ac-5G', label: '802.11ac (5G)' },
  { value: '802.11ax-5G', label: '802.11ax (5G)' },
];
const MODE_OPTS = [
  { value: 'ap', label: 'Access Point' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'disabled', label: 'Disabled', danger: true },
];
const BONDING_OPTS = [
  { value: '', label: 'Auto' }, { value: '20MHz', label: '20 MHz' },
  { value: '40MHz', label: '40 MHz' }, { value: '80MHz', label: '80 MHz' }, { value: '160MHz', label: '160 MHz' },
];

// A radio is "2.4GHz-ish" if it uses only 2G bands; used to pick the band checklist.
function RadioSection({ label, radio, vapNames, onChange }: {
  label: string; radio: WirelessRadio; vapNames: string[]; onChange: (r: WirelessRadio) => void;
}) {
  const set = (patch: Partial<WirelessRadio>) => onChange({ ...radio, ...patch });
  const is2G = radio.band.some((b) => b.includes('2G') || b === '802.11b' || b === '802.11g');
  const bandOpts = is2G ? BAND_2G : BAND_5G;

  return (
    <FormSection title={label}>
      <FieldRow label="Mode">
        <Segmented value={radio.mode} onChange={(v) => set({ mode: v as WirelessRadio['mode'] })} options={MODE_OPTS} />
      </FieldRow>

      {radio.mode === 'monitor' && (
        <FieldRow label="WIDS profile">
          <input className="forti-input max-w-[240px]" value={radio.widsProfile} onChange={(e) => set({ widsProfile: e.target.value })} placeholder="default" />
        </FieldRow>
      )}

      {radio.mode === 'ap' && (
        <>
          <FieldRow label="Band(s)" align="start">
            <div>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => set({ band: radio.band.filter((b) => b.includes('2G') || b === '802.11b' || b === '802.11g') })}
                  className={`px-2 py-0.5 text-xs rounded border ${is2G ? 'border-forti-accent bg-forti-accent-soft' : 'border-gray-200'}`}>2.4 GHz</button>
                <button type="button" onClick={() => set({ band: radio.band.filter((b) => !(b.includes('2G') || b === '802.11b' || b === '802.11g')) })}
                  className={`px-2 py-0.5 text-xs rounded border ${!is2G ? 'border-forti-accent bg-forti-accent-soft' : 'border-gray-200'}`}>5 GHz</button>
              </div>
              <CheckboxGrid columns={2} options={bandOpts} value={radio.band} onChange={(band) => set({ band })} />
            </div>
          </FieldRow>

          <FieldRow label="Channel bonding">
            <Segmented value={radio.channelBonding} onChange={(v) => set({ channelBonding: v })} options={BONDING_OPTS} />
          </FieldRow>

          <FieldRow label="Short guard interval">
            <Toggle checked={radio.shortGuardInterval} onChange={(v) => set({ shortGuardInterval: v })} />
          </FieldRow>

          <FieldRow label="TX power">
            <Segmented value={radio.autoPowerLevel ? 'auto' : (radio.powerMode === 'dBm' ? 'dbm' : 'pct')}
              onChange={(v) => set({
                autoPowerLevel: v === 'auto',
                powerMode: v === 'dbm' ? 'dBm' : '',
              })}
              options={[{ value: 'auto', label: 'Auto' }, { value: 'pct', label: 'Percentage' }, { value: 'dbm', label: 'dBm' }]} />
          </FieldRow>
          {radio.autoPowerLevel ? (
            <FieldRow label="Auto power (low–high dBm)">
              <div className="flex items-center gap-2">
                <input type="number" className="forti-input max-w-[90px]" value={radio.autoPowerLow || ''} onChange={(e) => set({ autoPowerLow: parseInt(e.target.value) || 0 })} placeholder="low" />
                <span className="text-gray-400">–</span>
                <input type="number" className="forti-input max-w-[90px]" value={radio.autoPowerHigh || ''} onChange={(e) => set({ autoPowerHigh: parseInt(e.target.value) || 0 })} placeholder="high" />
              </div>
            </FieldRow>
          ) : radio.powerMode === 'dBm' ? (
            <FieldRow label="Power (dBm)">
              <input type="number" className="forti-input max-w-[120px]" value={radio.powerValue || ''} onChange={(e) => set({ powerValue: parseInt(e.target.value) || 0 })} />
            </FieldRow>
          ) : (
            <FieldRow label="Power level (%)">
              <input type="number" className="forti-input max-w-[120px]" value={radio.powerLevel} onChange={(e) => set({ powerLevel: parseInt(e.target.value) || 0 })} />
            </FieldRow>
          )}

          <FieldRow label="DARRP (auto channel)">
            <div className="flex items-center gap-3 flex-wrap">
              <Toggle checked={radio.darrp} onChange={(v) => set({ darrp: v })} />
              {radio.darrp && (
                <input className="forti-input max-w-[200px]" value={radio.arrpProfile} onChange={(e) => set({ arrpProfile: e.target.value })} placeholder="ARRP profile" />
              )}
            </div>
          </FieldRow>

          <FieldRow label="Channel utilization">
            <Toggle checked={radio.channelUtilization} onChange={(v) => set({ channelUtilization: v })} />
          </FieldRow>

          <FieldRow label="Channels" align="start" help="Allowed channel numbers (e.g. 36, 40, 44)">
            <StringChips value={radio.channels} onChange={(channels) => set({ channels })} placeholder="Add channel #" />
          </FieldRow>

          <FieldRow label="SSID assignment">
            <Segmented value={radio.vapAll || 'manual'} onChange={(v) => set({ vapAll: v })}
              options={[{ value: 'manual', label: 'Manual' }, { value: 'tunnel', label: 'All Tunnel' }, { value: 'bridge', label: 'All Bridge' }]} />
          </FieldRow>
          {(radio.vapAll === 'manual' || radio.vapAll === '') && (
            <FieldRow label="SSIDs" align="start" help="Broadcast in listed order. Pick from defined SSIDs or type a name.">
              <div>
                {vapNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {vapNames.map((n) => {
                      const on = radio.vaps.includes(n);
                      return (
                        <button key={n} type="button"
                          onClick={() => set(on
                            ? { vaps: radio.vaps.filter((x) => x !== n), vapSlots: radio.vapSlots.filter((x) => x !== n) }
                            : { vaps: [...radio.vaps, n], vapSlots: [...radio.vapSlots, n] })}
                          className={`px-2 py-0.5 text-xs rounded border ${on ? 'border-forti-accent bg-forti-accent-soft' : 'border-gray-200'}`}>{n}</button>
                      );
                    })}
                  </div>
                )}
                <StringChips value={radio.vaps} onChange={(vaps) => set({ vaps, vapSlots: vaps })} placeholder="Add SSID name" />
              </div>
            </FieldRow>
          )}
        </>
      )}
    </FormSection>
  );
}

export default function WTPProfileEditor({ initial, isNew, vapNames, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<WirelessWTPProfile>(initial);
  const set = (patch: Partial<WirelessWTPProfile>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <EditorPage title={isNew ? 'New AP Profile' : `Edit AP Profile — ${draft.name}`} onSave={() => onSave(draft)} onCancel={onCancel}>
      <Card>
        <FieldRow label="Name">
          <input className="forti-input max-w-[360px]" value={draft.name} onChange={(e) => set({ name: e.target.value })} disabled={!isNew} />
        </FieldRow>
        <FieldRow label="Platform / model">
          <input className="forti-input max-w-[200px]" value={draft.platform} onChange={(e) => set({ platform: e.target.value })} placeholder="431F" />
        </FieldRow>
        <FieldRow label="Comments" align="start">
          <textarea className="forti-input min-h-[52px] max-w-[360px]" rows={2} value={draft.comment} onChange={(e) => set({ comment: e.target.value })} />
        </FieldRow>

        <FormSection title="Platform Options">
          <FieldRow label="Dedicated scan / dual-5G (ddscan)">
            <Toggle checked={draft.ddscan} onChange={(v) => set({ ddscan: v })} />
          </FieldRow>
          <FieldRow label="Handoff STA threshold">
            <input type="number" className="forti-input max-w-[120px]" value={draft.handoffStaThresh || ''} onChange={(e) => set({ handoffStaThresh: parseInt(e.target.value) || 0 })} placeholder="55" />
          </FieldRow>
          <FieldRow label="Frequency handoff">
            <Toggle checked={draft.frequencyHandoff} onChange={(v) => set({ frequencyHandoff: v })} />
          </FieldRow>
          <FieldRow label="AP handoff">
            <Toggle checked={draft.apHandoff} onChange={(v) => set({ apHandoff: v })} />
          </FieldRow>
        </FormSection>

        <RadioSection label="Radio 1" radio={draft.radio1} vapNames={vapNames} onChange={(radio1) => set({ radio1 })} />
        <RadioSection label="Radio 2" radio={draft.radio2} vapNames={vapNames} onChange={(radio2) => set({ radio2 })} />
        <RadioSection label="Radio 3" radio={draft.radio3} vapNames={vapNames} onChange={(radio3) => set({ radio3 })} />
      </Card>
    </EditorPage>
  );
}
