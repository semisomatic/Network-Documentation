import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { SystemGlobal } from '../../types/fortigate';

export default function SystemSettings() {
  const config = useProjectStore((s) => s.project.config);
  const updateConfig = useProjectStore((s) => s.updateConfig);
  const setProjectMeta = useProjectStore((s) => s.setProjectMeta);
  const global = config.system.global;

  const update = (key: keyof SystemGlobal, value: any) => {
    updateConfig((c) => ({
      ...c,
      system: {
        ...c.system,
        global: { ...c.system.global, [key]: value },
      },
    }));
    if (key === 'hostname') setProjectMeta({ hostname: value });
  };

  return (
    <div className="forti-card">
      <div className="forti-section-header">
        <h2 className="forti-section-title">System Settings</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          {/* Hostname */}
          <div>
            <label className="forti-label">Hostname</label>
            <input className="forti-input" value={global.hostname} onChange={(e) => update('hostname', e.target.value)} />
          </div>

          {/* Timezone */}
          <div>
            <label className="forti-label">Timezone</label>
            <input className="forti-input" value={global.timezone} onChange={(e) => update('timezone', e.target.value)} />
          </div>

          {/* Admin HTTPS Port */}
          <div>
            <label className="forti-label">Admin HTTPS Port</label>
            <input type="number" className="forti-input" value={global.adminSport} onChange={(e) => update('adminSport', parseInt(e.target.value) || 443)} />
          </div>

          {/* Admin SSH Port */}
          <div>
            <label className="forti-label">Admin SSH Port</label>
            <input type="number" className="forti-input" value={global.adminSSHPort} onChange={(e) => update('adminSSHPort', parseInt(e.target.value) || 22)} />
          </div>

          {/* Admin Server Cert */}
          <div>
            <label className="forti-label">Admin Server Certificate</label>
            <input className="forti-input" value={global.adminServerCert} onChange={(e) => update('adminServerCert', e.target.value)} />
          </div>

          {/* Admin Timeout */}
          <div>
            <label className="forti-label">Admin Timeout (minutes)</label>
            <input type="number" className="forti-input" value={global.admintimeout} onChange={(e) => update('admintimeout', parseInt(e.target.value) || 5)} />
          </div>

          {/* Language */}
          <div>
            <label className="forti-label">Language</label>
            <select className="forti-select" value={global.language} onChange={(e) => update('language', e.target.value)}>
              <option value="english">English</option>
              <option value="french">French</option>
              <option value="spanish">Spanish</option>
              <option value="portuguese">Portuguese</option>
              <option value="japanese">Japanese</option>
              <option value="chinese">Chinese</option>
              <option value="korean">Korean</option>
            </select>
          </div>

          {/* SSL Min Protocol */}
          <div>
            <label className="forti-label">SSL Minimum Protocol Version</label>
            <select className="forti-select" value={global.sslMinProtoVersion} onChange={(e) => update('sslMinProtoVersion', e.target.value)}>
              <option value="TLSv1.0">TLS v1.0</option>
              <option value="TLSv1.1">TLS v1.1</option>
              <option value="TLSv1.2">TLS v1.2</option>
              <option value="TLSv1.3">TLS v1.3</option>
            </select>
          </div>

          {/* Strong Crypto */}
          <div className="col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={global.strongCrypto} onChange={(e) => update('strongCrypto', e.target.checked)} className="w-4 h-4 text-forti-accent border-gray-300 rounded" />
              <span className="text-sm text-forti-text-primary">Enable Strong Crypto</span>
            </label>
            <p className="text-xs text-gray-400 mt-1">Enforce strong encryption algorithms for HTTPS, SSH, etc.</p>
          </div>
        </div>

        {/* Device Info (read-only display) */}
        <div className="mt-8 pt-6 border-t border-forti-table-border">
          <h3 className="text-sm font-semibold text-forti-text-primary mb-4">Project Information</h3>
          <div className="grid grid-cols-3 gap-4 max-w-4xl">
            <div>
              <label className="forti-label">Device Model</label>
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
            </div>
            <div>
              <label className="forti-label">FortiOS Version</label>
              <select
                className="forti-select"
                value={useProjectStore.getState().project.fortiosVersion}
                onChange={(e) => setProjectMeta({ fortiosVersion: e.target.value })}
              >
                <option value="7.4">7.4</option>
                <option value="7.6">7.6</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
