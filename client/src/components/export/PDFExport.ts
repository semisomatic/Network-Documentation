// ============================================================================
// PDF Export - Generates Fortigate GUI-styled PDF documentation
// Uses jspdf + jspdf-autotable for table generation
// ============================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FortigateProject } from '../../types/fortigate';

// Fortigate color constants
const FORTI_DARK = [30, 42, 58] as const;    // #1e2a3a - sidebar/header
const FORTI_ACCENT = [59, 130, 246] as const;  // #3b82f6 - accent blue
const FORTI_GRAY = [100, 116, 139] as const;   // #64748b - secondary text
const WHITE = [255, 255, 255] as const;

// TOC entry tracking for internal links
interface TocEntry {
  title: string;
  tocPage: number;
  tocY: number;
  targetPage?: number;
}

function addSection(
  doc: jsPDF,
  title: string,
  yPos: number,
  tocEntries?: TocEntry[],
  tocTitle?: string,
): number {
  if (yPos > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    yPos = 20;
  }
  // Record the target page for TOC linking
  if (tocEntries) {
    const lookup = tocTitle || title;
    const entry = tocEntries.find((e) => e.title === lookup && !e.targetPage);
    if (entry) {
      entry.targetPage = (doc as any).internal.pages.length - 1;
    }
  }
  doc.setFillColor(...FORTI_DARK);
  doc.rect(14, yPos, doc.internal.pageSize.getWidth() - 28, 10, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 18, yPos + 7);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  return yPos + 14;
}

function addTable(doc: jsPDF, headers: string[], rows: string[][], startY: number): number {
  autoTable(doc, {
    startY,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [232, 237, 242],
      textColor: [100, 116, 139],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 249, 251],
    },
    margin: { left: 14, right: 14 },
    styles: {
      lineColor: [222, 226, 232],
      lineWidth: 0.25,
    },
  });
  return (doc as any).lastAutoTable.finalY + 8;
}

function addKeyValueTable(doc: jsPDF, data: [string, string][], startY: number): number {
  return addTable(
    doc,
    ['Setting', 'Value'],
    data.filter(([_, v]) => v && v !== '0' && v !== 'false'),
    startY,
  );
}

export async function generatePDF(project: FortigateProject) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const c = project.config;

  // ==================== COVER PAGE ====================
  doc.setFillColor(...FORTI_DARK);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFillColor(...FORTI_ACCENT);
  doc.rect(0, 60, pageWidth, 3, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('Firewall Design Document', pageWidth / 2, 90, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(project.name, pageWidth / 2, 110, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(200, 214, 229);
  const infoLines = [
    `Hostname: ${c.system.global.hostname}`,
    `Model: ${project.model}`,
    `FortiOS: ${project.fortiosVersion}`,
    `Date: ${new Date().toLocaleDateString()}`,
  ];
  infoLines.forEach((line, i) => {
    doc.text(line, pageWidth / 2, 135 + i * 10, { align: 'center' });
  });

  doc.setFillColor(...FORTI_ACCENT);
  doc.rect(0, pageHeight - 70, pageWidth, 3, 'F');

  doc.setTextColor(200, 214, 229);
  doc.setFontSize(10);
  doc.text('Prepared by: _________________________________', 30, pageHeight - 50);
  doc.text('Date: _______________', 30, pageHeight - 40);
  doc.text('Approved by: _________________________________', 30, pageHeight - 25);
  doc.text('Date: _______________', 30, pageHeight - 15);

  // ==================== TABLE OF CONTENTS ====================
  doc.addPage();
  doc.setTextColor(0, 0, 0);
  let y = 20;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', 14, y);
  y += 12;

  // Build TOC section list in the desired order:
  // Move policies, addresses, address groups, services, service groups to end (before signature)
  const sections: string[] = [];
  sections.push('System Settings');
  if (c.system.interfaces.length) sections.push('Network Interfaces');
  if (c.router.static.length) sections.push('Static Routes');
  if (c.router.policy.length) sections.push('Policy Routes');
  if (c.router.bgp.as) sections.push('BGP');
  if (c.router.ospf.routerId || c.router.ospf.networks.length) sections.push('OSPF');
  if (c.firewallSchedule.length) sections.push('Schedules');
  if (c.firewallVip.length) sections.push('Virtual IPs');
  if (c.firewallIppool.length) sections.push('IP Pools');
  if (c.securityProfiles.antivirus.length) sections.push('Antivirus Profiles');
  if (c.securityProfiles.webFilter.length) sections.push('Web Filter Profiles');
  if (c.securityProfiles.ips.length) sections.push('IPS Profiles');
  if (c.securityProfiles.applicationControl.length) sections.push('Application Control');
  if (c.securityProfiles.sslInspection.length) sections.push('SSL Inspection');
  if (c.vpnIpsec.phase1.length) sections.push('IPsec VPN');
  if (c.system.dhcpServers.length) sections.push('DHCP Servers');
  if (c.user.ldap.length) sections.push('LDAP Servers');
  if (c.user.radius.length) sections.push('RADIUS Servers');
  if (c.user.local.length) sections.push('Local Users');
  if (c.user.group.length) sections.push('User Groups');
  // --- Moved sections (before signature) ---
  if (c.firewallPolicy.length) sections.push('Firewall Policies');
  if (c.firewallAddress.length) sections.push('Firewall Addresses');
  if (c.firewallAddrgrp.length) sections.push('Address Groups');
  if (c.firewallService.length) sections.push('Firewall Services');
  if (c.firewallServiceGroup.length) sections.push('Service Groups');
  sections.push('Signature Page');

  // Render TOC entries as blue links and track positions
  const tocEntries: TocEntry[] = [];
  const tocStartPage = (doc as any).internal.pages.length - 1;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  sections.forEach((s, i) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    const currentPage = (doc as any).internal.pages.length - 1;
    tocEntries.push({ title: s, tocPage: currentPage, tocY: y });
    // Render as blue text to indicate clickable
    doc.setTextColor(...FORTI_ACCENT);
    doc.text(`${i + 1}. ${s}`, 20, y);
    doc.setTextColor(0, 0, 0);
    y += 7;
  });

  // ==================== CONTENT PAGES ====================
  doc.addPage();
  y = 20;

  // --- System Settings ---
  y = addSection(doc, 'System Settings', y, tocEntries);
  y = addKeyValueTable(doc, [
    ['Hostname', c.system.global.hostname],
    ['Timezone', c.system.global.timezone],
    ['Admin HTTPS Port', String(c.system.global.adminSport)],
    ['Admin SSH Port', String(c.system.global.adminSSHPort)],
    ['Admin Timeout', `${c.system.global.admintimeout} min`],
    ['Strong Crypto', c.system.global.strongCrypto ? 'Enabled' : 'Disabled'],
    ['SSL Min Version', c.system.global.sslMinProtoVersion],
    ['DNS Primary', c.system.dns.primary],
    ['DNS Secondary', c.system.dns.secondary],
  ], y);

  // --- Interfaces ---
  if (c.system.interfaces.length) {
    const zoneMap = new Map<string, string>();
    for (const z of c.system.zones) {
      for (const intf of z.interface) zoneMap.set(intf, z.name);
    }
    y = addSection(doc, 'Network Interfaces', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Type', 'IP Address', 'Netmask', 'Role', 'Zone', 'Admin Access'],
      c.system.interfaces.map(i => [i.name, i.type, i.ip, i.netmask, i.role, zoneMap.get(i.name) || '', i.allowaccess.join(', ')]),
      y,
    );
  }

  // --- Static Routes ---
  if (c.router.static.length) {
    y = addSection(doc, 'Static Routes', y, tocEntries);
    y = addTable(doc,
      ['Seq', 'Destination', 'Gateway', 'Interface', 'Distance', 'Status', 'Comment'],
      c.router.static.map(r => [String(r.seqNum), r.dstaddr || r.dst, r.gateway, r.device, String(r.distance), r.status, r.comment]),
      y,
    );
  }

  // --- Policy Routes ---
  if (c.router.policy.length) {
    y = addSection(doc, 'Policy Routes', y, tocEntries);
    y = addTable(doc,
      ['Seq', 'Source', 'Destination', 'Protocol', 'Gateway', 'Output', 'Status', 'Comments'],
      c.router.policy.map(r => [String(r.seqNum), r.src, r.dst, String(r.protocol), r.gateway, r.outputDevice, r.status, r.comments]),
      y,
    );
  }

  // --- BGP ---
  if (c.router.bgp.as) {
    y = addSection(doc, 'BGP', y, tocEntries);
    y = addKeyValueTable(doc, [
      ['AS Number', String(c.router.bgp.as)],
      ['Router ID', c.router.bgp.routerId],
      ['eBGP Multipath', c.router.bgp.ebgpMultipath ? 'Yes' : 'No'],
      ['iBGP Multipath', c.router.bgp.ibgpMultipath ? 'Yes' : 'No'],
      ['Graceful Restart', c.router.bgp.gracefulRestart ? 'Yes' : 'No'],
    ], y);
    if (c.router.bgp.neighbors.length) {
      y = addTable(doc,
        ['Neighbor', 'Remote AS', 'Update Source', 'Next-Hop Self', 'Route Map In', 'Route Map Out', 'Description'],
        c.router.bgp.neighbors.map(n => [n.ip, String(n.remoteAs), n.updateSource, n.nextHopSelf ? 'Yes' : 'No', n.routeMapIn, n.routeMapOut, n.description]),
        y,
      );
    }
    if (c.router.bgp.networks.length) {
      y = addTable(doc,
        ['ID', 'Prefix', 'Route Map'],
        c.router.bgp.networks.map(n => [String(n.id), n.prefix, n.routeMap]),
        y,
      );
    }
  }

  // --- OSPF ---
  if (c.router.ospf.routerId || c.router.ospf.networks.length) {
    y = addSection(doc, 'OSPF', y, tocEntries);
    y = addKeyValueTable(doc, [
      ['Router ID', c.router.ospf.routerId],
      ['Default Metric', String(c.router.ospf.defaultMetric)],
      ['Default Info Originate', c.router.ospf.defaultInformationOriginate ? 'Yes' : 'No'],
    ], y);
    if (c.router.ospf.areas.length) {
      y = addTable(doc,
        ['Area ID', 'Type', 'Authentication', 'Comment'],
        c.router.ospf.areas.map(a => [a.id, a.type, a.authentication, a.comment]),
        y,
      );
    }
    if (c.router.ospf.networks.length) {
      y = addTable(doc,
        ['ID', 'Prefix', 'Area'],
        c.router.ospf.networks.map(n => [String(n.id), n.prefix, n.area]),
        y,
      );
    }
    if (c.router.ospf.ospfInterfaces.length) {
      y = addTable(doc,
        ['Interface', 'Cost', 'Priority', 'Hello', 'Dead', 'Network Type'],
        c.router.ospf.ospfInterfaces.map(i => [i.name, String(i.cost), String(i.priority), String(i.helloInterval), String(i.deadInterval), i.networkType]),
        y,
      );
    }
  }

  // --- Schedules ---
  if (c.firewallSchedule.length) {
    y = addSection(doc, 'Schedules', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Type'],
      c.firewallSchedule.map(s => [s.name, s.type]),
      y,
    );
  }

  // --- VIPs ---
  if (c.firewallVip.length) {
    y = addSection(doc, 'Virtual IPs', y, tocEntries);
    y = addTable(doc,
      ['Name', 'External IP', 'Mapped IP', 'Interface', 'Port Forward', 'Comment'],
      c.firewallVip.map(v => [
        v.name, v.extip, v.mappedip.join(', '), v.extintf,
        v.portforward ? `${v.protocol} ${v.extport}→${v.mappedport}` : 'No', v.comment,
      ]),
      y,
    );
  }

  // --- IP Pools ---
  if (c.firewallIppool.length) {
    y = addSection(doc, 'IP Pools', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Type', 'Start IP', 'End IP', 'Comments'],
      c.firewallIppool.map(p => [p.name, p.type, p.startip, p.endip, p.comments]),
      y,
    );
  }

  // --- Security Profiles ---
  if (c.securityProfiles.antivirus.length) {
    y = addSection(doc, 'Antivirus Profiles', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Scan Mode', 'HTTP', 'FTP', 'SMTP', 'Comment'],
      c.securityProfiles.antivirus.map(a => [a.name, a.scanMode, a.httpAction, a.ftpAction, a.smtpAction, a.comment]),
      y,
    );
  }

  if (c.securityProfiles.webFilter.length) {
    y = addSection(doc, 'Web Filter Profiles', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Safe Search', 'YouTube', 'Comment'],
      c.securityProfiles.webFilter.map(w => [w.name, w.safeSearch, w.youtubeRestrict, w.comment]),
      y,
    );
  }

  if (c.securityProfiles.ips.length) {
    y = addSection(doc, 'IPS Profiles', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Block Malicious URL', 'Botnet Scanning', 'Comment'],
      c.securityProfiles.ips.map(i => [i.name, i.blockMaliciousUrl ? 'Yes' : 'No', i.scanBotnetConnections, i.comment]),
      y,
    );
  }

  if (c.securityProfiles.applicationControl.length) {
    y = addSection(doc, 'Application Control', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Comment'],
      c.securityProfiles.applicationControl.map(a => [a.name, a.comment]),
      y,
    );
  }

  if (c.securityProfiles.sslInspection.length) {
    y = addSection(doc, 'SSL Inspection', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Comment'],
      c.securityProfiles.sslInspection.map(s => [s.name, s.comment]),
      y,
    );
  }

  // --- VPN ---
  if (c.vpnIpsec.phase1.length) {
    y = addSection(doc, 'IPsec VPN - Phase 1', y, tocEntries, 'IPsec VPN');
    y = addTable(doc,
      ['Name', 'Interface', 'Remote GW', 'IKE Ver', 'Proposal', 'DH Group', 'Auth'],
      c.vpnIpsec.phase1.map(p => [p.name, p.interface, p.remoteGw, p.ikeVersion, p.proposal.join(','), p.dhgrp.join(','), p.authMethod]),
      y,
    );
  }

  if (c.vpnIpsec.phase2.length) {
    y = addSection(doc, 'IPsec VPN - Phase 2', y);
    y = addTable(doc,
      ['Name', 'Phase1', 'Proposal', 'PFS', 'Src Subnet', 'Dst Subnet'],
      c.vpnIpsec.phase2.map(p => [p.name, p.phase1name, p.proposal.join(','), p.pfs, p.srcSubnet, p.dstSubnet]),
      y,
    );
  }

  // --- DHCP ---
  if (c.system.dhcpServers.length) {
    y = addSection(doc, 'DHCP Servers', y, tocEntries);
    y = addTable(doc,
      ['ID', 'Interface', 'Gateway', 'Netmask', 'DNS 1', 'DNS 2', 'Status', 'Comments'],
      c.system.dhcpServers.map(d => [String(d.id), d.interface, d.defaultGateway, d.netmask, d.dnsServer1, d.dnsServer2, d.status, d.comments]),
      y,
    );
  }

  // --- User ---
  if (c.user.ldap.length) {
    y = addSection(doc, 'LDAP Servers', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Server', 'Port', 'DN', 'Secure'],
      c.user.ldap.map(l => [l.name, l.server, String(l.port), l.dn, l.secure]),
      y,
    );
  }

  if (c.user.radius.length) {
    y = addSection(doc, 'RADIUS Servers', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Server', 'Port', 'Auth Type'],
      c.user.radius.map(r => [r.name, r.server, String(r.port), r.authType]),
      y,
    );
  }

  if (c.user.local.length) {
    y = addSection(doc, 'Local Users', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Type', 'Status', '2FA'],
      c.user.local.map(u => [u.name, u.type, u.status, u.twoFactor]),
      y,
    );
  }

  if (c.user.group.length) {
    y = addSection(doc, 'User Groups', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Type', 'Members'],
      c.user.group.map(g => [g.name, g.groupType, g.member.join(', ')]),
      y,
    );
  }

  // ==================== MOVED SECTIONS (before signature) ====================

  // --- Firewall Policies (detail cards only, summary table commented out) ---
  if (c.firewallPolicy.length) {
    y = addSection(doc, 'Firewall Policies', y, tocEntries);

    // Summary table commented out - too much text per cell makes it unreadable
    // y = addTable(doc,
    //   ['ID', 'Name', 'Src Intf', 'Dst Intf', 'Source', 'Destination', 'Service', 'Action', 'NAT', 'Status'],
    //   c.firewallPolicy.map(p => [
    //     String(p.policyid), p.name, p.srcintf.join(','), p.dstintf.join(','),
    //     p.srcaddr.join(','), p.dstaddr.join(','), p.service.join(','),
    //     p.action, p.nat ? 'Yes' : 'No', p.status,
    //   ]),
    //   y,
    // );

    // Policy detail cards
    for (const pol of c.firewallPolicy) {
      y = addSection(doc, `Policy #${pol.policyid}: ${pol.name}`, y);
      const details: [string, string][] = [
        ['Source Interface', pol.srcintf.join(', ')],
        ['Destination Interface', pol.dstintf.join(', ')],
        ['Source Address', pol.srcaddr.join(', ')],
        ['Destination Address', pol.dstaddr.join(', ')],
        ['Service', pol.service.join(', ')],
        ['Action', pol.action.toUpperCase()],
        ['Schedule', pol.schedule],
        ['NAT', pol.nat ? 'Enabled' : 'Disabled'],
        ['Log Traffic', pol.logtraffic],
        ['Inspection Mode', pol.inspectionMode],
        ['Comments', pol.comments],
      ];
      if (pol.utmStatus) {
        if (pol.avProfile) details.push(['Antivirus', pol.avProfile]);
        if (pol.webfilterProfile) details.push(['Web Filter', pol.webfilterProfile]);
        if (pol.ipsSensor) details.push(['IPS', pol.ipsSensor]);
        if (pol.applicationList) details.push(['App Control', pol.applicationList]);
        if (pol.sslSshProfile) details.push(['SSL Inspection', pol.sslSshProfile]);
      }
      if (pol.groups.length) details.push(['User Groups', pol.groups.join(', ')]);
      y = addKeyValueTable(doc, details, y);
    }
  }

  // --- Firewall Addresses ---
  if (c.firewallAddress.length) {
    y = addSection(doc, 'Firewall Addresses', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Type', 'Value', 'Interface', 'Comment'],
      c.firewallAddress.map(a => {
        let val = a.subnet;
        if (a.type === 'fqdn') val = a.fqdn;
        if (a.type === 'iprange') val = `${a.startIp} - ${a.endIp}`;
        if (a.type === 'geography') val = a.country;
        return [a.name, a.type, val, a.associatedInterface, a.comment];
      }),
      y,
    );
  }

  // --- Address Groups ---
  if (c.firewallAddrgrp.length) {
    y = addSection(doc, 'Address Groups', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Members', 'Comment'],
      c.firewallAddrgrp.map(g => [g.name, g.member.join(', '), g.comment]),
      y,
    );
  }

  // --- Firewall Services ---
  if (c.firewallService.length) {
    y = addSection(doc, 'Firewall Services', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Protocol', 'TCP Ports', 'UDP Ports', 'Category', 'Comment'],
      c.firewallService.map(s => [s.name, s.protocol, s.tcpPortrange, s.udpPortrange, s.category, s.comment]),
      y,
    );
  }

  // --- Service Groups ---
  if (c.firewallServiceGroup.length) {
    y = addSection(doc, 'Service Groups', y, tocEntries);
    y = addTable(doc,
      ['Name', 'Members', 'Comment'],
      c.firewallServiceGroup.map(g => [g.name, g.member.join(', '), g.comment]),
      y,
    );
  }

  // ==================== SIGNATURE PAGE ====================
  doc.addPage();
  // Record signature page for TOC
  const sigEntry = tocEntries.find((e) => e.title === 'Signature Page');
  if (sigEntry) sigEntry.targetPage = (doc as any).internal.pages.length - 1;

  y = 40;

  doc.setFillColor(...FORTI_DARK);
  doc.rect(14, y, pageWidth - 28, 10, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Document Approval', 18, y + 7);
  y += 20;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const sigBlock = (label: string, yStart: number) => {
    doc.text(label, 20, yStart);
    doc.setDrawColor(180, 180, 180);
    doc.line(20, yStart + 15, 120, yStart + 15);
    doc.text('Signature', 20, yStart + 20);
    doc.line(140, yStart + 15, 190, yStart + 15);
    doc.text('Date', 140, yStart + 20);
    doc.line(20, yStart + 35, 120, yStart + 35);
    doc.text('Print Name', 20, yStart + 40);
    doc.line(140, yStart + 35, 190, yStart + 35);
    doc.text('Title', 140, yStart + 40);
    return yStart + 55;
  };

  y = sigBlock('Prepared By:', y);
  y = sigBlock('Reviewed By:', y);
  y = sigBlock('Approved By (Customer):', y);

  doc.setFontSize(8);
  doc.setTextColor(...FORTI_GRAY);
  doc.text(
    `Generated by FortiDoc on ${new Date().toLocaleString()} | ${project.hostname} | ${project.model} v${project.fortiosVersion}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' },
  );

  // ==================== ADD TOC NAVIGATION LINKS ====================
  // Go back to TOC pages and overlay clickable link annotations on each entry
  for (const entry of tocEntries) {
    if (entry.targetPage) {
      doc.setPage(entry.tocPage);
      // Create invisible clickable rectangle over the TOC text line
      doc.link(18, entry.tocY - 4, pageWidth - 36, 6, { pageNumber: entry.targetPage });
    }
  }

  // Save
  doc.save(`${project.hostname}_Firewall_Design_${new Date().toISOString().slice(0, 10)}.pdf`);
}
