import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import DNSFilterEditor from './DNSFilterEditor';
import { useProjectStore } from '../../store/projectStore';
import type { DNSFilterProfile } from '../../types/fortigate';

const PATH = 'securityProfiles.dnsFilter';

const defaultProfile: DNSFilterProfile = {
  name: '', comment: '', domainFilterTable: 0, domainFilter: [], ftgdDnsCategories: [],
  blockBotnet: true, safeSearch: false, youtubeRestrict: 'none',
  externalIpBlocklist: [], redirectPortal: '', logAllDomain: false, stripEch: false,
};

export default function DNSFilter() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.securityProfiles.dnsFilter;

  const [editorState, setEditorState] = useState<{ item: DNSFilterProfile; index: number; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<DNSFilterProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'ftgdDnsCategories', label: 'Category Filters', render: (p) => p.ftgdDnsCategories.length ? `${p.ftgdDnsCategories.length} categories` : '-' },
    { key: 'domainFilter', label: 'Domain Filters', render: (p) => p.domainFilter.length ? `${p.domainFilter.length} domains` : '-' },
    { key: 'blockBotnet', label: 'Botnet C&C', render: (p) => <StatusBadge value={p.blockBotnet ? 'enable' : 'disable'} /> },
    { key: 'safeSearch', label: 'Safe Search', render: (p) => <StatusBadge value={p.safeSearch ? 'enable' : 'disable'} /> },
    { key: 'comment', label: 'Comment' },
  ];

  const saveProfile = (item: DNSFilterProfile) => {
    if (!editorState) return;
    if (editorState.isNew) addItem(PATH, item);
    else updateItem(PATH, editorState.index, item);
    setEditorState(null);
  };

  if (editorState) {
    return (
      <DNSFilterEditor
        initial={editorState.item}
        isNew={editorState.isNew}
        onSave={saveProfile}
        onCancel={() => setEditorState(null)}
      />
    );
  }

  return (
    <>
      <DataTable title="DNS Filter Profiles" columns={columns} data={data}
        getRowKey={(item) => item.name}
        highlights={highlights}
        onHighlight={(key, color) => setHighlight(PATH, key, color)}
        onAdd={() => setEditorState({ item: { ...defaultProfile }, index: -1, isNew: true })}
        onEdit={(item, index) => setEditorState({ item: { ...item }, index, isNew: false })}
        onDelete={(_, index) => setDeleting(index)}
        onClone={(item) => setEditorState({ item: { ...item, name: item.name + '_copy' }, index: -1, isNew: true })}
        onReorder={(from, to) => reorderItems(PATH, from, to)}
      />
      {deleting !== null && (
        <ConfirmDialog title="Delete DNS Filter Profile" message={`Delete DNS filter profile "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
