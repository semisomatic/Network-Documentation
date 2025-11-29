import React, { useState } from 'react';
import { Search, Filter, Network, Shield, Lock, Layers, Menu, X, Download, Upload, Plus, Minus, Info, AlertTriangle, MessageSquare, Check, Settings, Zap, Globe, Key } from 'lucide-react';

const FirewallDocSystem = () => {
  const [activeTab, setActiveTab] = useState('policies');
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPolicy, setExpandedPolicy] = useState(null);
  const [showModuleConfig, setShowModuleConfig] = useState(false);
  const [customerMode, setCustomerMode] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activeComment, setActiveComment] = useState(null);
  
  // Module configuration - controls which components are visible
  const [enabledModules, setEnabledModules] = useState({
    policies: true,
    interfaces: true,
    vpn: true,
    sdwan: false,
    trafficShaper: false,
    sslVpn: false,
    securityProfiles: false,
    dhcp: false,
    dns: false,
    routing: true
  });

  const availableModules = [
    { id: 'policies', name: 'Firewall Policies', icon: Shield, description: 'Security policies and rules' },
    { id: 'interfaces', name: 'Network Interfaces', icon: Network, description: 'Physical and virtual interfaces' },
    { id: 'vpn', name: 'IPsec VPN Tunnels', icon: Lock, description: 'Site-to-site VPN configurations' },
    { id: 'sdwan', name: 'SD-WAN Rules', icon: Layers, description: 'SD-WAN policies and SLA requirements' },
    { id: 'trafficShaper', name: 'Traffic Shaping', icon: Zap, description: 'Bandwidth management and QoS' },
    { id: 'sslVpn', name: 'SSL VPN', icon: Key, description: 'Remote access VPN configuration' },
    { id: 'securityProfiles', name: 'Security Profiles', icon: Shield, description: 'AV, IPS, Web filtering profiles' },
    { id: 'dhcp', name: 'DHCP Server', icon: Network, description: 'DHCP scopes and reservations' },
    { id: 'dns', name: 'DNS Settings', icon: Globe, description: 'DNS servers and domain settings' },
    { id: 'routing', name: 'Static Routes', icon: Network, description: 'Static routing configuration' }
  ];
  
  // Comments storage - in production this would be in a database
  const [comments, setComments] = useState({
    policy_1: [
      { id: 1, author: 'John Smith (Customer)', text: 'Can we add FTP to this rule as well?', timestamp: '2025-04-08 10:30', status: 'open', type: 'question' }
    ],
    policy_3: [
      { id: 2, author: 'Sarah Johnson (Customer)', text: 'We need this to only apply during business hours (8am-6pm)', timestamp: '2025-04-08 11:15', status: 'open', type: 'change_request' }
    ]
  });

  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('question');
  
  // Sample data
  const policies = [
    { id: 1, name: "Internet Access", srcintf: "LAN", dstintf: "WAN", srcaddr: "Internal_Network", dstaddr: "all", service: "HTTP, HTTPS", action: "accept", nat: true, status: "enabled", priority: "high", lastModified: "2025-03-15", creator: "admin", purpose: "Allow internal users to access web services" },
    { id: 2, name: "Block Social Media", srcintf: "LAN", dstintf: "WAN", srcaddr: "Internal_Network", dstaddr: "Social_Media", service: "HTTP, HTTPS", action: "deny", nat: false, status: "enabled", priority: "medium", lastModified: "2025-03-10", creator: "admin", purpose: "Restrict access to social media sites during business hours" },
    { id: 3, name: "VPN Access", srcintf: "WAN", dstintf: "LAN", srcaddr: "Remote_Users", dstaddr: "Internal_Servers", service: "SSH, RDP", action: "accept", nat: false, status: "enabled", priority: "high", lastModified: "2025-04-01", creator: "admin", purpose: "Allow remote employees to access internal resources" },
    { id: 4, name: "Database Traffic", srcintf: "DMZ", dstintf: "LAN", srcaddr: "Web_Servers", dstaddr: "DB_Servers", service: "MySQL, MSSQL", action: "accept", nat: false, status: "enabled", priority: "critical", lastModified: "2025-03-25", creator: "admin", purpose: "Allow application servers to communicate with databases" },
    { id: 5, name: "Block Malicious IPs", srcintf: "WAN", dstintf: "any", srcaddr: "Threat_Feed", dstaddr: "any", service: "any", action: "deny", nat: false, status: "enabled", priority: "critical", lastModified: "2025-04-05", creator: "system", purpose: "Block known malicious IP addresses" },
  ];
  
  const interfaces = [
    { id: 1, name: "WAN1", type: "Physical", ip: "203.0.113.1/24", zone: "WAN", status: "up", bandwidth: "1 Gbps", vlan: "N/A" },
    { id: 2, name: "LAN", type: "Physical", ip: "192.168.1.1/24", zone: "Internal", status: "up", bandwidth: "1 Gbps", vlan: "N/A" },
    { id: 3, name: "DMZ", type: "Physical", ip: "192.168.2.1/24", zone: "DMZ", status: "up", bandwidth: "1 Gbps", vlan: "N/A" },
    { id: 4, name: "GUEST", type: "VLAN", ip: "192.168.3.1/24", zone: "Guest", status: "up", bandwidth: "100 Mbps", vlan: "10" },
  ];

  const vpnTunnels = [
    { id: 1, name: "HQ-to-Branch1", type: "IPsec", localGateway: "203.0.113.1", remoteGateway: "198.51.100.1", encryptionAlgo: "AES-256", hashAlgo: "SHA-256", dhGroup: "14", ikev: "2", status: "up", lastStateChange: "2025-04-06 08:15" },
    { id: 2, name: "HQ-to-Cloud", type: "IPsec", localGateway: "203.0.113.1", remoteGateway: "34.218.162.10", encryptionAlgo: "AES-256", hashAlgo: "SHA-256", dhGroup: "14", ikev: "2", status: "up", lastStateChange: "2025-04-07 10:30" },
  ];

  const sdwanRules = [
    { id: 1, name: "Critical-Traffic", srcaddr: "Internal_Network", dstaddr: "ERP_Cloud", service: "HTTPS", outgoingInterface: "WAN1", priority: 1, sla: "SLA_Premium" },
    { id: 2, name: "Normal-Web", srcaddr: "Internal_Network", dstaddr: "all", service: "HTTP, HTTPS", outgoingInterface: "WAN2", priority: 2, sla: "SLA_Standard" },
  ];

  const trafficShapers = [
    { id: 1, name: "VoIP_Priority", maxBandwidth: "10 Mbps", guaranteedBandwidth: "5 Mbps", priority: "high", matchingTraffic: "SIP, RTP" },
    { id: 2, name: "Web_Traffic", maxBandwidth: "50 Mbps", guaranteedBandwidth: "20 Mbps", priority: "medium", matchingTraffic: "HTTP, HTTPS" },
  ];

  const sslVpnConfig = [
    { id: 1, name: "Remote Workers", portal: "full-access", authMethod: "LDAP", splitTunneling: "enabled", ipPool: "10.10.10.100-10.10.10.200" },
    { id: 2, name: "Contractors", portal: "limited-access", authMethod: "Local", splitTunneling: "disabled", ipPool: "10.10.11.100-10.10.11.150" },
  ];

  const securityProfiles = [
    { id: 1, name: "Corporate_AV", type: "Antivirus", action: "block", updateFrequency: "Real-time", scanOptions: "All files" },
    { id: 2, name: "Corporate_IPS", type: "IPS", action: "block", severity: "medium-high-critical", updateFrequency: "Daily" },
    { id: 3, name: "Corporate_WebFilter", type: "Web Filter", categories: "Adult, Gambling, Malware", action: "block" },
  ];

  const staticRoutes = [
    { id: 1, destination: "10.20.0.0/16", gateway: "192.168.1.254", interface: "LAN", distance: "10", comment: "Route to Branch Office" },
    { id: 2, destination: "172.16.0.0/12", gateway: "203.0.113.254", interface: "WAN1", distance: "5", comment: "Default route via WAN1" },
  ];

  // Filter displayed policies based on search
  const filteredPolicies = policies.filter(policy => 
    policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.srcaddr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.dstaddr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleModule = (moduleId) => {
    setEnabledModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const openCommentModal = (itemType, itemId) => {
    setActiveComment({ type: itemType, id: itemId });
    setShowCommentModal(true);
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    
    const commentKey = `${activeComment.type}_${activeComment.id}`;
    const comment = {
      id: Date.now(),
      author: customerMode ? 'Customer User' : 'Internal User',
      text: newComment,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'open',
      type: commentType
    };

    setComments(prev => ({
      ...prev,
      [commentKey]: [...(prev[commentKey] || []), comment]
    }));

    setNewComment('');
    setShowCommentModal(false);
  };

  const getCommentsForItem = (itemType, itemId) => {
    const key = `${itemType}_${itemId}`;
    return comments[key] || [];
  };

  const renderCommentBadge = (itemType, itemId) => {
    const itemComments = getCommentsForItem(itemType, itemId);
    if (itemComments.length === 0) return null;

    const openComments = itemComments.filter(c => c.status === 'open').length;
    
    return (
      <div className="flex items-center ml-2">
        <MessageSquare 
          size={16} 
          className={`${openComments > 0 ? 'text-orange-500' : 'text-green-500'}`}
        />
        <span className={`ml-1 text-xs ${openComments > 0 ? 'text-orange-500' : 'text-green-500'}`}>
          {itemComments.length}
        </span>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'policies':
        return viewMode === 'table' ? renderPoliciesTable() : renderPoliciesVisual();
      case 'interfaces':
        return renderInterfacesTable();
      case 'vpn':
        return renderVPNTable();
      case 'sdwan':
        return renderSDWANTable();
      case 'trafficShaper':
        return renderTrafficShaperTable();
      case 'sslVpn':
        return renderSSLVPNTable();
      case 'securityProfiles':
        return renderSecurityProfilesTable();
      case 'routing':
        return renderRoutingTable();
      default:
        return renderPoliciesTable();
    }
  };

  const renderPoliciesTable = () => (
    <div className="overflow-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredPolicies.map(policy => (
            <React.Fragment key={policy.id}>
              <tr 
                className={`hover:bg-gray-50 cursor-pointer ${expandedPolicy === policy.id ? 'bg-blue-50' : ''}`}
                onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{policy.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{policy.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Int: {policy.srcintf}</div>
                  <div>Addr: {policy.srcaddr}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Int: {policy.dstintf}</div>
                  <div>Addr: {policy.dstaddr}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{policy.service}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${policy.action === 'accept' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {policy.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${policy.status === 'enabled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {policy.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openCommentModal('policy', policy.id);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <MessageSquare size={16} />
                    </button>
                    {renderCommentBadge('policy', policy.id)}
                  </div>
                </td>
              </tr>
              {expandedPolicy === policy.id && (
                <tr>
                  <td colSpan="8" className="px-6 py-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Policy Details</h4>
                        <dl className="mt-2 text-sm text-gray-500">
                          <div className="mt-1">
                            <dt className="font-medium">Priority:</dt>
                            <dd>{policy.priority}</dd>
                          </div>
                          <div className="mt-1">
                            <dt className="font-medium">NAT:</dt>
                            <dd>{policy.nat ? 'Enabled' : 'Disabled'}</dd>
                          </div>
                          <div className="mt-1">
                            <dt className="font-medium">Last Modified:</dt>
                            <dd>{policy.lastModified}</dd>
                          </div>
                          <div className="mt-1">
                            <dt className="font-medium">Created By:</dt>
                            <dd>{policy.creator}</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Purpose & Notes</h4>
                        <p className="mt-2 text-sm text-gray-500">{policy.purpose}</p>
                        
                        {/* Display comments */}
                        {getCommentsForItem('policy', policy.id).length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Comments:</h5>
                            {getCommentsForItem('policy', policy.id).map(comment => (
                              <div key={comment.id} className={`mb-2 p-2 rounded text-xs ${comment.type === 'question' ? 'bg-blue-50 border-l-2 border-blue-400' : 'bg-orange-50 border-l-2 border-orange-400'}`}>
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium">{comment.author}</span>
                                  <span className="text-gray-500">{comment.timestamp}</span>
                                </div>
                                <p className="text-gray-700">{comment.text}</p>
                                <div className="mt-1 flex items-center space-x-2">
                                  <span className={`px-2 py-0.5 rounded text-xs ${comment.type === 'question' ? 'bg-blue-200 text-blue-800' : 'bg-orange-200 text-orange-800'}`}>
                                    {comment.type === 'question' ? 'Question' : 'Change Request'}
                                  </span>
                                  {!customerMode && (
                                    <button className="text-green-600 hover:text-green-800 text-xs">Mark Resolved</button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {!customerMode && (
                          <div className="mt-4 flex space-x-2">
                            <button className="px-3 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50">Edit</button>
                            <button className="px-3 py-1 text-xs text-red-600 border border-red-600 rounded hover:bg-red-50">Delete</button>
                            <button className="px-3 py-1 text-xs text-green-600 border border-green-600 rounded hover:bg-green-50">Clone</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPoliciesVisual = () => (
    <div className="p-4 bg-gray-50 min-h-96 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block border border-gray-300 rounded-lg p-8 bg-white">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex space-x-10">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-300">
                  <div className="text-blue-600 font-medium">LAN Zone</div>
                </div>
                <div className="mt-2 text-sm text-gray-600">192.168.1.0/24</div>
              </div>
              
              <div className="flex flex-col space-y-3">
                {filteredPolicies.map(policy => (
                  <div key={policy.id} className={`h-8 px-3 flex items-center text-xs font-medium rounded ${policy.action === 'accept' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                    {policy.name}
                    <span className="ml-2 text-gray-500">({policy.service})</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-300">
                  <div className="text-gray-600 font-medium">WAN Zone</div>
                </div>
                <div className="mt-2 text-sm text-gray-600">Internet</div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              Visual network flow representation. Hover over connections for details.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInterfacesTable = () => (
    <div className="overflow-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandwidth</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VLAN</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {interfaces.map(interface_ => (
            <tr key={interface_.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{interface_.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{interface_.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{interface_.type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{interface_.ip}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{interface_.zone}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${interface_.status === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {interface_.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{interface_.bandwidth}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{interface_.vlan}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  onClick={() => openCommentModal('interface', interface_.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <MessageSquare size={16} />
                </button>
                {renderCommentBadge('interface', interface_.id)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderVPNTable = () => (
    <div className="overflow-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local Gateway</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remote Gateway</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Encryption</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {vpnTunnels.map(tunnel => (
            <tr key={tunnel.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tunnel.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tunnel.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tunnel.type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tunnel.localGateway}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tunnel.remoteGateway}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tunnel.encryptionAlgo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tunnel.status === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {tunnel.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  onClick={() => openCommentModal('vpn', tunnel.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <MessageSquare size={16} />
                </button>
                {renderCommentBadge('vpn', tunnel.id)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSDWANTable = () => (
    <div className="overflow-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outgoing Interface</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sdwanRules.map(rule => (
            <tr key={rule.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rule.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.srcaddr}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.dstaddr}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.service}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.outgoingInterface}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.priority}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.sla}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  onClick={() => openCommentModal('sdwan', rule.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <MessageSquare size={16} />
                </button>
                {renderCommentBadge('sdwan', rule.id)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTrafficShaperTable = () => (
    <div className="overflow-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Bandwidth</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guaranteed Bandwidth</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matching Traffic</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {trafficShapers.map(shaper => (
            <tr key={shaper.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shaper.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shaper.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shaper.maxBandwidth}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shaper.guaranteedBandwidth}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shaper.priority}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shaper.matchingTraffic}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  onClick={() => openCommentModal('trafficShaper', shaper.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <MessageSquare size={16} />
                </button>
                {renderCommentBadge('trafficShaper', shaper.id)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSSLVPNTable = () => (
    <div className="overflow-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portal</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth Method</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Split Tunneling</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Pool</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sslVpnConfig.map(config => (
            <tr key={config.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{config.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.portal}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.authMethod}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.splitTunneling}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.ipPool}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  onClick={() => openCommentModal('sslVpn', config.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <MessageSquare size={16} />
                </button>
                {renderCommentBadge('sslVpn', config.id)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSecurityProfilesTable = () => (
    <div className="overflow-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {securityProfiles.map(profile => (
            <tr key={profile.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{profile.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.action}</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {profile.scanOptions && <div>Scan: {profile.scanOptions}</div>}
                {profile.severity && <div>Severity: {profile.severity}</div>}
                {profile.categories && <div>Categories: {profile.categories}</div>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  onClick={() => openCommentModal('securityProfile', profile.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <MessageSquare size={16} />
                </button>
                {renderCommentBadge('securityProfile', profile.id)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderRoutingTable = () => (
    <div className="overflow-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gateway</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interface</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {staticRoutes.map(route => (
            <tr key={route.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.destination}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.gateway}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.interface}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.distance}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{route.comment}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  onClick={() => openCommentModal('route', route.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <MessageSquare size={16} />
                </button>
                {renderCommentBadge('route', route.id)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-16 bg-gray-800 text-white flex flex-col items-center py-4">
        <div className="mb-8">
          <Shield size={24} className="text-blue-400" />
        </div>
        {availableModules.filter(m => enabledModules[m.id]).map(module => {
          const Icon = module.icon;
          return (
            <button 
              key={module.id}
              className={`p-3 rounded-lg mb-4 ${activeTab === module.id ? 'bg-blue-500' : 'hover:bg-gray-700'}`}
              onClick={() => setActiveTab(module.id)}
              title={module.name}
            >
              <Icon size={20} />
            </button>
          );
        })}
        <div className="mt-auto">
          <button 
            className="p-3 rounded-lg hover:bg-gray-700"
            onClick={() => setShowModuleConfig(!showModuleConfig)}
            title="Configure Modules"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">Firewall Documentation System</h1>
              <div className="ml-6 text-sm text-gray-500">Company: Acme Corp | Device: FW-HQ-01 | Last Updated: April 8, 2025</div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={customerMode}
                  onChange={(e) => setCustomerMode(e.target.checked)}
                  className="mr-2"
                />
                Customer View Mode
              </label>
              <button className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 flex items-center">
                <Download size={16} className="mr-1" /> Export PDF
              </button>
              {!customerMode && (
                <button className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50 flex items-center">
                  <Upload size={16} className="mr-1" /> Import Config
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center px-4 py-2 border-t">
            <div className="flex space-x-1">
              {activeTab === 'policies' && (
                <>
                  <button 
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'table' ? 'bg-gray-200 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setViewMode('table')}
                  >
                    Table View
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'visual' ? 'bg-gray-200 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setViewMode('visual')}
                  >
                    Visual View
                  </button>
                </>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-8 pr-4 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} className="absolute left-2.5 top-2 text-gray-400" />
            </div>
          </div>
        </header>
        
        {/* Tab title */}
        <div className="bg-white border-b px-4 py-2">
          <h2 className="text-lg font-medium text-gray-800 capitalize">
            {availableModules.find(m => m.id === activeTab)?.name || 'Configuration'}
          </h2>
        </div>

        {/* Tab content */}
        <main className="flex-1 overflow-auto bg-white">
          {renderTabContent()}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t px-4 py-2 text-sm text-gray-500 flex justify-between items-center">
          <div>
            {Object.values(comments).flat().filter(c => c.status === 'open').length > 0 && (
              <div className="flex items-center space-x-2">
                <AlertTriangle size={16} className="text-orange-500" />
                <span>{Object.values(comments).flat().filter(c => c.status === 'open').length} open comments from customer</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {customerMode ? 'Customer View - Read Only with Comments' : 'Internal View - Full Access'}
          </div>
        </footer>
      </div>

      {/* Module Configuration Modal */}
      {showModuleConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Configure Modules</h3>
              <button onClick={() => setShowModuleConfig(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {availableModules.map(module => {
                const Icon = module.icon;
                return (
                  <div key={module.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={enabledModules[module.id]}
                      onChange={() => toggleModule(module.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Icon size={16} className="text-gray-600" />
                        <span className="font-medium text-sm">{module.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{module.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowModuleConfig(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Comment</h3>
              <button onClick={() => setShowCommentModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment Type</label>
                <select 
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="question">Question</option>
                  <option value="change_request">Change Request</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Comment</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="4"
                  placeholder="Enter your comment or question..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button 
                onClick={() => setShowCommentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={addComment}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirewallDocSystem;
