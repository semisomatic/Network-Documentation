import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { DNSSettings } from '../../types/fortigate';

export default function DNS() {
  const config = useProjectStore((s) => s.project.config);
  const updateConfig = useProjectStore((s) => s.updateConfig);
  const dns = config.system.dns;

  const update = (key: keyof DNSSettings, value: any) => {
    updateConfig((c) => ({
      ...c,
      system: {
        ...c.system,
        dns: { ...c.system.dns, [key]: value },
      },
    }));
  };

  return (
    <div className="forti-card">
      <div className="forti-section-header">
        <h2 className="forti-section-title">DNS Settings</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          {/* Primary DNS */}
          <div>
            <label className="forti-label">Primary DNS Server</label>
            <input className="forti-input" value={dns.primary} onChange={(e) => update('primary', e.target.value)} placeholder="208.91.112.53" />
          </div>

          {/* Secondary DNS */}
          <div>
            <label className="forti-label">Secondary DNS Server</label>
            <input className="forti-input" value={dns.secondary} onChange={(e) => update('secondary', e.target.value)} placeholder="208.91.112.52" />
          </div>

          {/* Protocol */}
          <div>
            <label className="forti-label">DNS Protocol</label>
            <select className="forti-select" value={dns.protocol} onChange={(e) => update('protocol', e.target.value)}>
              <option value="cleartext">Cleartext</option>
              <option value="dot">DNS over TLS (DoT)</option>
              <option value="doh">DNS over HTTPS (DoH)</option>
            </select>
          </div>

          {/* DNS Over TLS */}
          <div>
            <label className="forti-label">DNS over TLS</label>
            <select className="forti-select" value={dns.dnsOverTls} onChange={(e) => update('dnsOverTls', e.target.value)}>
              <option value="disable">Disable</option>
              <option value="enable">Enable</option>
              <option value="enforce">Enforce</option>
            </select>
          </div>

          {/* Domain */}
          <div>
            <label className="forti-label">Local Domain</label>
            <input className="forti-input" value={dns.domain} onChange={(e) => update('domain', e.target.value)} placeholder="example.com" />
          </div>

          {/* SSL Certificate */}
          <div>
            <label className="forti-label">SSL Certificate</label>
            <input className="forti-input" value={dns.sslCertificate} onChange={(e) => update('sslCertificate', e.target.value)} />
          </div>

          {/* Cache TTL */}
          <div>
            <label className="forti-label">Cache TTL (seconds)</label>
            <input type="number" className="forti-input" value={dns.cacheTtl} onChange={(e) => update('cacheTtl', parseInt(e.target.value) || 1800)} />
          </div>

          {/* Cache Not Found */}
          <div className="col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={dns.cacheNotFoundResponses} onChange={(e) => update('cacheNotFoundResponses', e.target.checked)} className="w-4 h-4 text-forti-accent border-gray-300 rounded" />
              <span className="text-sm text-forti-text-primary">Cache Not-Found Responses</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
