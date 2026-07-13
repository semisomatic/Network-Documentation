import React, { useState } from 'react';
import EditModal, { FieldDef } from '../shared/EditModal';
import { useProjectStore } from '../../store/projectStore';
import { EditorPage, Card, FormSection, FieldRow, Segmented, Toggle, InlineTable } from '../shared/forti';
import type { InlineColumn } from '../shared/forti';
import type { WebFilterProfile } from '../../types/fortigate';
import { categoryName, categoryGroup, FORTIGUARD_CATEGORIES } from '../../data/fortiguardCategories';

type Cat = WebFilterProfile['ftgdWfCategories'][number];
type Url = WebFilterProfile['urlFilterEntries'][number];

interface Props {
  initial: WebFilterProfile;
  isNew: boolean;
  onSave: (item: WebFilterProfile) => void;
  onCancel: () => void;
}

const ACTION_OPTS = [
  { value: 'allow', label: 'Allow' }, { value: 'monitor', label: 'Monitor' },
  { value: 'block', label: 'Block' }, { value: 'warning', label: 'Warning' },
  { value: 'authenticate', label: 'Authenticate' },
];

export default function WebFilterEditor({ initial, isNew, onSave, onCancel }: Props) {
  const config = useProjectStore((s) => s.project.config);
  const localCats = config.securityProfiles.ftgdLocalCategories;
  const [draft, setDraft] = useState<WebFilterProfile>(initial);
  const set = (patch: Partial<WebFilterProfile>) => setDraft((d) => ({ ...d, ...patch }));

  const [catEdit, setCatEdit] = useState<{ item: Cat; index: number } | null>(null);
  const [urlEdit, setUrlEdit] = useState<{ item: Url; index: number } | null>(null);

  // options[] token helpers
  const hasOpt = (t: string) => draft.options.includes(t);
  const setOpt = (t: string, on: boolean) =>
    set({ options: on ? Array.from(new Set([...draft.options, t])) : draft.options.filter((x) => x !== t) });

  // ---- category picker options (known FortiGuard + local) ----
  const knownCatOptions = [
    ...localCats.map((c) => ({ value: String(c.id), label: `${c.name} (Local)` })),
    ...Object.entries(FORTIGUARD_CATEGORIES).map(([id, c]) => ({ value: id, label: `${c.name} (${c.group})` })),
  ];

  const catColumns: InlineColumn<Cat>[] = [
    { key: 'name', label: 'Category', render: (c) => categoryName(c.id, localCats) },
    { key: 'group', label: 'Group', render: (c) => categoryGroup(c.id, localCats) },
    { key: 'action', label: 'Action', render: (c) => c.action.charAt(0).toUpperCase() + c.action.slice(1) },
  ];
  const urlColumns: InlineColumn<Url>[] = [
    { key: 'url', label: 'URL' },
    { key: 'type', label: 'Type' },
    { key: 'action', label: 'Action' },
    { key: 'status', label: 'Enabled', render: (u) => (u.status ? 'Yes' : 'No') },
  ];

  const catFields: FieldDef[] = [
    { key: 'id', label: 'Category', type: 'select', options: knownCatOptions },
    { key: 'action', label: 'Action', type: 'select', options: ACTION_OPTS },
  ];
  const urlFields: FieldDef[] = [
    { key: 'url', label: 'URL / Pattern', type: 'text' },
    { key: 'type', label: 'Type', type: 'select', options: [
      { value: 'simple', label: 'Simple' }, { value: 'regex', label: 'Regex' }, { value: 'wildcard', label: 'Wildcard' },
    ]},
    { key: 'action', label: 'Action', type: 'select', options: [
      { value: 'exempt', label: 'Exempt' }, { value: 'block', label: 'Block' },
      { value: 'allow', label: 'Allow' }, { value: 'monitor', label: 'Monitor' },
    ]},
    { key: 'status', label: 'Enabled', type: 'checkbox' },
  ];

  const saveCat = () => {
    if (!catEdit) return;
    const item = { ...catEdit.item, id: parseInt(String(catEdit.item.id), 10) || 0 };
    const list = [...draft.ftgdWfCategories];
    if (catEdit.index < 0) list.push(item); else list[catEdit.index] = item;
    set({ ftgdWfCategories: list });
    setCatEdit(null);
  };
  const saveUrl = () => {
    if (!urlEdit) return;
    const list = [...draft.urlFilterEntries];
    if (urlEdit.index < 0) list.push({ ...urlEdit.item, id: list.length + 1 }); else list[urlEdit.index] = urlEdit.item;
    set({ urlFilterEntries: list, urlFilterTable: draft.urlFilterTable || 1 });
    setUrlEdit(null);
  };

  return (
    <>
      <EditorPage title={isNew ? 'New Web Filter Profile' : 'Edit Web Filter Profile'} onSave={() => onSave(draft)} onCancel={onCancel}>
        <Card>
          <FieldRow label="Name">
            <input className="forti-input max-w-[360px]" value={draft.name} onChange={(e) => set({ name: e.target.value })} disabled={!isNew} />
          </FieldRow>
          <FieldRow label="Comments" align="start">
            <div className="max-w-[360px]">
              <textarea className="forti-input min-h-[52px]" rows={2} maxLength={255} value={draft.comment} onChange={(e) => set({ comment: e.target.value })} />
              <div className="text-[11px] text-gray-400 text-right">{draft.comment.length}/255</div>
            </div>
          </FieldRow>
          <FieldRow label="Feature set">
            <Segmented value={draft.featureSet} onChange={(v) => set({ featureSet: v as WebFilterProfile['featureSet'] })}
              options={[{ value: 'flow', label: 'Flow-based' }, { value: 'proxy', label: 'Proxy-based' }]} />
          </FieldRow>

          {/* FortiGuard categories */}
          <FormSection title="FortiGuard Category Based Filter">
            <FieldRow label="" align="start">
              <InlineTable<Cat>
                columns={catColumns}
                data={draft.ftgdWfCategories}
                maxHeight={320}
                onCreate={() => setCatEdit({ item: { id: 0, action: 'monitor' }, index: -1 })}
                onEdit={(item, index) => setCatEdit({ item: { ...item }, index })}
                onDelete={(_, index) => set({ ftgdWfCategories: draft.ftgdWfCategories.filter((_, i) => i !== index) })}
              />
            </FieldRow>
            <FieldRow label="Allow users to override blocked categories">
              <Toggle checked={draft.ovrdPerm.length > 0} onChange={(on) => set({ ovrdPerm: on ? ['bannedword-override', 'urlfilter-override', 'fortiguard-wf-override'] : [] })} />
            </FieldRow>
          </FormSection>

          {/* Search engines */}
          <FormSection title="Search Engines">
            <FieldRow label="Enforce 'Safe Search'">
              <Toggle checked={draft.safeSearch !== 'disable'} onChange={(on) => set({ safeSearch: on ? 'url' : 'disable' })} />
            </FieldRow>
          </FormSection>

          {/* Static URL filter */}
          <FormSection title="Static URL Filter">
            <FieldRow label="Block invalid URLs">
              <Toggle checked={hasOpt('block-invalid-url')} onChange={(on) => setOpt('block-invalid-url', on)} />
            </FieldRow>
            <FieldRow label="URL Filter" align="start">
              <InlineTable<Url>
                columns={urlColumns}
                data={draft.urlFilterEntries}
                maxHeight={260}
                onCreate={() => setUrlEdit({ item: { id: 0, url: '', type: 'simple', action: 'block', status: true }, index: -1 })}
                onEdit={(item, index) => setUrlEdit({ item: { ...item }, index })}
                onDelete={(_, index) => set({ urlFilterEntries: draft.urlFilterEntries.filter((_, i) => i !== index) })}
              />
            </FieldRow>
          </FormSection>

          {/* Rating options */}
          <FormSection title="Rating Options">
            <FieldRow label="Rate URLs by domain and IP Address">
              <Toggle checked={hasOpt('rate-server-ip')} onChange={(on) => setOpt('rate-server-ip', on)} />
            </FieldRow>
          </FormSection>

          {/* Proxy options */}
          <FormSection title="Proxy Options">
            <FieldRow label="HTTP POST Action">
              <Segmented value={draft.postAction} onChange={(v) => set({ postAction: v as WebFilterProfile['postAction'] })}
                options={[{ value: 'normal', label: 'Allow' }, { value: 'block', label: 'Block', danger: true }]} />
            </FieldRow>
            <FieldRow label="Remove Cookies">
              <Toggle checked={hasOpt('cookie-removal')} onChange={(on) => setOpt('cookie-removal', on)} />
            </FieldRow>
          </FormSection>
        </Card>
      </EditorPage>

      {catEdit && (
        <EditModal title="Category" fields={catFields} values={catEdit.item} isNew={catEdit.index < 0}
          onChange={(key, val) => setCatEdit({ ...catEdit, item: { ...catEdit.item, [key]: val } })}
          onSave={saveCat} onCancel={() => setCatEdit(null)} />
      )}
      {urlEdit && (
        <EditModal title="URL Filter Entry" fields={urlFields} values={urlEdit.item} isNew={urlEdit.index < 0}
          onChange={(key, val) => setUrlEdit({ ...urlEdit, item: { ...urlEdit.item, [key]: val } })}
          onSave={saveUrl} onCancel={() => setUrlEdit(null)} />
      )}
    </>
  );
}
