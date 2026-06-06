import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { WirelessVAP, WirelessWTPProfile, WirelessWTP } from '../../types/fortigate';

const VAP_PATH = 'wireless.vaps';
const PROFILE_PATH = 'wireless.wtpProfiles';
const WTP_PATH = 'wireless.wtps';

const defaultVAP: WirelessVAP = {
  name: '', ssid: '', securityMode: 'wpa2-personal', passphrase: '', authServer: '',
  vlanid: 0, broadcast: true, schedule: 'always', maxClients: 0, macFilter: false, comment: '',
};

const defaultProfile: WirelessWTPProfile = {
  name: '', platform: '', radio1Band: '802.11ax', radio1Channels: [], radio1Power: 100,
  radio1VapAll: true, radio1Vaps: [], radio2Band: '802.11ax', radio2Channels: [], radio2Power: 100,
  radio2VapAll: true, radio2Vaps: [], comment: '',
};

const defaultWTP: WirelessWTP = {
  id: '', name: '', wtpProfile: '', admin: 'enable', location: '', comment: '',
};

export default function FortiAP() {
  const config = useProjectStore((s) => s.project.config);
  const vapHighlights = useProjectStore((s) => s.project.highlights[VAP_PATH] || {});
  const profileHighlights = useProjectStore((s) => s.project.highlights[PROFILE_PATH] || {});
  const wtpHighlights = useProjectStore((s) => s.project.highlights[WTP_PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const wireless = config.wireless;

  const [editingVap, setEditingVap] = useState<{ item: WirelessVAP; index: number } | null>(null);
  const [isNewVap, setIsNewVap] = useState(false);
  const [deletingVap, setDeletingVap] = useState<number | null>(null);

  const [editingProfile, setEditingProfile] = useState<{ item: WirelessWTPProfile; index: number } | null>(null);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState<number | null>(null);

  const [editingWtp, setEditingWtp] = useState<{ item: WirelessWTP; index: number } | null>(null);
  const [isNewWtp, setIsNewWtp] = useState(false);
  const [deletingWtp, setDeletingWtp] = useState<number | null>(null);

  const profileOptions = [
    { value: '', label: '-- Select --' },
    ...wireless.wtpProfiles.map(p => ({ value: p.name, label: p.name })),
  ];

  const vapFields: FieldDef[] = [
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
    { key: 'ssid', label: 'SSID', type: 'text', required: true, group: 'General' },
    { key: 'securityMode', label: 'Security', type: 'select', group: 'General', options: [
      { value: 'open', label: 'Open' },
      { value: 'wpa2-personal', label: 'WPA2 Personal' },
      { value: 'wpa2-enterprise', label: 'WPA2 Enterprise' },
      { value: 'wpa3-sae', label: 'WPA3 SAE' },
      { value: 'wpa3-enterprise', label: 'WPA3 Enterprise' },
      { value: 'captive-portal', label: 'Captive Portal' },
    ]},
    { key: 'passphrase', label: 'Passphrase', type: 'text', group: 'Security' },
    { key: 'authServer', label: 'Auth Server', type: 'text', group: 'Security' },
    { key: 'vlanid', label: 'VLAN ID', type: 'number', group: 'Network' },
    { key: 'broadcast', label: 'Broadcast SSID', type: 'checkbox', group: 'Network' },
    { key: 'maxClients', label: 'Max Clients', type: 'number', group: 'Network' },
    { key: 'macFilter', label: 'MAC Filter', type: 'checkbox', group: 'Network' },
    { key: 'schedule', label: 'Schedule', type: 'text', group: 'Other', defaultValue: 'always' },
    { key: 'comment', label: 'Comment', type: 'textarea', group: 'Other', width: 'full' },
  ];

  const profileFields: FieldDef[] = [
    { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
    { key: 'platform', label: 'Platform/Model', type: 'text', group: 'General', placeholder: 'FAP-231F' },
    { key: 'radio1Band', label: 'Radio 1 Band', type: 'select', group: 'Radio 1', options: [
      { value: '802.11ax', label: '802.11ax (Wi-Fi 6)' }, { value: '802.11ac', label: '802.11ac (Wi-Fi 5)' },
      { value: '802.11n', label: '802.11n' }, { value: '802.11a', label: '802.11a' },
    ]},
    { key: 'radio1Power', label: 'Radio 1 Power (%)', type: 'number', group: 'Radio 1', defaultValue: 100 },
    { key: 'radio2Band', label: 'Radio 2 Band', type: 'select', group: 'Radio 2', options: [
      { value: '802.11ax', label: '802.11ax (Wi-Fi 6)' }, { value: '802.11ac', label: '802.11ac (Wi-Fi 5)' },
      { value: '802.11n', label: '802.11n' }, { value: '802.11n,g', label: '802.11n/g' },
    ]},
    { key: 'radio2Power', label: 'Radio 2 Power (%)', type: 'number', group: 'Radio 2', defaultValue: 100 },
    { key: 'comment', label: 'Comment', type: 'textarea', group: 'Other', width: 'full' },
  ];

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
    { key: 'vlanid', label: 'VLAN', width: '70px', render: (v) => v.vlanid ? String(v.vlanid) : '-' },
    { key: 'broadcast', label: 'Broadcast', width: '80px', render: (v) => v.broadcast ? 'Yes' : 'No' },
    { key: 'comment', label: 'Comment' },
  ];

  const profileColumns: Column<WirelessWTPProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'platform', label: 'Platform' },
    { key: 'radio1Band', label: 'Radio 1' },
    { key: 'radio2Band', label: 'Radio 2' },
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

  return (
    <div className="space-y-6">
      {/* SSIDs / VAPs */}
      <DataTable title="SSIDs (Virtual Access Points)" columns={vapColumns} data={wireless.vaps}
        getRowKey={(item) => item.name}
        highlights={vapHighlights}
        onHighlight={(key, color) => setHighlight(VAP_PATH, key, color)}
        onAdd={() => { setEditingVap({ item: { ...defaultVAP }, index: -1 }); setIsNewVap(true); }}
        onEdit={(item, index) => { setEditingVap({ item: { ...item }, index }); setIsNewVap(false); }}
        onDelete={(_, index) => setDeletingVap(index)}
        onReorder={(from, to) => reorderItems(VAP_PATH, from, to)}
      />

      {/* WTP Profiles */}
      <DataTable title="AP Profiles" columns={profileColumns} data={wireless.wtpProfiles}
        getRowKey={(item) => item.name}
        highlights={profileHighlights}
        onHighlight={(key, color) => setHighlight(PROFILE_PATH, key, color)}
        onAdd={() => { setEditingProfile({ item: { ...defaultProfile }, index: -1 }); setIsNewProfile(true); }}
        onEdit={(item, index) => { setEditingProfile({ item: { ...item }, index }); setIsNewProfile(false); }}
        onDelete={(_, index) => setDeletingProfile(index)}
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

      {/* Edit Modals */}
      {editingVap && (
        <EditModal title="SSID / VAP" fields={vapFields} values={editingVap.item} isNew={isNewVap}
          onChange={(key, val) => setEditingVap({ ...editingVap, item: { ...editingVap.item, [key]: val } })}
          onSave={() => {
            if (isNewVap) addItem(VAP_PATH, editingVap.item);
            else updateItem(VAP_PATH, editingVap.index, editingVap.item);
            setEditingVap(null);
          }}
          onCancel={() => setEditingVap(null)}
        />
      )}
      {editingProfile && (
        <EditModal title="AP Profile" fields={profileFields} values={editingProfile.item} isNew={isNewProfile}
          onChange={(key, val) => setEditingProfile({ ...editingProfile, item: { ...editingProfile.item, [key]: val } })}
          onSave={() => {
            if (isNewProfile) addItem(PROFILE_PATH, editingProfile.item);
            else updateItem(PROFILE_PATH, editingProfile.index, editingProfile.item);
            setEditingProfile(null);
          }}
          onCancel={() => setEditingProfile(null)}
        />
      )}
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
