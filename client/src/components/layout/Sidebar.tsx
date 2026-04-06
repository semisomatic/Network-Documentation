import React, { useState } from 'react';
import {
  Settings, Network, Shield, Globe, Lock, Layers, Users, Zap,
  ChevronDown, ChevronRight, Menu, Monitor, Server, Route, FileText,
  Key, Wifi, Database, BookOpen
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navStructure: NavItem[] = [
  {
    id: 'system',
    label: 'System',
    icon: Monitor,
    children: [
      { id: 'system-settings', label: 'Settings', icon: Settings },
      { id: 'system-interfaces', label: 'Interfaces', icon: Network },
      { id: 'system-dhcp', label: 'DHCP Servers', icon: Server },
      { id: 'system-admins', label: 'Administrators', icon: Users },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    icon: Globe,
    children: [
      { id: 'network-static-routes', label: 'Static Routes', icon: Route },
      { id: 'network-policy-routes', label: 'Policy Routes', icon: Route },
      { id: 'network-dns', label: 'DNS', icon: Globe },
    ],
  },
  {
    id: 'policy',
    label: 'Policy & Objects',
    icon: Shield,
    children: [
      { id: 'policy-firewall', label: 'Firewall Policy', icon: Shield },
      { id: 'policy-addresses', label: 'Addresses', icon: FileText },
      { id: 'policy-address-groups', label: 'Address Groups', icon: FileText },
      { id: 'policy-services', label: 'Services', icon: Layers },
      { id: 'policy-service-groups', label: 'Service Groups', icon: Layers },
      { id: 'policy-schedules', label: 'Schedules', icon: BookOpen },
      { id: 'policy-vips', label: 'Virtual IPs', icon: Network },
      { id: 'policy-ip-pools', label: 'IP Pools', icon: Database },
    ],
  },
  {
    id: 'security',
    label: 'Security Profiles',
    icon: Shield,
    children: [
      { id: 'security-antivirus', label: 'Antivirus', icon: Shield },
      { id: 'security-webfilter', label: 'Web Filter', icon: Globe },
      { id: 'security-dnsfilter', label: 'DNS Filter', icon: Globe },
      { id: 'security-appcontrol', label: 'Application Control', icon: Layers },
      { id: 'security-ips', label: 'Intrusion Prevention', icon: Shield },
      { id: 'security-ssl', label: 'SSL/SSH Inspection', icon: Lock },
    ],
  },
  {
    id: 'vpn',
    label: 'VPN',
    icon: Lock,
    children: [
      { id: 'vpn-ipsec', label: 'IPsec Tunnels', icon: Lock },
      { id: 'vpn-ssl', label: 'SSL-VPN', icon: Key },
    ],
  },
  {
    id: 'sdwan',
    label: 'SD-WAN',
    icon: Wifi,
    children: [
      { id: 'sdwan-config', label: 'SD-WAN Configuration', icon: Wifi },
    ],
  },
  {
    id: 'traffic',
    label: 'Traffic Shaping',
    icon: Zap,
    children: [
      { id: 'traffic-shapers', label: 'Traffic Shapers', icon: Zap },
      { id: 'traffic-policies', label: 'Shaping Policies', icon: Zap },
    ],
  },
  {
    id: 'user',
    label: 'User & Authentication',
    icon: Users,
    children: [
      { id: 'user-ldap', label: 'LDAP Servers', icon: Server },
      { id: 'user-radius', label: 'RADIUS Servers', icon: Server },
      { id: 'user-local', label: 'Local Users', icon: Users },
      { id: 'user-groups', label: 'User Groups', icon: Users },
    ],
  },
];

export default function Sidebar() {
  const { activeSection, setActiveSection, sidebarCollapsed, toggleSidebar } = useProjectStore();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    system: true,
    network: true,
    policy: true,
    security: false,
    vpn: false,
    sdwan: false,
    traffic: false,
    user: false,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-12 bg-forti-sidebar min-h-screen flex flex-col items-center py-4">
        <button onClick={toggleSidebar} className="text-forti-text-sidebar hover:text-white p-1">
          <Menu size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-forti-sidebar min-h-screen flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Shield className="text-forti-accent" size={24} />
          <span className="text-white font-semibold text-sm">FortiDoc</span>
        </div>
        <button onClick={toggleSidebar} className="text-forti-text-sidebar hover:text-white">
          <Menu size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navStructure.map((group) => (
          <div key={group.id}>
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-forti-text-sidebar hover:bg-forti-sidebar-hover transition-colors text-sm"
            >
              <div className="flex items-center space-x-2">
                <group.icon size={16} />
                <span className="font-medium">{group.label}</span>
              </div>
              {expandedGroups[group.id] ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>

            {expandedGroups[group.id] && group.children && (
              <div className="ml-4">
                {group.children.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-2 px-4 py-2 text-xs transition-colors ${
                      activeSection === item.id
                        ? 'bg-forti-sidebar-active text-forti-text-sidebar-active border-l-2 border-forti-accent'
                        : 'text-forti-text-sidebar hover:bg-forti-sidebar-hover hover:text-white'
                    }`}
                  >
                    <item.icon size={14} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
