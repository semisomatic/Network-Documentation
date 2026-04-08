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

  // --- System Interfaces ---
  if (config.system.interfaces.length > 0) {
    out += 'config system interface\n';
    for (const iface of config.system.interfaces) {
      out += line(1, `edit ${q(iface.name)}`);
      if (iface.ip && iface.netmask) out += line(2, `set ip ${iface.ip} ${iface.netmask}`);
      if (iface.allowaccess.length > 0) out += setArr(2, 'allowaccess', iface.allowaccess);
      out += setVal(2, 'type', iface.type);
      if (iface.type === 'vlan' && iface.vlanid) out += setVal(2, 'vlanid', iface.vlanid);
      if (iface.interface) out += setVal(2, 'interface', iface.interface);
      out += setVal(2, 'alias', iface.alias);
      if (iface.status === 'down') out += setVal(2, 'status', 'down');
      if (iface.speed && iface.speed !== 'auto') out += setVal(2, 'speed', iface.speed);
      if (iface.mtuOverride) {
        out += setVal(2, 'mtu-override', true);
        out += setVal(2, 'mtu', iface.mtu);
      }
      if (iface.role !== 'undefined') out += setVal(2, 'role', iface.role);
      out += setVal(2, 'description', iface.description);
      if (iface.mode !== 'static') out += setVal(2, 'mode', iface.mode);
      if (iface.estimatedUpstreamBandwidth) out += setVal(2, 'estimated-upstream-bandwidth', iface.estimatedUpstreamBandwidth);
      if (iface.estimatedDownstreamBandwidth) out += setVal(2, 'estimated-downstream-bandwidth', iface.estimatedDownstreamBandwidth);
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
      out += setVal(2, 'domain', srv.domain);
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
      out += setVal(2, 'dst', r.dst);
      out += setVal(2, 'gateway', r.gateway);
      out += setVal(2, 'device', r.device);
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

  // --- Firewall Addresses ---
  if (config.firewallAddress.length > 0) {
    out += 'config firewall address\n';
    for (const a of config.firewallAddress) {
      out += line(1, `edit ${q(a.name)}`);
      if (a.type !== 'ipmask') out += setVal(2, 'type', a.type);
      if (a.type === 'ipmask' && a.subnet) out += setVal(2, 'subnet', a.subnet);
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
      out += setVal(2, 'tcp-portrange', s.tcpPortrange);
      out += setVal(2, 'udp-portrange', s.udpPortrange);
      if (s.sctpPortrange) out += setVal(2, 'sctp-portrange', s.sctpPortrange);
      if (s.protocol === 'IP') out += setVal(2, 'protocol-number', s.protocolNumber);
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
    // Separate recurring and onetime
    const recurring = config.firewallSchedule.filter(s => s.type === 'recurring');
    const onetime = config.firewallSchedule.filter(s => s.type === 'onetime');
    const always = config.firewallSchedule.filter(s => s.type === 'always');

    if (recurring.length > 0) {
      out += 'config firewall schedule recurring\n';
      for (const s of recurring) {
        out += line(1, `edit ${q(s.name)}`);
        out += setArr(2, 'day', s.day);
        out += setVal(2, 'start', s.start);
        out += setVal(2, 'end', s.end);
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
        out += setVal(2, 'ssl-ssh-profile', pol.sslSshProfile);
      }
      out += setArr(2, 'groups', pol.groups);
      out += setArr(2, 'users', pol.users);
      if (pol.inspectionMode !== 'flow') out += setVal(2, 'inspection-mode', pol.inspectionMode);
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

  return out;
}
