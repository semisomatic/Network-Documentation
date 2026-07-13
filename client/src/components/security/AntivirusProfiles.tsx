import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import ConfirmDialog from '../shared/ConfirmDialog';
import AntivirusEditor from './AntivirusEditor';
import { useProjectStore } from '../../store/projectStore';
import type { AntivirusProfile } from '../../types/fortigate';

const PATH = 'securityProfiles.antivirus';

const defaultProfile: AntivirusProfile = {
  name: '', comment: '', featureSet: 'flow', scanAction: 'block',
  inspectHttp: true, inspectFtp: true, inspectImap: true, inspectPop3: true, inspectSmtp: true,
  inspectMapi: false, inspectNntp: false, inspectCifs: false, inspectSsh: false,
  treatExeAsVirus: false, outbreakPrevention: false, outbreakPreventionArchiveScan: true,
  externalBlocklistAll: false, emsThreatFeed: false, mobileMalware: false, scanMode: 'default',
};

export default function AntivirusProfiles() {
  const config = useProjectStore((s) => s.project.config);
  const highlights = useProjectStore((s) => s.project.highlights[PATH] || {});
  const { addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const data = config.securityProfiles.antivirus;

  const [editorState, setEditorState] = useState<{ item: AntivirusProfile; index: number; isNew: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const protoList = (a: AntivirusProfile) => {
    const p = [];
    if (a.inspectHttp) p.push('HTTP'); if (a.inspectSmtp) p.push('SMTP'); if (a.inspectPop3) p.push('POP3');
    if (a.inspectImap) p.push('IMAP'); if (a.inspectFtp) p.push('FTP'); if (a.inspectCifs) p.push('CIFS');
    if (a.inspectMapi) p.push('MAPI'); if (a.inspectNntp) p.push('NNTP'); if (a.inspectSsh) p.push('SSH');
    return p.join(', ') || '-';
  };

  const columns: Column<AntivirusProfile>[] = [
    { key: 'name', label: 'Name' },
    { key: 'featureSet', label: 'Feature Set' },
    { key: 'scanAction', label: 'Action', render: (a) => a.scanAction.charAt(0).toUpperCase() + a.scanAction.slice(1) },
    { key: 'protocols', label: 'Inspected Protocols', render: protoList },
    { key: 'outbreakPrevention', label: 'Outbreak Prev.', render: (a) => a.outbreakPrevention ? 'Yes' : '-' },
    { key: 'comment', label: 'Comment' },
  ];

  const saveProfile = (item: AntivirusProfile) => {
    if (!editorState) return;
    if (editorState.isNew) addItem(PATH, item);
    else updateItem(PATH, editorState.index, item);
    setEditorState(null);
  };

  if (editorState) {
    return (
      <AntivirusEditor
        initial={editorState.item}
        isNew={editorState.isNew}
        onSave={saveProfile}
        onCancel={() => setEditorState(null)}
      />
    );
  }

  return (
    <>
      <DataTable title="AntiVirus Profiles" columns={columns} data={data}
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
        <ConfirmDialog title="Delete AntiVirus Profile" message={`Delete antivirus profile "${data[deleting]?.name}"?`}
          onConfirm={() => { removeItem(PATH, deleting); setDeleting(null); }} onCancel={() => setDeleting(null)} />
      )}
    </>
  );
}
