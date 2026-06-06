// ============================================================================
// FortiOS 7.4+ Data Model - Complete Type Definitions
// ============================================================================

// --- Project ---
export type HighlightColor = 'red' | 'yellow' | 'green' | 'blue';

export interface FortigateProject {
  version: number;
  id: string;
  name: string;
  hostname: string;
  model: string;
  fortiosVersion: string;
  createdAt: string;
  updatedAt: string;
  config: FortigateConfig;
  highlights: Record<string, Record<string, HighlightColor>>;
  _deletedNames: Record<string, string[]>;
}

// --- Root Config ---
export interface FortigateConfig {
  system: {
    global: SystemGlobal;
    interfaces: SystemInterface[];
    dhcpServers: DHCPServer[];
    admins: Administrator[];
    dns: DNSSettings;
    zones: SystemZone[];
  };
  router: {
    static: StaticRoute[];
    policy: PolicyRoute[];
    bgp: BGPConfig;
    ospf: OSPFConfig;
  };
  firewallPolicy: FirewallPolicy[];
  firewallAddress: FirewallAddress[];
  firewallAddrgrp: FirewallAddressGroup[];
  firewallService: FirewallService[];
  firewallServiceGroup: FirewallServiceGroup[];
  firewallSchedule: FirewallSchedule[];
  firewallVip: FirewallVIP[];
  firewallIppool: FirewallIPPool[];
  vpnIpsec: {
    phase1: VPNPhase1[];
    phase2: VPNPhase2[];
  };
  vpnSsl: SSLVPNSettings;
  securityProfiles: {
    antivirus: AntivirusProfile[];
    webFilter: WebFilterProfile[];
    dnsFilter: DNSFilterProfile[];
    applicationControl: AppControlProfile[];
    ips: IPSProfile[];
    sslInspection: SSLInspectionProfile[];
  };
  sdwan: SDWANConfig;
  trafficShaping: {
    shapers: TrafficShaper[];
    shapingPolicies: TrafficShapingPolicy[];
  };
  user: {
    ldap: LDAPServer[];
    radius: RADIUSServer[];
    local: LocalUser[];
    group: UserGroup[];
  };
}

// --- System Global ---
export interface SystemGlobal {
  hostname: string;
  timezone: string;
  adminSport: number;
  adminSSHPort: number;
  adminServerCert: string;
  admintimeout: number;
  guiTheme: string;
  language: string;
  strongCrypto: boolean;
  sslMinProtoVersion: string;
}

// --- System Interface ---
export interface SystemInterface {
  name: string;
  ip: string;
  netmask: string;
  allowaccess: string[];
  type: 'physical' | 'vlan' | 'aggregate' | 'loopback' | 'tunnel' | 'redundant' | 'switch';
  vlanid: number;
  interface: string;
  alias: string;
  status: 'up' | 'down';
  speed: string;
  mtu: number;
  mtuOverride: boolean;
  role: 'lan' | 'wan' | 'dmz' | 'undefined';
  description: string;
  mode: 'static' | 'dhcp' | 'pppoe';
  secondaryIP: boolean;
  secondaryIPs: Array<{ ip: string; netmask: string; allowaccess: string[] }>;
  dhcpRelayService: boolean;
  dhcpRelayIp: string[];
  defaultgw: boolean;
  distance: number;
  weight: number;
  lldpTransmission: 'enable' | 'disable';
  lldpReception: 'enable' | 'disable';
  deviceIdentification: boolean;
  estimatedUpstreamBandwidth: number;
  estimatedDownstreamBandwidth: number;
  inbandwidth: number;
  outbandwidth: number;
}

// --- DHCP Server ---
export interface DHCPServer {
  id: number;
  interface: string;
  status: 'enable' | 'disable';
  leaseTime: number;
  defaultGateway: string;
  netmask: string;
  dnsServer1: string;
  dnsServer2: string;
  dnsServer3: string;
  domain: string;
  winsServer1: string;
  winsServer2: string;
  ntpServer1: string;
  ntpServer2: string;
  comments: string;
  ipRanges: Array<{ id: number; startIp: string; endIp: string }>;
  reservedAddresses: Array<{ id: number; ip: string; mac: string; description: string; action: 'assign' | 'block' }>;
  options: Array<{ id: number; code: number; type: 'hex' | 'string' | 'ip' | 'fqdn'; value: string }>;
}

// --- Administrator ---
export interface Administrator {
  name: string;
  password: string;
  accprofile: string;
  trusthost1: string;
  trusthost2: string;
  trusthost3: string;
  trusthost4: string;
  trusthost5: string;
  comments: string;
  forcePasswordChange: boolean;
  twoFactor: 'disable' | 'fortitoken' | 'email' | 'sms';
  emailTo: string;
  smsServer: string;
}

// --- DNS ---
export interface DNSSettings {
  primary: string;
  secondary: string;
  protocol: 'cleartext' | 'dot' | 'doh';
  sslCertificate: string;
  domain: string;
  dnsOverTls: 'disable' | 'enable' | 'enforce';
  cacheNotFoundResponses: boolean;
  cacheTtl: number;
}

// --- System Zone ---
export interface SystemZone {
  name: string;
  interface: string[];
  intrazone: 'allow' | 'deny';
  description: string;
}

// --- Static Route ---
export interface StaticRoute {
  seqNum: number;
  dst: string;
  dstaddr: string;
  gateway: string;
  device: string;
  distance: number;
  weight: number;
  priority: number;
  status: 'enable' | 'disable';
  comment: string;
  blackhole: boolean;
  sdwan: boolean;
  sdwanZone: string;
}

// --- BGP ---
export interface BGPNeighbor {
  ip: string;
  remoteAs: number;
  description: string;
  weight: number;
  holdtimeTimer: number;
  keepAliveTimer: number;
  ebgpMultihop: number;
  ebgpMultihopTtl: number;
  nextHopSelf: boolean;
  softReconfiguration: boolean;
  routeMapIn: string;
  routeMapOut: string;
  updateSource: string;
  bfd: boolean;
  status: 'enable' | 'disable';
  comment: string;
}

export interface BGPNetwork {
  id: number;
  prefix: string;
  routeMap: string;
}

export interface BGPRedistribute {
  connected: boolean;
  connectedRouteMap: string;
  static: boolean;
  staticRouteMap: string;
  ospf: boolean;
  ospfRouteMap: string;
}

export interface BGPConfig {
  as: number;
  routerId: string;
  ebgpMultipath: boolean;
  ibgpMultipath: boolean;
  bestpathMedConfed: boolean;
  bestpathAsPathIgnore: boolean;
  gracefulRestart: boolean;
  logNeighborChanges: boolean;
  neighbors: BGPNeighbor[];
  networks: BGPNetwork[];
  redistribute: BGPRedistribute;
}

// --- OSPF ---
export interface OSPFArea {
  id: string;
  type: 'regular' | 'stub' | 'nssa';
  stubType: 'no-summary' | 'summary';
  authentication: 'none' | 'text' | 'md5';
  comment: string;
}

export interface OSPFNetwork {
  id: number;
  prefix: string;
  area: string;
}

export interface OSPFInterface {
  name: string;
  cost: number;
  priority: number;
  helloInterval: number;
  deadInterval: number;
  retransmitInterval: number;
  networkType: 'broadcast' | 'non-broadcast' | 'point-to-point' | 'point-to-multipoint';
  authentication: 'none' | 'text' | 'md5';
  status: 'enable' | 'disable';
  comment: string;
}

export interface OSPFRedistribute {
  connected: boolean;
  connectedRouteMap: string;
  static: boolean;
  staticRouteMap: string;
  bgp: boolean;
  bgpRouteMap: string;
}

export interface OSPFConfig {
  routerId: string;
  defaultInformationOriginate: boolean;
  defaultInformationOriginateAlways: boolean;
  defaultMetric: number;
  passiveInterfaces: string[];
  areas: OSPFArea[];
  networks: OSPFNetwork[];
  ospfInterfaces: OSPFInterface[];
  redistribute: OSPFRedistribute;
}

// --- Policy Route ---
export interface PolicyRoute {
  seqNum: number;
  inputDevice: string[];
  src: string;
  srcNegate: boolean;
  dst: string;
  dstNegate: boolean;
  protocol: number;
  startPort: number;
  endPort: number;
  gateway: string;
  outputDevice: string;
  status: 'enable' | 'disable';
  comments: string;
  tos: string;
  tosMask: string;
}

// --- Firewall Policy ---
export interface FirewallPolicy {
  policyid: number;
  name: string;
  srcintf: string[];
  dstintf: string[];
  srcaddr: string[];
  dstaddr: string[];
  srcaddrNegate: boolean;
  dstaddrNegate: boolean;
  action: 'accept' | 'deny';
  service: string[];
  serviceNegate: boolean;
  schedule: string;
  nat: boolean;
  ippool: boolean;
  poolname: string[];
  fixedport: boolean;
  status: 'enable' | 'disable';
  logtraffic: 'all' | 'utm' | 'disable';
  logtrafficStart: boolean;
  comments: string;
  utmStatus: boolean;
  avProfile: string;
  webfilterProfile: string;
  dnsfilterProfile: string;
  ipsSensor: string;
  applicationList: string;
  sslSshProfile: string;
  inspectionMode: 'proxy' | 'flow';
  groups: string[];
  users: string[];
  internet_service: boolean;
  internet_service_name: string[];
  internet_service_negate: boolean;
  captivePortalExempt: boolean;
  wccp: boolean;
  tcpMssSender: number;
  tcpMssReceiver: number;
  sessionTtl: number;
  antiReplay: boolean;
  matchVip: boolean;
  diffservForward: boolean;
  diffservReverse: boolean;
  diffservcodeForward: string;
  diffservcodeReverse: string;
}

// --- Firewall Address ---
export interface FirewallAddress {
  name: string;
  type: 'ipmask' | 'iprange' | 'fqdn' | 'geography' | 'wildcard' | 'dynamic' | 'mac';
  subnet: string;
  startIp: string;
  endIp: string;
  fqdn: string;
  country: string;
  wildcardFqdn: string;
  interface: string;
  comment: string;
  visibility: boolean;
  color: number;
  allowRouting: boolean;
  associatedInterface: string;
  macaddr: string[];
}

// --- Firewall Address Group ---
export interface FirewallAddressGroup {
  name: string;
  member: string[];
  comment: string;
  visibility: boolean;
  color: number;
  exclude: boolean;
  excludeMember: string[];
}

// --- Firewall Service ---
export interface FirewallService {
  name: string;
  category: string;
  protocol: 'TCP/UDP/SCTP' | 'ICMP' | 'ICMP6' | 'IP';
  tcpPortrange: string;
  udpPortrange: string;
  sctpPortrange: string;
  protocolNumber: number;
  icmptype: number;
  icmpcode: number;
  comment: string;
  visibility: boolean;
  color: number;
  sessionTtl: number;
  proxy: boolean;
  iprange: string;
  fqdn: string;
}

// --- Firewall Service Group ---
export interface FirewallServiceGroup {
  name: string;
  member: string[];
  comment: string;
  color: number;
}

// --- Firewall Schedule ---
export interface FirewallSchedule {
  name: string;
  type: 'always' | 'onetime' | 'recurring';
  start: string;
  end: string;
  day: string[];
  color: number;
}

// --- Firewall VIP (Virtual IP / DNAT) ---
export interface FirewallVIP {
  name: string;
  extip: string;
  mappedip: string[];
  extintf: string;
  portforward: boolean;
  protocol: 'tcp' | 'udp' | 'sctp' | 'icmp';
  extport: string;
  mappedport: string;
  comment: string;
  color: number;
  type: 'static-nat' | 'load-balance' | 'server-load-balance' | 'dns-translation' | 'fqdn';
  srcintfFilter: string[];
  srcFilter: string[];
  natSourceVip: boolean;
  arpReply: boolean;
  portmappingType: 'one-to-one' | 'many-to-many';
  gratuitousArpInterval: number;
}

// --- Firewall IP Pool (SNAT) ---
export interface FirewallIPPool {
  name: string;
  type: 'overload' | 'one-to-one' | 'fixed-port-range' | 'port-block-allocation';
  startip: string;
  endip: string;
  sourceStartip: string;
  sourceEndip: string;
  arpIntf: string;
  arpReply: boolean;
  comments: string;
  blockSize: number;
  numBlocksPerUser: number;
  associatedInterface: string;
}

// --- VPN Phase 1 (IKE) ---
export interface VPNPhase1 {
  name: string;
  type: 'static' | 'dynamic';
  interface: string;
  ikeVersion: '1' | '2';
  remoteGw: string;
  localGw: string;
  psksecret: string;
  peertype: 'any' | 'one' | 'dialup' | 'peer' | 'peergrp';
  peerid: string;
  proposal: string[];
  dhgrp: string[];
  natTraversal: 'enable' | 'disable' | 'forced';
  keepalive: number;
  dpd: 'disable' | 'on-idle' | 'on-demand';
  dpdRetrycount: number;
  dpdRetryinterval: number;
  comments: string;
  localid: string;
  localidType: 'auto' | 'fqdn' | 'user-fqdn' | 'keyid' | 'address' | 'asn1dn';
  authMethod: 'psk' | 'signature';
  certificate: string[];
  keylife: number;
  xauthtype: 'disable' | 'client' | 'pap' | 'chap' | 'auto';
  mode: 'main' | 'aggressive';
  modeConfig: 'disable' | 'enable';
  ipv4Dns: string;
  ipv4Wins: string;
  ipv4StartIp: string;
  ipv4EndIp: string;
  ipv4Netmask: string;
  splitIncludeService: string;
  splitIncludeAccess: string[];
  networkOverlay: 'enable' | 'disable';
  networkId: number;
}

// --- VPN Phase 2 ---
export interface VPNPhase2 {
  name: string;
  phase1name: string;
  proposal: string[];
  pfs: 'enable' | 'disable';
  dhgrp: string[];
  replay: 'enable' | 'disable';
  keepalive: 'enable' | 'disable';
  autoNegotiate: 'enable' | 'disable';
  keylifeseconds: number;
  keylifekbs: number;
  srcSubnet: string;
  dstSubnet: string;
  srcName: string;
  dstName: string;
  srcAddrType: 'subnet' | 'range' | 'ip' | 'name';
  dstAddrType: 'subnet' | 'range' | 'ip' | 'name';
  comments: string;
  protocol: 'esp' | 'ah';
  encapsulation: 'tunnel-mode' | 'transport-mode';
}

// --- SSL VPN ---
export interface SSLVPNSettings {
  status: 'enable' | 'disable';
  port: number;
  source_interface: string[];
  source_address: string[];
  default_portal: string;
  servercert: string;
  tunnel_ip_pools: string[];
  dns_server1: string;
  dns_server2: string;
  dns_suffix: string;
  wins_server1: string;
  wins_server2: string;
  ipv6_dns_server1: string;
  ipv6_dns_server2: string;
  idle_timeout: number;
  auth_timeout: number;
  dtls_tunnel: boolean;
  tunnel_connect_without_reauth: boolean;
  authentication_rules: SSLVPNAuthRule[];
  portals: SSLVPNPortal[];
}

export interface SSLVPNAuthRule {
  id: number;
  source_interface: string;
  source_address: string[];
  groups: string[];
  users: string[];
  portal: string;
  realm: string;
}

export interface SSLVPNPortal {
  name: string;
  tunnel_mode: boolean;
  web_mode: boolean;
  ip_pools: string[];
  split_tunneling: boolean;
  split_tunneling_routing_address: string[];
  allow_user_access: string[];
  heading: string;
  theme: string;
  customLang: string;
}

// --- Security Profiles ---
export interface AntivirusProfile {
  name: string;
  comment: string;
  httpAction: 'block' | 'monitor';
  ftpAction: 'block' | 'monitor';
  imapAction: 'block' | 'monitor';
  pop3Action: 'block' | 'monitor';
  smtpAction: 'block' | 'monitor';
  nntp: 'block' | 'monitor';
  mapi: 'block' | 'monitor';
  ssh: 'block' | 'monitor';
  scanMode: 'quick' | 'full' | 'legacy';
  ftgdAnalytics: 'disable' | 'suspicious' | 'everything';
  analytics_max_upload: number;
  emThreatFeed: boolean;
  outbreakPrevention: 'disable' | 'files' | 'full-archive';
  contentDisarm: boolean;
}

export interface WebFilterProfile {
  name: string;
  comment: string;
  options: string[];
  httpsReplacemsg: boolean;
  ovrdPerm: string[];
  postAction: 'normal' | 'block';
  webContentLog: boolean;
  webFilterActivex: 'block' | 'allow';
  webFilterCookie: 'block' | 'allow';
  webFilterJscript: 'block' | 'allow';
  webFilterJavaApplet: 'block' | 'allow';
  webFilterUnknown: 'block' | 'allow';
  ftgdWfCategories: Array<{ id: number; action: 'allow' | 'block' | 'monitor' | 'warning' | 'authenticate' }>;
  urlFilterEntries: Array<{ id: number; url: string; type: 'simple' | 'regex' | 'wildcard'; action: 'exempt' | 'block' | 'allow' | 'monitor' }>;
  safeSearch: 'url' | 'header' | 'disable';
  youtubeRestrict: 'none' | 'strict' | 'moderate';
}

export interface DNSFilterProfile {
  name: string;
  comment: string;
  domainFilter: Array<{ id: number; domain: string; type: 'simple' | 'regex'; action: 'allow' | 'block' | 'monitor' }>;
  ftgdDnsCategories: Array<{ id: number; action: 'allow' | 'block' | 'monitor' }>;
  blockBotnet: boolean;
  safeSearch: boolean;
  youtubeRestrict: 'none' | 'strict' | 'moderate';
  externalIpBlocklist: string[];
  redirectPortal: string;
  logAllDomain: boolean;
}

export interface AppControlProfile {
  name: string;
  comment: string;
  entries: Array<{
    id: number;
    category: number[];
    application: number[];
    action: 'pass' | 'block' | 'reset';
    log: boolean;
  }>;
  defaultNetworkServices: Array<{
    id: number;
    port: number;
    services: string[];
    violationAction: 'allow' | 'monitor' | 'block';
  }>;
  deepAppInspection: boolean;
  options: string[];
}

export interface IPSProfile {
  name: string;
  comment: string;
  entries: Array<{
    id: number;
    rule: string[];
    location: string[];
    severity: string[];
    protocol: string[];
    os: string[];
    application: string[];
    status: 'enable' | 'disable';
    action: 'pass' | 'block' | 'reset' | 'default';
    log: boolean;
    logPacket: boolean;
    quarantine: 'none' | 'attacker';
    quarantineDuration: number;
    rateCount: number;
    rateDuration: number;
    rateMode: 'periodical' | 'continuous';
    rateTrack: 'none' | 'src-ip' | 'dest-ip' | 'dhcp-client-mac' | 'dns-domain';
  }>;
  blockMaliciousUrl: boolean;
  scanBotnetConnections: 'disable' | 'block' | 'monitor';
}

export interface SSLInspectionProfile {
  name: string;
  comment: string;
  inspectionMode: 'certificate-inspection' | 'deep-inspection';
  serverCert: string;
  serverCertMode: 're-sign' | 'replace';
  caname: string;
  untrustedCaname: string;
  mitmMode: 'enable' | 'disable';
  allowInvalidServerCert: boolean;
  untrustedServerCertAction: 'allow' | 'block' | 'ignore';
  sniServerCertCheck: boolean;
  https: { status: 'certificate-inspection' | 'deep-inspection' | 'disable'; ports: string };
  ftps: { status: 'certificate-inspection' | 'deep-inspection' | 'disable'; ports: string };
  imaps: { status: 'certificate-inspection' | 'deep-inspection' | 'disable'; ports: string };
  pop3s: { status: 'certificate-inspection' | 'deep-inspection' | 'disable'; ports: string };
  smtps: { status: 'certificate-inspection' | 'deep-inspection' | 'disable'; ports: string };
  ssh: { status: 'deep-inspection' | 'disable'; ports: string };
  exemptedAddresses: string[];
  whitelistedAddresses: string[];
}

// --- SD-WAN ---
export interface SDWANConfig {
  status: 'enable' | 'disable';
  loadBalanceMode: 'source-ip-based' | 'weight-based' | 'usage-based' | 'source-dest-ip-based' | 'measured-volume-based';
  members: SDWANMember[];
  healthChecks: SDWANHealthCheck[];
  rules: SDWANRule[];
  zones: SDWANZone[];
}

export interface SDWANMember {
  seqNum: number;
  interface: string;
  zone: string;
  gateway: string;
  source: string;
  cost: number;
  weight: number;
  priority: number;
  status: 'enable' | 'disable';
  comment: string;
  volumeRatio: number;
}

export interface SDWANHealthCheck {
  name: string;
  server: string[];
  protocol: 'ping' | 'tcp-echo' | 'udp-echo' | 'http' | 'dns' | 'twamp';
  port: number;
  interval: number;
  failtime: number;
  recovertime: number;
  thresholdWarningJitter: number;
  thresholdWarningLatency: number;
  thresholdWarningPacketloss: number;
  thresholdAlertJitter: number;
  thresholdAlertLatency: number;
  thresholdAlertPacketloss: number;
  members: number[];
  slaTargets: Array<{
    id: number;
    latencyThreshold: number;
    jitterThreshold: number;
    packetlossThreshold: number;
  }>;
}

export interface SDWANRule {
  id: number;
  name: string;
  srcAddr: string[];
  dstAddr: string[];
  srcIntf: string[];
  service: string[];
  mode: 'sla' | 'priority' | 'manual';
  healthCheck: string;
  slaId: number;
  members: number[];
  protocol: number;
  startPort: number;
  endPort: number;
  routeTag: number;
  status: 'enable' | 'disable';
  tieBreak: 'zone' | 'cfg-order' | 'fib-best-match';
  internetService: boolean;
  internetServiceName: string[];
}

export interface SDWANZone {
  name: string;
  members: string[];
}

// --- Traffic Shaping ---
export interface TrafficShaper {
  name: string;
  guaranteedBandwidth: number;
  maximumBandwidth: number;
  bandwidthUnit: 'kbps' | 'mbps' | 'gbps';
  priority: 'low' | 'medium' | 'high' | 'critical';
  perPolicy: boolean;
  diffserv: boolean;
  diffservcode: string;
}

export interface TrafficShapingPolicy {
  id: number;
  name: string;
  srcaddr: string[];
  dstaddr: string[];
  service: string[];
  srcintf: string[];
  dstintf: string[];
  trafficShaper: string;
  trafficShaperReverse: string;
  perIpShaper: string;
  status: 'enable' | 'disable';
  classId: number;
  comment: string;
}

// --- User / Authentication ---
export interface LDAPServer {
  name: string;
  server: string;
  secondaryServer: string;
  tertiaryServer: string;
  port: number;
  cnid: string;
  dn: string;
  type: 'simple' | 'anonymous' | 'regular';
  username: string;
  password: string;
  secure: 'disable' | 'starttls' | 'ldaps';
  caCert: string;
  passwordExpiryWarning: boolean;
  passwordRenewal: boolean;
  memberAttr: string;
  groupMemberCheck: 'user-attr' | 'group-object' | 'posix-group-object';
  groupFilter: string;
  groupSearchBase: string;
  interface: string;
  sourceIp: string;
}

export interface RADIUSServer {
  name: string;
  server: string;
  secondaryServer: string;
  tertiaryServer: string;
  secret: string;
  secondarySecret: string;
  tertiarySecret: string;
  port: number;
  acctPort: number;
  sourceIp: string;
  allUsergroup: boolean;
  nasIp: string;
  authType: 'auto' | 'ms_chap_v2' | 'ms_chap' | 'chap' | 'pap';
  radiusCoa: boolean;
  interface: string;
}

export interface LocalUser {
  name: string;
  status: 'enable' | 'disable';
  type: 'password' | 'ldap' | 'radius' | 'tacacs+' | 'email';
  passwd: string;
  ldapServer: string;
  radiusServer: string;
  twoFactor: 'disable' | 'fortitoken' | 'email' | 'sms';
  emailTo: string;
  smsServer: string;
  fortitoken: string;
}

export interface UserGroup {
  name: string;
  groupType: 'firewall' | 'fsso-service' | 'rsso' | 'guest';
  member: string[];
  match: Array<{
    id: number;
    serverName: string;
    groupName: string;
  }>;
}

// --- Helper: Default factory functions ---

export function createDefaultConfig(): FortigateConfig {
  return {
    system: {
      global: {
        hostname: 'FortiGate',
        timezone: 'US/Eastern',
        adminSport: 443,
        adminSSHPort: 22,
        adminServerCert: 'self-sign',
        admintimeout: 5,
        guiTheme: 'neutrino',
        language: 'english',
        strongCrypto: true,
        sslMinProtoVersion: 'TLSv1.2',
      },
      interfaces: [],
      dhcpServers: [],
      admins: [],
      dns: {
        primary: '208.91.112.53',
        secondary: '208.91.112.52',
        protocol: 'cleartext',
        sslCertificate: '',
        domain: '',
        dnsOverTls: 'disable',
        cacheNotFoundResponses: false,
        cacheTtl: 1800,
      },
      zones: [],
    },
    router: {
      static: [],
      policy: [],
      bgp: {
        as: 0, routerId: '', ebgpMultipath: false, ibgpMultipath: false,
        bestpathMedConfed: false, bestpathAsPathIgnore: false,
        gracefulRestart: false, logNeighborChanges: true,
        neighbors: [], networks: [],
        redistribute: { connected: false, connectedRouteMap: '', static: false, staticRouteMap: '', ospf: false, ospfRouteMap: '' },
      },
      ospf: {
        routerId: '', defaultInformationOriginate: false, defaultInformationOriginateAlways: false,
        defaultMetric: 10, passiveInterfaces: [], areas: [], networks: [], ospfInterfaces: [],
        redistribute: { connected: false, connectedRouteMap: '', static: false, staticRouteMap: '', bgp: false, bgpRouteMap: '' },
      },
    },
    firewallPolicy: [],
    firewallAddress: [],
    firewallAddrgrp: [],
    firewallService: [],
    firewallServiceGroup: [],
    firewallSchedule: [],
    firewallVip: [],
    firewallIppool: [],
    vpnIpsec: {
      phase1: [],
      phase2: [],
    },
    vpnSsl: {
      status: 'disable',
      port: 443,
      source_interface: [],
      source_address: [],
      default_portal: 'full-access',
      servercert: 'self-sign',
      tunnel_ip_pools: [],
      dns_server1: '',
      dns_server2: '',
      dns_suffix: '',
      wins_server1: '',
      wins_server2: '',
      ipv6_dns_server1: '',
      ipv6_dns_server2: '',
      idle_timeout: 300,
      auth_timeout: 28800,
      dtls_tunnel: true,
      tunnel_connect_without_reauth: false,
      authentication_rules: [],
      portals: [],
    },
    securityProfiles: {
      antivirus: [],
      webFilter: [],
      dnsFilter: [],
      applicationControl: [],
      ips: [],
      sslInspection: [],
    },
    sdwan: {
      status: 'disable',
      loadBalanceMode: 'source-ip-based',
      members: [],
      healthChecks: [],
      rules: [],
      zones: [],
    },
    trafficShaping: {
      shapers: [],
      shapingPolicies: [],
    },
    user: {
      ldap: [],
      radius: [],
      local: [],
      group: [],
    },
  };
}

export function createDefaultProject(): FortigateProject {
  return {
    version: 1,
    id: '',
    name: 'New Project',
    hostname: 'FortiGate',
    model: 'FortiGate-60F',
    fortiosVersion: '7.4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    config: createDefaultConfig(),
    highlights: {},
    _deletedNames: {},
  };
}

export function migrateProject(raw: any): FortigateProject {
  const project = { ...raw };
  if (!project.version) project.version = 1;
  if (!project.highlights) project.highlights = {};
  if (!project._deletedNames) project._deletedNames = {};
  if (project.config) {
    if (!project.config.router.bgp) {
      project.config.router.bgp = createDefaultConfig().router.bgp;
    }
    if (!project.config.router.ospf) {
      project.config.router.ospf = createDefaultConfig().router.ospf;
    }
  }
  return project as FortigateProject;
}
