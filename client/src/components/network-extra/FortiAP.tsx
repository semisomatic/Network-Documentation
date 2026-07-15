import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import VAPEditor from './VAPEditor';
import WTPProfileEditor from './WTPProfileEditor';
import { useProjectStore } from '../../store/projectStore';
import {
  createDefaultVAP, createDefaultWTPProfile,
  type WirelessVAP, type WirelessWTPProfile, type WirelessWTP, type WirelessRadio,
} from '../../types/fortigate';

const VAP_PATH = 'wireless.vaps';
const PROFILE_PATH = 'wireless.wtpProfiles';
const WTP_PATH = 'wireless.wtps';

const defaultWTP: WirelessWTP = {
  id: '', name: '', wtpProfile: '', admin: 'enable', location: '', comment: '',
};

// Compact summary of a radio for the profile list.
function radioSummary(r: WirelessRadio): string {
  if (r.mode === 'disabled') return 'Disabled';
  if (r.mode === 'monitor') return 'Monitor';
  if (r.mode === 'sniffer') return 'Sniffer';
  const is2G = r.band.some((b) => b.includes('2G') || b === '802.11b' || b === '802.11g');
  const gen = r.band.some((b) => b.includes('ax')) ? 'ax' : r.band.some((b) => b.includes('ac')) ? 'ac' : r.band.some((b) => b.includes('n')) ? 'n' : '';
  const bandLabel = r.band.length ? `${is2G ? '2.4G' : '5G'}${gen ? ` 802.11${gen}` : ''}` : 'AP';
  const vapCount = r.vaps.length;
  return `${bandLabel}${vapCount ? ` · ${vapCount} SSID${vapCount > 1 ? 's' : ''}` : ''}`;
}

export default function FortiAP() {
  const config = useProjectStore((s) => s.project.config);
  const vapHighlights = useProjectStore((s) => s.project.highlights[VAP_PATH] || {});
  const profileHighlights = useProjectStore((s) => s.project.highlights[PROFILE_PATH] || {});
  const wtpHighlights = useProjectStore((s) => s.project.highlights[WTP_PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const wireless = config.wireless;

  const [editingVap, setEditingVap] = useState<{ item: WirelessVAP; index: number; isNew: boolean } | null>(null);
  const [deletingVap, setDeletingVap] = useState<number | null>(null);

  const [editingProfile, setEditingProfile] = useState<{ item: WirelessWTPProfile; index: number; isNew: boolean } | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<number | null>(null);

  const [editingWtp, setEditingWtp] = useState<{ item: WirelessWTP; index: number } | null>(null);
  const [isNewWtp, setIsNewWtp] = useState(false);
  const [deletingWtp, setDeletingWtp] = useState<number | null>(null);

  const profileOptions = [
    { value: '', label: '-- Select --' },
    ...wireless.wtpProfiles.map((p) => ({ value: p.name, label: p.name })),
  ];
  const vapNames = wireless.vaps.map((v) => v.name);

  const wtpFields: FieldDef[] = [
    { key: 'id', label: 'Serial / ID', type: 'text', required: true, group: 'General' },
    { key: 'name', label: 'Name', type: 'text', group: 'General' },
    { key: 'wtpProfile', label: 'WTP Profile', type: 'select', group: 'General', options: profileOptions },
    { key: 'admin', label: 'Admin', type: 'select', group: 'General', options: [
      { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' }, { value: 'discovered', label: 'Discovered' },
    ]},
    { key: 'location', label: 'Location', type: 'text', group: 'Other' },
    { key: 'comment', label: 'Comment', type: 'textarea', group: 'Other', width: 'full' },
  ];

  const vapColumns: Column<WirelessVAP>[] = [
    { key: 'name', label: 'Name' },
    { key: 'ssid', label: 'SSID' },
    { key: 'securityMode', label: 'Security' },
    { key: 'traffic', label: 'Traffic', width: '80px', render: (v) => v.trafficMode.charAt(0).toUpperCase() + v.trafficMode.slice(1) },
    { key: 'vlanid', label: 'VLAN', width: '70px', render: (v) => v.vlanid ? String(v.vlanid) : '-' },
    { key: 'broadcast', label: 'Broadcast', width: '80px', render: (v) => v.broadcast ? 'Yes' : 'No' },
    { key: 'comment', label: 'Comment' },
  ];

  const profileColumns: Column<WirelessWTPProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'platform', label: 'Platform', width: '90px', render: (p) => p.platform || '-' },
    { key: 'radio1', label: 'Radio 1', render: (p) => radioSummary(p.radio1) },
    { key: 'radio2', label: 'Radio 2', render: (p) => radioSummary(p.radio2) },
    { key: 'radio3', label: 'Radio 3', render: (p) => radioSummary(p.radio3) },
    { key: 'comment', label: 'Comment' },
  ];

  const wtpColumns: Column<WirelessWTP>[] = [
    { key: 'id', label: 'Serial / ID' },
    { key: 'name', label: 'Name' },
    { key: 'wtpProfile', label: 'Profile' },
    { key: 'admin', label: 'Admin', render: (w) => <StatusBadge value={w.admin === 'enable' ? 'enable' : 'disable'} /> },
    { key: 'location', label: 'Location' },
    { key: 'comment', label: 'Comment' },
  ];

  // Full-page editors take over the whole view when open.
  if (editingVap) {
    return (
      <VAPEditor initial={editingVap.item} isNew={editingVap.isNew}
        onSave={(item) => {
          if (editingVap.isNew) addItem(VAP_PATH, item); else updateItem(VAP_PATH, editingVap.index, item);
          setEditingVap(null);
        }}
        onCancel={() => setEditingVap(null)} />
    );
  }
  if (editingProfile) {
    return (
      <WTPProfileEditor initial={editingProfile.item} isNew={editingProfile.isNew} vapNames={vapNames}
        onSave={(item) => {
          if (editingProfile.isNew) addItem(PROFILE_PATH, item); else updateItem(PROFILE_PATH, editingProfile.index, item);
          setEditingProfile(null);
        }}
        onCancel={() => setEditingProfile(null)} />
    );
  }

  return (
    <div className="space-y-6">
      {/* SSIDs / VAPs */}
      <DataTable title="SSIDs (Virtual Access Points)" columns={vapColumns} data={wireless.vaps}
        getRowKey={(item) => item.name}
        highlights={vapHighlights}
        onHighlight={(key, color) => setHighlight(VAP_PATH, key, color)}
        onAdd={() => setEditingVap({ item: createDefaultVAP(), index: -1, isNew: true })}
        onEdit={(item, index) => setEditingVap({ item: { ...item }, index, isNew: false })}
        onDelete={(_, index) => setDeletingVap(index)}
        onClone={(item) => setEditingVap({ item: { ...item, name: item.name + '_copy' }, index: -1, isNew: true })}
        onReorder={(from, to) => reorderItems(VAP_PATH, from, to)}
      />

      {/* WTP Profiles */}
      <DataTable title="AP Profiles" columns={profileColumns} data={wireless.wtpProfiles}
        getRowKey={(item) => item.name}
        highlights={profileHighlights}
        onHighlight={(key, color) => setHighlight(PROFILE_PATH, key, color)}
        onAdd={() => setEditingProfile({ item: createDefaultWTPProfile(), index: -1, isNew: true })}
        onEdit={(item, index) => setEditingProfile({ item: { ...item }, index, isNew: false })}
        onDelete={(_, index) => setDeletingProfile(index)}
        onClone={(item) => setEditingProfile({ item: { ...item, name: 'Clone of ' + item.name }, index: -1, isNew: true })}
        onReorder={(from, to) => reorderItems(PROFILE_PATH, from, to)}
      />

      {/* Managed APs */}
      <DataTable title="Managed Access Points" columns={wtpColumns} data={wireless.wtps}
        getRowKey={(item) => item.id}
        highlights={wtpHighlights}
        onHighlight={(key, color) => setHighlight(WTP_PATH, key, color)}
        onAdd={() => { setEditingWtp({ item: { ...defaultWTP }, index: -1 }); setIsNewWtp(true); }}
        onEdit={(item, index) => { setEditingWtp({ item: { ...item }, index }); setIsNewWtp(false); }}
        onDelete={(_, index) => setDeletingWtp(index)}
        onReorder={(from, to) => reorderItems(WTP_PATH, from, to)}
      />

      {editingWtp && (
        <EditModal title="Managed AP" fields={wtpFields} values={editingWtp.item} isNew={isNewWtp}
          onChange={(key, val) => setEditingWtp({ ...editingWtp, item: { ...editingWtp.item, [key]: val } })}
          onSave={() => {
            if (isNewWtp) addItem(WTP_PATH, editingWtp.item);
            else updateItem(WTP_PATH, editingWtp.index, editingWtp.item);
            setEditingWtp(null);
          }}
          onCancel={() => setEditingWtp(null)}
        />
      )}

      {/* Delete Confirmations */}
      {deletingVap !== null && (
        <ConfirmDialog title="Delete SSID" message={`Delete SSID "${wireless.vaps[deletingVap]?.name}"?`}
          onConfirm={() => { removeItem(VAP_PATH, deletingVap); setDeletingVap(null); }}
          onCancel={() => setDeletingVap(null)} />
      )}
      {deletingProfile !== null && (
        <ConfirmDialog title="Delete Profile" message={`Delete AP profile "${wireless.wtpProfiles[deletingProfile]?.name}"?`}
          onConfirm={() => { removeItem(PROFILE_PATH, deletingProfile); setDeletingProfile(null); }}
          onCancel={() => setDeletingProfile(null)} />
      )}
      {deletingWtp !== null && (
        <ConfirmDialog title="Delete AP" message={`Delete AP "${wireless.wtps[deletingWtp]?.name || wireless.wtps[deletingWtp]?.id}"?`}
          onConfirm={() => { removeItem(WTP_PATH, deletingWtp); setDeletingWtp(null); }}
          onCancel={() => setDeletingWtp(null)} />
      )}
    </div>
  );
}
