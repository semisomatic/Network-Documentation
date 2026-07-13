import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import ApplicationControlEditor from './ApplicationControlEditor';
import { useProjectStore } from '../../store/projectStore';
import type { AppControlProfile } from '../../types/fortigate';

const PATH = 'securityProfiles.applicationControl';

const defaultProfile: AppControlProfile = {
  name: '', comment: '', categories: [], otherApplicationAction: 'pass', unknownApplicationAction: 'pass',
  overrides: [], networkProtocolEnforcement: false, networkServices: [], deepAppInspection: true, options: [],
};

export default function ApplicationControl() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.securityProfiles.applicationControl;

  const [editorState, setEditorState] = useState<{ item: AppControlProfile; index: number; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const columns: Column<AppControlProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'categories', label: 'Category Actions', render: (p) => p.categories.length ? `${p.categories.length} set` : '-' },
    { key: 'overrides', label: 'Overrides', render: (p) => p.overrides.length || '-' },
    { key: 'otherApplicationAction', label: 'Other Apps', render: (p) => p.otherApplicationAction },
    { key: 'unknownApplicationAction', label: 'Unknown Apps', render: (p) => p.unknownApplicationAction },
    { key: 'comment', label: 'Comment' },
  ];

  const saveProfile = (item: AppControlProfile) => {
    if (!editorState) return;
    if (editorState.isNew) addItem(PATH, item);
    else updateItem(PATH, editorState.index, item);
    setEditorState(null);
  };

  if (editorState) {
    return (
      <ApplicationControlEditor
        initial={editorState.item}
        isNew={editorState.isNew}
        onSave={saveProfile}
        onCancel={() => setEditorState(null)}
      />
    );
  }

  return (
    <>
      <DataTable title="Application Control" columns={columns} data={data}
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
        <ConfirmDialog title="Delete Application Sensor" message={`Delete application sensor "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
