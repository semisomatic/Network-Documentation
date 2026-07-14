// ============================================================================
// FortiOS 7.4 Configuration Exporter
// Generates valid FortiOS config text from the typed FortigateConfig
// ============================================================================

import { FortigateConfig } from '../types/fortigate';

const INDENT = '    ';

function q(val: string): string {
  // Quote a value if it contains spaces or is empty
  if (val === '' || val.includes(' ') || val.includes('"')) {
    return `"${val.replace(/"/g, '\\"')}"`;
  }
  return val;
}

function line(depth: number, text: string): string {
  return INDENT.repeat(depth) + text + '\n';
}

function setVal(depth: number, key: string, val: string | number | boolean | undefined, skipEmpty = true): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'boolean') {
    return line(depth, `set ${key} ${val ? 'enable' : 'disable'}`);
  }
  const s = String(val);
  if (skipEmpty && s === '') return '';
  if (skipEmpty && s === '0' && key !== 'vlanid') return '';
  return line(depth, `set ${key} ${q(s)}`);
}

function setArr(depth: number, key: string, arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return '';
  return line(depth, `set ${key} ${arr.map(q).join(' ')}`);
}

function setEnDis(depth: number, key: string, val: 'enable' | 'disable' | undefined, defaultVal?: string): string {
  if (!val) return '';
  if (val === defaultVal) return '';
  return line(depth, `set ${key} ${val}`);
}

export function exportFortiConfig(config: FortigateConfig): string {
  let out = '';

  // --- System Global ---
  const g = config.system.global;
  out += 'config system global\n';
  out += setVal(1, 'hostname', g.hostname);
  out += setVal(1, 'timezone', g.timezone);
  out += setVal(1, 'admin-sport', g.adminSport);
  out += setVal(1, 'admin-ssh-port', g.adminSSHPort);
  out += setVal(1, 'admin-server-cert', g.adminServerCert);
  out += setVal(1, 'admintimeout', g.admintimeout);
  out += setVal(1, 'language', g.language);
  out += setVal(1, 'strong-crypto', g.strongCrypto);
  out += setVal(1, 'ssl-min-proto-version', g.sslMinProtoVersion);
  out += 'end\n\n';

  // --- System DNS ---
  const d = config.system.dns;
  out += 'config system dns\n';
  out += setVal(1, 'primary', d.primary);
  out += setVal(1, 'secondary', d.secondary);
  if (d.protocol !== 'cleartext') out += setVal(1, 'protocol', d.protocol);
  if (d.domain) out += setVal(1, 'domain', d.domain);
  if (d.dnsOverTls !== 'disable') out += setVal(1, 'dns-over-tls', d.dnsOverTls);
  out += 'end\n\n';

  // --- High Availability ---
  const ha = config.system.ha;
  if (ha.mode !== 'standalone') {
    out += 'config system ha\n';
    out += setVal(1, 'mode', ha.mode);
    out += setVal(1, 'group-name', ha.groupName);
    out += setVal(1, 'group-id', ha.groupId);
    if (ha.priority !== 128) out += setVal(1, 'priority', ha.priority);
    if (ha.override) out += setVal(1, 'override', true);
    if (ha.hbdev.length > 0) out += line(1, `set hbdev ${ha.hbdev.map((h) => `${q(h)} 50`).join(' ')}`);
    if (ha.sessionPickup) out += setVal(1, 'session-pickup', true);
    if (ha.monitorInterfaces.length > 0) out += setArr(1, 'monitor', ha.monitorInterfaces);
    if (ha.managementInterface) {
      out += setVal(1, 'ha-mgmt-status', 'enable');
      out += setVal(1, 'ha-mgmt-interface', ha.managementInterface);
      out += setVal(1, 'ha-mgmt-interface-gateway', ha.managementGateway);
    }
    out += 'end\n\n';
  }

  // --- NTP ---
  const ntp = config.system.ntp;
  if (ntp.type === 'custom' || ntp.servers.length > 0 || !ntp.syncEnabled) {
    out += 'config system ntp\n';
    out += setVal(1, 'ntpsync', ntp.syncEnabled ? 'enable' : 'disable');
    out += setVal(1, 'type', ntp.type);
    if (ntp.syncInterval !== 60) out += setVal(1, 'syncinterval', ntp.syncInterval);
    if (ntp.type === 'custom' && ntp.servers.length > 0) {
      out += line(1, 'config ntpserver');
      ntp.servers.forEach((s, i) => {
        out += line(2, `edit ${i + 1}`);
        out += setVal(3, 'server', s);
        out += line(2, 'next');
      });
      out += line(1, 'end');
    }
    if (ntp.sourceInterface) out += setVal(1, 'interface', ntp.sourceInterface);
    out += 'end\n\n';
  }

  // --- SNMP ---
  const snmp = config.system.snmp;
  if (snmp.status === 'enable' || snmp.communities.length > 0) {
    out += 'config system snmp sysinfo\n';
    out += setVal(1, 'status', snmp.status);
    out += setVal(1, 'description', snmp.description);
    out += setVal(1, 'contact-info', snmp.contact);
    out += setVal(1, 'location', snmp.location);
    out += 'end\n\n';
    if (snmp.communities.length > 0) {
      out += 'config system snmp community\n';
      snmp.communities.forEach((c, i) => {
        out += line(1, `edit ${c.id || i + 1}`);
        out += setVal(2, 'name', c.name);
        if (c.status === 'disable') out += setVal(2, 'status', 'disable');
        if (c.hosts.length > 0) {
          out += line(2, 'config hosts');
          c.hosts.forEach((h, hi) => {
            out += line(3, `edit ${hi + 1}`);
            out += setVal(4, 'ip', h);
            out += line(3, 'next');
          });
          out += line(2, 'end');
        }
        if (!c.queryV1) out += setVal(2, 'query-v1-status', 'disable');
        if (!c.queryV2c) out += setVal(2, 'query-v2c-status', 'disable');
        if (!c.trapV1) out += setVal(2, 'trap-v1-status', 'disable');
        if (!c.trapV2c) out += setVal(2, 'trap-v2c-status', 'disable');
        out += line(1, 'next');
      });
      out += 'end\n\n';
    }
  }

  // --- Central Management (FortiManager) ---
  const cm = config.system.centralManagement;
  if (cm.status === 'enable') {
    out += 'config system central-management\n';
    out += setVal(1, 'type', cm.type || (cm.mode === 'cloud' ? 'fortiguard' : 'fortimanager'));
    if (cm.mode === 'local' && cm.server) out += setVal(1, 'fmg', cm.server);
    if (cm.serialNumber) out += setVal(1, 'serial-number', cm.serialNumber);
    out += 'end\n\n';
  }

  // --- Logging: FortiAnalyzer ---
  const faz = config.logging.fortianalyzer;
  if (faz.status === 'enable') {
    out += `config log ${faz.mode === 'cloud' ? 'fortianalyzer-cloud' : 'fortianalyzer'} setting\n`;
    out += setVal(1, 'status', 'enable');
    if (faz.mode === 'local' && faz.server) out += setVal(1, 'server', faz.server);
    out += setVal(1, 'upload-option', faz.uploadOption);
    if (faz.sourceInterface) out += setVal(1, 'interface', faz.sourceInterface);
    out += 'end\n\n';
  }

  // --- Logging: Syslog ---
  const syslog = config.logging.syslog;
  if (syslog.status === 'enable') {
    out += 'config log syslogd setting\n';
    out += setVal(1, 'status', 'enable');
    out += setVal(1, 'server', syslog.server);
    if (syslog.port !== 514) out += setVal(1, 'port', syslog.port);
    if (syslog.mode !== 'udp') out += setVal(1, 'mode', syslog.mode);
    out += setVal(1, 'facility', syslog.facility);
    if (syslog.format !== 'default') out += setVal(1, 'format', syslog.format);
    if (syslog.sourceInterface) out += setVal(1, 'interface', syslog.sourceInterface);
    out += 'end\n\n';
  }

  // --- System Interfaces ---
  if (config.system.interfaces.length > 0) {
    out += 'config system interface\n';
    for (const iface of config.system.interfaces) {
      out += line(1, `edit ${q(iface.name)}`);
      if (iface.ip && iface.netmask) out += line(2, `set ip ${iface.ip} ${iface.netmask}`);
      if (iface.allowaccess.length > 0) out += setArr(2, 'allowaccess', iface.allowaccess);
      out += setVal(2, 'type', iface.type);
      if (iface.vlanid) out += setVal(2, 'vlanid', iface.vlanid);
      if (iface.interface) out += setVal(2, 'interface', iface.interface);
      out += setVal(2, 'alias', iface.alias);
      if (iface.status === 'down') out += setVal(2, 'status', 'down');
      if (iface.speed && iface.speed !== 'auto') out += setVal(2, 'speed', iface.speed);
      if (iface.mtuOverride) {
        out += setVal(2, 'mtu-override', true);
        out += setVal(2, 'mtu', iface.mtu);
      }
      if (iface.role !== 'undefined') out += setVal(2, 'role', iface.role);
      if (iface.deviceIdentification) out += setVal(2, 'device-identification', 'enable');
      out += setVal(2, 'description', iface.description);
      if (iface.mode !== 'static') out += setVal(2, 'mode', iface.mode);
      if (iface.dhcpRelayService) {
        out += setVal(2, 'dhcp-relay-service', 'enable');
        if (iface.dhcpRelayIp.length > 0) out += line(2, `set dhcp-relay-ip ${iface.dhcpRelayIp.map(q).join(' ')}`);
      }
      if (iface.estimatedUpstreamBandwidth) out += setVal(2, 'estimated-upstream-bandwidth', iface.estimatedUpstreamBandwidth);
      if (iface.estimatedDownstreamBandwidth) out += setVal(2, 'estimated-downstream-bandwidth', iface.estimatedDownstreamBandwidth);
      if (iface.secondaryIP && iface.secondaryIPs.length > 0) {
        out += setVal(2, 'secondary-IP', 'enable');
        out += line(2, 'config secondaryip');
        iface.secondaryIPs.forEach((sip, i) => {
          out += line(3, `edit ${i + 1}`);
          if (sip.ip && sip.netmask) out += line(4, `set ip ${sip.ip} ${sip.netmask}`);
          if (sip.allowaccess.length > 0) out += setArr(4, 'allowaccess', sip.allowaccess);
          out += line(3, 'next');
        });
        out += line(2, 'end');
      }
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- DHCP Servers ---
  if (config.system.dhcpServers.length > 0) {
    out += 'config system dhcp server\n';
    for (const srv of config.system.dhcpServers) {
      out += line(1, `edit ${srv.id}`);
      out += setVal(2, 'interface', srv.interface);
      out += setEnDis(2, 'status', srv.status);
      out += setVal(2, 'default-gateway', srv.defaultGateway);
      out += setVal(2, 'netmask', srv.netmask);
      out += setVal(2, 'lease-time', srv.leaseTime);
      out += setVal(2, 'dns-server1', srv.dnsServer1);
      out += setVal(2, 'dns-server2', srv.dnsServer2);
      out += setVal(2, 'dns-server3', srv.dnsServer3);
      out += setVal(2, 'domain', srv.domain);
      out += setVal(2, 'description', srv.comments);
      if (srv.ipRanges.length > 0) {
        out += line(2, 'config ip-range');
        for (const r of srv.ipRanges) {
          out += line(3, `edit ${r.id}`);
          out += setVal(4, 'start-ip', r.startIp);
          out += setVal(4, 'end-ip', r.endIp);
          out += line(3, 'next');
        }
        out += line(2, 'end');
      }
      if (srv.reservedAddresses.length > 0) {
        out += line(2, 'config reserved-address');
        srv.reservedAddresses.forEach((res, i) => {
          out += line(3, `edit ${res.id || i + 1}`);
          if (res.action && res.action !== 'assign') out += setVal(4, 'action', res.action);
          out += setVal(4, 'ip', res.ip);
          out += setVal(4, 'mac', res.mac);
          out += setVal(4, 'description', res.description);
          out += line(3, 'next');
        });
        out += line(2, 'end');
      }
      if (srv.options.length > 0) {
        out += line(2, 'config options');
        srv.options.forEach((opt, i) => {
          out += line(3, `edit ${opt.id || i + 1}`);
          out += setVal(4, 'code', opt.code);
          out += setVal(4, 'type', opt.type);
          out += setVal(4, 'value', opt.value);
          out += line(3, 'next');
        });
        out += line(2, 'end');
      }
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- System Zones ---
  if (config.system.zones && config.system.zones.length > 0) {
    out += 'config system zone\n';
    for (const z of config.system.zones) {
      out += line(1, `edit ${q(z.name)}`);
      out += setArr(2, 'interface', z.interface);
      if (z.intrazone && z.intrazone !== 'deny') out += line(2, `set intrazone ${z.intrazone}`);
      out += setVal(2, 'description', z.description);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Static Routes ---
  if (config.router.static.length > 0) {
    out += 'config router static\n';
    for (const r of config.router.static) {
      out += line(1, `edit ${r.seqNum}`);
      if (r.dstaddr) {
        out += setVal(2, 'dstaddr', r.dstaddr);
      } else {
        out += setVal(2, 'dst', r.dst);
      }
      out += setVal(2, 'gateway', r.gateway);
      if (r.sdwan) out += setVal(2, 'sdwan', 'enable');
      if (r.sdwanZone) out += setVal(2, 'sdwan-zone', r.sdwanZone);
      else out += setVal(2, 'device', r.device);
      if (r.distance !== 10) out += setVal(2, 'distance', r.distance);
      if (r.priority !== 1) out += setVal(2, 'priority', r.priority);
      out += setVal(2, 'comment', r.comment);
      if (r.status === 'disable') out += setVal(2, 'status', 'disable');
      if (r.blackhole) out += setVal(2, 'blackhole', true);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Policy Routes ---
  if (config.router.policy.length > 0) {
    out += 'config router policy\n';
    for (const r of config.router.policy) {
      out += line(1, `edit ${r.seqNum}`);
      out += setArr(2, 'input-device', r.inputDevice);
      out += setVal(2, 'src', r.src);
      out += setVal(2, 'dst', r.dst);
      if (r.protocol) out += setVal(2, 'protocol', r.protocol);
      if (r.startPort) out += setVal(2, 'start-port', r.startPort);
      if (r.endPort) out += setVal(2, 'end-port', r.endPort);
      out += setVal(2, 'gateway', r.gateway);
      out += setVal(2, 'output-device', r.outputDevice);
      out += setVal(2, 'comments', r.comments);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- BGP ---
  if (config.router.bgp.as) {
    const bgp = config.router.bgp;
    out += 'config router bgp\n';
    out += setVal(1, 'as', bgp.as);
    out += setVal(1, 'router-id', bgp.routerId);
    if (bgp.ebgpMultipath) out += setVal(1, 'ebgp-multipath', true);
    if (bgp.ibgpMultipath) out += setVal(1, 'ibgp-multipath', true);
    if (bgp.gracefulRestart) out += setVal(1, 'graceful-restart', true);
    if (!bgp.logNeighborChanges) out += setVal(1, 'log-neighbour-changes', false);
    if (bgp.neighbors.length > 0) {
      out += line(1, 'config neighbor');
      for (const n of bgp.neighbors) {
        out += line(2, `edit ${q(n.ip)}`);
        out += setVal(3, 'remote-as', n.remoteAs);
        out += setVal(3, 'description', n.description);
        if (n.weight) out += setVal(3, 'weight', n.weight);
        if (n.ebgpMultihop) out += setVal(3, 'ebgp-multihop', n.ebgpMultihop);
        if (n.nextHopSelf) out += setVal(3, 'next-hop-self', true);
        if (n.softReconfiguration) out += setVal(3, 'soft-reconfiguration', true);
        out += setVal(3, 'route-map-in', n.routeMapIn);
        out += setVal(3, 'route-map-out', n.routeMapOut);
        out += setVal(3, 'update-source', n.updateSource);
        if (n.bfd) out += setVal(3, 'bfd', true);
        out += line(2, 'next');
      }
      out += line(1, 'end');
    }
    if (bgp.networks.length > 0) {
      out += line(1, 'config network');
      for (const n of bgp.networks) {
        out += line(2, `edit ${n.id}`);
        out += setVal(3, 'prefix', n.prefix);
        out += setVal(3, 'route-map', n.routeMap);
        out += line(2, 'next');
      }
      out += line(1, 'end');
    }
    if (bgp.redistribute.connected) {
      out += line(1, 'config redistribute connected');
      out += setVal(2, 'status', 'enable');
      out += setVal(2, 'route-map', bgp.redistribute.connectedRouteMap);
      out += line(1, 'end');
    }
    if (bgp.redistribute.static) {
      out += line(1, 'config redistribute static');
      out += setVal(2, 'status', 'enable');
      out += setVal(2, 'route-map', bgp.redistribute.staticRouteMap);
      out += line(1, 'end');
    }
    if (bgp.redistribute.ospf) {
      out += line(1, 'config redistribute ospf');
      out += setVal(2, 'status', 'enable');
      out += setVal(2, 'route-map', bgp.redistribute.ospfRouteMap);
      out += line(1, 'end');
    }
    out += 'end\n\n';
  }

  // --- OSPF ---
  if (config.router.ospf.routerId || config.router.ospf.networks.length > 0) {
    const ospf = config.router.ospf;
    out += 'config router ospf\n';
    out += setVal(1, 'router-id', ospf.routerId);
    if (ospf.defaultInformationOriginate) out += setVal(1, 'default-information-originate', true);
    if (ospf.defaultInformationOriginateAlways) out += setVal(1, 'default-information-originate-always', true);
    if (ospf.defaultMetric !== 10) out += setVal(1, 'default-metric', ospf.defaultMetric);
    if (ospf.passiveInterfaces.length > 0) out += setArr(1, 'passive-interface', ospf.passiveInterfaces);
    if (ospf.areas.length > 0) {
      out += line(1, 'config area');
      for (const a of ospf.areas) {
        out += line(2, `edit ${q(a.id)}`);
        if (a.type !== 'regular') out += setVal(3, 'type', a.type);
        if (a.type === 'stub' || a.type === 'nssa') out += setVal(3, 'stub-type', a.stubType);
        if (a.authentication !== 'none') out += setVal(3, 'authentication', a.authentication);
        out += setVal(3, 'comments', a.comment);
        out += line(2, 'next');
      }
      out += line(1, 'end');
    }
    if (ospf.networks.length > 0) {
      out += line(1, 'config network');
      for (const n of ospf.networks) {
        out += line(2, `edit ${n.id}`);
        out += setVal(3, 'prefix', n.prefix);
        out += setVal(3, 'area', n.area);
        out += line(2, 'next');
      }
      out += line(1, 'end');
    }
    if (ospf.ospfInterfaces.length > 0) {
      out += line(1, 'config ospf-interface');
      for (const oi of ospf.ospfInterfaces) {
        out += line(2, `edit ${q(oi.name)}`);
        if (oi.cost) out += setVal(3, 'cost', oi.cost);
        if (oi.priority !== 1) out += setVal(3, 'priority', oi.priority);
        if (oi.helloInterval !== 10) out += setVal(3, 'hello-interval', oi.helloInterval);
        if (oi.deadInterval !== 40) out += setVal(3, 'dead-interval', oi.deadInterval);
        if (oi.networkType !== 'broadcast') out += setVal(3, 'network-type', oi.networkType);
        if (oi.authentication !== 'none') out += setVal(3, 'authentication', oi.authentication);
        out += line(2, 'next');
      }
      out += line(1, 'end');
    }
    if (ospf.redistribute.connected) {
      out += line(1, 'config redistribute connected');
      out += setVal(2, 'status', 'enable');
      out += setVal(2, 'route-map', ospf.redistribute.connectedRouteMap);
      out += line(1, 'end');
    }
    if (ospf.redistribute.static) {
      out += line(1, 'config redistribute static');
      out += setVal(2, 'status', 'enable');
      out += setVal(2, 'route-map', ospf.redistribute.staticRouteMap);
      out += line(1, 'end');
    }
    if (ospf.redistribute.bgp) {
      out += line(1, 'config redistribute bgp');
      out += setVal(2, 'status', 'enable');
      out += setVal(2, 'route-map', ospf.redistribute.bgpRouteMap);
      out += line(1, 'end');
    }
    out += 'end\n\n';
  }

  // --- SD-WAN ---
  const sd = config.sdwan;
  if (sd.status === 'enable' || sd.members.length > 0) {
    out += 'config system sdwan\n';
    out += setVal(1, 'status', sd.status);
    out += setVal(1, 'load-balance-mode', sd.loadBalanceMode);

    if (sd.zones.length > 0) {
      out += line(1, 'config zone');
      for (const z of sd.zones) {
        out += line(2, `edit ${q(z.name)}`);
        out += line(2, 'next');
      }
      out += line(1, 'end');
    }

    if (sd.members.length > 0) {
      out += line(1, 'config members');
      for (const m of sd.members) {
        out += line(2, `edit ${m.seqNum}`);
        out += setVal(3, 'interface', m.interface);
        out += setVal(3, 'zone', m.zone);
        if (m.gateway) out += setVal(3, 'gateway', m.gateway);
        if (m.source) out += setVal(3, 'source', m.source);
        if (m.cost) out += setVal(3, 'cost', m.cost);
        if (m.priority !== 1) out += setVal(3, 'priority', m.priority);
        if (m.weight !== 1) out += setVal(3, 'weight', m.weight);
        if (m.status === 'disable') out += setVal(3, 'status', 'disable');
        out += setVal(3, 'comment', m.comment);
        out += line(2, 'next');
      }
      out += line(1, 'end');
    }

    if (sd.healthChecks.length > 0) {
      out += line(1, 'config health-check');
      for (const h of sd.healthChecks) {
        out += line(2, `edit ${q(h.name)}`);
        if (h.systemDns) out += setVal(3, 'system-dns', 'enable');
        else if (h.server.length > 0) out += line(3, `set server ${h.server.map(q).join(' ')}`);
        if (h.protocol !== 'ping') out += setVal(3, 'protocol', h.protocol);
        if (h.probeMode !== 'active') out += setVal(3, 'probe-mode', h.probeMode);
        if (h.port) out += setVal(3, 'port', h.port);
        out += setVal(3, 'interval', h.interval);
        if (h.probeTimeout) out += setVal(3, 'probe-timeout', h.probeTimeout);
        if (h.failtime !== 5) out += setVal(3, 'failtime', h.failtime);
        if (h.recovertime !== 5) out += setVal(3, 'recoverytime', h.recovertime);
        if (!h.updateStaticRoute) out += setVal(3, 'update-static-route', 'disable');
        if (h.members.length > 0) out += line(3, `set members ${h.members.join(' ')}`);
        if (h.slaTargets.length > 0) {
          out += line(3, 'config sla');
          for (const t of h.slaTargets) {
            out += line(4, `edit ${t.id}`);
            if (t.latencyThreshold) out += setVal(5, 'latency-threshold', t.latencyThreshold);
            if (t.jitterThreshold) out += setVal(5, 'jitter-threshold', t.jitterThreshold);
            if (t.packetlossThreshold) out += setVal(5, 'packetloss-threshold', t.packetlossThreshold);
            out += line(4, 'next');
          }
          out += line(3, 'end');
        }
        out += line(2, 'next');
      }
      out += line(1, 'end');
    }

    if (sd.rules.length > 0) {
      out += line(1, 'config service');
      for (const r of sd.rules) {
        out += line(2, `edit ${r.id}`);
        out += setVal(3, 'name', r.name);
        out += setVal(3, 'comments', r.comment);
        if (r.mode !== 'sla') out += setVal(3, 'mode', r.mode);
        if (r.srcAddr.length > 0) out += setArr(3, 'src', r.srcAddr);
        if (r.dstAddr.length > 0) out += setArr(3, 'dst', r.dstAddr);
        if (r.internetServiceName.length > 0) {
          out += setVal(3, 'internet-service', 'enable');
          out += setArr(3, 'internet-service-name', r.internetServiceName);
        }
        if (r.protocol) out += setVal(3, 'protocol', r.protocol);
        if (r.startPort) out += setVal(3, 'start-port', r.startPort);
        if (r.endPort) out += setVal(3, 'end-port', r.endPort);
        if (r.healthCheck) {
          out += line(3, 'config sla');
          out += line(4, `edit ${q(r.healthCheck)}`);
          if (r.slaId) out += setVal(5, 'id', r.slaId);
          out += line(4, 'next');
          out += line(3, 'end');
        }
        if (r.priorityZone) out += setVal(3, 'priority-zone', r.priorityZone);
        else if (r.members.length > 0) out += line(3, `set priority-members ${r.members.join(' ')}`);
        out += line(2, 'next');
      }
      out += line(1, 'end');
    }
    out += 'end\n\n';
  }

  // --- Firewall Addresses ---
  if (config.firewallAddress.length > 0) {
    out += 'config firewall address\n';
    for (const a of config.firewallAddress) {
      out += line(1, `edit ${q(a.name)}`);
      if (a.type !== 'ipmask') out += setVal(2, 'type', a.type);
      if (a.type === 'ipmask' && a.subnet) out += setVal(2, 'subnet', a.subnet);
      if (a.type === 'interface-subnet') {
        if (a.subnet) out += setVal(2, 'subnet', a.subnet);
        if (a.interface) out += setVal(2, 'interface', a.interface);
      }
      if (a.type === 'mac' && a.macaddr.length) out += line(2, `set macaddr ${a.macaddr.map(q).join(' ')}`);
      if (a.type === 'fqdn' && a.fqdn) out += setVal(2, 'fqdn', a.fqdn);
      if (a.type === 'iprange') {
        out += setVal(2, 'start-ip', a.startIp);
        out += setVal(2, 'end-ip', a.endIp);
      }
      if (a.type === 'geography' && a.country) out += setVal(2, 'country', a.country);
      if (a.type === 'wildcard' && a.wildcardFqdn) out += setVal(2, 'wildcard-fqdn', a.wildcardFqdn);
      out += setVal(2, 'associated-interface', a.associatedInterface);
      out += setVal(2, 'comment', a.comment);
      if (a.color) out += setVal(2, 'color', a.color);
      if (a.allowRouting) out += setVal(2, 'allow-routing', true);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Firewall Address Groups ---
  if (config.firewallAddrgrp.length > 0) {
    out += 'config firewall addrgrp\n';
    for (const g of config.firewallAddrgrp) {
      out += line(1, `edit ${q(g.name)}`);
      out += setArr(2, 'member', g.member);
      out += setVal(2, 'comment', g.comment);
      if (g.color) out += setVal(2, 'color', g.color);
      if (g.exclude) {
        out += setVal(2, 'exclude', true);
        out += setArr(2, 'exclude-member', g.excludeMember);
      }
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Firewall Services ---
  if (config.firewallService.length > 0) {
    out += 'config firewall service custom\n';
    for (const s of config.firewallService) {
      out += line(1, `edit ${q(s.name)}`);
      out += setVal(2, 'category', s.category);
      if (s.protocol !== 'TCP/UDP/SCTP') out += setVal(2, 'protocol', s.protocol);
      // Direct lines so a literal "0" portrange isn't dropped by setVal's zero-skip
      if (s.tcpPortrange) out += line(2, `set tcp-portrange ${s.tcpPortrange}`);
      if (s.udpPortrange) out += line(2, `set udp-portrange ${s.udpPortrange}`);
      if (s.sctpPortrange) out += setVal(2, 'sctp-portrange', s.sctpPortrange);
      if (s.protocol === 'IP') out += setVal(2, 'protocol-number', s.protocolNumber);
      if (s.protocol === 'ICMP' || s.protocol === 'ICMP6') {
        if (s.icmptype) out += setVal(2, 'icmptype', s.icmptype);
        if (s.icmpcode) out += setVal(2, 'icmpcode', s.icmpcode);
      }
      if (s.proxy) out += setVal(2, 'proxy', 'enable');
      out += setVal(2, 'comment', s.comment);
      if (s.color) out += setVal(2, 'color', s.color);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Firewall Service Groups ---
  if (config.firewallServiceGroup.length > 0) {
    out += 'config firewall service group\n';
    for (const g of config.firewallServiceGroup) {
      out += line(1, `edit ${q(g.name)}`);
      out += setArr(2, 'member', g.member);
      out += setVal(2, 'comment', g.comment);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Firewall Schedules ---
  if (config.firewallSchedule.length > 0) {
    // "always" (built-in) and recurring schedules both live in the recurring section
    const recurring = config.firewallSchedule.filter(s => s.type === 'recurring' || s.type === 'always');
    const onetime = config.firewallSchedule.filter(s => s.type === 'onetime');

    if (recurring.length > 0) {
      out += 'config firewall schedule recurring\n';
      for (const s of recurring) {
        out += line(1, `edit ${q(s.name)}`);
        if (s.day.length > 0) out += setArr(2, 'day', s.day);
        out += setVal(2, 'start', s.start);
        out += setVal(2, 'end', s.end);
        if (s.color) out += setVal(2, 'color', s.color);
        out += line(1, 'next');
      }
      out += 'end\n\n';
    }

    if (onetime.length > 0) {
      out += 'config firewall schedule onetime\n';
      for (const s of onetime) {
        out += line(1, `edit ${q(s.name)}`);
        out += setVal(2, 'start', s.start);
        out += setVal(2, 'end', s.end);
        if (s.color) out += setVal(2, 'color', s.color);
        out += line(1, 'next');
      }
      out += 'end\n\n';
    }
  }

  // --- Firewall VIPs ---
  if (config.firewallVip.length > 0) {
    out += 'config firewall vip\n';
    for (const v of config.firewallVip) {
      out += line(1, `edit ${q(v.name)}`);
      out += setVal(2, 'extip', v.extip);
      out += setArr(2, 'mappedip', v.mappedip);
      if (v.extintf !== 'any') out += setVal(2, 'extintf', v.extintf);
      if (v.portforward) {
        out += setVal(2, 'portforward', true);
        out += setVal(2, 'protocol', v.protocol);
        out += setVal(2, 'extport', v.extport);
        out += setVal(2, 'mappedport', v.mappedport);
      }
      out += setVal(2, 'comment', v.comment);
      if (v.type !== 'static-nat') out += setVal(2, 'type', v.type);
      if (v.color) out += setVal(2, 'color', v.color);
      if (v.srcFilter.length > 0) out += setArr(2, 'src-filter', v.srcFilter);
      if (v.srcintfFilter.length > 0) out += setArr(2, 'srcintf-filter', v.srcintfFilter);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Firewall IP Pools ---
  if (config.firewallIppool.length > 0) {
    out += 'config firewall ippool\n';
    for (const p of config.firewallIppool) {
      out += line(1, `edit ${q(p.name)}`);
      if (p.type !== 'overload') out += setVal(2, 'type', p.type);
      out += setVal(2, 'startip', p.startip);
      out += setVal(2, 'endip', p.endip);
      if (p.sourceStartip) out += setVal(2, 'source-startip', p.sourceStartip);
      if (p.sourceEndip) out += setVal(2, 'source-endip', p.sourceEndip);
      out += setVal(2, 'arp-intf', p.arpIntf);
      if (!p.arpReply) out += setVal(2, 'arp-reply', 'disable');
      out += setVal(2, 'comments', p.comments);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- VPN Phase 1 ---
  if (config.vpnIpsec.phase1.length > 0) {
    out += 'config vpn ipsec phase1-interface\n';
    for (const p1 of config.vpnIpsec.phase1) {
      out += line(1, `edit ${q(p1.name)}`);
      out += setVal(2, 'type', p1.type);
      out += setVal(2, 'interface', p1.interface);
      out += setVal(2, 'ike-version', p1.ikeVersion);
      out += setVal(2, 'remote-gw', p1.remoteGw);
      if (p1.localGw && p1.localGw !== '0.0.0.0') out += setVal(2, 'local-gw', p1.localGw);
      out += setVal(2, 'psksecret', p1.psksecret);
      out += setArr(2, 'proposal', p1.proposal);
      out += setArr(2, 'dhgrp', p1.dhgrp);
      if (p1.natTraversal !== 'enable') out += setVal(2, 'nattraversal', p1.natTraversal);
      out += setVal(2, 'dpd', p1.dpd);
      out += setVal(2, 'dpd-retrycount', p1.dpdRetrycount);
      out += setVal(2, 'dpd-retryinterval', p1.dpdRetryinterval);
      out += setVal(2, 'keylife', p1.keylife);
      out += setVal(2, 'comments', p1.comments);
      if (p1.localid) out += setVal(2, 'localid', p1.localid);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- VPN Phase 2 ---
  if (config.vpnIpsec.phase2.length > 0) {
    out += 'config vpn ipsec phase2-interface\n';
    for (const p2 of config.vpnIpsec.phase2) {
      out += line(1, `edit ${q(p2.name)}`);
      out += setVal(2, 'phase1name', p2.phase1name);
      out += setArr(2, 'proposal', p2.proposal);
      out += setEnDis(2, 'pfs', p2.pfs, 'enable');
      out += setArr(2, 'dhgrp', p2.dhgrp);
      out += setEnDis(2, 'auto-negotiate', p2.autoNegotiate, 'enable');
      out += setVal(2, 'keylifeseconds', p2.keylifeseconds);
      if (p2.keylifekbs) out += setVal(2, 'keylifekbs', p2.keylifekbs);
      if (p2.srcAddrType && p2.srcAddrType !== 'subnet') out += setVal(2, 'src-addr-type', p2.srcAddrType);
      if (p2.dstAddrType && p2.dstAddrType !== 'subnet') out += setVal(2, 'dst-addr-type', p2.dstAddrType);
      if (p2.srcSubnet) out += setVal(2, 'src-subnet', p2.srcSubnet);
      if (p2.dstSubnet) out += setVal(2, 'dst-subnet', p2.dstSubnet);
      if (p2.srcName) out += setVal(2, 'src-name', p2.srcName);
      if (p2.dstName) out += setVal(2, 'dst-name', p2.dstName);
      out += setVal(2, 'comments', p2.comments);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Traffic Shapers ---
  if (config.trafficShaping.shapers.length > 0) {
    out += 'config firewall shaper traffic-shaper\n';
    for (const s of config.trafficShaping.shapers) {
      out += line(1, `edit ${q(s.name)}`);
      out += setVal(2, 'guaranteed-bandwidth', s.guaranteedBandwidth);
      out += setVal(2, 'maximum-bandwidth', s.maximumBandwidth);
      out += setVal(2, 'bandwidth-unit', s.bandwidthUnit);
      out += setVal(2, 'priority', s.priority);
      if (s.perPolicy) out += setVal(2, 'per-policy', 'enable');
      if (s.diffserv) { out += setVal(2, 'diffserv', 'enable'); out += setVal(2, 'diffservcode', s.diffservcode); }
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Firewall Policies (always last before user sections) ---
  if (config.firewallPolicy.length > 0) {
    out += 'config firewall policy\n';
    for (const pol of config.firewallPolicy) {
      out += line(1, `edit ${pol.policyid}`);
      out += setVal(2, 'name', pol.name);
      out += setArr(2, 'srcintf', pol.srcintf);
      out += setArr(2, 'dstintf', pol.dstintf);
      out += setArr(2, 'srcaddr', pol.srcaddr);
      out += setArr(2, 'dstaddr', pol.dstaddr);
      out += setVal(2, 'action', pol.action);
      out += setArr(2, 'service', pol.service);
      out += setVal(2, 'schedule', pol.schedule);
      if (pol.nat) out += setVal(2, 'nat', true);
      if (pol.ippool) {
        out += setVal(2, 'ippool', true);
        out += setArr(2, 'poolname', pol.poolname);
      }
      if (pol.fixedport) out += setVal(2, 'fixedport', true);
      if (pol.status === 'disable') out += setVal(2, 'status', 'disable');
      out += setVal(2, 'logtraffic', pol.logtraffic);
      if (pol.logtrafficStart) out += setVal(2, 'logtraffic-start', true);
      out += setVal(2, 'comments', pol.comments);
      if (pol.utmStatus) {
        out += setVal(2, 'utm-status', true);
        out += setVal(2, 'av-profile', pol.avProfile);
        out += setVal(2, 'webfilter-profile', pol.webfilterProfile);
        out += setVal(2, 'dnsfilter-profile', pol.dnsfilterProfile);
        out += setVal(2, 'ips-sensor', pol.ipsSensor);
        out += setVal(2, 'application-list', pol.applicationList);
      }
      // ssl-ssh-profile applies independently of utm-status
      out += setVal(2, 'ssl-ssh-profile', pol.sslSshProfile);
      out += setArr(2, 'groups', pol.groups);
      out += setArr(2, 'users', pol.users);
      if (pol.inspectionMode !== 'flow') out += setVal(2, 'inspection-mode', pol.inspectionMode);
      if (pol.tcpMssSender) out += setVal(2, 'tcp-mss-sender', pol.tcpMssSender);
      if (pol.tcpMssReceiver) out += setVal(2, 'tcp-mss-receiver', pol.tcpMssReceiver);
      if (pol.trafficShaper) out += setVal(2, 'traffic-shaper', pol.trafficShaper);
      if (pol.trafficShaperReverse) out += setVal(2, 'traffic-shaper-reverse', pol.trafficShaperReverse);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- User LDAP ---
  if (config.user.ldap.length > 0) {
    out += 'config user ldap\n';
    for (const l of config.user.ldap) {
      out += line(1, `edit ${q(l.name)}`);
      out += setVal(2, 'server', l.server);
      if (l.secondaryServer) out += setVal(2, 'secondary-server', l.secondaryServer);
      out += setVal(2, 'port', l.port);
      out += setVal(2, 'cnid', l.cnid);
      out += setVal(2, 'dn', l.dn);
      out += setVal(2, 'type', l.type);
      out += setVal(2, 'username', l.username);
      if (l.password) out += setVal(2, 'password', l.password);
      if (l.secure !== 'disable') out += setVal(2, 'secure', l.secure);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- User RADIUS ---
  if (config.user.radius.length > 0) {
    out += 'config user radius\n';
    for (const r of config.user.radius) {
      out += line(1, `edit ${q(r.name)}`);
      out += setVal(2, 'server', r.server);
      if (r.secondaryServer) out += setVal(2, 'secondary-server', r.secondaryServer);
      out += setVal(2, 'secret', r.secret);
      if (r.port !== 1812) out += setVal(2, 'auth-port', r.port);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- User Local ---
  if (config.user.local.length > 0) {
    out += 'config user local\n';
    for (const u of config.user.local) {
      out += line(1, `edit ${q(u.name)}`);
      out += setEnDis(2, 'status', u.status, 'enable');
      out += setVal(2, 'type', u.type);
      if (u.passwd) out += setVal(2, 'passwd', u.passwd);
      if (u.ldapServer) out += setVal(2, 'ldap-server', u.ldapServer);
      if (u.radiusServer) out += setVal(2, 'radius-server', u.radiusServer);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- User FSSO ---
  if (config.user.fsso.length > 0) {
    out += 'config user fsso\n';
    for (const f of config.user.fsso) {
      out += line(1, `edit ${q(f.name)}`);
      if (f.type && f.type !== 'default') out += setVal(2, 'type', f.type);
      out += setVal(2, 'server', f.server);
      if (f.server2) out += setVal(2, 'server2', f.server2);
      if (f.server3) out += setVal(2, 'server3', f.server3);
      if (f.port !== 8000) out += setVal(2, 'port', f.port);
      if (f.password) out += setVal(2, 'password', f.password);
      if (f.ldapServer) out += setVal(2, 'ldap-server', f.ldapServer);
      if (f.groupPollInterval) out += setVal(2, 'group-poll-interval', f.groupPollInterval);
      if (f.sourceIp) out += setVal(2, 'source-ip', f.sourceIp);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- User Groups ---
  if (config.user.group.length > 0) {
    out += 'config user group\n';
    for (const g of config.user.group) {
      out += line(1, `edit ${q(g.name)}`);
      if (g.groupType !== 'firewall') out += setVal(2, 'group-type', g.groupType);
      out += setArr(2, 'member', g.member);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Application Control ---
  if (config.securityProfiles.applicationControl.length > 0) {
    out += 'config application list\n';
    for (const a of config.securityProfiles.applicationControl) {
      out += line(1, `edit ${q(a.name)}`);
      out += setVal(2, 'comment', a.comment);
      if (!a.deepAppInspection) out += setVal(2, 'deep-app-inspection', 'disable');
      if (a.options.length > 0) out += setArr(2, 'options', a.options);
      let eid = 1;
      out += line(2, 'config entries');
      // categories grouped by action
      const groups = new Map<string, number[]>();
      for (const c of a.categories) {
        if (!groups.has(c.action)) groups.set(c.action, []);
        groups.get(c.action)!.push(c.id);
      }
      for (const [act, ids] of groups) {
        out += line(3, `edit ${eid++}`);
        out += line(4, `set category ${ids.join(' ')}`);
        if (act === 'block') out += setVal(4, 'action', 'block');
        else { out += setVal(4, 'action', 'pass'); if (act === 'allow') out += setVal(4, 'log', 'disable'); }
        out += line(3, 'next');
      }
      // overrides
      for (const ov of a.overrides) {
        out += line(3, `edit ${eid++}`);
        if (ov.type === 'application') {
          if (ov.applications.trim()) out += line(4, `set application ${ov.applications.trim().split(/[\s,]+/).join(' ')}`);
        } else {
          if (ov.filterCategories.length) out += line(4, `set category ${ov.filterCategories.join(' ')}`);
          if (ov.risk.length) out += setArr(4, 'risk', ov.risk);
          if (ov.popularity.length) out += setArr(4, 'popularity', ov.popularity);
          if (ov.behavior.length) out += setArr(4, 'behavior', ov.behavior);
        }
        if (ov.action !== 'block') out += setVal(4, 'action', ov.action);
        if (!ov.log) out += setVal(4, 'log', 'disable');
        out += line(3, 'next');
      }
      out += line(2, 'end');
      if (a.networkProtocolEnforcement && a.networkServices.length > 0) {
        out += line(2, 'config default-network-services');
        for (const ns of a.networkServices) {
          out += line(3, `edit ${ns.id}`);
          out += setVal(4, 'port', ns.port);
          if (ns.protocols.length) out += setArr(4, 'services', ns.protocols);
          if (ns.violationAction !== 'block') out += setVal(4, 'violation-action', ns.violationAction);
          out += line(3, 'next');
        }
        out += line(2, 'end');
      }
      const actField = (v: string) => (v === 'block' ? 'block' : 'pass');
      out += setVal(2, 'other-application-action', actField(a.otherApplicationAction));
      if (a.otherApplicationAction === 'monitor') out += setVal(2, 'other-application-log', 'enable');
      out += setVal(2, 'unknown-application-action', actField(a.unknownApplicationAction));
      if (a.unknownApplicationAction === 'monitor') out += setVal(2, 'unknown-application-log', 'enable');
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- SSL/SSH Inspection Profiles ---
  if (config.securityProfiles.sslInspection.length > 0) {
    out += 'config firewall ssl-ssh-profile\n';
    for (const s of config.securityProfiles.sslInspection) {
      out += line(1, `edit ${q(s.name)}`);
      out += setVal(2, 'comment', s.comment);
      if (s.caCert) out += setVal(2, 'caname', s.caCert);
      if (s.serverCertMode) out += setVal(2, 'server-cert-mode', s.serverCertMode);
      const emitBlock = (name: string, b: typeof s.https) => {
        if (![b.status, b.ports, b.quic, b.unsupportedSslVersion, b.expiredCert, b.revokedCert, b.certValidationFailure].some(Boolean)) return;
        out += line(2, `config ${name}`);
        if (b.ports) out += setVal(3, 'ports', b.ports);
        if (b.status) out += setVal(3, 'status', b.status);
        if (b.quic) out += setVal(3, 'quic', b.quic);
        if (b.unsupportedSslVersion) out += setVal(3, 'unsupported-ssl-version', b.unsupportedSslVersion);
        if (b.expiredCert) out += setVal(3, 'expired-server-cert', b.expiredCert);
        if (b.revokedCert) out += setVal(3, 'revoked-server-cert', b.revokedCert);
        if (b.certValidationFailure) out += setVal(3, 'cert-validation-failure', b.certValidationFailure);
        out += line(2, 'end');
      };
      // config ssl (global) — emit before per-protocol to match FortiOS ordering
      if ([s.inspectAll, s.sslExpiredCert, s.sslRevokedCert, s.sslCertValidationFailure].some(Boolean)) {
        out += line(2, 'config ssl');
        if (s.inspectAll) out += setVal(3, 'inspect-all', s.inspectAll);
        if (s.sslExpiredCert) out += setVal(3, 'expired-server-cert', s.sslExpiredCert);
        if (s.sslRevokedCert) out += setVal(3, 'revoked-server-cert', s.sslRevokedCert);
        if (s.sslCertValidationFailure) out += setVal(3, 'cert-validation-failure', s.sslCertValidationFailure);
        out += line(2, 'end');
      }
      emitBlock('https', s.https); emitBlock('ftps', s.ftps); emitBlock('imaps', s.imaps);
      emitBlock('pop3s', s.pop3s); emitBlock('smtps', s.smtps); emitBlock('ssh', s.ssh); emitBlock('dot', s.dot);
      if (s.sslExempt.length > 0) {
        out += line(2, 'config ssl-exempt');
        s.sslExempt.forEach((x, i) => {
          out += line(3, `edit ${i + 1}`);
          if (x.type) out += setVal(4, 'type', x.type);
          if (x.wildcardFqdn) out += setVal(4, 'wildcard-fqdn', x.wildcardFqdn);
          if (x.fortiguardCategory) out += setVal(4, 'fortiguard-category', x.fortiguardCategory);
          if (x.address) out += setVal(4, 'address', x.address);
          out += line(3, 'next');
        });
        out += line(2, 'end');
      }
      if (!s.logSslAnomalies) out += setVal(2, 'ssl-anomaly-log', 'disable');
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- IPS Sensors ---
  if (config.securityProfiles.ips.length > 0) {
    const actMap: Record<string, string> = { pass: 'pass', block: 'block', reset: 'reset', monitor: 'pass', quarantine: 'block' };
    out += 'config ips sensor\n';
    for (const s of config.securityProfiles.ips) {
      out += line(1, `edit ${q(s.name)}`);
      out += setVal(2, 'comment', s.comment);
      if (s.blockMaliciousUrl) out += setVal(2, 'block-malicious-url', 'enable');
      if (s.scanBotnetConnections !== 'disable') out += setVal(2, 'scan-botnet-connections', s.scanBotnetConnections);
      out += line(2, 'config entries');
      for (const en of s.entries) {
        out += line(3, `edit ${en.id}`);
        if (en.type === 'signature' && en.rule.length) out += setArr(4, 'rule', en.rule);
        if (en.location.length) out += setArr(4, 'location', en.location);
        if (en.severity.length) out += setArr(4, 'severity', en.severity);
        if (en.protocol.length) out += setArr(4, 'protocol', en.protocol);
        if (en.os.length) out += setArr(4, 'os', en.os);
        if (en.application.length) out += setArr(4, 'application', en.application);
        if (en.action !== 'default') out += setVal(4, 'action', actMap[en.action] || en.action);
        if (en.status !== 'default') out += setVal(4, 'status', en.status);
        if (en.logPacket) out += setVal(4, 'log-packet', 'enable');
        if (en.exemptIps.length) {
          out += line(4, 'config exempt-ip');
          en.exemptIps.forEach((ip, i) => {
            out += line(5, `edit ${i + 1}`);
            out += setVal(6, 'src-ip', ip);
            out += line(5, 'next');
          });
          out += line(4, 'end');
        }
        out += line(3, 'next');
      }
      out += line(2, 'end');
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Antivirus Profiles ---
  if (config.securityProfiles.antivirus.length > 0) {
    out += 'config antivirus profile\n';
    for (const a of config.securityProfiles.antivirus) {
      out += line(1, `edit ${q(a.name)}`);
      out += setVal(2, 'comment', a.comment);
      out += setVal(2, 'feature-set', a.featureSet);
      const proto = (name: string, enabled: boolean, exe: boolean) => {
        if (!enabled) return;
        out += line(2, `config ${name}`);
        out += setVal(3, 'av-scan', a.scanAction);
        if (a.outbreakPrevention) out += setVal(3, 'outbreak-prevention', 'block');
        if (exe && a.treatExeAsVirus) out += setVal(3, 'executables', 'virus');
        out += line(2, 'end');
      };
      proto('http', a.inspectHttp, false);
      proto('ftp', a.inspectFtp, false);
      proto('imap', a.inspectImap, true);
      proto('pop3', a.inspectPop3, true);
      proto('smtp', a.inspectSmtp, true);
      proto('mapi', a.inspectMapi, false);
      proto('nntp', a.inspectNntp, false);
      proto('cifs', a.inspectCifs, false);
      proto('ssh', a.inspectSsh, false);
      if (!a.outbreakPreventionArchiveScan) out += setVal(2, 'outbreak-prevention-archive-scan', 'disable');
      if (a.externalBlocklistAll) out += setVal(2, 'external-blocklist-enable-all', 'enable');
      if (a.emsThreatFeed) out += setVal(2, 'ems-threat-feed', 'enable');
      if (a.mobileMalware) out += setVal(2, 'mobile-malware-db', 'enable');
      if (a.scanMode !== 'default') out += setVal(2, 'scan-mode', a.scanMode);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- FortiGuard local categories ---
  if (config.securityProfiles.ftgdLocalCategories.length > 0) {
    out += 'config webfilter ftgd-local-cat\n';
    for (const c of config.securityProfiles.ftgdLocalCategories) {
      out += line(1, `edit ${q(c.name)}`);
      out += setVal(2, 'id', c.id);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Web Filter URL filter objects (referenced by profiles) ---
  {
    const tables = config.securityProfiles.webFilter
      .filter((w) => w.urlFilterEntries.length > 0 && w.urlFilterTable)
      .map((w) => ({ id: w.urlFilterTable, name: `${w.name}-urls`, entries: w.urlFilterEntries }));
    // de-dupe shared tables by id
    const seen = new Set<number>();
    const uniq = tables.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
    if (uniq.length > 0) {
      out += 'config webfilter urlfilter\n';
      for (const t of uniq) {
        out += line(1, `edit ${t.id}`);
        out += setVal(2, 'name', t.name);
        out += line(2, 'config entries');
        t.entries.forEach((en, i) => {
          out += line(3, `edit ${en.id || i + 1}`);
          out += setVal(4, 'url', en.url);
          out += setVal(4, 'type', en.type);
          if (en.action !== 'block') out += setVal(4, 'action', en.action);
          if (!en.status) out += setVal(4, 'status', 'disable');
          out += line(3, 'next');
        });
        out += line(2, 'end');
        out += line(1, 'next');
      }
      out += 'end\n\n';
    }
  }

  // --- Web Filter Profiles ---
  if (config.securityProfiles.webFilter.length > 0) {
    out += 'config webfilter profile\n';
    for (const w of config.securityProfiles.webFilter) {
      out += line(1, `edit ${q(w.name)}`);
      out += setVal(2, 'comment', w.comment);
      out += setVal(2, 'feature-set', w.featureSet);
      if (w.options.length > 0) out += setArr(2, 'options', w.options);
      if (w.postAction !== 'normal') out += setVal(2, 'post-action', w.postAction);
      if (!w.webContentLog) out += setVal(2, 'web-content-log', 'disable');
      if (w.urlFilterTable || w.safeSearch !== 'disable' || w.youtubeRestrict !== 'none') {
        out += line(2, 'config web');
        if (w.urlFilterTable) out += setVal(3, 'urlfilter-table', w.urlFilterTable);
        if (w.safeSearch !== 'disable') out += setVal(3, 'safe-search', w.safeSearch);
        if (w.youtubeRestrict !== 'none') out += setVal(3, 'youtube-restrict', w.youtubeRestrict);
        out += line(2, 'end');
      }
      if (w.ftgdWfCategories.length > 0) {
        out += line(2, 'config ftgd-wf');
        out += line(3, 'config filters');
        w.ftgdWfCategories.forEach((c, i) => {
          out += line(4, `edit ${i + 1}`);
          out += setVal(5, 'category', c.id);
          if (c.action !== 'monitor') out += setVal(5, 'action', c.action);
          out += line(4, 'next');
        });
        out += line(3, 'end');
        out += line(2, 'end');
      }
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- DNS Filter domain-filter objects (referenced by profiles) ---
  {
    const tables = config.securityProfiles.dnsFilter
      .filter((d) => d.domainFilter.length > 0 && d.domainFilterTable)
      .map((d) => ({ id: d.domainFilterTable, name: `${d.name}-domains`, entries: d.domainFilter }));
    const seen = new Set<number>();
    const uniq = tables.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
    if (uniq.length > 0) {
      out += 'config dnsfilter domain-filter\n';
      for (const t of uniq) {
        out += line(1, `edit ${t.id}`);
        out += setVal(2, 'name', t.name);
        out += line(2, 'config entries');
        t.entries.forEach((en, i) => {
          out += line(3, `edit ${en.id || i + 1}`);
          out += setVal(4, 'domain', en.domain);
          out += setVal(4, 'type', en.type);
          if (en.action !== 'block') out += setVal(4, 'action', en.action);
          if (!en.status) out += setVal(4, 'status', 'disable');
          out += line(3, 'next');
        });
        out += line(2, 'end');
        out += line(1, 'next');
      }
      out += 'end\n\n';
    }
  }

  // --- DNS Filter Profiles ---
  if (config.securityProfiles.dnsFilter.length > 0) {
    out += 'config dnsfilter profile\n';
    for (const d of config.securityProfiles.dnsFilter) {
      out += line(1, `edit ${q(d.name)}`);
      out += setVal(2, 'comment', d.comment);
      if (d.blockBotnet) out += setVal(2, 'block-botnet', 'enable');
      if (d.safeSearch) out += setVal(2, 'safe-search', 'enable');
      if (d.youtubeRestrict !== 'none') out += setVal(2, 'youtube-restrict', d.youtubeRestrict);
      if (d.redirectPortal) out += setVal(2, 'redirect-portal', d.redirectPortal);
      if (d.logAllDomain) out += setVal(2, 'log-all-domain', 'enable');
      if (d.stripEch) out += setVal(2, 'strip-ech', 'enable');
      if (d.externalIpBlocklist.length > 0) out += setArr(2, 'external-ip-blocklist', d.externalIpBlocklist);
      if (d.ftgdDnsCategories.length > 0) {
        out += line(2, 'config ftgd-dns');
        out += line(3, 'config filters');
        d.ftgdDnsCategories.forEach((c, i) => {
          out += line(4, `edit ${i + 1}`);
          out += setVal(5, 'category', c.id);
          if (c.action !== 'monitor') out += setVal(5, 'action', c.action);
          out += line(4, 'next');
        });
        out += line(3, 'end');
        out += line(2, 'end');
      }
      if (d.domainFilterTable) {
        out += line(2, 'config domain-filter');
        out += setVal(3, 'domain-filter-table', d.domainFilterTable);
        out += line(2, 'end');
      }
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Wireless VAPs ---
  if (config.wireless.vaps.length > 0) {
    out += 'config wireless-controller vap\n';
    for (const v of config.wireless.vaps) {
      out += line(1, `edit ${q(v.name)}`);
      out += setVal(2, 'ssid', v.ssid);
      if (v.securityMode !== 'open') out += setVal(2, 'security', v.securityMode);
      out += setVal(2, 'passphrase', v.passphrase);
      if (v.authServer) out += setVal(2, 'auth', v.authServer);
      if (v.vlanid) out += setVal(2, 'vlanid', v.vlanid);
      if (v.maxClients) out += setVal(2, 'max-clients', v.maxClients);
      if (v.macFilter) out += setVal(2, 'mac-filter', true);
      out += setVal(2, 'schedule', v.schedule);
      out += setVal(2, 'comment', v.comment);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Wireless WTP Profiles ---
  if (config.wireless.wtpProfiles.length > 0) {
    out += 'config wireless-controller wtp-profile\n';
    for (const p of config.wireless.wtpProfiles) {
      out += line(1, `edit ${q(p.name)}`);
      out += setVal(2, 'comment', p.comment);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  // --- Wireless WTPs ---
  if (config.wireless.wtps.length > 0) {
    out += 'config wireless-controller wtp\n';
    for (const w of config.wireless.wtps) {
      out += line(1, `edit ${q(w.id)}`);
      out += setVal(2, 'name', w.name);
      out += setVal(2, 'wtp-profile', w.wtpProfile);
      out += setVal(2, 'admin', w.admin);
      out += setVal(2, 'location', w.location);
      out += setVal(2, 'comment', w.comment);
      out += line(1, 'next');
    }
    out += 'end\n\n';
  }

  return out;
}
