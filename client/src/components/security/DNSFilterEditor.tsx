import React, { useState } from 'react';
import EditModal, { FieldDef } from '../shared/EditModal';
import { useProjectStore } from '../../store/projectStore';
import { EditorPage, Card, FormSection, FieldRow, Segmented, Toggle, InlineTable, StringChips } from '../shared/forti';
import type { InlineColumn } from '../shared/forti';
import type { DNSFilterProfile } from '../../types/fortigate';
import CategoryFilterTable from './CategoryFilterTable';

type Dom = DNSFilterProfile['domainFilter'][number];

interface Props {
  initial: DNSFilterProfile;
  isNew: boolean;
  onSave: (item: DNSFilterProfile) => void;
  onCancel: () => void;
}

// DNS filter category actions: Allow / Monitor / Block ("Redirect to Block Portal")
const ACTION_OPTS = [
  { value: 'allow', label: 'Allow' }, { value: 'monitor', label: 'Monitor' }, { value: 'block', label: 'Redirect to Block Portal' },
];

export default function DNSFilterEditor({ initial, isNew, onSave, onCancel }: Props) {
  const config = useProjectStore((s) => s.project.config);
  const localCats = config.securityProfiles.ftgdLocalCategories;
  const [draft, setDraft] = useState<DNSFilterProfile>(initial);
  const set = (patch: Partial<DNSFilterProfile>) => setDraft((d) => ({ ...d, ...patch }));

  const [domEdit, setDomEdit] = useState<{ item: Dom; index: number } | null>(null);
  const [extBlocklist, setExtBlocklist] = useState(initial.externalIpBlocklist.length > 0);
  const redirectSpecify = draft.redirectPortal !== '';

  const domColumns: InlineColumn<Dom>[] = [
    { key: 'domain', label: 'Domain' },
    { key: 'type', label: 'Type' },
    { key: 'action', label: 'Action' },
    { key: 'status', label: 'Enabled', render: (d) => (d.status ? 'Yes' : 'No') },
  ];

  const domFields: FieldDef[] = [
    { key: 'domain', label: 'Domain', type: 'text' },
    { key: 'type', label: 'Type', type: 'select', options: [
      { value: 'simple', label: 'Simple' }, { value: 'regex', label: 'Regex' }, { value: 'wildcard', label: 'Wildcard' },
    ]},
    { key: 'action', label: 'Action', type: 'select', options: [
      { value: 'block', label: 'Block' }, { value: 'allow', label: 'Allow' }, { value: 'monitor', label: 'Monitor' },
    ]},
    { key: 'status', label: 'Enabled', type: 'checkbox' },
  ];

  const saveDom = () => {
    if (!domEdit) return;
    const list = [...draft.domainFilter];
    if (domEdit.index < 0) list.push({ ...domEdit.item, id: list.length + 1 }); else list[domEdit.index] = domEdit.item;
    set({ domainFilter: list, domainFilterTable: draft.domainFilterTable || 1 });
    setDomEdit(null);
  };

  const handleSave = () => {
    onSave({ ...draft, externalIpBlocklist: extBlocklist ? draft.externalIpBlocklist : [] });
  };

  return (
    <>
      <EditorPage title={isNew ? 'New DNS Filter Profile' : 'Edit DNS Filter Profile'} onSave={handleSave} onCancel={onCancel}>
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
          <FieldRow label="Redirect botnet C&amp;C requests to Block Portal">
            <Toggle checked={draft.blockBotnet} onChange={(v) => set({ blockBotnet: v })} />
          </FieldRow>
          <FieldRow label="Enforce 'Safe Search' on Google, Bing, YouTube">
            <Toggle checked={draft.safeSearch} onChange={(v) => set({ safeSearch: v })} />
          </FieldRow>

          {/* FortiGuard categories */}
          <FormSection title="FortiGuard Category Based Filter">
            <FieldRow label="" align="start">
              <CategoryFilterTable
                value={draft.ftgdDnsCategories}
                onChange={(v) => set({ ftgdDnsCategories: v as DNSFilterProfile['ftgdDnsCategories'] })}
                actionOptions={ACTION_OPTS}
                localCategories={localCats}
              />
            </FieldRow>
          </FormSection>

          {/* Static domain filter */}
          <FormSection title="Static Domain Filter">
            <FieldRow label="Domain Filter" align="start">
              <InlineTable<Dom>
                columns={domColumns}
                data={draft.domainFilter}
                maxHeight={260}
                onCreate={() => setDomEdit({ item: { id: 0, domain: '', type: 'simple', action: 'block', status: true }, index: -1 })}
                onEdit={(item, index) => setDomEdit({ item: { ...item }, index })}
                onDelete={(_, index) => set({ domainFilter: draft.domainFilter.filter((_, i) => i !== index) })}
              />
            </FieldRow>
            <FieldRow label="External IP Block Lists" align="start">
              <div>
                <Toggle checked={extBlocklist} onChange={setExtBlocklist} />
                {extBlocklist && (
                  <div className="mt-2">
                    <StringChips value={draft.externalIpBlocklist} onChange={(v) => set({ externalIpBlocklist: v })} placeholder="External resource name" />
                  </div>
                )}
              </div>
            </FieldRow>
          </FormSection>

          {/* Options */}
          <FormSection title="Options">
            <FieldRow label="Redirect Portal IP" align="start">
              <div>
                <Segmented value={redirectSpecify ? 'specify' : 'default'} onChange={(v) => set({ redirectPortal: v === 'specify' ? (draft.redirectPortal || ' ') : '' })}
                  options={[{ value: 'default', label: 'Use FortiGuard Default' }, { value: 'specify', label: 'Specify' }]} />
                {redirectSpecify && (
                  <input className="forti-input max-w-[240px] mt-2" value={draft.redirectPortal.trim()} onChange={(e) => set({ redirectPortal: e.target.value })} placeholder="0.0.0.0" />
                )}
              </div>
            </FieldRow>
            <FieldRow label="Log all DNS queries and responses">
              <Toggle checked={draft.logAllDomain} onChange={(v) => set({ logAllDomain: v })} />
            </FieldRow>
            <FieldRow label="Strip Encrypted Client Hello service parameters">
              <Toggle checked={draft.stripEch} onChange={(v) => set({ stripEch: v })} />
            </FieldRow>
          </FormSection>
        </Card>
      </EditorPage>

      {domEdit && (
        <EditModal title="Domain Filter Entry" fields={domFields} values={domEdit.item} isNew={domEdit.index < 0}
          onChange={(key, val) => setDomEdit({ ...domEdit, item: { ...domEdit.item, [key]: val } })}
          onSave={saveDom} onCancel={() => setDomEdit(null)} />
      )}
    </>
  );
}
