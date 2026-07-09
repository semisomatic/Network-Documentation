import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import type {
  SystemGlobal, HAConfig, NTPConfig, SNMPConfig, SNMPCommunity,
  CentralManagementConfig, FortiAnalyzerConfig, SyslogConfig,
} from '../../types/fortigate';

// Collapsible section wrapper
function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="forti-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="forti-section-header w-full flex items-center justify-between cursor-pointer"
      >
        <h2 className="forti-section-title">{title}</h2>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
}

const Field = ({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={full ? 'col-span-2' : ''}>
    <label className="forti-label">{label}</label>
    {children}
  </div>
);

const toList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const fromList = (a: string[]) => a.join(', ');

export default function SystemSettings() {
  const config = useProjectStore((s) => s.project.config);
  const updateConfig = useProjectStore((s) => s.updateConfig);
  const setProjectMeta = useProjectStore((s) => s.setProjectMeta);

  const global = config.system.global;
  const ha = config.system.ha;
  const ntp = config.system.ntp;
  const snmp = config.system.snmp;
  const cm = config.system.centralManagement;
  const faz = config.logging.fortianalyzer;
  const syslog = config.logging.syslog;

  const interfaceNames = config.system.interfaces.map((i) => i.name);

  const updateGlobal = (key: keyof SystemGlobal, value: any) => {
    updateConfig((c) => ({ ...c, system: { ...c.system, global: { ...c.system.global, [key]: value } } }));
    if (key === 'hostname') setProjectMeta({ hostname: value });
  };
  const updateHA = (patch: Partial<HAConfig>) =>
    updateConfig((c) => ({ ...c, system: { ...c.system, ha: { ...c.system.ha, ...patch } } }));
  const updateNTP = (patch: Partial<NTPConfig>) =>
    updateConfig((c) => ({ ...c, system: { ...c.system, ntp: { ...c.system.ntp, ...patch } } }));
  const updateSNMP = (patch: Partial<SNMPConfig>) =>
    updateConfig((c) => ({ ...c, system: { ...c.system, snmp: { ...c.system.snmp, ...patch } } }));
  const updateCM = (patch: Partial<CentralManagementConfig>) =>
    updateConfig((c) => ({ ...c, system: { ...c.system, centralManagement: { ...c.system.centralManagement, ...patch } } }));
  const updateFAZ = (patch: Partial<FortiAnalyzerConfig>) =>
    updateConfig((c) => ({ ...c, logging: { ...c.logging, fortianalyzer: { ...c.logging.fortianalyzer, ...patch } } }));
  const updateSyslog = (patch: Partial<SyslogConfig>) =>
    updateConfig((c) => ({ ...c, logging: { ...c.logging, syslog: { ...c.logging.syslog, ...patch } } }));

  // SNMP community list ops
  const addCommunity = () => {
    const nextId = snmp.communities.length ? Math.max(...snmp.communities.map((c) => c.id)) + 1 : 1;
    const nc: SNMPCommunity = { id: nextId, name: 'public', status: 'enable', hosts: [], queryV1: false, queryV2c: true, trapV1: false, trapV2c: true };
    updateSNMP({ communities: [...snmp.communities, nc] });
  };
  const updateCommunity = (idx: number, patch: Partial<SNMPCommunity>) =>
    updateSNMP({ communities: snmp.communities.map((c, i) => (i === idx ? { ...c, ...patch } : c)) });
  const removeCommunity = (idx: number) =>
    updateSNMP({ communities: snmp.communities.filter((_, i) => i !== idx) });

  const intfSelect = (value: string, onChange: (v: string) => void) => (
    <select className="forti-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">-- None --</option>
      {interfaceNames.map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  );

  return (
    <div className="space-y-4">
      {/* ---------------- General ---------------- */}
      <Section title="General Settings" defaultOpen>
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          <Field label="Hostname">
            <input className="forti-input" value={global.hostname} onChange={(e) => updateGlobal('hostname', e.target.value)} />
          </Field>
          <Field label="Timezone">
            <input className="forti-input" value={global.timezone} onChange={(e) => updateGlobal('timezone', e.target.value)} />
          </Field>
          <Field label="Admin HTTPS Port">
            <input type="number" className="forti-input" value={global.adminSport} onChange={(e) => updateGlobal('adminSport', parseInt(e.target.value) || 443)} />
          </Field>
          <Field label="Admin SSH Port">
            <input type="number" className="forti-input" value={global.adminSSHPort} onChange={(e) => updateGlobal('adminSSHPort', parseInt(e.target.value) || 22)} />
          </Field>
          <Field label="Admin Server Certificate">
            <input className="forti-input" value={global.adminServerCert} onChange={(e) => updateGlobal('adminServerCert', e.target.value)} />
          </Field>
          <Field label="Admin Timeout (minutes)">
            <input type="number" className="forti-input" value={global.admintimeout} onChange={(e) => updateGlobal('admintimeout', parseInt(e.target.value) || 5)} />
          </Field>
          <Field label="Language">
            <select className="forti-select" value={global.language} onChange={(e) => updateGlobal('language', e.target.value)}>
              <option value="english">English</option>
              <option value="french">French</option>
              <option value="spanish">Spanish</option>
              <option value="portuguese">Portuguese</option>
              <option value="japanese">Japanese</option>
              <option value="chinese">Chinese</option>
              <option value="korean">Korean</option>
            </select>
          </Field>
          <Field label="SSL Minimum Protocol Version">
            <select className="forti-select" value={global.sslMinProtoVersion} onChange={(e) => updateGlobal('sslMinProtoVersion', e.target.value)}>
              <option value="TLSv1.0">TLS v1.0</option>
              <option value="TLSv1.1">TLS v1.1</option>
              <option value="TLSv1.2">TLS v1.2</option>
              <option value="TLSv1.3">TLS v1.3</option>
            </select>
          </Field>
          <div className="col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={global.strongCrypto} onChange={(e) => updateGlobal('strongCrypto', e.target.checked)} className="w-4 h-4 text-forti-accent border-gray-300 rounded" />
              <span className="text-sm text-forti-text-primary">Enable Strong Crypto</span>
            </label>
            <p className="text-xs text-gray-400 mt-1">Enforce strong encryption algorithms for HTTPS, SSH, etc.</p>
          </div>
        </div>
      </Section>

      {/* ---------------- High Availability ---------------- */}
      <Section title="High Availability (HA)">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          <Field label="HA Mode">
            <select className="forti-select" value={ha.mode} onChange={(e) => updateHA({ mode: e.target.value as HAConfig['mode'] })}>
              <option value="standalone">Standalone</option>
              <option value="a-p">Active-Passive</option>
              <option value="a-a">Active-Active</option>
            </select>
          </Field>
          {ha.mode !== 'standalone' && (
            <>
              <Field label="Group Name">
                <input className="forti-input" value={ha.groupName} onChange={(e) => updateHA({ groupName: e.target.value })} />
              </Field>
              <Field label="Group ID">
                <input type="number" className="forti-input" value={ha.groupId} onChange={(e) => updateHA({ groupId: parseInt(e.target.value) || 0 })} />
              </Field>
              <Field label="Device Priority">
                <input type="number" className="forti-input" value={ha.priority} onChange={(e) => updateHA({ priority: parseInt(e.target.value) || 128 })} />
              </Field>
              <Field label="Heartbeat Interfaces">
                <input className="forti-input" value={fromList(ha.hbdev)} onChange={(e) => updateHA({ hbdev: toList(e.target.value) })} placeholder="port9, port10" />
              </Field>
              <Field label="Monitored Interfaces">
                <input className="forti-input" value={fromList(ha.monitorInterfaces)} onChange={(e) => updateHA({ monitorInterfaces: toList(e.target.value) })} placeholder="wan1, wan2" />
              </Field>
              <Field label="Management Interface">
                {intfSelect(ha.managementInterface, (v) => updateHA({ managementInterface: v }))}
              </Field>
              <Field label="Management Gateway">
                <input className="forti-input" value={ha.managementGateway} onChange={(e) => updateHA({ managementGateway: e.target.value })} placeholder="192.168.1.254" />
              </Field>
              <div className="col-span-2 flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={ha.override} onChange={(e) => updateHA({ override: e.target.checked })} className="w-4 h-4 rounded" />
                  <span>Override</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={ha.sessionPickup} onChange={(e) => updateHA({ sessionPickup: e.target.checked })} className="w-4 h-4 rounded" />
                  <span>Session Pickup</span>
                </label>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ---------------- NTP ---------------- */}
      <Section title="NTP (Time Synchronization)">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          <div className="col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer text-sm">
              <input type="checkbox" checked={ntp.syncEnabled} onChange={(e) => updateNTP({ syncEnabled: e.target.checked })} className="w-4 h-4 rounded" />
              <span>Enable NTP synchronization</span>
            </label>
          </div>
          <Field label="NTP Source">
            <select className="forti-select" value={ntp.type} onChange={(e) => updateNTP({ type: e.target.value as NTPConfig['type'] })}>
              <option value="fortiguard">FortiGuard</option>
              <option value="custom">Custom Servers</option>
            </select>
          </Field>
          <Field label="Sync Interval (minutes)">
            <input type="number" className="forti-input" value={ntp.syncInterval} onChange={(e) => updateNTP({ syncInterval: parseInt(e.target.value) || 60 })} />
          </Field>
          {ntp.type === 'custom' && (
            <Field label="NTP Servers" full>
              <input className="forti-input" value={fromList(ntp.servers)} onChange={(e) => updateNTP({ servers: toList(e.target.value) })} placeholder="0.pool.ntp.org, 1.pool.ntp.org" />
            </Field>
          )}
          <Field label="Source Interface">
            {intfSelect(ntp.sourceInterface, (v) => updateNTP({ sourceInterface: v }))}
          </Field>
        </div>
      </Section>

      {/* ---------------- SNMP ---------------- */}
      <Section title="SNMP">
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="col-span-2">
              <label className="flex items-center space-x-2 cursor-pointer text-sm">
                <input type="checkbox" checked={snmp.status === 'enable'} onChange={(e) => updateSNMP({ status: e.target.checked ? 'enable' : 'disable' })} className="w-4 h-4 rounded" />
                <span>Enable SNMP agent</span>
              </label>
            </div>
            <Field label="Description">
              <input className="forti-input" value={snmp.description} onChange={(e) => updateSNMP({ description: e.target.value })} />
            </Field>
            <Field label="Contact">
              <input className="forti-input" value={snmp.contact} onChange={(e) => updateSNMP({ contact: e.target.value })} />
            </Field>
            <Field label="Location" full>
              <input className="forti-input" value={snmp.location} onChange={(e) => updateSNMP({ location: e.target.value })} />
            </Field>
          </div>

          {/* Communities */}
          <div className="border-t border-forti-table-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-forti-text-primary">Communities</h4>
              <button onClick={addCommunity} className="forti-btn-secondary flex items-center space-x-1 text-xs">
                <Plus size={14} /><span>Add Community</span>
              </button>
            </div>
            {snmp.communities.length === 0 && <p className="text-xs text-gray-400">No SNMP communities configured.</p>}
            <div className="space-y-2">
              {snmp.communities.map((c, i) => (
                <div key={c.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded p-2">
                  <input className="forti-input col-span-3" value={c.name} placeholder="Name" onChange={(e) => updateCommunity(i, { name: e.target.value })} />
                  <input className="forti-input col-span-5" value={fromList(c.hosts)} placeholder="Manager hosts (comma-separated)" onChange={(e) => updateCommunity(i, { hosts: toList(e.target.value) })} />
                  <label className="col-span-1 flex items-center space-x-1 text-xs">
                    <input type="checkbox" checked={c.queryV1} onChange={(e) => updateCommunity(i, { queryV1: e.target.checked })} /><span>v1</span>
                  </label>
                  <label className="col-span-2 flex items-center space-x-1 text-xs">
                    <input type="checkbox" checked={c.queryV2c} onChange={(e) => updateCommunity(i, { queryV2c: e.target.checked })} /><span>v2c</span>
                  </label>
                  <button onClick={() => removeCommunity(i)} className="col-span-1 text-red-500 hover:text-red-700 flex justify-center" title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------- FortiManager ---------------- */}
      <Section title="FortiManager (Central Management)">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          <div className="col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer text-sm">
              <input type="checkbox" checked={cm.status === 'enable'} onChange={(e) => updateCM({ status: e.target.checked ? 'enable' : 'disable' })} className="w-4 h-4 rounded" />
              <span>Managed by FortiManager</span>
            </label>
          </div>
          {cm.status === 'enable' && (
            <>
              <Field label="Mode">
                <select className="forti-select" value={cm.mode} onChange={(e) => updateCM({ mode: e.target.value as CentralManagementConfig['mode'] })}>
                  <option value="local">Local (on-prem FortiManager)</option>
                  <option value="cloud">Cloud (FortiManager Cloud)</option>
                </select>
              </Field>
              {cm.mode === 'local' && (
                <Field label="Server (IP / FQDN)">
                  <input className="forti-input" value={cm.server} onChange={(e) => updateCM({ server: e.target.value })} placeholder="10.0.0.10" />
                </Field>
              )}
              <Field label="Serial Number">
                <input className="forti-input" value={cm.serialNumber} onChange={(e) => updateCM({ serialNumber: e.target.value })} />
              </Field>
            </>
          )}
        </div>
      </Section>

      {/* ---------------- FortiAnalyzer ---------------- */}
      <Section title="FortiAnalyzer Logging">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          <div className="col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer text-sm">
              <input type="checkbox" checked={faz.status === 'enable'} onChange={(e) => updateFAZ({ status: e.target.checked ? 'enable' : 'disable' })} className="w-4 h-4 rounded" />
              <span>Send logs to FortiAnalyzer</span>
            </label>
          </div>
          {faz.status === 'enable' && (
            <>
              <Field label="Mode">
                <select className="forti-select" value={faz.mode} onChange={(e) => updateFAZ({ mode: e.target.value as FortiAnalyzerConfig['mode'] })}>
                  <option value="local">Local (on-prem FortiAnalyzer)</option>
                  <option value="cloud">Cloud (FortiAnalyzer Cloud)</option>
                </select>
              </Field>
              {faz.mode === 'local' && (
                <Field label="Server (IP / FQDN)">
                  <input className="forti-input" value={faz.server} onChange={(e) => updateFAZ({ server: e.target.value })} placeholder="10.0.0.20" />
                </Field>
              )}
              <Field label="Upload Option">
                <select className="forti-select" value={faz.uploadOption} onChange={(e) => updateFAZ({ uploadOption: e.target.value })}>
                  <option value="realtime">Real-time</option>
                  <option value="1-minute">Every 1 minute</option>
                  <option value="5-minute">Every 5 minutes</option>
                </select>
              </Field>
              <Field label="Source Interface">
                {intfSelect(faz.sourceInterface, (v) => updateFAZ({ sourceInterface: v }))}
              </Field>
            </>
          )}
        </div>
      </Section>

      {/* ---------------- Syslog ---------------- */}
      <Section title="Syslog">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          <div className="col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer text-sm">
              <input type="checkbox" checked={syslog.status === 'enable'} onChange={(e) => updateSyslog({ status: e.target.checked ? 'enable' : 'disable' })} className="w-4 h-4 rounded" />
              <span>Send logs to a syslog server</span>
            </label>
          </div>
          {syslog.status === 'enable' && (
            <>
              <Field label="Server (IP / FQDN)">
                <input className="forti-input" value={syslog.server} onChange={(e) => updateSyslog({ server: e.target.value })} placeholder="10.0.0.30" />
              </Field>
              <Field label="Port">
                <input type="number" className="forti-input" value={syslog.port} onChange={(e) => updateSyslog({ port: parseInt(e.target.value) || 514 })} />
              </Field>
              <Field label="Mode">
                <select className="forti-select" value={syslog.mode} onChange={(e) => updateSyslog({ mode: e.target.value as SyslogConfig['mode'] })}>
                  <option value="udp">UDP</option>
                  <option value="reliable">Reliable (TCP)</option>
                  <option value="legacy-reliable">Legacy Reliable</option>
                </select>
              </Field>
              <Field label="Facility">
                <input className="forti-input" value={syslog.facility} onChange={(e) => updateSyslog({ facility: e.target.value })} placeholder="local7" />
              </Field>
              <Field label="Format">
                <select className="forti-select" value={syslog.format} onChange={(e) => updateSyslog({ format: e.target.value as SyslogConfig['format'] })}>
                  <option value="default">Default</option>
                  <option value="csv">CSV</option>
                  <option value="cef">CEF</option>
                  <option value="rfc5424">RFC 5424</option>
                </select>
              </Field>
              <Field label="Source Interface">
                {intfSelect(syslog.sourceInterface, (v) => updateSyslog({ sourceInterface: v }))}
              </Field>
            </>
          )}
        </div>
      </Section>

      {/* ---------------- Project Information ---------------- */}
      <Section title="Project Information" defaultOpen>
        <div className="grid grid-cols-3 gap-4 max-w-4xl">
          <Field label="Device Model">
            <select
              className="forti-select"
              value={useProjectStore.getState().project.model}
              onChange={(e) => setProjectMeta({ model: e.target.value })}
            >
              <option value="FortiGate-40F">FortiGate-40F</option>
              <option value="FortiGate-60F">FortiGate-60F</option>
              <option value="FortiGate-70F">FortiGate-70F</option>
              <option value="FortiGate-80F">FortiGate-80F</option>
              <option value="FortiGate-100F">FortiGate-100F</option>
              <option value="FortiGate-200F">FortiGate-200F</option>
              <option value="FortiGate-400F">FortiGate-400F</option>
              <option value="FortiGate-600F">FortiGate-600F</option>
              <option value="FortiGate-1000F">FortiGate-1000F</option>
              <option value="FortiGate-1800F">FortiGate-1800F</option>
              <option value="FortiGate-2600F">FortiGate-2600F</option>
              <option value="FortiGate-3000F">FortiGate-3000F</option>
              <option value="FortiGate-VM">FortiGate-VM</option>
            </select>
          </Field>
          <Field label="FortiOS Version">
            <select
              className="forti-select"
              value={useProjectStore.getState().project.fortiosVersion}
              onChange={(e) => setProjectMeta({ fortiosVersion: e.target.value })}
            >
              <option value="7.4">7.4</option>
              <option value="7.6">7.6</option>
            </select>
          </Field>
        </div>
      </Section>
    </div>
  );
}
