import React, { useRef, useState } from 'react';
import EditModal, { FieldDef } from '../shared/EditModal';
import { EditorPage, Card, FormSection, FieldRow, Toggle, InlineTable } from '../shared/forti';
import type { InlineColumn } from '../shared/forti';
import type { AppControlProfile, AppControlOverride, AppControlNetworkService } from '../../types/fortigate';
import { APP_CATEGORIES, APP_CATEGORY_IDS, appCategoryName, APP_BEHAVIORS, APP_POPULARITY, APP_RISK } from '../../data/appControlCategories';

type Ns = AppControlNetworkService;
type Ov = AppControlOverride;

interface Props {
  initial: AppControlProfile;
  isNew: boolean;
  onSave: (item: AppControlProfile) => void;
  onCancel: () => void;
}

const CAT_ACTIONS = [{ value: 'allow', label: 'Allow' }, { value: 'monitor', label: 'Monitor' }, { value: 'block', label: 'Block' }];
const APP_ENFORCE_PROTOCOLS = ['DNS', 'FTP', 'HTTP', 'HTTPS', 'IMAP', 'NNTP', 'POP3', 'SMTP', 'SNMP', 'SSH', 'TELNET'];

export default function ApplicationControlEditor({ initial, isNew, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<AppControlProfile>(initial);
  const set = (patch: Partial<AppControlProfile>) => setDraft((d) => ({ ...d, ...patch }));
  const originalCatIds = useRef(new Set(initial.categories.map((c) => c.id)));

  const [nsEdit, setNsEdit] = useState<{ item: Ns; index: number } | null>(null);
  const [ovEdit, setOvEdit] = useState<{ item: Ov; index: number } | null>(null);

  // ---- category actions (show all; default monitor; keep non-default + originals) ----
  const catActionOf = (id: number) => draft.categories.find((c) => c.id === id)?.action ?? 'monitor';
  const setCatAction = (id: number, action: string) => {
    const m = new Map(draft.categories.map((c) => [c.id, c.action]));
    m.set(id, action as any);
    set({ categories: [...m.entries()].filter(([cid, a]) => a !== 'monitor' || originalCatIds.current.has(cid)).map(([cid, a]) => ({ id: cid, action: a as any })) });
  };
  const catRows = APP_CATEGORY_IDS.map((id) => ({ id, name: APP_CATEGORIES[id] })).sort((a, b) => a.name.localeCompare(b.name));

  // ---- network services ----
  const nsColumns: InlineColumn<Ns>[] = [
    { key: 'port', label: 'Port' },
    { key: 'protocols', label: 'Enforce Protocols', render: (n) => n.protocols.join(', ') || '-' },
    { key: 'violationAction', label: 'Violation Action', render: (n) => n.violationAction === 'block' ? 'Block' : 'Monitor' },
  ];
  const nsFields: FieldDef[] = [
    { key: 'port', label: 'Port', type: 'number' },
    { key: 'protocols', label: 'Enforce Protocols', type: 'multiselect', width: 'full', options: APP_ENFORCE_PROTOCOLS.map((p) => ({ value: p, label: p })) },
    { key: 'violationAction', label: 'Violation Action', type: 'select', options: [{ value: 'monitor', label: 'Monitor' }, { value: 'block', label: 'Block' }] },
  ];
  const saveNs = () => {
    if (!nsEdit) return;
    const list = [...draft.networkServices];
    if (nsEdit.index < 0) list.push({ ...nsEdit.item, id: list.length + 1 }); else list[nsEdit.index] = nsEdit.item;
    set({ networkServices: list });
    setNsEdit(null);
  };

  // ---- overrides ----
  const ovDetails = (o: Ov) => o.type === 'application'
    ? (o.applications || '-')
    : [o.filterCategories.length && `Category: ${o.filterCategories.map(appCategoryName).join(', ')}`,
       o.risk.length && `Risk: ${o.risk.join(',')}`, o.popularity.length && `Popularity: ${o.popularity.join(',')}`,
       o.behavior.length && `Behavior: ${o.behavior.join(',')}`].filter(Boolean).join(' | ') || '-';
  const ovColumns: InlineColumn<Ov>[] = [
    { key: 'id', label: 'Priority', width: '70px' },
    { key: 'details', label: 'Details', render: ovDetails },
    { key: 'type', label: 'Type', render: (o) => o.type.charAt(0).toUpperCase() + o.type.slice(1) },
    { key: 'action', label: 'Action', render: (o) => o.action.charAt(0).toUpperCase() + o.action.slice(1) },
  ];
  const ovFields: FieldDef[] = [
    { key: 'type', label: 'Type', type: 'select', options: [{ value: 'application', label: 'Application' }, { value: 'filter', label: 'Filter' }] },
    { key: 'action', label: 'Action', type: 'select', options: [
      { value: 'block', label: 'Block' }, { value: 'pass', label: 'Pass' }, { value: 'reset', label: 'Reset' }, { value: 'quarantine', label: 'Quarantine' },
    ]},
    { key: 'applications', label: 'Applications (Application type — enter app ids/names)', type: 'text', width: 'full' },
    { key: 'filterCategories', label: 'Filter: Category', type: 'multiselect', width: 'full', options: catRows.map((c) => ({ value: String(c.id), label: c.name })) },
    { key: 'behavior', label: 'Filter: Behavior', type: 'multiselect', options: APP_BEHAVIORS.map((b) => ({ value: b, label: b })) },
    { key: 'popularity', label: 'Filter: Popularity', type: 'multiselect', options: APP_POPULARITY.map((p) => ({ value: p, label: `${p} star${p === '1' ? '' : 's'}` })) },
    { key: 'risk', label: 'Filter: Risk', type: 'multiselect', options: APP_RISK.map((r) => ({ value: r, label: r })) },
  ];
  const saveOv = () => {
    if (!ovEdit) return;
    const item = { ...ovEdit.item, filterCategories: (ovEdit.item.filterCategories as any[]).map(Number) };
    const list = [...draft.overrides];
    if (ovEdit.index < 0) list.push({ ...item, id: list.length + 1 }); else list[ovEdit.index] = item;
    set({ overrides: list });
    setOvEdit(null);
  };

  return (
    <>
      <EditorPage title={isNew ? 'New Application Sensor' : 'Edit Application Sensor'} onSave={() => onSave(draft)} onCancel={onCancel}>
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

          <FormSection title="Categories">
            <FieldRow label="" align="start">
              <div className="border border-forti-table-border rounded overflow-hidden w-full max-w-[560px]">
                <table className="w-full text-xs">
                  <thead><tr className="bg-forti-table-header text-forti-text-secondary">
                    <th className="text-left font-semibold px-3 py-1.5 border-b border-forti-table-border">Name</th>
                    <th className="text-left font-semibold px-3 py-1.5 border-b border-forti-table-border" style={{ width: '160px' }}>Action</th>
                  </tr></thead>
                  <tbody>
                    {catRows.map((c) => (
                      <tr key={c.id} className="border-b border-forti-table-border hover:bg-gray-50">
                        <td className="px-3 py-1.5">{c.name}</td>
                        <td className="px-3 py-1">
                          <select className="border border-gray-300 rounded px-2 py-1 text-xs bg-white" value={catActionOf(c.id)} onChange={(e) => setCatAction(c.id, e.target.value)}>
                            {CAT_ACTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b border-forti-table-border bg-gray-50">
                      <td className="px-3 py-1.5 font-medium">Other Known Applications</td>
                      <td className="px-3 py-1">
                        <select className="border border-gray-300 rounded px-2 py-1 text-xs bg-white" value={draft.otherApplicationAction} onChange={(e) => set({ otherApplicationAction: e.target.value as any })}>
                          <option value="pass">Allow</option><option value="monitor">Monitor</option><option value="block">Block</option>
                        </select>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-3 py-1.5 font-medium">Unknown Applications</td>
                      <td className="px-3 py-1">
                        <select className="border border-gray-300 rounded px-2 py-1 text-xs bg-white" value={draft.unknownApplicationAction} onChange={(e) => set({ unknownApplicationAction: e.target.value as any })}>
                          <option value="pass">Allow</option><option value="monitor">Monitor</option><option value="block">Block</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </FieldRow>
          </FormSection>

          <FormSection title="Network Protocol Enforcement">
            <FieldRow label="Enable">
              <Toggle checked={draft.networkProtocolEnforcement} onChange={(v) => set({ networkProtocolEnforcement: v })} />
            </FieldRow>
            {draft.networkProtocolEnforcement && (
              <FieldRow label="" align="start">
                <InlineTable<Ns> columns={nsColumns} data={draft.networkServices}
                  onCreate={() => setNsEdit({ item: { id: 0, port: 0, protocols: [], violationAction: 'block' }, index: -1 })}
                  onEdit={(item, index) => setNsEdit({ item: { ...item }, index })}
                  onDelete={(_, index) => set({ networkServices: draft.networkServices.filter((_, i) => i !== index) })} />
              </FieldRow>
            )}
          </FormSection>

          <FormSection title="Application and Filter Overrides">
            <FieldRow label="" align="start">
              <InlineTable<Ov> columns={ovColumns} data={draft.overrides} maxHeight={240}
                onCreate={() => setOvEdit({ item: { id: 0, type: 'filter', action: 'block', applications: '', filterCategories: [], behavior: [], popularity: [], risk: [], log: true }, index: -1 })}
                onEdit={(item, index) => setOvEdit({ item: { ...item, filterCategories: item.filterCategories.map(String) as any }, index })}
                onDelete={(_, index) => set({ overrides: draft.overrides.filter((_, i) => i !== index) })} />
            </FieldRow>
          </FormSection>

          <FormSection title="Options">
            <FieldRow label="Deep application inspection">
              <Toggle checked={draft.deepAppInspection} onChange={(v) => set({ deepAppInspection: v })} />
            </FieldRow>
          </FormSection>
        </Card>
      </EditorPage>

      {nsEdit && (
        <EditModal title="Default Network Service" fields={nsFields} values={nsEdit.item} isNew={nsEdit.index < 0}
          onChange={(key, val) => setNsEdit({ ...nsEdit, item: { ...nsEdit.item, [key]: val } })}
          onSave={saveNs} onCancel={() => setNsEdit(null)} />
      )}
      {ovEdit && (
        <EditModal title="Override" fields={ovFields} values={ovEdit.item} isNew={ovEdit.index < 0}
          onChange={(key, val) => setOvEdit({ ...ovEdit, item: { ...ovEdit.item, [key]: val } })}
          onSave={saveOv} onCancel={() => setOvEdit(null)} />
      )}
    </>
  );
}
