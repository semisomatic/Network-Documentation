import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import StatusBadge from '../shared/StatusBadge';
import WebFilterEditor from './WebFilterEditor';
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

export default function WebFilter() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.securityProfiles.webFilter;

  const [editorState, setEditorState] = useState<{ item: WebFilterProfile; index: number; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<WebFilterProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'featureSet', label: 'Feature Set' },
    { key: 'ftgdWfCategories', label: 'Category Filters', render: (p) => p.ftgdWfCategories.length ? `${p.ftgdWfCategories.length} categories` : '-' },
    { key: 'urlFilterEntries', label: 'URL Filters', render: (p) => p.urlFilterEntries.length ? `${p.urlFilterEntries.length} URLs` : '-' },
    { key: 'safeSearch', label: 'Safe Search', render: (p) => <StatusBadge value={p.safeSearch} /> },
    { key: 'comment', label: 'Comment' },
  ];

  const saveProfile = (item: WebFilterProfile) => {
    if (!editorState) return;
    if (editorState.isNew) addItem(PATH, item);
    else updateItem(PATH, editorState.index, item);
    setEditorState(null);
  };

  if (editorState) {
    return (
      <WebFilterEditor
        initial={editorState.item}
        isNew={editorState.isNew}
        onSave={saveProfile}
        onCancel={() => setEditorState(null)}
      />
    );
  }

  return (
    <>
      <DataTable title="Web Filter Profiles" columns={columns} data={data}
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
        <ConfirmDialog title="Delete Web Filter Profile" message={`Delete web filter profile "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
