import React, { useState } from 'react';
import { Wifi } from 'lucide-react';
import { EditorPage, Card, FormSection, FieldRow, Segmented, Toggle, CheckboxGrid, StringChips, InfoDot } from '../shared/forti';
import type { WirelessVAP } from '../../types/fortigate';

interface Props {
  initial: WirelessVAP;
  isNew: boolean;
  onSave: (item: WirelessVAP) => void;
  onCancel: () => void;
}

// Security mode: FortiOS `set security` value -> GUI label
const SECURITY_OPTS: { value: string; label: string }[] = [
  { value: 'wpa3-sae', label: 'WPA3 SAE' },
  { value: 'wpa3-sae-transition', label: 'WPA3 SAE Transition' },
  { value: 'wpa3-only-enterprise', label: 'WPA3 Enterprise Only' },
  { value: 'wpa3-enterprise', label: 'WPA3 Enterprise Transition' },
  { value: 'wpa2-only-personal', label: 'WPA2 Personal' },
  { value: 'wpa2-only-enterprise', label: 'WPA2 Enterprise' },
  { value: 'osen', label: 'OSEN' },
  { value: 'open', label: 'Open' },
];
const ADMIN_ACCESS = [
  { value: 'https', label: 'HTTPS' }, { value: 'http', label: 'HTTP' }, { value: 'ping', label: 'PING' },
  { value: 'fgfm', label: 'FMG-Access' }, { value: 'ssh', label: 'SSH' }, { value: 'snmp', label: 'SNMP' },
  { value: 'ftm', label: 'FTM' }, { value: 'radius-acct', label: 'RADIUS Accounting' }, { value: 'fabric', label: 'Security Fabric Connection' },
  { value: 'speed-test', label: 'Speed Test' }, { value: 'scim', label: 'SCIM' },
];
const BEACON_OPTS = [
  { value: 'name', label: 'Name' }, { value: 'model', label: 'Model' }, { value: 'serial-number', label: 'Serial number' },
];
const SUPPRESSION_OPTS = [
  { value: 'arp-known', label: 'ARPs for known clients' }, { value: 'arp-unknown', label: 'ARPs for unknown clients' },
  { value: 'arp-reply', label: 'ARP replies' }, { value: 'arp-poison', label: 'ARP poison' },
  { value: 'dhcp-ucast', label: 'DHCP unicast' }, { value: 'dhcp-up', label: 'DHCP uplink' }, { value: 'dhcp-down', label: 'DHCP downlink' },
  { value: 'netbios-ns', label: 'NetBIOS name service' }, { value: 'netbios-ds', label: 'NetBIOS datagram' },
  { value: 'ipv6', label: 'IPv6' }, { value: 'all-other-mc', label: 'All other multicast' }, { value: 'all-other-bc', label: 'All other broadcast' },
];

export default function VAPEditor({ initial, isNew, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<WirelessVAP>(initial);
  const set = (patch: Partial<WirelessVAP>) => setDraft((d) => ({ ...d, ...patch }));

  const isTunnel = draft.trafficMode === 'tunnel';
  const isBridge = draft.trafficMode === 'bridge';
  const captive = draft.securityMode === 'captive-portal';
  const isEnterprise = draft.securityMode.includes('enterprise');
  const isPersonal = draft.securityMode.includes('personal') || draft.securityMode.includes('sae');
  const encPass = /^ENC\s/.test(draft.passphrase);
  // Show the raw security value even if it isn't one of the known options.
  const secOpts = SECURITY_OPTS.some((o) => o.value === draft.securityMode) || captive
    ? SECURITY_OPTS : [...SECURITY_OPTS, { value: draft.securityMode, label: draft.securityMode }];

  return (
    <EditorPage title={isNew ? 'Create New SSID' : `Edit SSID — ${draft.name}`} onSave={() => onSave(draft)} onCancel={onCancel}>
      <Card>
        <FieldRow label="Name">
          <input className="forti-input max-w-[360px]" value={draft.name} onChange={(e) => set({ name: e.target.value })} disabled={!isNew} />
        </FieldRow>
        <FieldRow label="Alias">
          <input className="forti-input max-w-[360px]" value={draft.alias} onChange={(e) => set({ alias: e.target.value })} />
        </FieldRow>
        <FieldRow label="Type">
          <span className="inline-flex items-center gap-2 text-sm text-forti-text-primary"><Wifi size={15} className="text-forti-accent" /> WiFi SSID</span>
        </FieldRow>
        <FieldRow label="VRF ID">
          <input type="number" className="forti-input max-w-[120px]" value={draft.vrf || 0} onChange={(e) => set({ vrf: parseInt(e.target.value) || 0 })} />
        </FieldRow>
        <FieldRow label="Traffic mode">
          <Segmented value={draft.trafficMode} onChange={(v) => set({ trafficMode: v as WirelessVAP['trafficMode'] })}
            options={[{ value: 'tunnel', label: 'Tunnel' }, { value: 'bridge', label: 'Bridge' }, { value: 'mesh', label: 'Mesh' }]} />
        </FieldRow>

        {/* Address (tunnel mode) */}
        {isTunnel && (
          <FormSection title="Address">
            <FieldRow label="Addressing mode">
              <Segmented value={draft.addressingMode} onChange={(v) => set({ addressingMode: v as WirelessVAP['addressingMode'] })}
                options={[{ value: 'manual', label: 'Manual' }, { value: 'ipam', label: 'IPAM' }, { value: 'sniffer', label: 'One-Arm Sniffer' }]} />
            </FieldRow>
            {draft.addressingMode === 'manual' && (
              <FieldRow label="IP/Netmask">
                <input className="forti-input max-w-[300px]" value={draft.ip} onChange={(e) => set({ ip: e.target.value })} placeholder="0.0.0.0 0.0.0.0" />
              </FieldRow>
            )}
          </FormSection>
        )}

        {/* Administrative Access */}
        <FormSection title="Administrative Access">
          <FieldRow label="IPv4" align="start">
            <CheckboxGrid columns={3} options={ADMIN_ACCESS} value={draft.allowaccess} onChange={(allowaccess) => set({ allowaccess })} />
          </FieldRow>
        </FormSection>

        {/* Network */}
        <FormSection title="Network">
          <FieldRow label={<span>Device detection <InfoDot tip="Identify device types of clients on this SSID" /></span>}>
            <Toggle checked={draft.deviceDetection} onChange={(v) => set({ deviceDetection: v })} />
          </FieldRow>
          <FieldRow label="Explicit web proxy">
            <Toggle checked={draft.explicitWebProxy} onChange={(v) => set({ explicitWebProxy: v })} />
          </FieldRow>
        </FormSection>

        {/* WiFi Settings */}
        <FormSection title="WiFi Settings">
          <FieldRow label="SSID">
            <input className="forti-input max-w-[360px]" value={draft.ssid} onChange={(e) => set({ ssid: e.target.value })} />
          </FieldRow>
          <FieldRow label={<span>Client limit <InfoDot tip="Maximum concurrent clients (0 = unlimited)" /></span>}>
            <div className="flex items-center gap-3">
              <Toggle checked={draft.maxClients > 0} onChange={(on) => set({ maxClients: on ? (draft.maxClients || 1) : 0 })} />
              {draft.maxClients > 0 && (
                <input type="number" className="forti-input max-w-[120px]" value={draft.maxClients} onChange={(e) => set({ maxClients: parseInt(e.target.value) || 0 })} />
              )}
            </div>
          </FieldRow>
          <FieldRow label="Broadcast SSID">
            <Toggle checked={draft.broadcast} onChange={(v) => set({ broadcast: v })} />
          </FieldRow>
          <FieldRow label="Beacon advertising" align="start">
            <CheckboxGrid columns={3} options={BEACON_OPTS} value={draft.beaconAdvertising} onChange={(beaconAdvertising) => set({ beaconAdvertising })} />
          </FieldRow>

          {/* Security Mode Settings */}
          <div className="pt-2 mb-1 text-sm font-semibold text-forti-text-primary">Security Mode Settings</div>
          <FieldRow label="Security mode">
            <select className="forti-select max-w-[300px]" value={captive ? 'captive-portal' : draft.securityMode}
              onChange={(e) => set({ securityMode: e.target.value })}>
              {secOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Captive Portal">
            <Toggle checked={captive} onChange={(on) => set({ securityMode: on ? 'captive-portal' : 'wpa2-only-personal' })} />
          </FieldRow>

          {/* Pre-shared Key (personal / SAE) */}
          {isPersonal && !captive && (
            <>
              <div className="pt-2 mb-1 text-sm font-semibold text-forti-text-primary">Pre-shared Key</div>
              <FieldRow label={<span>Mode <InfoDot tip="Single or multiple pre-shared keys" /></span>}>
                <Segmented value={draft.pskMode} onChange={(v) => set({ pskMode: v as WirelessVAP['pskMode'] })}
                  options={[{ value: 'single', label: 'Single' }, { value: 'multiple', label: 'Multiple' }]} />
              </FieldRow>
              <FieldRow label="Passphrase" help={encPass ? 'Stored encrypted (ENC) — preserved verbatim from the imported config.' : undefined}>
                <input className="forti-input max-w-[420px]" value={draft.passphrase} onChange={(e) => set({ passphrase: e.target.value })} placeholder="passphrase" />
              </FieldRow>
            </>
          )}
          {isEnterprise && !captive && (
            <FieldRow label="RADIUS / auth server">
              <input className="forti-input max-w-[260px]" value={draft.authServer} onChange={(e) => set({ authServer: e.target.value })} />
            </FieldRow>
          )}
        </FormSection>

        {/* Client MAC Address Filtering */}
        <FormSection title="Client MAC Address Filtering">
          <FieldRow label="RADIUS server">
            <Toggle checked={draft.radiusMacAuth} onChange={(v) => set({ radiusMacAuth: v })} />
          </FieldRow>
          <FieldRow label="Address group policy">
            <Segmented value={draft.macFilter ? draft.macFilterPolicy : 'disable'}
              onChange={(v) => set(v === 'disable' ? { macFilter: false, macFilterPolicy: 'disable' } : { macFilter: true, macFilterPolicy: v as WirelessVAP['macFilterPolicy'] })}
              options={[{ value: 'disable', label: 'Disable' }, { value: 'allow', label: 'Allow' }, { value: 'deny', label: 'Deny', danger: true }]} />
          </FieldRow>
        </FormSection>

        {/* Security Profiles */}
        <FormSection title="Security Profiles">
          <FieldRow label="Enable UTM">
            <Toggle checked={draft.utmStatus} onChange={(v) => set({ utmStatus: v })} />
          </FieldRow>
          {draft.utmStatus && (
            <>
              <FieldRow label="AntiVirus">
                <input className="forti-input max-w-[240px]" value={draft.avProfile} onChange={(e) => set({ avProfile: e.target.value })} placeholder="profile name" />
              </FieldRow>
              <FieldRow label="Web filter">
                <input className="forti-input max-w-[240px]" value={draft.webfilterProfile} onChange={(e) => set({ webfilterProfile: e.target.value })} placeholder="profile name" />
              </FieldRow>
              <FieldRow label="Application control">
                <input className="forti-input max-w-[240px]" value={draft.applicationList} onChange={(e) => set({ applicationList: e.target.value })} placeholder="list name" />
              </FieldRow>
              <FieldRow label="Intrusion Prevention">
                <input className="forti-input max-w-[240px]" value={draft.ipsSensor} onChange={(e) => set({ ipsSensor: e.target.value })} placeholder="sensor name" />
              </FieldRow>
              <FieldRow label="Scan botnets">
                <Segmented value={draft.scanBotnet} onChange={(v) => set({ scanBotnet: v as WirelessVAP['scanBotnet'] })}
                  options={[{ value: 'disable', label: 'Disable' }, { value: 'block', label: 'Block', danger: true }, { value: 'monitor', label: 'Monitor' }]} />
              </FieldRow>
              <FieldRow label="Logging">
                <Segmented value={draft.utmLog ? 'enable' : 'disable'} onChange={(v) => set({ utmLog: v === 'enable' })}
                  options={[{ value: 'enable', label: 'Enabled' }, { value: 'disable', label: 'Disabled', danger: true }]} />
              </FieldRow>
            </>
          )}
        </FormSection>

        {/* Additional Settings */}
        <FormSection title="Additional Settings">
          {isBridge && (
            <>
              <FieldRow label={<span>Local standalone <InfoDot tip="Continue to pass traffic if the controller is unreachable" /></span>}>
                <Toggle checked={draft.localStandalone} onChange={(v) => set({ localStandalone: v })} />
              </FieldRow>
              <FieldRow label={<span>Local authentication <InfoDot tip="Authenticate clients locally on the AP" /></span>}>
                <Toggle checked={draft.localAuthentication} onChange={(v) => set({ localAuthentication: v })} />
              </FieldRow>
            </>
          )}
          <FieldRow label="Schedule">
            <input className="forti-input max-w-[240px]" value={draft.schedule} onChange={(e) => set({ schedule: e.target.value })} placeholder="always" />
          </FieldRow>
          {isTunnel && (
            <FieldRow label="Block intra-SSID traffic">
              <Toggle checked={draft.blockIntraVap} onChange={(v) => set({ blockIntraVap: v })} />
            </FieldRow>
          )}
          <FieldRow label="Optional VLAN ID">
            <input type="number" className="forti-input max-w-[120px]" value={draft.vlanid || 0} onChange={(e) => set({ vlanid: parseInt(e.target.value) || 0 })} />
          </FieldRow>
          <FieldRow label="Broadcast suppression" align="start">
            <div>
              <Toggle checked={draft.broadcastSuppression.length > 0} onChange={(on) => set({ broadcastSuppression: on ? ['arp-known', 'dhcp-ucast', 'dhcp-up'] : [] })} />
              {draft.broadcastSuppression.length > 0 && (
                <div className="mt-2"><CheckboxGrid columns={2} options={SUPPRESSION_OPTS} value={draft.broadcastSuppression} onChange={(broadcastSuppression) => set({ broadcastSuppression })} /></div>
              )}
            </div>
          </FieldRow>
          {isTunnel && (
            <FieldRow label="Quarantine host">
              <Toggle checked={draft.quarantine} onChange={(v) => set({ quarantine: v })} />
            </FieldRow>
          )}
          <FieldRow label="VLAN pooling">
            <div className="flex items-center gap-3">
              <Toggle checked={!!draft.vlanPooling} onChange={(on) => set({ vlanPooling: on ? 'wtp-group' : '' })} />
              {!!draft.vlanPooling && (
                <Segmented value={draft.vlanPooling} onChange={(v) => set({ vlanPooling: v })}
                  options={[{ value: 'wtp-group', label: 'WTP Group' }, { value: 'round-robin', label: 'Round Robin' }, { value: 'hash', label: 'Hash' }]} />
              )}
            </div>
          </FieldRow>
          <FieldRow label="NAC profile">
            <div className="flex items-center gap-3">
              <Toggle checked={draft.nac} onChange={(v) => set({ nac: v })} />
              {draft.nac && <input className="forti-input max-w-[220px]" value={draft.nacProfile} onChange={(e) => set({ nacProfile: e.target.value })} placeholder="NAC profile" />}
            </div>
          </FieldRow>
        </FormSection>

        {/* Data Rates */}
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

        {/* Miscellaneous */}
        <FormSection title="Miscellaneous">
          <FieldRow label="Comments" align="start">
            <div className="max-w-[360px]">
              <textarea className="forti-input min-h-[52px]" rows={2} maxLength={255} value={draft.comment} onChange={(e) => set({ comment: e.target.value })} />
              <div className="text-[11px] text-gray-400 text-right">{draft.comment.length}/255</div>
            </div>
          </FieldRow>
          <FieldRow label="Status">
            <Segmented value={draft.status} onChange={(v) => set({ status: v as WirelessVAP['status'] })}
              options={[{ value: 'enable', label: 'Enabled' }, { value: 'disable', label: 'Disabled', danger: true }]} />
          </FieldRow>
        </FormSection>
      </Card>
    </EditorPage>
  );
}
