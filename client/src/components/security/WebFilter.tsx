import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import { useProjectStore } from '../../store/projectStore';
import type { WebFilterProfile } from '../../types/fortigate';

const PATH = 'securityProfiles.webFilter';

const defaultProfile: WebFilterProfile = {
  name: '', comment: '', featureSet: 'flow', options: [], httpsReplacemsg: true, ovrdPerm: [],
  postAction: 'normal', webContentLog: true, webFilterActivex: 'allow',
  webFilterCookie: 'allow', webFilterJscript: 'allow', webFilterJavaApplet: 'allow',
  webFilterUnknown: 'allow', ftgdWfCategories: [], urlFilterTable: 0, urlFilterEntries: [],
  safeSearch: 'disable', youtubeRestrict: 'none',
};

const fields: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, group: 'General' },
  { key: 'comment', label: 'Comment', type: 'textarea', group: 'General', width: 'full' },
  { key: 'featureSet', label: 'Feature Set', type: 'select', group: 'General', options: [
    { value: 'flow', label: 'Flow-based' }, { value: 'proxy', label: 'Proxy-based' },
  ]},
  { key: 'safeSearch', label: 'Safe Search', type: 'select', group: 'Search Engines', options: [
    { value: 'url', label: 'URL' }, { value: 'header', label: 'Header' }, { value: 'disable', label: 'Disable' },
  ]},
  { key: 'youtubeRestrict', label: 'YouTube Restrict', type: 'select', group: 'Search Engines', options: [
    { value: 'none', label: 'None' }, { value: 'strict', label: 'Strict' }, { value: 'moderate', label: 'Moderate' },
  ]},
  { key: 'postAction', label: 'POST Action', type: 'select', group: 'Options', options: [
    { value: 'normal', label: 'Normal' }, { value: 'block', label: 'Block' },
  ]},
  { key: 'httpsReplacemsg', label: 'HTTPS Replacement Message', type: 'checkbox', group: 'Options' },
  { key: 'webContentLog', label: 'Web Content Log', type: 'checkbox', group: 'Options' },
  { key: 'webFilterActivex', label: 'ActiveX Filter', type: 'select', group: 'Content Filters', options: [
    { value: 'block', label: 'Block' }, { value: 'allow', label: 'Allow' },
  ]},
  { key: 'webFilterCookie', label: 'Cookie Filter', type: 'select', group: 'Content Filters', options: [
    { value: 'block', label: 'Block' }, { value: 'allow', label: 'Allow' },
  ]},
  { key: 'webFilterJscript', label: 'JavaScript Filter', type: 'select', group: 'Content Filters', options: [
    { value: 'block', label: 'Block' }, { value: 'allow', label: 'Allow' },
  ]},
  { key: 'webFilterJavaApplet', label: 'Java Applet Filter', type: 'select', group: 'Content Filters', options: [
    { value: 'block', label: 'Block' }, { value: 'allow', label: 'Allow' },
  ]},
  { key: 'webFilterUnknown', label: 'Unknown Content Filter', type: 'select', group: 'Content Filters', options: [
    { value: 'block', label: 'Block' }, { value: 'allow', label: 'Allow' },
  ]},
];

export default function WebFilter() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.securityProfiles.webFilter;

  const [editing, setEditing] = useState<{ item: WebFilterProfile; index: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<WebFilterProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'featureSet', label: 'Feature Set' },
    { key: 'ftgdWfCategories', label: 'Category Filters', render: (p) => p.ftgdWfCategories.length ? `${p.ftgdWfCategories.length} categories` : '-' },
    { key: 'safeSearch', label: 'Safe Search', render: (p) => <StatusBadge value={p.safeSearch} /> },
    { key: 'youtubeRestrict', label: 'YouTube Restrict', render: (p) => <StatusBadge value={p.youtubeRestrict} /> },
    { key: 'postAction', label: 'POST Action', render: (p) => <StatusBadge value={p.postAction} /> },
  ];

  const handleSave = () => {
    if (!editing) return;
    if (isNew) addItem(PATH, editing.item);
    else updateItem(PATH, editing.index, editing.item);
    setEditing(null);
  };

  return (
    <>
      <DataTable title="Web Filter Profiles" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => { setEditing({ item: { ...defaultProfile }, index: -1 }); setIsNew(true); }}
        onEdit={(item, index) => { setEditing({ item: { ...item }, index }); setIsNew(false); }}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => { setEditing({ item: { ...item, name: item.name + '_copy' }, index: -1 }); setIsNew(true); }}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {editing && (
        <EditModal title="Web Filter Profile" fields={fields} values={editing.item} isNew={isNew}
          onChange={(key, val) => setEditing({ ...editing, item: { ...editing.item, [key]: val } })}
          onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {deleting !== null && (
        <ConfirmDialog title="Delete Web Filter Profile" message={`Delete web filter profile "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
