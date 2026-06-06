import type { FortigateConfig } from '../types/fortigate';

export type ObjectType =
  | 'interface'
  | 'zone'
  | 'sdwanZone'
  | 'address'
  | 'addressGroup'
  | 'service'
  | 'serviceGroup'
  | 'schedule'
  | 'vip'
  | 'ippool'
  | 'vpnPhase1'
  | 'avProfile'
  | 'webFilterProfile'
  | 'dnsFilterProfile'
  | 'ipsProfile'
  | 'appControlProfile'
  | 'sslInspectionProfile'
  | 'userGroup'
  | 'localUser'
  | 'ldapServer'
  | 'radiusServer'
  | 'trafficShaper'
  | 'sslvpnPortal'
  | 'healthCheck';

export const PATH_TO_OBJECT_TYPE: Record<string, ObjectType> = {
  'system.interfaces': 'interface',
  'system.zones': 'zone',
  'sdwan.zones': 'sdwanZone',
  'firewallAddress': 'address',
  'firewallAddrgrp': 'addressGroup',
  'firewallService': 'service',
  'firewallServiceGroup': 'serviceGroup',
  'firewallSchedule': 'schedule',
  'firewallVip': 'vip',
  'firewallIppool': 'ippool',
  'vpnIpsec.phase1': 'vpnPhase1',
  'securityProfiles.antivirus': 'avProfile',
  'securityProfiles.webFilter': 'webFilterProfile',
  'securityProfiles.dnsFilter': 'dnsFilterProfile',
  'securityProfiles.ips': 'ipsProfile',
  'securityProfiles.applicationControl': 'appControlProfile',
  'securityProfiles.sslInspection': 'sslInspectionProfile',
  'user.group': 'userGroup',
  'user.local': 'localUser',
  'user.ldap': 'ldapServer',
  'user.radius': 'radiusServer',
  'trafficShaping.shapers': 'trafficShaper',
  'vpnSsl.portals': 'sslvpnPortal',
  'sdwan.healthChecks': 'healthCheck',
};

export const OBJECT_TYPE_TO_PATH: Record<ObjectType, string> = {
  interface: 'system.interfaces',
  zone: 'system.zones',
  sdwanZone: 'sdwan.zones',
  address: 'firewallAddress',
  addressGroup: 'firewallAddrgrp',
  service: 'firewallService',
  serviceGroup: 'firewallServiceGroup',
  schedule: 'firewallSchedule',
  vip: 'firewallVip',
  ippool: 'firewallIppool',
  vpnPhase1: 'vpnIpsec.phase1',
  avProfile: 'securityProfiles.antivirus',
  webFilterProfile: 'securityProfiles.webFilter',
  dnsFilterProfile: 'securityProfiles.dnsFilter',
  ipsProfile: 'securityProfiles.ips',
  appControlProfile: 'securityProfiles.applicationControl',
  sslInspectionProfile: 'securityProfiles.sslInspection',
  userGroup: 'user.group',
  localUser: 'user.local',
  ldapServer: 'user.ldap',
  radiusServer: 'user.radius',
  trafficShaper: 'trafficShaping.shapers',
  sslvpnPortal: 'vpnSsl.portals',
  healthCheck: 'sdwan.healthChecks',
};

export const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  interface: 'Interface',
  zone: 'Zone',
  sdwanZone: 'SD-WAN Zone',
  address: 'Address',
  addressGroup: 'Address Group',
  service: 'Service',
  serviceGroup: 'Service Group',
  schedule: 'Schedule',
  vip: 'Virtual IP',
  ippool: 'IP Pool',
  vpnPhase1: 'IPsec Phase 1',
  avProfile: 'Antivirus Profile',
  webFilterProfile: 'Web Filter Profile',
  dnsFilterProfile: 'DNS Filter Profile',
  ipsProfile: 'IPS Profile',
  appControlProfile: 'App Control Profile',
  sslInspectionProfile: 'SSL Inspection Profile',
  userGroup: 'User Group',
  localUser: 'Local User',
  ldapServer: 'LDAP Server',
  radiusServer: 'RADIUS Server',
  trafficShaper: 'Traffic Shaper',
  sslvpnPortal: 'SSL-VPN Portal',
  healthCheck: 'Health Check',
};

export const SOURCE_PATH_LABELS: Record<string, string> = {
  'firewallPolicy': 'Firewall Policies',
  'firewallAddress': 'Addresses',
  'firewallAddrgrp': 'Address Groups',
  'firewallService': 'Services',
  'firewallServiceGroup': 'Service Groups',
  'firewallSchedule': 'Schedules',
  'firewallVip': 'Virtual IPs',
  'firewallIppool': 'IP Pools',
  'system.interfaces': 'Interfaces',
  'system.zones': 'Zones',
  'system.dhcpServers': 'DHCP Servers',
  'router.static': 'Static Routes',
  'router.policy': 'Policy Routes',
  'vpnIpsec.phase1': 'IPsec Phase 1',
  'vpnIpsec.phase2': 'IPsec Phase 2',
  'vpnSsl': 'SSL-VPN Settings',
  'vpnSsl.authentication_rules': 'SSL-VPN Auth Rules',
  'vpnSsl.portals': 'SSL-VPN Portals',
  'sdwan.members': 'SD-WAN Members',
  'sdwan.rules': 'SD-WAN Rules',
  'sdwan.zones': 'SD-WAN Zones',
  'sdwan.healthChecks': 'Health Checks',
  'securityProfiles.antivirus': 'Antivirus Profiles',
  'securityProfiles.webFilter': 'Web Filter Profiles',
  'securityProfiles.dnsFilter': 'DNS Filter Profiles',
  'securityProfiles.ips': 'IPS Profiles',
  'securityProfiles.applicationControl': 'App Control Profiles',
  'securityProfiles.sslInspection': 'SSL Inspection Profiles',
  'trafficShaping.shapers': 'Traffic Shapers',
  'trafficShaping.shapingPolicies': 'Shaping Policies',
  'user.ldap': 'LDAP Servers',
  'user.radius': 'RADIUS Servers',
  'user.local': 'Local Users',
  'user.group': 'User Groups',
};

interface RefDef {
  sourcePath: string;
  sourceIsArray: boolean;
  field: string;
  isArray: boolean;
  targetType: ObjectType;
}

export const REFERENCE_DEFS: RefDef[] = [
  // === Interface references ===
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'srcintf', isArray: true, targetType: 'interface' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'srcintf', isArray: true, targetType: 'zone' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'srcintf', isArray: true, targetType: 'sdwanZone' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'dstintf', isArray: true, targetType: 'interface' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'dstintf', isArray: true, targetType: 'zone' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'dstintf', isArray: true, targetType: 'sdwanZone' },
  { sourcePath: 'firewallAddress', sourceIsArray: true, field: 'interface', isArray: false, targetType: 'interface' },
  { sourcePath: 'firewallAddress', sourceIsArray: true, field: 'associatedInterface', isArray: false, targetType: 'interface' },
  { sourcePath: 'firewallVip', sourceIsArray: true, field: 'extintf', isArray: false, targetType: 'interface' },
  { sourcePath: 'firewallVip', sourceIsArray: true, field: 'srcintfFilter', isArray: true, targetType: 'interface' },
  { sourcePath: 'firewallIppool', sourceIsArray: true, field: 'arpIntf', isArray: false, targetType: 'interface' },
  { sourcePath: 'firewallIppool', sourceIsArray: true, field: 'associatedInterface', isArray: false, targetType: 'interface' },
  { sourcePath: 'system.zones', sourceIsArray: true, field: 'interface', isArray: true, targetType: 'interface' },
  { sourcePath: 'system.dhcpServers', sourceIsArray: true, field: 'interface', isArray: false, targetType: 'interface' },
  { sourcePath: 'vpnIpsec.phase1', sourceIsArray: true, field: 'interface', isArray: false, targetType: 'interface' },
  { sourcePath: 'sdwan.members', sourceIsArray: true, field: 'interface', isArray: false, targetType: 'interface' },
  { sourcePath: 'sdwan.rules', sourceIsArray: true, field: 'srcIntf', isArray: true, targetType: 'interface' },
  { sourcePath: 'router.static', sourceIsArray: true, field: 'device', isArray: false, targetType: 'interface' },
  { sourcePath: 'router.static', sourceIsArray: true, field: 'device', isArray: false, targetType: 'zone' },
  { sourcePath: 'router.static', sourceIsArray: true, field: 'device', isArray: false, targetType: 'sdwanZone' },
  { sourcePath: 'router.static', sourceIsArray: true, field: 'device', isArray: false, targetType: 'vpnPhase1' },
  { sourcePath: 'router.static', sourceIsArray: true, field: 'dstaddr', isArray: false, targetType: 'address' },
  { sourcePath: 'router.policy', sourceIsArray: true, field: 'inputDevice', isArray: true, targetType: 'interface' },
  { sourcePath: 'router.policy', sourceIsArray: true, field: 'outputDevice', isArray: false, targetType: 'interface' },
  { sourcePath: 'vpnSsl', sourceIsArray: false, field: 'source_interface', isArray: true, targetType: 'interface' },
  { sourcePath: 'vpnSsl.authentication_rules', sourceIsArray: true, field: 'source_interface', isArray: false, targetType: 'interface' },
  { sourcePath: 'user.ldap', sourceIsArray: true, field: 'interface', isArray: false, targetType: 'interface' },
  { sourcePath: 'user.radius', sourceIsArray: true, field: 'interface', isArray: false, targetType: 'interface' },
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'srcintf', isArray: true, targetType: 'interface' },
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'dstintf', isArray: true, targetType: 'interface' },
  { sourcePath: 'system.interfaces', sourceIsArray: true, field: 'interface', isArray: false, targetType: 'interface' },

  // === Address references ===
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'srcaddr', isArray: true, targetType: 'address' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'srcaddr', isArray: true, targetType: 'addressGroup' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'dstaddr', isArray: true, targetType: 'address' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'dstaddr', isArray: true, targetType: 'addressGroup' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'dstaddr', isArray: true, targetType: 'vip' },
  { sourcePath: 'firewallAddrgrp', sourceIsArray: true, field: 'member', isArray: true, targetType: 'address' },
  { sourcePath: 'firewallAddrgrp', sourceIsArray: true, field: 'member', isArray: true, targetType: 'addressGroup' },
  { sourcePath: 'firewallAddrgrp', sourceIsArray: true, field: 'excludeMember', isArray: true, targetType: 'address' },
  { sourcePath: 'firewallVip', sourceIsArray: true, field: 'srcFilter', isArray: true, targetType: 'address' },
  { sourcePath: 'sdwan.rules', sourceIsArray: true, field: 'srcAddr', isArray: true, targetType: 'address' },
  { sourcePath: 'sdwan.rules', sourceIsArray: true, field: 'srcAddr', isArray: true, targetType: 'addressGroup' },
  { sourcePath: 'sdwan.rules', sourceIsArray: true, field: 'dstAddr', isArray: true, targetType: 'address' },
  { sourcePath: 'sdwan.rules', sourceIsArray: true, field: 'dstAddr', isArray: true, targetType: 'addressGroup' },
  { sourcePath: 'vpnSsl', sourceIsArray: false, field: 'source_address', isArray: true, targetType: 'address' },
  { sourcePath: 'vpnSsl.authentication_rules', sourceIsArray: true, field: 'source_address', isArray: true, targetType: 'address' },
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'srcaddr', isArray: true, targetType: 'address' },
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'srcaddr', isArray: true, targetType: 'addressGroup' },
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'dstaddr', isArray: true, targetType: 'address' },
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'dstaddr', isArray: true, targetType: 'addressGroup' },
  { sourcePath: 'securityProfiles.sslInspection', sourceIsArray: true, field: 'exemptedAddresses', isArray: true, targetType: 'address' },
  { sourcePath: 'securityProfiles.sslInspection', sourceIsArray: true, field: 'whitelistedAddresses', isArray: true, targetType: 'address' },
  { sourcePath: 'vpnIpsec.phase1', sourceIsArray: true, field: 'splitIncludeAccess', isArray: true, targetType: 'address' },
  { sourcePath: 'vpnSsl.portals', sourceIsArray: true, field: 'split_tunneling_routing_address', isArray: true, targetType: 'address' },

  // === Service references ===
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'service', isArray: true, targetType: 'service' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'service', isArray: true, targetType: 'serviceGroup' },
  { sourcePath: 'firewallServiceGroup', sourceIsArray: true, field: 'member', isArray: true, targetType: 'service' },
  { sourcePath: 'firewallServiceGroup', sourceIsArray: true, field: 'member', isArray: true, targetType: 'serviceGroup' },
  { sourcePath: 'sdwan.rules', sourceIsArray: true, field: 'service', isArray: true, targetType: 'service' },
  { sourcePath: 'sdwan.rules', sourceIsArray: true, field: 'service', isArray: true, targetType: 'serviceGroup' },
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'service', isArray: true, targetType: 'service' },
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'service', isArray: true, targetType: 'serviceGroup' },

  // === Schedule references ===
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'schedule', isArray: false, targetType: 'schedule' },

  // === IP Pool references ===
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'poolname', isArray: true, targetType: 'ippool' },
  { sourcePath: 'vpnSsl', sourceIsArray: false, field: 'tunnel_ip_pools', isArray: true, targetType: 'ippool' },
  { sourcePath: 'vpnSsl.portals', sourceIsArray: true, field: 'ip_pools', isArray: true, targetType: 'ippool' },

  // === VPN Phase 1 references ===
  { sourcePath: 'vpnIpsec.phase2', sourceIsArray: true, field: 'phase1name', isArray: false, targetType: 'vpnPhase1' },

  // === SDWAN Zone references ===
  { sourcePath: 'sdwan.members', sourceIsArray: true, field: 'zone', isArray: false, targetType: 'sdwanZone' },
  { sourcePath: 'router.static', sourceIsArray: true, field: 'sdwanZone', isArray: false, targetType: 'sdwanZone' },

  // === Security Profile references ===
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'avProfile', isArray: false, targetType: 'avProfile' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'webfilterProfile', isArray: false, targetType: 'webFilterProfile' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'dnsfilterProfile', isArray: false, targetType: 'dnsFilterProfile' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'ipsSensor', isArray: false, targetType: 'ipsProfile' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'applicationList', isArray: false, targetType: 'appControlProfile' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'sslSshProfile', isArray: false, targetType: 'sslInspectionProfile' },

  // === User references ===
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'groups', isArray: true, targetType: 'userGroup' },
  { sourcePath: 'firewallPolicy', sourceIsArray: true, field: 'users', isArray: true, targetType: 'localUser' },
  { sourcePath: 'vpnSsl.authentication_rules', sourceIsArray: true, field: 'groups', isArray: true, targetType: 'userGroup' },
  { sourcePath: 'vpnSsl.authentication_rules', sourceIsArray: true, field: 'users', isArray: true, targetType: 'localUser' },
  { sourcePath: 'user.local', sourceIsArray: true, field: 'ldapServer', isArray: false, targetType: 'ldapServer' },
  { sourcePath: 'user.local', sourceIsArray: true, field: 'radiusServer', isArray: false, targetType: 'radiusServer' },
  { sourcePath: 'user.group', sourceIsArray: true, field: 'member', isArray: true, targetType: 'localUser' },

  // === Traffic Shaper references ===
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'trafficShaper', isArray: false, targetType: 'trafficShaper' },
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'trafficShaperReverse', isArray: false, targetType: 'trafficShaper' },
  { sourcePath: 'trafficShaping.shapingPolicies', sourceIsArray: true, field: 'perIpShaper', isArray: false, targetType: 'trafficShaper' },

  // === SSL-VPN Portal references ===
  { sourcePath: 'vpnSsl.authentication_rules', sourceIsArray: true, field: 'portal', isArray: false, targetType: 'sslvpnPortal' },
  { sourcePath: 'vpnSsl', sourceIsArray: false, field: 'default_portal', isArray: false, targetType: 'sslvpnPortal' },

  // === Health Check references ===
  { sourcePath: 'sdwan.rules', sourceIsArray: true, field: 'healthCheck', isArray: false, targetType: 'healthCheck' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function getExistingNames(config: FortigateConfig, objectType: ObjectType): Set<string> {
  const path = OBJECT_TYPE_TO_PATH[objectType];
  const items = getNestedValue(config, path);
  if (!items || !Array.isArray(items)) return new Set();
  return new Set(items.map((item: any) => item.name as string));
}

// ---------------------------------------------------------------------------
// Cascading Rename
// ---------------------------------------------------------------------------

export function cascadeRename(
  config: FortigateConfig,
  targetType: ObjectType,
  oldName: string,
  newName: string,
): FortigateConfig {
  const result: any = JSON.parse(JSON.stringify(config));

  for (const def of REFERENCE_DEFS) {
    if (def.targetType !== targetType) continue;

    if (def.sourceIsArray) {
      const items = getNestedValue(result, def.sourcePath);
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        if (def.isArray) {
          const arr: string[] = item[def.field];
          if (!arr) continue;
          for (let i = 0; i < arr.length; i++) {
            if (arr[i] === oldName) arr[i] = newName;
          }
        } else {
          if (item[def.field] === oldName) item[def.field] = newName;
        }
      }
    } else {
      const obj = getNestedValue(result, def.sourcePath);
      if (!obj) continue;

      if (def.isArray) {
        const arr: string[] = obj[def.field];
        if (!arr) continue;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] === oldName) arr[i] = newName;
        }
      } else {
        if (obj[def.field] === oldName) obj[def.field] = newName;
      }
    }
  }

  return result as FortigateConfig;
}

// ---------------------------------------------------------------------------
// Orphan Detection
// ---------------------------------------------------------------------------

export interface OrphanedRef {
  field: string;
  missingName: string;
  targetType: ObjectType;
}

export function findOrphanedRefs(
  config: FortigateConfig,
  item: any,
  sourcePath: string,
  deletedNames: Record<string, string[]>,
): OrphanedRef[] {
  const orphans: OrphanedRef[] = [];
  const defs = REFERENCE_DEFS.filter((d) => d.sourcePath === sourcePath);

  for (const def of defs) {
    const values: string[] = def.isArray
      ? (item[def.field] || [])
      : item[def.field]
        ? [item[def.field]]
        : [];

    const existing = getExistingNames(config, def.targetType);
    const deleted = deletedNames[def.targetType] || [];

    for (const val of values) {
      if (!existing.has(val) && deleted.includes(val)) {
        if (!orphans.some((o) => o.field === def.field && o.missingName === val)) {
          orphans.push({ field: def.field, missingName: val, targetType: def.targetType });
        }
      }
    }
  }

  return orphans;
}

// ---------------------------------------------------------------------------
// Delete Impact Preview
// ---------------------------------------------------------------------------

export interface ReferenceHit {
  sourcePath: string;
  sourceLabel: string;
  field: string;
  count: number;
}

export function findReferencesTo(
  config: FortigateConfig,
  targetType: ObjectType,
  name: string,
): ReferenceHit[] {
  const hits: ReferenceHit[] = [];

  for (const def of REFERENCE_DEFS) {
    if (def.targetType !== targetType) continue;

    let count = 0;

    if (def.sourceIsArray) {
      const items = getNestedValue(config, def.sourcePath);
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        const values: string[] = def.isArray
          ? (item[def.field] || [])
          : item[def.field]
            ? [item[def.field]]
            : [];
        if (values.includes(name)) count++;
      }
    } else {
      const obj = getNestedValue(config, def.sourcePath);
      if (!obj) continue;
      const values: string[] = def.isArray
        ? (obj[def.field] || [])
        : obj[def.field]
          ? [obj[def.field]]
          : [];
      if (values.includes(name)) count++;
    }

    if (count > 0) {
      const existing = hits.find((h) => h.sourcePath === def.sourcePath && h.field === def.field);
      if (existing) {
        existing.count = Math.max(existing.count, count);
      } else {
        hits.push({
          sourcePath: def.sourcePath,
          sourceLabel: SOURCE_PATH_LABELS[def.sourcePath] || def.sourcePath,
          field: def.field,
          count,
        });
      }
    }
  }

  return hits;
}
