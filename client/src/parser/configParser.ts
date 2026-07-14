// ============================================================================
// FortiOS 7.4 Configuration Parser
// Parses the "config ... edit ... set ... next ... end" block format
// ============================================================================

import {
  FortigateConfig, createDefaultConfig,
  SystemInterface, SystemGlobal, DHCPServer, Administrator, DNSSettings, SystemZone,
  HAConfig, NTPConfig, SNMPConfig, SNMPCommunity, CentralManagementConfig,
  FortiAnalyzerConfig, SyslogConfig,
  StaticRoute, PolicyRoute,
  BGPConfig, BGPNeighbor, BGPNetwork, BGPNeighborGroup, BGPNeighborRange,
  OSPFConfig, OSPFArea, OSPFNetwork, OSPFInterface,
  WirelessVAP, WirelessWTPProfile, WirelessWTP,
  FirewallPolicy, FirewallAddress, FirewallAddressGroup,
  FirewallService, FirewallServiceGroup, FirewallSchedule,
  FirewallVIP, FirewallIPPool,
  VPNPhase1, VPNPhase2, SSLVPNSettings, SSLVPNPortal, SSLVPNAuthRule,
  AntivirusProfile, WebFilterProfile, DNSFilterProfile, FtgdLocalCategory,
  AppControlOverride, AppControlNetworkService, IPSEntry,
  SSLProtoBlock, SSLExemptEntry,
  AppControlProfile, IPSProfile, SSLInspectionProfile,
  SDWANConfig, SDWANMember, SDWANHealthCheck, SDWANRule, SDWANZone,
  TrafficShaper, TrafficShapingPolicy,
  LDAPServer, RADIUSServer, LocalUser, UserGroup, FSSOServer,
} from '../types/fortigate';

// --- Raw parsed tree types ---
interface RawEntry {
  name: string;
  properties: Record<string, string | string[]>;
  children: Record<string, RawEntry[]>;
}

interface RawSection {
  path: string;
  entries: RawEntry[];
  properties: Record<string, string | string[]>;
}

// --- Tokenizer / Line parser ---
function tokenizeLine(line: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const trimmed = line.trim();
  while (i < trimmed.length) {
    if (trimmed[i] === '"') {
      // Quoted string
      let j = i + 1;
      while (j < trimmed.length && trimmed[j] !== '"') {
        if (trimmed[j] === '\\') j++; // skip escaped char
        j++;
      }
      tokens.push(trimmed.slice(i + 1, j));
      i = j + 1;
    } else if (trimmed[i] === ' ' || trimmed[i] === '\t') {
      i++;
    } else {
      let j = i;
      while (j < trimmed.length && trimmed[j] !== ' ' && trimmed[j] !== '\t') j++;
      tokens.push(trimmed.slice(i, j));
      i = j;
    }
  }
  return tokens;
}

// --- Recursive descent parser ---
function parseBlock(lines: string[], index: number): { entries: RawEntry[]; properties: Record<string, string | string[]>; endIndex: number } {
  const entries: RawEntry[] = [];
  const properties: Record<string, string | string[]> = {};
  let currentEntry: RawEntry | null = null;
  let i = index;

  while (i < lines.length) {
    const tokens = tokenizeLine(lines[i]);
    if (tokens.length === 0) { i++; continue; }

    const cmd = tokens[0].toLowerCase();

    if (cmd === 'config') {
      // Nested config block
      const subPath = tokens.slice(1).join(' ');
      const result = parseBlock(lines, i + 1);
      if (currentEntry) {
        currentEntry.children[subPath] = result.entries;
        // Also merge properties from sub-block into the entry if no entries exist
        if (result.entries.length === 0) {
          for (const [k, v] of Object.entries(result.properties)) {
            currentEntry.properties[`${subPath}.${k}`] = v;
          }
        }
      } else {
        // Top-level sub-config
        for (const entry of result.entries) {
          entries.push(entry);
        }
        Object.assign(properties, result.properties);
      }
      i = result.endIndex;
    } else if (cmd === 'edit') {
      const entryName = tokens[1] || '';
      currentEntry = { name: entryName, properties: {}, children: {} };
      i++;
    } else if (cmd === 'next') {
      if (currentEntry) {
        entries.push(currentEntry);
        currentEntry = null;
      }
      i++;
    } else if (cmd === 'end') {
      if (currentEntry) {
        entries.push(currentEntry);
        currentEntry = null;
      }
      return { entries, properties, endIndex: i + 1 };
    } else if (cmd === 'set') {
      const key = tokens[1];
      const values = tokens.slice(2);
      const target = currentEntry || { properties } as any;
      if (currentEntry) {
        currentEntry.properties[key] = values.length === 1 ? values[0] : values;
      } else {
        properties[key] = values.length === 1 ? values[0] : values;
      }
      i++;
    } else if (cmd === 'unset') {
      i++;
    } else if (cmd === 'append') {
      const key = tokens[1];
      const values = tokens.slice(2);
      const target = currentEntry ? currentEntry.properties : properties;
      const existing = target[key];
      if (Array.isArray(existing)) {
        target[key] = [...existing, ...values];
      } else if (existing) {
        target[key] = [existing as string, ...values];
      } else {
        target[key] = values;
      }
      i++;
    } else {
      i++;
    }
  }

  return { entries, properties, endIndex: i };
}

// --- Top-level parser: splits config into sections ---
// Also flattens nested config blocks (e.g. "config system sdwan" > "config members")
// into separate section entries like "system sdwan members"
function parseConfigSections(text: string): Map<string, RawSection> {
  const lines = text.split('\n');
  const sections = new Map<string, RawSection>();
  let i = 0;

  while (i < lines.length) {
    const tokens = tokenizeLine(lines[i]);
    if (tokens.length === 0) { i++; continue; }

    if (tokens[0].toLowerCase() === 'config') {
      const path = tokens.slice(1).join(' ');
      const result = parseBlockFlat(lines, i + 1, path, sections);
      sections.set(path, { path, entries: result.entries, properties: result.properties });
      i = result.endIndex;
    } else {
      i++;
    }
  }

  return sections;
}

// Like parseBlock but also registers nested config blocks as separate sections
function parseBlockFlat(
  lines: string[], index: number, parentPath: string, sections: Map<string, RawSection>
): { entries: RawEntry[]; properties: Record<string, string | string[]>; endIndex: number } {
  const entries: RawEntry[] = [];
  const properties: Record<string, string | string[]> = {};
  let currentEntry: RawEntry | null = null;
  let i = index;

  while (i < lines.length) {
    const tokens = tokenizeLine(lines[i]);
    if (tokens.length === 0) { i++; continue; }

    const cmd = tokens[0].toLowerCase();

    if (cmd === 'config') {
      const subPath = tokens.slice(1).join(' ');
      const fullSubPath = `${parentPath} ${subPath}`;
      const result = parseBlockFlat(lines, i + 1, fullSubPath, sections);

      // Register as a separate section for flat access
      sections.set(fullSubPath, { path: fullSubPath, entries: result.entries, properties: result.properties });

      if (currentEntry) {
        currentEntry.children[subPath] = result.entries;
        if (result.entries.length === 0) {
          for (const [k, v] of Object.entries(result.properties)) {
            currentEntry.properties[`${subPath}.${k}`] = v;
          }
        }
      } else {
        for (const entry of result.entries) {
          entries.push(entry);
        }
        Object.assign(properties, result.properties);
      }
      i = result.endIndex;
    } else if (cmd === 'edit') {
      const entryName = tokens[1] || '';
      currentEntry = { name: entryName, properties: {}, children: {} };
      i++;
    } else if (cmd === 'next') {
      if (currentEntry) {
        entries.push(currentEntry);
        currentEntry = null;
      }
      i++;
    } else if (cmd === 'end') {
      if (currentEntry) {
        entries.push(currentEntry);
        currentEntry = null;
      }
      return { entries, properties, endIndex: i + 1 };
    } else if (cmd === 'set') {
      const key = tokens[1];
      const values = tokens.slice(2);
      if (currentEntry) {
        currentEntry.properties[key] = values.length === 1 ? values[0] : values;
      } else {
        properties[key] = values.length === 1 ? values[0] : values;
      }
      i++;
    } else if (cmd === 'unset') {
      i++;
    } else if (cmd === 'append') {
      const key = tokens[1];
      const values = tokens.slice(2);
      const target = currentEntry ? currentEntry.properties : properties;
      const existing = target[key];
      if (Array.isArray(existing)) {
        target[key] = [...existing, ...values];
      } else if (existing) {
        target[key] = [existing as string, ...values];
      } else {
        target[key] = values;
      }
      i++;
    } else {
      i++;
    }
  }

  return { entries, properties, endIndex: i };
}

// --- Helper functions for value extraction ---
function str(val: string | string[] | undefined, def = ''): string {
  if (val === undefined) return def;
  return Array.isArray(val) ? val.join(' ') : val;
}

function strArr(val: string | string[] | undefined): string[] {
  if (val === undefined) return [];
  // A single set-value is one logical token (the tokenizer already split
  // unquoted lists into an array). Do NOT split on spaces, or quoted
  // multi-word names like "Boca Subnets" would be broken apart.
  if (Array.isArray(val)) return val;
  return val === '' ? [] : [val];
}

function num(val: string | string[] | undefined, def = 0): number {
  const s = str(val);
  const n = parseInt(s, 10);
  return isNaN(n) ? def : n;
}

function bool(val: string | string[] | undefined, def = false): boolean {
  const s = str(val).toLowerCase();
  if (s === 'enable' || s === '1' || s === 'yes') return true;
  if (s === 'disable' || s === '0' || s === 'no') return false;
  return def;
}

function enableDisable(val: string | string[] | undefined, def: 'enable' | 'disable' = 'disable'): 'enable' | 'disable' {
  const s = str(val).toLowerCase();
  if (s === 'enable') return 'enable';
  if (s === 'disable') return 'disable';
  return def;
}

// --- Section mappers ---

function mapSystemGlobal(section: RawSection): Partial<SystemGlobal> {
  const p = section.properties;
  return {
    hostname: str(p['hostname'], 'FortiGate'),
    timezone: str(p['timezone'], 'US/Eastern'),
    adminSport: num(p['admin-sport'], 443),
    adminSSHPort: num(p['admin-ssh-port'], 22),
    adminServerCert: str(p['admin-server-cert'], 'self-sign'),
    admintimeout: num(p['admintimeout'], 5),
    language: str(p['language'], 'english'),
    strongCrypto: bool(p['strong-crypto'], true),
    sslMinProtoVersion: str(p['ssl-min-proto-version'], 'TLSv1.2'),
  };
}

function mapInterfaces(section: RawSection): SystemInterface[] {
  return section.entries.map((e) => {
    const p = e.properties;
    const ipVal = strArr(p['ip']);
    const secondaryIPs: SystemInterface['secondaryIPs'] = [];
    for (const child of e.children['secondaryip'] || []) {
      const sip = strArr(child.properties['ip']);
      secondaryIPs.push({
        ip: sip[0] || '',
        netmask: sip[1] || '',
        allowaccess: strArr(child.properties['allowaccess']),
      });
    }
    return {
      name: e.name,
      ip: ipVal[0] || '',
      netmask: ipVal[1] || '',
      allowaccess: strArr(p['allowaccess']),
      type: str(p['type'], 'physical') as SystemInterface['type'],
      vlanid: num(p['vlanid']),
      interface: str(p['interface']),
      alias: str(p['alias']),
      status: str(p['status'], 'up') as 'up' | 'down',
      speed: str(p['speed'], 'auto'),
      mtu: num(p['mtu'], 1500),
      mtuOverride: bool(p['mtu-override']),
      role: str(p['role'], 'undefined') as SystemInterface['role'],
      description: str(p['description']),
      mode: str(p['mode'], 'static') as SystemInterface['mode'],
      secondaryIP: bool(p['secondary-IP']) || secondaryIPs.length > 0,
      secondaryIPs,
      dhcpRelayService: bool(p['dhcp-relay-service']),
      dhcpRelayIp: strArr(p['dhcp-relay-ip']),
      defaultgw: bool(p['defaultgw'], true),
      distance: num(p['distance'], 10),
      weight: num(p['weight'], 0),
      lldpTransmission: enableDisable(p['lldp-transmission'], 'enable'),
      lldpReception: enableDisable(p['lldp-reception'], 'enable'),
      deviceIdentification: bool(p['device-identification']),
      estimatedUpstreamBandwidth: num(p['estimated-upstream-bandwidth']),
      estimatedDownstreamBandwidth: num(p['estimated-downstream-bandwidth']),
      inbandwidth: num(p['inbandwidth']),
      outbandwidth: num(p['outbandwidth']),
    };
  });
}

function mapDHCPServers(section: RawSection): DHCPServer[] {
  return section.entries.map((e) => {
    const p = e.properties;
    const ipRanges: DHCPServer['ipRanges'] = [];
    const children = e.children['ip-range'] || [];
    for (const child of children) {
      ipRanges.push({
        id: num(child.properties['id'] || [child.name]),
        startIp: str(child.properties['start-ip']),
        endIp: str(child.properties['end-ip']),
      });
    }
    const reservedAddresses: DHCPServer['reservedAddresses'] = [];
    for (const child of e.children['reserved-address'] || []) {
      reservedAddresses.push({
        id: num(child.properties['id'] || [child.name]),
        ip: str(child.properties['ip']),
        mac: str(child.properties['mac']),
        description: str(child.properties['description']),
        action: str(child.properties['action'], 'assign') as 'assign' | 'block',
      });
    }
    const options: DHCPServer['options'] = [];
    for (const child of e.children['options'] || []) {
      options.push({
        id: num(child.properties['id'] || [child.name]),
        code: num(child.properties['code']),
        type: str(child.properties['type'], 'hex') as 'hex' | 'string' | 'ip' | 'fqdn',
        value: str(child.properties['value']),
      });
    }
    return {
      id: parseInt(e.name) || 0,
      interface: str(p['interface']),
      status: enableDisable(p['status'], 'enable'),
      leaseTime: num(p['lease-time'], 86400),
      defaultGateway: str(p['default-gateway']),
      netmask: str(p['netmask']),
      dnsServer1: str(p['dns-server1']),
      dnsServer2: str(p['dns-server2']),
      dnsServer3: str(p['dns-server3']),
      domain: str(p['domain']),
      winsServer1: str(p['wins-server1']),
      winsServer2: str(p['wins-server2']),
      ntpServer1: str(p['ntp-server1']),
      ntpServer2: str(p['ntp-server2']),
      comments: str(p['description']) || str(p['comment']),
      ipRanges,
      reservedAddresses,
      options,
    };
  });
}

function mapDNS(section: RawSection): Partial<DNSSettings> {
  const p = section.properties;
  return {
    primary: str(p['primary']),
    secondary: str(p['secondary']),
    protocol: str(p['protocol'], 'cleartext') as DNSSettings['protocol'],
    domain: str(p['domain']),
    dnsOverTls: str(p['dns-over-tls'], 'disable') as DNSSettings['dnsOverTls'],
  };
}

function mapHA(section: RawSection): HAConfig {
  const p = section.properties;
  // hbdev is "port10" 50 "port9" 50 — keep only the interface names (non-numeric tokens)
  const hbTokens = strArr(p['hbdev']);
  const hbdev = hbTokens.filter((t) => !/^\d+$/.test(t));
  return {
    mode: str(p['mode'], 'standalone') as HAConfig['mode'],
    groupName: str(p['group-name']),
    groupId: num(p['group-id']),
    priority: num(p['priority'], 128),
    override: bool(p['override']),
    hbdev,
    sessionPickup: bool(p['session-pickup']),
    monitorInterfaces: strArr(p['monitor']),
    managementInterface: str(p['ha-mgmt-interface']),
    managementGateway: str(p['ha-mgmt-interface-gateway']),
  };
}

function mapNTP(section: RawSection, sections: Map<string, RawSection>): NTPConfig {
  const p = section.properties;
  const serverSection = sections.get('system ntp ntpserver');
  const servers = serverSection
    ? serverSection.entries.map((e) => str(e.properties['server'])).filter(Boolean)
    : [];
  return {
    syncEnabled: bool(p['ntpsync'], true),
    type: str(p['type'], 'fortiguard') as NTPConfig['type'],
    syncInterval: num(p['syncinterval'], 60),
    servers,
    sourceInterface: str(p['source-ip-interface']) || str(p['interface']),
  };
}

function mapSNMP(sysinfo: RawSection | undefined, communitySection: RawSection | undefined): SNMPConfig {
  const p = sysinfo?.properties || {};
  const communities: SNMPCommunity[] = [];
  if (communitySection) {
    communitySection.entries.forEach((e, i) => {
      const cp = e.properties;
      const hosts: string[] = [];
      for (const host of e.children['hosts'] || []) {
        const ip = strArr(host.properties['ip'])[0];
        if (ip) hosts.push(ip);
      }
      communities.push({
        id: num(cp['id'] || [String(i + 1)]),
        name: e.name,
        status: enableDisable(cp['status'], 'enable'),
        hosts,
        queryV1: bool(cp['query-v1-status'], true),
        queryV2c: bool(cp['query-v2c-status'], true),
        trapV1: bool(cp['trap-v1-status'], true),
        trapV2c: bool(cp['trap-v2c-status'], true),
      });
    });
  }
  return {
    status: enableDisable(p['status'], communities.length > 0 ? 'enable' : 'disable'),
    description: str(p['description']),
    contact: str(p['contact-info']),
    location: str(p['location']),
    communities,
  };
}

function mapCentralManagement(section: RawSection): CentralManagementConfig {
  const p = section.properties;
  const type = str(p['type']);
  return {
    status: (str(p['type']) && str(p['type']) !== 'none') ? 'enable' : 'disable',
    mode: type === 'fortiguard' ? 'cloud' : 'local',
    type,
    server: str(p['fmg']) || str(p['fmg-source-ip']),
    serialNumber: str(p['serial-number']),
  };
}

function mapFortiAnalyzer(local: RawSection | undefined, cloud: RawSection | undefined): FortiAnalyzerConfig {
  const cloudOn = cloud ? bool(cloud.properties['status']) : false;
  const src = cloudOn ? cloud! : local;
  const p = src?.properties || {};
  return {
    status: enableDisable(p['status'], (src ? 'enable' : 'disable')),
    mode: cloudOn ? 'cloud' : 'local',
    server: str(p['server']),
    uploadOption: str(p['upload-option'], 'realtime'),
    sourceInterface: str(p['source-ip']) || str(p['interface']),
  };
}

function mapSyslog(section: RawSection): SyslogConfig {
  const p = section.properties;
  return {
    status: enableDisable(p['status'], 'enable'),
    server: str(p['server']),
    port: num(p['port'], 514),
    mode: str(p['mode'], 'udp') as SyslogConfig['mode'],
    facility: str(p['facility'], 'local7'),
    format: str(p['format'], 'default') as SyslogConfig['format'],
    sourceInterface: str(p['source-ip']) || str(p['interface']),
  };
}

function mapSystemZones(section: RawSection): SystemZone[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      interface: strArr(p['interface']),
      intrazone: str(p['intrazone'], 'deny') as 'allow' | 'deny',
      description: str(p['description']),
    };
  });
}

function mapStaticRoutes(section: RawSection): StaticRoute[] {
  return section.entries.map((e) => {
    const p = e.properties;
    const dstArr = strArr(p['dst']);
    return {
      seqNum: parseInt(e.name) || 0,
      dst: dstArr.join(' '),
      dstaddr: str(p['dstaddr']),
      gateway: str(p['gateway']),
      device: str(p['device']),
      distance: num(p['distance'], 10),
      weight: num(p['weight'], 0),
      priority: num(p['priority'], 1),
      status: enableDisable(p['status'], 'enable'),
      comment: str(p['comment']),
      blackhole: bool(p['blackhole']),
      sdwan: bool(p['sdwan']),
      sdwanZone: str(p['sdwan-zone']),
    };
  });
}

function mapPolicyRoutes(section: RawSection): PolicyRoute[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      seqNum: parseInt(e.name) || 0,
      inputDevice: strArr(p['input-device']),
      src: str(p['src']),
      srcNegate: bool(p['src-negate']),
      dst: str(p['dst']),
      dstNegate: bool(p['dst-negate']),
      protocol: num(p['protocol']),
      startPort: num(p['start-port']),
      endPort: num(p['end-port']),
      gateway: str(p['gateway']),
      outputDevice: str(p['output-device']),
      status: enableDisable(p['status'], 'enable'),
      comments: str(p['comments']),
      tos: str(p['tos']),
      tosMask: str(p['tos-mask']),
    };
  });
}

function mapBGP(section: RawSection, sections: Map<string, RawSection>): BGPConfig {
  const p = section.properties;
  const neighbors: BGPNeighbor[] = [];
  const networks: BGPNetwork[] = [];

  const neighborSection = sections.get('router bgp neighbor');
  if (neighborSection) {
    for (const e of neighborSection.entries) {
      const np = e.properties;
      neighbors.push({
        ip: e.name,
        remoteAs: num(np['remote-as']),
        description: str(np['description']),
        weight: num(np['weight']),
        holdtimeTimer: num(np['holdtime-timer'], 60),
        keepAliveTimer: num(np['keep-alive-timer'], 30),
        ebgpMultihop: num(np['ebgp-multihop']),
        ebgpMultihopTtl: num(np['ebgp-multihop-ttl'], 255),
        nextHopSelf: bool(np['next-hop-self']),
        softReconfiguration: bool(np['soft-reconfiguration']),
        routeMapIn: str(np['route-map-in']),
        routeMapOut: str(np['route-map-out']),
        updateSource: str(np['update-source']),
        bfd: bool(np['bfd']),
        status: enableDisable(np['shutdown'], 'disable') === 'enable' ? 'disable' : 'enable',
        comment: str(np['description']),
      });
    }
  }

  const networkSection = sections.get('router bgp network');
  if (networkSection) {
    for (const e of networkSection.entries) {
      const np = e.properties;
      networks.push({
        id: parseInt(e.name) || 0,
        prefix: str(np['prefix']),
        routeMap: str(np['route-map']),
      });
    }
  }

  const neighborGroups: BGPNeighborGroup[] = [];
  const ngSection = sections.get('router bgp neighbor-group');
  if (ngSection) for (const e of ngSection.entries) neighborGroups.push({ name: e.name, remoteAs: num(e.properties['remote-as']) });

  const neighborRanges: BGPNeighborRange[] = [];
  const nrSection = sections.get('router bgp neighbor-range');
  if (nrSection) for (const e of nrSection.entries) neighborRanges.push({
    id: parseInt(e.name, 10) || 0,
    prefix: str(e.properties['prefix']),
    neighborGroup: str(e.properties['neighbor-group']),
    maxNeighborNum: num(e.properties['max-neighbor-num']),
  });

  // Redistribute (each is a nested "config redistribute <name>" sub-section)
  const redist = (name: string) => {
    const s = sections.get(`router bgp redistribute ${name}`);
    return { on: s ? bool(s.properties['status']) : false, rm: s ? str(s.properties['route-map']) : '' };
  };
  const rc = redist('connected'), rr = redist('rip'), ro = redist('ospf'), rs = redist('static'), ri = redist('isis');

  return {
    as: num(p['as']),
    routerId: str(p['router-id']),
    neighbors,
    neighborGroups,
    neighborRanges,
    networks,
    redistribute: {
      connected: rc.on, connectedRouteMap: rc.rm, rip: rr.on, ripRouteMap: rr.rm,
      ospf: ro.on, ospfRouteMap: ro.rm, static: rs.on, staticRouteMap: rs.rm, isis: ri.on, isisRouteMap: ri.rm,
    },
    dampening: bool(p['dampening']),
    dampeningRouteMap: str(p['dampening-route-map']),
    dampeningReachabilityHalfLife: num(p['dampening-reachability-half-life'], 15),
    dampeningUnreachabilityHalfLife: num(p['dampening-unreachability-half-life'], 15),
    dampeningReuse: num(p['dampening-reuse'], 750),
    dampeningSuppress: num(p['dampening-suppress'], 2000),
    dampeningMaxSuppressTime: num(p['dampening-max-suppress-time'], 60),
    gracefulRestart: bool(p['graceful-restart']),
    gracefulRestartTime: num(p['graceful-restart-time'], 120),
    gracefulStalepathTime: num(p['graceful-stalepath-time'], 360),
    gracefulUpdateDelay: num(p['graceful-update-delay'], 120),
    clusterId: str(p['cluster-id'], '0.0.0.0'),
    defaultLocalPreference: num(p['default-local-preference'], 100),
    distanceExternal: num(p['distance-external'], 20),
    distanceInternal: num(p['distance-internal'], 200),
    distanceLocal: num(p['distance-local'], 200),
    keepaliveTimer: num(p['keepalive-timer'], 60),
    holdtimeTimer: num(p['holdtime-timer'], 180),
    scanTime: num(p['scan-time'], 60),
    alwaysCompareMed: bool(p['always-compare-med']),
    bestpathAsPathIgnore: bool(p['bestpath-as-path-ignore']),
    bestpathCmpConfedAspath: bool(p['bestpath-cmp-confed-aspath']),
    bestpathCmpRouterid: bool(p['bestpath-cmp-routerid']),
    bestpathMedConfed: bool(p['bestpath-med-confed']),
    bestpathMedMissingAsWorst: bool(p['bestpath-med-missing-as-worst']),
    synchronization: bool(p['synchronization']),
    deterministicMed: bool(p['deterministic-med']),
    clientToClientReflection: bool(p['client-to-client-reflection'], true),
    ebgpMultipath: bool(p['ebgp-multipath']),
    ibgpMultipath: bool(p['ibgp-multipath']),
    additionalPath: bool(p['additional-path']),
    enforceFirstAs: bool(p['enforce-first-as'], true),
    fastExternalFailover: bool(p['fast-external-failover'], true),
    logNeighborChanges: bool(p['log-neighbour-changes'], true),
    networkImportCheck: bool(p['network-import-check'], true),
    ignoreOptionalCapability: bool(p['ignore-optional-capability'], true),
  };
}

function mapOSPF(section: RawSection, sections: Map<string, RawSection>): OSPFConfig {
  const p = section.properties;
  const areas: OSPFArea[] = [];
  const networks: OSPFNetwork[] = [];
  const ospfInterfaces: OSPFInterface[] = [];

  const areaSection = sections.get('router ospf area');
  if (areaSection) {
    for (const e of areaSection.entries) {
      const ap = e.properties;
      areas.push({
        id: e.name,
        type: str(ap['type'], 'regular') as OSPFArea['type'],
        stubType: str(ap['stub-type'], 'summary') as OSPFArea['stubType'],
        authentication: str(ap['authentication'], 'none') as OSPFArea['authentication'],
        comment: str(ap['comments']),
      });
    }
  }

  const networkSection = sections.get('router ospf network');
  if (networkSection) {
    for (const e of networkSection.entries) {
      const np = e.properties;
      networks.push({
        id: parseInt(e.name) || 0,
        prefix: str(np['prefix']),
        area: str(np['area']),
      });
    }
  }

  const intfSection = sections.get('router ospf ospf-interface');
  if (intfSection) {
    for (const e of intfSection.entries) {
      const ip = e.properties;
      ospfInterfaces.push({
        name: e.name,
        cost: num(ip['cost'], 0),
        priority: num(ip['priority'], 1),
        helloInterval: num(ip['hello-interval'], 10),
        deadInterval: num(ip['dead-interval'], 40),
        retransmitInterval: num(ip['retransmit-interval'], 5),
        networkType: str(ip['network-type'], 'broadcast') as OSPFInterface['networkType'],
        authentication: str(ip['authentication'], 'none') as OSPFInterface['authentication'],
        status: enableDisable(ip['status'], 'enable'),
        comment: str(ip['comments']),
      });
    }
  }

  const redistribute: OSPFConfig['redistribute'] = {
    connected: bool(p['redistribute.connected.status']),
    connectedRouteMap: str(p['redistribute.connected.route-map']),
    static: bool(p['redistribute.static.status']),
    staticRouteMap: str(p['redistribute.static.route-map']),
    bgp: bool(p['redistribute.bgp.status']),
    bgpRouteMap: str(p['redistribute.bgp.route-map']),
  };

  return {
    routerId: str(p['router-id']),
    defaultInformationOriginate: bool(p['default-information-originate']),
    defaultInformationOriginateAlways: bool(p['default-information-originate-always']),
    defaultMetric: num(p['default-metric'], 10),
    passiveInterfaces: strArr(p['passive-interface']),
    areas,
    networks,
    ospfInterfaces,
    redistribute,
  };
}

function mapWirelessVAPs(section: RawSection): WirelessVAP[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      ssid: str(p['ssid'], e.name),
      securityMode: str(p['security'], 'open') as WirelessVAP['securityMode'],
      passphrase: str(p['passphrase']),
      authServer: str(p['auth']),
      vlanid: num(p['vlanid']),
      broadcast: !bool(p['broadcast-suppress']),
      schedule: str(p['schedule'], 'always'),
      maxClients: num(p['max-clients']),
      macFilter: bool(p['mac-filter']),
      comment: str(p['comment']),
    };
  });
}

function mapWTPProfiles(section: RawSection): WirelessWTPProfile[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      platform: str(p['platform.type']),
      radio1Band: str(p['radio-1.band'], '802.11ax') as WirelessWTPProfile['radio1Band'],
      radio1Channels: strArr(p['radio-1.channel']),
      radio1Power: num(p['radio-1.power-level'], 100),
      radio1VapAll: bool(p['radio-1.vap-all'], true),
      radio1Vaps: strArr(p['radio-1.vaps']),
      radio2Band: str(p['radio-2.band'], '802.11ax') as WirelessWTPProfile['radio2Band'],
      radio2Channels: strArr(p['radio-2.channel']),
      radio2Power: num(p['radio-2.power-level'], 100),
      radio2VapAll: bool(p['radio-2.vap-all'], true),
      radio2Vaps: strArr(p['radio-2.vaps']),
      comment: str(p['comment']),
    };
  });
}

function mapWTPs(section: RawSection): WirelessWTP[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      id: e.name,
      name: str(p['name'], e.name),
      wtpProfile: str(p['wtp-profile']),
      admin: str(p['admin'], 'enable') as WirelessWTP['admin'],
      location: str(p['location']),
      comment: str(p['comment']),
    };
  });
}

function mapFirewallPolicies(section: RawSection): FirewallPolicy[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      policyid: parseInt(e.name) || 0,
      name: str(p['name']),
      srcintf: strArr(p['srcintf']),
      dstintf: strArr(p['dstintf']),
      srcaddr: strArr(p['srcaddr']),
      dstaddr: strArr(p['dstaddr']),
      srcaddrNegate: bool(p['srcaddr-negate']),
      dstaddrNegate: bool(p['dstaddr-negate']),
      action: str(p['action'], 'deny') as 'accept' | 'deny',
      service: strArr(p['service']),
      serviceNegate: bool(p['service-negate']),
      schedule: str(p['schedule'], 'always'),
      nat: bool(p['nat']),
      ippool: bool(p['ippool']),
      poolname: strArr(p['poolname']),
      fixedport: bool(p['fixedport']),
      status: enableDisable(p['status'], 'enable'),
      logtraffic: str(p['logtraffic'], 'utm') as FirewallPolicy['logtraffic'],
      logtrafficStart: bool(p['logtraffic-start']),
      comments: str(p['comments']),
      utmStatus: bool(p['utm-status']),
      avProfile: str(p['av-profile']),
      webfilterProfile: str(p['webfilter-profile']),
      dnsfilterProfile: str(p['dnsfilter-profile']),
      ipsSensor: str(p['ips-sensor']),
      applicationList: str(p['application-list']),
      sslSshProfile: str(p['ssl-ssh-profile']),
      inspectionMode: str(p['inspection-mode'], 'flow') as 'proxy' | 'flow',
      trafficShaper: str(p['traffic-shaper']),
      trafficShaperReverse: str(p['traffic-shaper-reverse']),
      groups: strArr(p['groups']),
      users: strArr(p['users']),
      internet_service: bool(p['internet-service']),
      internet_service_name: strArr(p['internet-service-name']),
      internet_service_negate: bool(p['internet-service-negate']),
      captivePortalExempt: bool(p['captive-portal-exempt']),
      wccp: bool(p['wccp']),
      tcpMssSender: num(p['tcp-mss-sender']),
      tcpMssReceiver: num(p['tcp-mss-receiver']),
      sessionTtl: num(p['session-ttl']),
      antiReplay: bool(p['anti-replay'], true),
      matchVip: bool(p['match-vip']),
      diffservForward: bool(p['diffserv-forward']),
      diffservReverse: bool(p['diffserv-reverse']),
      diffservcodeForward: str(p['diffservcode-forward']),
      diffservcodeReverse: str(p['diffservcode-rev']),
    };
  });
}

function mapAddresses(section: RawSection): FirewallAddress[] {
  return section.entries.map((e) => {
    const p = e.properties;
    const subnetArr = strArr(p['subnet']);
    return {
      name: e.name,
      type: str(p['type'], 'ipmask') as FirewallAddress['type'],
      subnet: subnetArr.join(' '),
      startIp: str(p['start-ip']),
      endIp: str(p['end-ip']),
      fqdn: str(p['fqdn']),
      country: str(p['country']),
      wildcardFqdn: str(p['wildcard-fqdn']),
      interface: str(p['associated-interface'] || p['interface']),
      comment: str(p['comment']),
      visibility: bool(p['visibility'], true),
      color: num(p['color']),
      allowRouting: bool(p['allow-routing']),
      associatedInterface: str(p['associated-interface']),
      macaddr: strArr(p['macaddr']),
    };
  });
}

function mapAddressGroups(section: RawSection): FirewallAddressGroup[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      member: strArr(p['member']),
      comment: str(p['comment']),
      visibility: bool(p['visibility'], true),
      color: num(p['color']),
      exclude: bool(p['exclude']),
      excludeMember: strArr(p['exclude-member']),
    };
  });
}

function mapServices(section: RawSection): FirewallService[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      category: str(p['category']),
      protocol: str(p['protocol'], 'TCP/UDP/SCTP') as FirewallService['protocol'],
      tcpPortrange: str(p['tcp-portrange']),
      udpPortrange: str(p['udp-portrange']),
      sctpPortrange: str(p['sctp-portrange']),
      protocolNumber: num(p['protocol-number']),
      icmptype: num(p['icmptype']),
      icmpcode: num(p['icmpcode']),
      comment: str(p['comment']),
      visibility: bool(p['visibility'], true),
      color: num(p['color']),
      sessionTtl: num(p['session-ttl']),
      proxy: bool(p['proxy']),
      iprange: str(p['iprange']),
      fqdn: str(p['fqdn']),
    };
  });
}

function mapServiceGroups(section: RawSection): FirewallServiceGroup[] {
  return section.entries.map((e) => ({
    name: e.name,
    member: strArr(e.properties['member']),
    comment: str(e.properties['comment']),
    color: num(e.properties['color']),
  }));
}

function mapSchedules(section: RawSection, schedType: FirewallSchedule['type']): FirewallSchedule[] {
  return section.entries.map((e) => {
    const p = e.properties;
    // Schedules carry no "type" field; it's implied by the section. The built-in
    // "always" schedule is the exception.
    return {
      name: e.name,
      type: e.name === 'always' ? 'always' : schedType,
      start: str(p['start']),
      end: str(p['end']),
      day: strArr(p['day']),
      color: num(p['color']),
    };
  });
}

function mapVIPs(section: RawSection): FirewallVIP[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      extip: str(p['extip']),
      mappedip: strArr(p['mappedip']),
      extintf: str(p['extintf'], 'any'),
      portforward: bool(p['portforward']),
      protocol: str(p['protocol'], 'tcp') as FirewallVIP['protocol'],
      extport: str(p['extport']),
      mappedport: str(p['mappedport']),
      comment: str(p['comment']),
      color: num(p['color']),
      type: str(p['type'], 'static-nat') as FirewallVIP['type'],
      srcintfFilter: strArr(p['srcintf-filter']),
      srcFilter: strArr(p['src-filter']),
      natSourceVip: bool(p['nat-source-vip']),
      arpReply: bool(p['arp-reply'], true),
      portmappingType: str(p['portmapping-type'], 'one-to-one') as FirewallVIP['portmappingType'],
      gratuitousArpInterval: num(p['gratuitous-arp-interval']),
    };
  });
}

function mapIPPools(section: RawSection): FirewallIPPool[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      type: str(p['type'], 'overload') as FirewallIPPool['type'],
      startip: str(p['startip']),
      endip: str(p['endip']),
      sourceStartip: str(p['source-startip']),
      sourceEndip: str(p['source-endip']),
      arpIntf: str(p['arp-intf']),
      arpReply: bool(p['arp-reply'], true),
      comments: str(p['comments']),
      blockSize: num(p['block-size'], 128),
      numBlocksPerUser: num(p['num-blocks-per-user'], 8),
      associatedInterface: str(p['associated-interface']),
    };
  });
}

function mapVPNPhase1(section: RawSection): VPNPhase1[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      type: str(p['type'], 'static') as VPNPhase1['type'],
      interface: str(p['interface']),
      ikeVersion: str(p['ike-version'], '2') as '1' | '2',
      remoteGw: str(p['remote-gw']),
      localGw: str(p['local-gw'], '0.0.0.0'),
      psksecret: str(p['psksecret']),
      peertype: str(p['peertype'], 'any') as VPNPhase1['peertype'],
      peerid: str(p['peerid']),
      proposal: strArr(p['proposal']),
      dhgrp: strArr(p['dhgrp']),
      natTraversal: str(p['nattraversal'], 'enable') as VPNPhase1['natTraversal'],
      keepalive: num(p['keepalive'], 10),
      dpd: str(p['dpd'], 'on-demand') as VPNPhase1['dpd'],
      dpdRetrycount: num(p['dpd-retrycount'], 3),
      dpdRetryinterval: num(p['dpd-retryinterval'], 20),
      comments: str(p['comments']),
      localid: str(p['localid']),
      localidType: str(p['localid-type'], 'auto') as VPNPhase1['localidType'],
      authMethod: str(p['authmethod'], 'psk') as 'psk' | 'signature',
      certificate: strArr(p['certificate']),
      keylife: num(p['keylife'], 86400),
      xauthtype: str(p['xauthtype'], 'disable') as VPNPhase1['xauthtype'],
      mode: str(p['mode'], 'main') as 'main' | 'aggressive',
      modeConfig: enableDisable(p['mode-cfg'], 'disable'),
      ipv4Dns: str(p['ipv4-dns-server1']),
      ipv4Wins: str(p['ipv4-wins-server1']),
      ipv4StartIp: str(p['ipv4-start-ip']),
      ipv4EndIp: str(p['ipv4-end-ip']),
      ipv4Netmask: str(p['ipv4-netmask']),
      splitIncludeService: str(p['split-include-service']),
      splitIncludeAccess: strArr(p['split-include-access']),
      networkOverlay: enableDisable(p['network-overlay'], 'disable'),
      networkId: num(p['network-id']),
    };
  });
}

function mapVPNPhase2(section: RawSection): VPNPhase2[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      phase1name: str(p['phase1name']),
      proposal: strArr(p['proposal']),
      pfs: enableDisable(p['pfs'], 'enable'),
      dhgrp: strArr(p['dhgrp']),
      replay: enableDisable(p['replay'], 'enable'),
      keepalive: enableDisable(p['keepalive'], 'disable'),
      autoNegotiate: enableDisable(p['auto-negotiate'], 'enable'),
      keylifeseconds: num(p['keylifeseconds'], 43200),
      keylifekbs: num(p['keylifekbs'], 5120),
      srcSubnet: str(p['src-subnet']),
      dstSubnet: str(p['dst-subnet']),
      srcName: str(p['src-name']),
      dstName: str(p['dst-name']),
      srcAddrType: str(p['src-addr-type'], 'subnet') as VPNPhase2['srcAddrType'],
      dstAddrType: str(p['dst-addr-type'], 'subnet') as VPNPhase2['dstAddrType'],
      comments: str(p['comments']),
      protocol: str(p['protocol'], 'esp') as 'esp' | 'ah',
      encapsulation: str(p['encapsulation'], 'tunnel-mode') as VPNPhase2['encapsulation'],
    };
  });
}

function mapTrafficShapers(section: RawSection): TrafficShaper[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      guaranteedBandwidth: num(p['guaranteed-bandwidth']),
      maximumBandwidth: num(p['maximum-bandwidth']),
      bandwidthUnit: str(p['bandwidth-unit'], 'kbps') as TrafficShaper['bandwidthUnit'],
      priority: str(p['priority'], 'medium') as TrafficShaper['priority'],
      perPolicy: bool(p['per-policy']),
      diffserv: bool(p['diffserv']),
      diffservcode: str(p['diffservcode']),
    };
  });
}

function mapLDAP(section: RawSection): LDAPServer[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      server: str(p['server']),
      secondaryServer: str(p['secondary-server']),
      tertiaryServer: str(p['tertiary-server']),
      port: num(p['port'], 389),
      cnid: str(p['cnid'], 'cn'),
      dn: str(p['dn']),
      type: str(p['type'], 'simple') as LDAPServer['type'],
      username: str(p['username']),
      password: str(p['password']),
      secure: str(p['secure'], 'disable') as LDAPServer['secure'],
      caCert: str(p['ca-cert']),
      passwordExpiryWarning: bool(p['password-expiry-warning']),
      passwordRenewal: bool(p['password-renewal']),
      memberAttr: str(p['member-attr']),
      groupMemberCheck: str(p['group-member-check'], 'user-attr') as LDAPServer['groupMemberCheck'],
      groupFilter: str(p['group-filter']),
      groupSearchBase: str(p['group-search-base']),
      interface: str(p['interface']),
      sourceIp: str(p['source-ip']),
    };
  });
}

function mapRADIUS(section: RawSection): RADIUSServer[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      server: str(p['server']),
      secondaryServer: str(p['secondary-server']),
      tertiaryServer: str(p['tertiary-server']),
      secret: str(p['secret']),
      secondarySecret: str(p['secondary-secret']),
      tertiarySecret: str(p['tertiary-secret']),
      port: num(p['auth-port'] || p['port'], 1812),
      acctPort: num(p['acct-port'], 1813),
      sourceIp: str(p['source-ip']),
      allUsergroup: bool(p['all-usergroup'], true),
      nasIp: str(p['nas-ip']),
      authType: str(p['auth-type'], 'auto') as RADIUSServer['authType'],
      radiusCoa: bool(p['radius-coa']),
      interface: str(p['interface']),
    };
  });
}

function mapLocalUsers(section: RawSection): LocalUser[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      status: enableDisable(p['status'], 'enable'),
      type: str(p['type'], 'password') as LocalUser['type'],
      passwd: str(p['passwd']),
      ldapServer: str(p['ldap-server']),
      radiusServer: str(p['radius-server']),
      twoFactor: str(p['two-factor'], 'disable') as LocalUser['twoFactor'],
      emailTo: str(p['email-to']),
      smsServer: str(p['sms-server']),
      fortitoken: str(p['fortitoken']),
    };
  });
}

function mapUserGroups(section: RawSection): UserGroup[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      groupType: str(p['group-type'], 'firewall') as UserGroup['groupType'],
      member: strArr(p['member']),
      match: [],
    };
  });
}

function mapSSLInspection(section: RawSection): SSLInspectionProfile[] {
  const block = (p: Record<string, any>, prefix: string): SSLProtoBlock => ({
    status: str(p[`${prefix}.status`]),
    ports: str(p[`${prefix}.ports`]),
    quic: str(p[`${prefix}.quic`]),
    unsupportedSslVersion: str(p[`${prefix}.unsupported-ssl-version`]),
    expiredCert: str(p[`${prefix}.expired-server-cert`]),
    revokedCert: str(p[`${prefix}.revoked-server-cert`]),
    certValidationFailure: str(p[`${prefix}.cert-validation-failure`]),
  });
  return section.entries.map((e) => {
    const p = e.properties;
    const sslExempt: SSLExemptEntry[] = (e.children['ssl-exempt'] || []).map((x) => {
      const xp = x.properties;
      const fc = xp['fortiguard-category'];
      return {
        type: str(xp['type']) || (fc !== undefined ? 'fortiguard-category' : 'address'),
        wildcardFqdn: str(xp['wildcard-fqdn']),
        fortiguardCategory: num(fc),
        address: str(xp['address']),
      };
    });
    return {
      name: e.name,
      comment: str(p['comment']),
      caCert: str(p['caname']) || str(p['server-cert']),
      serverCertMode: str(p['server-cert-mode']),
      inspectAll: str(p['ssl.inspect-all']),
      sslExpiredCert: str(p['ssl.expired-server-cert']),
      sslRevokedCert: str(p['ssl.revoked-server-cert']),
      sslCertValidationFailure: str(p['ssl.cert-validation-failure']),
      https: block(p, 'https'), ftps: block(p, 'ftps'), imaps: block(p, 'imaps'),
      pop3s: block(p, 'pop3s'), smtps: block(p, 'smtps'), dot: block(p, 'dot'), ssh: block(p, 'ssh'),
      sslExempt,
      logSslAnomalies: bool(p['ssl-anomaly-log'], true),
    };
  });
}

function mapIPS(section: RawSection): IPSProfile[] {
  return section.entries.map((e) => {
    const p = e.properties;
    const entries: IPSEntry[] = (e.children['entries'] || []).map((en) => {
      const ep = en.properties;
      const rule = strArr(ep['rule']);
      const exemptIps = (en.children['exempt-ip'] || []).map((x) => str(x.properties['src-ip'])).filter(Boolean);
      return {
        id: parseInt(en.name, 10) || 0,
        type: rule.length > 0 ? 'signature' : 'filter',
        action: str(ep['action'], 'default') as IPSEntry['action'],
        status: str(ep['status'], 'default') as IPSEntry['status'],
        logPacket: bool(ep['log-packet']),
        severity: strArr(ep['severity']),
        rule,
        exemptIps,
        location: strArr(ep['location']),
        protocol: strArr(ep['protocol']),
        os: strArr(ep['os']),
        application: strArr(ep['application']),
      };
    });
    return {
      name: e.name,
      comment: str(p['comment']),
      blockMaliciousUrl: bool(p['block-malicious-url']),
      scanBotnetConnections: str(p['scan-botnet-connections'], 'disable') as IPSProfile['scanBotnetConnections'],
      entries,
    };
  });
}

function mapAppControl(section: RawSection): AppControlProfile[] {
  return section.entries.map((e) => {
    const p = e.properties;
    const categories: AppControlProfile['categories'] = [];
    const overrides: AppControlOverride[] = [];
    let emptyEntryAction = '';
    let emptyEntryLog = false;

    for (const en of e.children['entries'] || []) {
      const ep = en.properties;
      const apps = strArr(ep['application']);
      const cats = strArr(ep['category']).map((s) => parseInt(s, 10) || 0);
      const behavior = strArr(ep['behavior']);
      const popularity = strArr(ep['popularity']);
      const risk = strArr(ep['risk']);
      const action = str(ep['action'], 'block');
      const log = enableDisable(ep['log'], 'enable') === 'enable';
      const isFilter = behavior.length > 0 || popularity.length > 0 || risk.length > 0;

      if (apps.length > 0) {
        overrides.push({ id: overrides.length + 1, type: 'application', action: action as any,
          applications: apps.join(' '), filterCategories: [], behavior: [], popularity: [], risk: [], log });
      } else if (isFilter) {
        overrides.push({ id: overrides.length + 1, type: 'filter', action: action as any,
          applications: '', filterCategories: cats, behavior, popularity, risk, log });
      } else if (cats.length > 0) {
        const catAction = action === 'pass' ? (log ? 'monitor' : 'allow') : 'block';
        for (const c of cats) categories.push({ id: c, action: catAction as 'allow' | 'monitor' | 'block' });
      } else {
        emptyEntryAction = action;
        emptyEntryLog = log;
      }
    }

    const deriveAction = (field: string, logField: string, fallback: string, fallbackLog: boolean): 'pass' | 'monitor' | 'block' => {
      const a = str(p[field], fallback);
      const l = p[logField] !== undefined ? bool(p[logField]) : fallbackLog;
      return a === 'block' ? 'block' : l ? 'monitor' : 'pass';
    };

    const networkServices: AppControlNetworkService[] = (e.children['default-network-services'] || []).map((ns) => ({
      id: parseInt(ns.name, 10) || 0,
      port: num(ns.properties['port']),
      protocols: strArr(ns.properties['services']),
      violationAction: str(ns.properties['violation-action'], 'block') as 'monitor' | 'block',
    }));

    return {
      name: e.name,
      comment: str(p['comment']),
      categories,
      otherApplicationAction: deriveAction('other-application-action', 'other-application-log', emptyEntryAction || 'pass', emptyEntryLog),
      unknownApplicationAction: deriveAction('unknown-application-action', 'unknown-application-log', 'pass', false),
      overrides,
      networkProtocolEnforcement: networkServices.length > 0,
      networkServices,
      deepAppInspection: bool(p['deep-app-inspection'], true),
      options: strArr(p['options']),
    };
  });
}

function mapAntivirus(section: RawSection): AntivirusProfile[] {
  const protos = ['http', 'ftp', 'imap', 'pop3', 'smtp', 'mapi', 'nntp', 'cifs', 'ssh'];
  return section.entries.map((e) => {
    const p = e.properties;
    const scan = (n: string) => str(p[`${n}.av-scan`], 'disable');
    const firstAction = protos.map(scan).find((v) => v === 'block' || v === 'monitor');
    const anyOutbreak = protos.some((n) => {
      const v = str(p[`${n}.outbreak-prevention`]);
      return v === 'block' || v === 'monitor';
    });
    return {
      name: e.name,
      comment: str(p['comment']),
      featureSet: str(p['feature-set'], 'flow') as AntivirusProfile['featureSet'],
      scanAction: (firstAction || 'block') as 'block' | 'monitor',
      inspectHttp: scan('http') !== 'disable',
      inspectFtp: scan('ftp') !== 'disable',
      inspectImap: scan('imap') !== 'disable',
      inspectPop3: scan('pop3') !== 'disable',
      inspectSmtp: scan('smtp') !== 'disable',
      inspectMapi: scan('mapi') !== 'disable',
      inspectNntp: scan('nntp') !== 'disable',
      inspectCifs: scan('cifs') !== 'disable',
      inspectSsh: scan('ssh') !== 'disable',
      treatExeAsVirus: str(p['imap.executables']) === 'virus' || str(p['pop3.executables']) === 'virus' || str(p['smtp.executables']) === 'virus',
      outbreakPrevention: anyOutbreak,
      outbreakPreventionArchiveScan: bool(p['outbreak-prevention-archive-scan'], true),
      externalBlocklistAll: bool(p['external-blocklist-enable-all']),
      emsThreatFeed: bool(p['ems-threat-feed']),
      mobileMalware: bool(p['mobile-malware-db']),
      scanMode: str(p['scan-mode'], 'default') as AntivirusProfile['scanMode'],
    };
  });
}

// config webfilter urlfilter -> Map<id, entries>
function mapUrlFilters(section: RawSection | undefined): Map<number, WebFilterProfile['urlFilterEntries']> {
  const map = new Map<number, WebFilterProfile['urlFilterEntries']>();
  if (!section) return map;
  for (const e of section.entries) {
    const entries = (e.children['entries'] || []).map((c) => ({
      id: parseInt(c.name, 10) || 0,
      url: str(c.properties['url']),
      type: str(c.properties['type'], 'simple') as 'simple' | 'regex' | 'wildcard',
      action: str(c.properties['action'], 'block') as 'exempt' | 'block' | 'allow' | 'monitor',
      status: enableDisable(c.properties['status'], 'enable') === 'enable',
    }));
    map.set(parseInt(e.name, 10) || 0, entries);
  }
  return map;
}

function mapWebFilter(section: RawSection, urlFilters: Map<number, WebFilterProfile['urlFilterEntries']>): WebFilterProfile[] {
  return section.entries.map((e) => {
    const p = e.properties;
    const urlTable = num(p['web.urlfilter-table']);
    // config ftgd-wf > config filters bubbles up to children['ftgd-wf']
    const cats = (e.children['ftgd-wf'] || [])
      .filter((f) => f.properties['category'] !== undefined)
      .map((f) => ({
        id: num(f.properties['category']),
        action: str(f.properties['action'], 'monitor') as WebFilterProfile['ftgdWfCategories'][number]['action'],
      }));
    return {
      name: e.name,
      comment: str(p['comment']),
      featureSet: str(p['feature-set'], 'flow') as WebFilterProfile['featureSet'],
      options: strArr(p['options']),
      httpsReplacemsg: bool(p['https-replacemsg'], true),
      ovrdPerm: strArr(p['ovrd-perm']),
      postAction: str(p['post-action'], 'normal') as WebFilterProfile['postAction'],
      webContentLog: bool(p['web-content-log'], true),
      webFilterActivex: str(p['web-filter-activex'], 'allow') as 'block' | 'allow',
      webFilterCookie: str(p['web-filter-cookie'], 'allow') as 'block' | 'allow',
      webFilterJscript: str(p['web-filter-jscript'], 'allow') as 'block' | 'allow',
      webFilterJavaApplet: str(p['web-filter-java-applet'], 'allow') as 'block' | 'allow',
      webFilterUnknown: str(p['web-filter-unknown'], 'allow') as 'block' | 'allow',
      ftgdWfCategories: cats,
      // config web (merged as web.<key> because it has no edit entries)
      urlFilterTable: urlTable,
      urlFilterEntries: urlFilters.get(urlTable) || [],
      safeSearch: str(p['web.safe-search'], 'disable') as WebFilterProfile['safeSearch'],
      youtubeRestrict: str(p['web.youtube-restrict'], 'none') as WebFilterProfile['youtubeRestrict'],
    };
  });
}

function mapFtgdLocalCat(section: RawSection): FtgdLocalCategory[] {
  return section.entries.map((e) => ({
    id: num(e.properties['id']),
    name: e.name,
  }));
}

// config dnsfilter domain-filter -> Map<id, entries>
function mapDnsDomainFilters(section: RawSection | undefined): Map<number, DNSFilterProfile['domainFilter']> {
  const map = new Map<number, DNSFilterProfile['domainFilter']>();
  if (!section) return map;
  for (const e of section.entries) {
    const entries = (e.children['entries'] || []).map((c) => ({
      id: parseInt(c.name, 10) || 0,
      domain: str(c.properties['domain']),
      type: str(c.properties['type'], 'simple') as 'simple' | 'regex' | 'wildcard',
      action: str(c.properties['action'], 'block') as 'allow' | 'block' | 'monitor',
      status: enableDisable(c.properties['status'], 'enable') === 'enable',
    }));
    map.set(parseInt(e.name, 10) || 0, entries);
  }
  return map;
}

function mapDNSFilter(section: RawSection, domainFilters: Map<number, DNSFilterProfile['domainFilter']>): DNSFilterProfile[] {
  return section.entries.map((e) => {
    const p = e.properties;
    const cats = (e.children['ftgd-dns'] || [])
      .filter((f) => f.properties['category'] !== undefined)
      .map((f) => ({
        id: num(f.properties['category']),
        action: str(f.properties['action'], 'monitor') as 'allow' | 'block' | 'monitor',
      }));
    const domTable = num(p['domain-filter.domain-filter-table']);
    return {
      name: e.name,
      comment: str(p['comment']),
      domainFilterTable: domTable,
      domainFilter: domainFilters.get(domTable) || [],
      ftgdDnsCategories: cats,
      blockBotnet: bool(p['block-botnet']),
      safeSearch: bool(p['safe-search']),
      youtubeRestrict: str(p['youtube-restrict'], 'none') as DNSFilterProfile['youtubeRestrict'],
      externalIpBlocklist: strArr(p['external-ip-blocklist']),
      redirectPortal: str(p['redirect-portal']),
      logAllDomain: bool(p['log-all-domain']),
      stripEch: bool(p['strip-ech']),
    };
  });
}

function mapFSSO(section: RawSection): FSSOServer[] {
  return section.entries.map((e) => {
    const p = e.properties;
    return {
      name: e.name,
      type: str(p['type'], 'default'),
      server: str(p['server']),
      server2: str(p['server2']),
      server3: str(p['server3']),
      port: num(p['port'], 8000),
      password: str(p['password']),
      ldapServer: str(p['ldap-server']),
      groupPollInterval: num(p['group-poll-interval']),
      sourceIp: str(p['source-ip']),
    };
  });
}

// --- Main export ---
// --- SD-WAN mapper ---
function mapSDWAN(section: RawSection, allSections: Map<string, RawSection>): Partial<SDWANConfig> {
  const p = section.properties;
  const result: Partial<SDWANConfig> = {
    status: enableDisable(p['status'], 'disable'),
    loadBalanceMode: str(p['load-balance-mode'], 'source-ip-based') as SDWANConfig['loadBalanceMode'],
    members: [],
    healthChecks: [],
    rules: [],
    zones: [],
  };

  // SD-WAN members: the nested "config members" block is flattened to the
  // "system sdwan members" section by the parser.
  const membersSub = allSections.get('system sdwan members');
  if (membersSub) {
    for (const entry of membersSub.entries) {
      const ep = entry.properties;
      result.members!.push({
        seqNum: parseInt(entry.name, 10) || 0,
        interface: str(ep['interface']),
        zone: str(ep['zone']),
        gateway: str(ep['gateway']),
        source: str(ep['source']),
        cost: num(ep['cost']),
        weight: num(ep['weight'], 1),
        priority: num(ep['priority'], 1),
        status: enableDisable(ep['status'], 'enable'),
        comment: str(ep['comment']),
        volumeRatio: num(ep['volume-ratio'], 1),
      });
    }
  }

  // Health checks
  const healthSub = allSections.get('system sdwan health-check');
  if (healthSub) {
    for (const entry of healthSub.entries) {
      const ep = entry.properties;
      result.healthChecks!.push({
        name: entry.name,
        server: strArr(ep['server']),
        systemDns: bool(ep['system-dns']),
        protocol: str(ep['protocol'], 'ping') as SDWANHealthCheck['protocol'],
        probeMode: str(ep['probe-mode'], 'active') as SDWANHealthCheck['probeMode'],
        port: num(ep['port']),
        interval: num(ep['interval'], 500),
        probeTimeout: num(ep['probe-timeout'], 500),
        failtime: num(ep['failtime'], 5),
        recovertime: num(ep['recoverytime'], 5),
        updateStaticRoute: bool(ep['update-static-route'], true),
        thresholdWarningJitter: num(ep['threshold-warning-jitter']),
        thresholdWarningLatency: num(ep['threshold-warning-latency']),
        thresholdWarningPacketloss: num(ep['threshold-warning-packetloss']),
        thresholdAlertJitter: num(ep['threshold-alert-jitter']),
        thresholdAlertLatency: num(ep['threshold-alert-latency']),
        thresholdAlertPacketloss: num(ep['threshold-alert-packetloss']),
        members: strArr(ep['members']).map((s) => parseInt(s, 10) || 0),
        slaTargets: (entry.children['sla'] || []).map((s) => ({
          id: parseInt(s.name, 10) || 1,
          latencyThreshold: num(s.properties['latency-threshold']),
          jitterThreshold: num(s.properties['jitter-threshold']),
          packetlossThreshold: num(s.properties['packetloss-threshold']),
        })),
      });
    }
  }

  // Rules (called "service" in FortiOS config)
  const rulesSub = allSections.get('system sdwan service');
  if (rulesSub) {
    for (const entry of rulesSub.entries) {
      const ep = entry.properties;
      // Rule -> SLA link comes from a nested "config sla / edit <health-check> / set id <n>"
      const svcSla = (entry.children['sla'] || [])[0];
      result.rules!.push({
        id: parseInt(entry.name, 10) || 0,
        name: str(ep['name']),
        comment: str(ep['comments']) || str(ep['comment']),
        priorityZone: str(ep['priority-zone']),
        srcAddr: strArr(ep['src']),
        dstAddr: strArr(ep['dst']),
        srcIntf: strArr(ep['input-device']),
        service: strArr(ep['internet-service-name'] || ep['service']),
        mode: str(ep['mode'], 'sla') as SDWANRule['mode'],
        healthCheck: svcSla ? svcSla.name : str(ep['health-check']),
        slaId: svcSla ? num(svcSla.properties['id']) : num(ep['sla-id']),
        members: strArr(ep['priority-members']).map((s) => parseInt(s, 10) || 0),
        protocol: num(ep['protocol']),
        startPort: num(ep['start-port']),
        endPort: num(ep['end-port']),
        routeTag: num(ep['route-tag']),
        status: enableDisable(ep['status'], 'enable'),
        tieBreak: str(ep['tie-break'], 'zone') as SDWANRule['tieBreak'],
        internetService: bool(ep['internet-service']),
        internetServiceName: strArr(ep['internet-service-name']),
      });
    }
  }

  // Zones
  const zonesSub = allSections.get('system sdwan zone');
  if (zonesSub) {
    for (const entry of zonesSub.entries) {
      result.zones!.push({
        name: entry.name,
        members: strArr(entry.properties['members']),
      });
    }
  }

  return result;
}

export function parseFortiConfig(text: string): FortigateConfig {
  const sections = parseConfigSections(text);
  const config = createDefaultConfig();

  // System
  const sysGlobal = sections.get('system global');
  if (sysGlobal) Object.assign(config.system.global, mapSystemGlobal(sysGlobal));

  const sysIntf = sections.get('system interface');
  if (sysIntf) config.system.interfaces = mapInterfaces(sysIntf);

  const sysDhcp = sections.get('system dhcp server');
  if (sysDhcp) config.system.dhcpServers = mapDHCPServers(sysDhcp);

  const sysDns = sections.get('system dns');
  if (sysDns) Object.assign(config.system.dns, mapDNS(sysDns));

  const sysZone = sections.get('system zone');
  if (sysZone) config.system.zones = mapSystemZones(sysZone);

  const sysHa = sections.get('system ha');
  if (sysHa) config.system.ha = mapHA(sysHa);

  const sysNtp = sections.get('system ntp');
  if (sysNtp) config.system.ntp = mapNTP(sysNtp, sections);

  const snmpSysinfo = sections.get('system snmp sysinfo');
  const snmpCommunity = sections.get('system snmp community');
  if (snmpSysinfo || snmpCommunity) config.system.snmp = mapSNMP(snmpSysinfo, snmpCommunity);

  const centralMgmt = sections.get('system central-management');
  if (centralMgmt) config.system.centralManagement = mapCentralManagement(centralMgmt);

  // Logging
  const fazLocal = sections.get('log fortianalyzer setting');
  const fazCloud = sections.get('log fortianalyzer-cloud setting');
  if (fazLocal || fazCloud) config.logging.fortianalyzer = mapFortiAnalyzer(fazLocal, fazCloud);

  const syslog = sections.get('log syslogd setting');
  if (syslog) config.logging.syslog = mapSyslog(syslog);

  // Router
  const routerStatic = sections.get('router static');
  if (routerStatic) config.router.static = mapStaticRoutes(routerStatic);

  const routerPolicy = sections.get('router policy');
  if (routerPolicy) config.router.policy = mapPolicyRoutes(routerPolicy);

  const routerBgp = sections.get('router bgp');
  if (routerBgp) config.router.bgp = mapBGP(routerBgp, sections);

  const routerOspf = sections.get('router ospf');
  if (routerOspf) config.router.ospf = mapOSPF(routerOspf, sections);

  // Firewall
  const fwPolicy = sections.get('firewall policy');
  if (fwPolicy) config.firewallPolicy = mapFirewallPolicies(fwPolicy);

  const fwAddr = sections.get('firewall address');
  if (fwAddr) config.firewallAddress = mapAddresses(fwAddr);

  const fwAddrGrp = sections.get('firewall addrgrp');
  if (fwAddrGrp) config.firewallAddrgrp = mapAddressGroups(fwAddrGrp);

  const fwSvc = sections.get('firewall service custom');
  if (fwSvc) config.firewallService = mapServices(fwSvc);

  const fwSvcGrp = sections.get('firewall service group');
  if (fwSvcGrp) config.firewallServiceGroup = mapServiceGroups(fwSvcGrp);

  const fwSched = sections.get('firewall schedule recurring');
  if (fwSched) config.firewallSchedule = mapSchedules(fwSched, 'recurring');
  const fwSchedOnetime = sections.get('firewall schedule onetime');
  if (fwSchedOnetime) config.firewallSchedule.push(...mapSchedules(fwSchedOnetime, 'onetime'));

  const fwVip = sections.get('firewall vip');
  if (fwVip) config.firewallVip = mapVIPs(fwVip);

  const fwIppool = sections.get('firewall ippool');
  if (fwIppool) config.firewallIppool = mapIPPools(fwIppool);

  // VPN
  const vpnP1 = sections.get('vpn ipsec phase1-interface');
  if (vpnP1) config.vpnIpsec.phase1 = mapVPNPhase1(vpnP1);

  const vpnP2 = sections.get('vpn ipsec phase2-interface');
  if (vpnP2) config.vpnIpsec.phase2 = mapVPNPhase2(vpnP2);

  // SD-WAN
  const sdwanSection = sections.get('system sdwan');
  if (sdwanSection) {
    Object.assign(config.sdwan, mapSDWAN(sdwanSection, sections));
  }

  // Traffic shapers
  const shapers = sections.get('firewall shaper traffic-shaper');
  if (shapers) config.trafficShaping.shapers = mapTrafficShapers(shapers);

  // User
  const userLdap = sections.get('user ldap');
  if (userLdap) config.user.ldap = mapLDAP(userLdap);

  const userRadius = sections.get('user radius');
  if (userRadius) config.user.radius = mapRADIUS(userRadius);

  const userLocal = sections.get('user local');
  if (userLocal) config.user.local = mapLocalUsers(userLocal);

  const userGroup = sections.get('user group');
  if (userGroup) config.user.group = mapUserGroups(userGroup);

  const userFsso = sections.get('user fsso');
  if (userFsso) config.user.fsso = mapFSSO(userFsso);

  // Security profiles
  const antivirus = sections.get('antivirus profile');
  if (antivirus) config.securityProfiles.antivirus = mapAntivirus(antivirus);

  const appList = sections.get('application list');
  if (appList) config.securityProfiles.applicationControl = mapAppControl(appList);

  const ipsSensor = sections.get('ips sensor');
  if (ipsSensor) config.securityProfiles.ips = mapIPS(ipsSensor);

  const sslProfile = sections.get('firewall ssl-ssh-profile');
  if (sslProfile) config.securityProfiles.sslInspection = mapSSLInspection(sslProfile);

  const ftgdLocalCat = sections.get('webfilter ftgd-local-cat');
  if (ftgdLocalCat) config.securityProfiles.ftgdLocalCategories = mapFtgdLocalCat(ftgdLocalCat);

  const webFilter = sections.get('webfilter profile');
  if (webFilter) {
    const urlFilters = mapUrlFilters(sections.get('webfilter urlfilter'));
    config.securityProfiles.webFilter = mapWebFilter(webFilter, urlFilters);
  }

  const dnsFilter = sections.get('dnsfilter profile');
  if (dnsFilter) {
    const domainFilters = mapDnsDomainFilters(sections.get('dnsfilter domain-filter'));
    config.securityProfiles.dnsFilter = mapDNSFilter(dnsFilter, domainFilters);
  }

  // Wireless
  const wirelessVap = sections.get('wireless-controller vap');
  if (wirelessVap) config.wireless.vaps = mapWirelessVAPs(wirelessVap);

  const wirelessWtpProfile = sections.get('wireless-controller wtp-profile');
  if (wirelessWtpProfile) config.wireless.wtpProfiles = mapWTPProfiles(wirelessWtpProfile);

  const wirelessWtp = sections.get('wireless-controller wtp');
  if (wirelessWtp) config.wireless.wtps = mapWTPs(wirelessWtp);

  return config;
}
