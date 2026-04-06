import React from 'react';
import MainLayout from './components/layout/MainLayout';
import { useProjectStore } from './store/projectStore';

// Lazy load all section components
import SystemSettings from './components/system/SystemSettings';
import Interfaces from './components/system/Interfaces';
import DHCPServers from './components/system/DHCPServers';
import Administrators from './components/system/Administrators';
import StaticRoutes from './components/network/StaticRoutes';
import PolicyRoutes from './components/network/PolicyRoutes';
import DNS from './components/network/DNS';
import FirewallPolicy from './components/policy/FirewallPolicy';
import Addresses from './components/policy/Addresses';
import AddressGroups from './components/policy/AddressGroups';
import Services from './components/policy/Services';
import ServiceGroups from './components/policy/ServiceGroups';
import Schedules from './components/policy/Schedules';
import VirtualIPs from './components/policy/VirtualIPs';
import IPPools from './components/policy/IPPools';
import AntivirusProfiles from './components/security/AntivirusProfiles';
import WebFilter from './components/security/WebFilter';
import DNSFilter from './components/security/DNSFilter';
import ApplicationControl from './components/security/ApplicationControl';
import IPS from './components/security/IPS';
import SSLInspection from './components/security/SSLInspection';
import IPsecTunnels from './components/vpn/IPsecTunnels';
import SSLVPNSettings from './components/vpn/SSLVPNSettings';
import SDWAN from './components/network-extra/SDWAN';
import TrafficShaping from './components/network-extra/TrafficShaping';
import LDAPServers from './components/user/LDAPServers';
import RADIUSServers from './components/user/RADIUSServers';
import LocalUsers from './components/user/LocalUsers';
import UserGroups from './components/user/UserGroups';

const sectionMap: Record<string, React.ComponentType> = {
  'system-settings': SystemSettings,
  'system-interfaces': Interfaces,
  'system-dhcp': DHCPServers,
  'system-admins': Administrators,
  'network-static-routes': StaticRoutes,
  'network-policy-routes': PolicyRoutes,
  'network-dns': DNS,
  'policy-firewall': FirewallPolicy,
  'policy-addresses': Addresses,
  'policy-address-groups': AddressGroups,
  'policy-services': Services,
  'policy-service-groups': ServiceGroups,
  'policy-schedules': Schedules,
  'policy-vips': VirtualIPs,
  'policy-ip-pools': IPPools,
  'security-antivirus': AntivirusProfiles,
  'security-webfilter': WebFilter,
  'security-dnsfilter': DNSFilter,
  'security-appcontrol': ApplicationControl,
  'security-ips': IPS,
  'security-ssl': SSLInspection,
  'vpn-ipsec': IPsecTunnels,
  'vpn-ssl': SSLVPNSettings,
  'sdwan-config': SDWAN,
  'traffic-shapers': TrafficShaping,
  'traffic-policies': TrafficShaping,
  'user-ldap': LDAPServers,
  'user-radius': RADIUSServers,
  'user-local': LocalUsers,
  'user-groups': UserGroups,
};

export default function App() {
  const activeSection = useProjectStore((s) => s.activeSection);
  const SectionComponent = sectionMap[activeSection] || SystemSettings;

  return (
    <MainLayout>
      <SectionComponent />
    </MainLayout>
  );
}
