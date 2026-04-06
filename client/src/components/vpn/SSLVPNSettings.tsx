import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { SSLVPNSettings as SSLVPNSettingsType } from '../../types/fortigate';

export default function SSLVPNSettings() {
  const config = useProjectStore((s) => s.project.config);
  const updateConfig = useProjectStore((s) => s.updateConfig);
  const ssl = config.vpnSsl;

  const update = (key: keyof SSLVPNSettingsType, value: any) => {
    updateConfig((c) => ({
      ...c,
      vpnSsl: { ...c.vpnSsl, [key]: value },
    }));
  };

  return (
    <div className="forti-card">
      <div className="forti-section-header">
        <h2 className="forti-section-title">SSL-VPN Settings</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          {/* Status */}
          <div>
            <label className="forti-label">Status</label>
            <select className="forti-select" value={ssl.status} onChange={(e) => update('status', e.target.value)}>
              <option value="enable">Enable</option>
              <option value="disable">Disable</option>
            </select>
          </div>

          {/* Port */}
          <div>
            <label className="forti-label">Listen on Port</label>
            <input type="number" className="forti-input" value={ssl.port} onChange={(e) => update('port', parseInt(e.target.value) || 443)} />
          </div>

          {/* Server Certificate */}
          <div>
            <label className="forti-label">Server Certificate</label>
            <input className="forti-input" value={ssl.servercert} onChange={(e) => update('servercert', e.target.value)} />
          </div>

          {/* Default Portal */}
          <div>
            <label className="forti-label">Default Portal</label>
            <input className="forti-input" value={ssl.default_portal} onChange={(e) => update('default_portal', e.target.value)} />
          </div>

          {/* Source Interface */}
          <div>
            <label className="forti-label">Source Interface (comma-separated)</label>
            <input className="forti-input" value={ssl.source_interface.join(', ')}
              onChange={(e) => update('source_interface', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
          </div>

          {/* Source Address */}
          <div>
            <label className="forti-label">Source Address (comma-separated)</label>
            <input className="forti-input" value={ssl.source_address.join(', ')}
              onChange={(e) => update('source_address', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
          </div>

          {/* Tunnel IP Pools */}
          <div>
            <label className="forti-label">Tunnel IP Pools (comma-separated)</label>
            <input className="forti-input" value={ssl.tunnel_ip_pools.join(', ')}
              onChange={(e) => update('tunnel_ip_pools', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
          </div>

          {/* DNS Server 1 */}
          <div>
            <label className="forti-label">DNS Server 1</label>
            <input className="forti-input" value={ssl.dns_server1} onChange={(e) => update('dns_server1', e.target.value)} />
          </div>

          {/* DNS Server 2 */}
          <div>
            <label className="forti-label">DNS Server 2</label>
            <input className="forti-input" value={ssl.dns_server2} onChange={(e) => update('dns_server2', e.target.value)} />
          </div>

          {/* DNS Suffix */}
          <div>
            <label className="forti-label">DNS Suffix</label>
            <input className="forti-input" value={ssl.dns_suffix} onChange={(e) => update('dns_suffix', e.target.value)} />
          </div>

          {/* WINS Server 1 */}
          <div>
            <label className="forti-label">WINS Server 1</label>
            <input className="forti-input" value={ssl.wins_server1} onChange={(e) => update('wins_server1', e.target.value)} />
          </div>

          {/* WINS Server 2 */}
          <div>
            <label className="forti-label">WINS Server 2</label>
            <input className="forti-input" value={ssl.wins_server2} onChange={(e) => update('wins_server2', e.target.value)} />
          </div>

          {/* Idle Timeout */}
          <div>
            <label className="forti-label">Idle Timeout (seconds)</label>
            <input type="number" className="forti-input" value={ssl.idle_timeout} onChange={(e) => update('idle_timeout', parseInt(e.target.value) || 300)} />
          </div>

          {/* Auth Timeout */}
          <div>
            <label className="forti-label">Auth Timeout (seconds)</label>
            <input type="number" className="forti-input" value={ssl.auth_timeout} onChange={(e) => update('auth_timeout', parseInt(e.target.value) || 28800)} />
          </div>

          {/* DTLS Tunnel */}
          <div className="col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={ssl.dtls_tunnel} onChange={(e) => update('dtls_tunnel', e.target.checked)} className="w-4 h-4 text-forti-accent border-gray-300 rounded" />
              <span className="text-sm text-forti-text-primary">Enable DTLS Tunnel</span>
            </label>
          </div>

          {/* Tunnel Connect Without Reauth */}
          <div className="col-span-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" checked={ssl.tunnel_connect_without_reauth} onChange={(e) => update('tunnel_connect_without_reauth', e.target.checked)} className="w-4 h-4 text-forti-accent border-gray-300 rounded" />
              <span className="text-sm text-forti-text-primary">Tunnel Connect Without Re-authentication</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
