import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EditorPage, Card, FormSection, FieldRow, Segmented, Toggle, InlineTable } from '../shared/forti';
import type { InlineColumn } from '../shared/forti';
import type { IPSProfile, IPSEntry } from '../../types/fortigate';

interface Props {
  initial: IPSProfile;
  isNew: boolean;
  onSave: (item: IPSProfile) => void;
  onCancel: () => void;
}

const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'];
const SEV_LEVEL: Record<string, number> = { info: 1, low: 2, medium: 3, high: 4, critical: 5 };
const SEV_COLOR: Record<string, string> = { info: 'bg-gray-400', low: 'bg-sky-500', medium: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500' };

function SeverityBar({ sev }: { sev: string }) {
  const level = SEV_LEVEL[sev] || 0;
  return (
    <span className="inline-flex items-center gap-1" title={sev}>
      <span className="text-[9px] font-bold bg-gray-500 text-white px-1 rounded-sm">SEV</span>
      <span className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`w-2 h-2.5 rounded-[1px] ${i <= level ? SEV_COLOR[sev] : 'bg-gray-200'}`} />)}
      </span>
    </span>
  );
}

const ACTION_OPTS = [
  { value: 'default', label: 'Default' }, { value: 'pass', label: 'Allow' }, { value: 'monitor', label: 'Monitor' },
  { value: 'block', label: 'Block' }, { value: 'reset', label: 'Reset' }, { value: 'quarantine', label: 'Quarantine' },
];
const actionLabel = (a: string) => ACTION_OPTS.find((o) => o.value === a)?.label ?? a;

export default function IPSEditor({ initial, isNew, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<IPSProfile>(initial);
  const set = (patch: Partial<IPSProfile>) => setDraft((d) => ({ ...d, ...patch }));
  const [entry, setEntry] = useState<{ item: IPSEntry; index: number } | null>(null);

  const columns: InlineColumn<IPSEntry>[] = [
    { key: 'details', label: 'Details', render: (en) => en.type === 'signature'
        ? <span>{en.rule.length} signature{en.rule.length === 1 ? '' : 's'}</span>
        : <span className="inline-flex flex-col gap-0.5">
            {en.severity.length ? en.severity.map((s) => <SeverityBar key={s} sev={s} />) : <span className="text-gray-400">All severities</span>}
            {[en.location.length && `location: ${en.location.join(',')}`, en.protocol.length && `protocol: ${en.protocol.join(',')}`, en.os.length && `os: ${en.os.join(',')}`].filter(Boolean).map((t, i) => <span key={i} className="text-[11px] text-forti-text-secondary">{t}</span>)}
          </span> },
    { key: 'exemptIps', label: 'Exempt IPs', render: (en) => en.exemptIps.join(', ') || '-' },
    { key: 'action', label: 'Action', render: (en) => actionLabel(en.action) },
    { key: 'logPacket', label: 'Packet Logging', render: (en) => en.logPacket ? 'Enabled' : 'Disabled' },
  ];

  const saveEntry = () => {
    if (!entry) return;
    const list = [...draft.entries];
    if (entry.index < 0) list.push({ ...entry.item, id: (list.length ? Math.max(...list.map((e) => e.id)) : 0) + 1 });
    else list[entry.index] = entry.item;
    set({ entries: list });
    setEntry(null);
  };
  const setE = (patch: Partial<IPSEntry>) => entry && setEntry({ ...entry, item: { ...entry.item, ...patch } });
  const toggleSev = (s: string) => {
    if (!entry) return;
    const has = entry.item.severity.includes(s);
    setE({ severity: has ? entry.item.severity.filter((x) => x !== s) : [...entry.item.severity, s] });
  };

  return (
    <>
      <EditorPage title={isNew ? 'New IPS Sensor' : 'Edit IPS Sensor'} onSave={() => onSave(draft)} onCancel={onCancel}>
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
          <FieldRow label="Block malicious URLs">
            <Toggle checked={draft.blockMaliciousUrl} onChange={(v) => set({ blockMaliciousUrl: v })} />
          </FieldRow>

          <FormSection title="IPS Signatures and Filters">
            <FieldRow label="" align="start">
              <InlineTable<IPSEntry> columns={columns} data={draft.entries} maxHeight={300}
                onCreate={() => setEntry({ item: { id: 0, type: 'filter', action: 'default', status: 'default', logPacket: false, severity: [], rule: [], exemptIps: [], location: [], protocol: [], os: [], application: [] }, index: -1 })}
                onEdit={(item, index) => setEntry({ item: { ...item }, index })}
                onDelete={(_, index) => set({ entries: draft.entries.filter((_, i) => i !== index) })} />
            </FieldRow>
          </FormSection>

          <FormSection title="Botnet C&amp;C">
            <FieldRow label="Scan Outgoing Connections to Botnet Sites">
              <Segmented value={draft.scanBotnetConnections} onChange={(v) => set({ scanBotnetConnections: v as IPSProfile['scanBotnetConnections'] })}
                options={[{ value: 'disable', label: 'Disable' }, { value: 'block', label: 'Block', danger: true }, { value: 'monitor', label: 'Monitor' }]} />
            </FieldRow>
          </FormSection>
        </Card>
      </EditorPage>

      {/* Entry editor */}
      {entry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-forti-table-border bg-forti-table-header rounded-t-lg">
              <h3 className="text-base font-semibold">{entry.index < 0 ? 'Add' : 'Edit'} Signatures</h3>
              <button onClick={() => setEntry(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center gap-4">
                <label className="w-28 text-sm text-forti-text-secondary">Type</label>
                <Segmented value={entry.item.type} onChange={(v) => setE({ type: v as IPSEntry['type'] })}
                  options={[{ value: 'filter', label: 'Filter' }, { value: 'signature', label: 'Signature' }]} />
              </div>
              <div className="flex items-center gap-4">
                <label className="w-28 text-sm text-forti-text-secondary">Action</label>
                <select className="forti-select max-w-[200px]" value={entry.item.action} onChange={(e) => setE({ action: e.target.value as IPSEntry['action'] })}>
                  {ACTION_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-28 text-sm text-forti-text-secondary">Packet logging</label>
                <Segmented value={entry.item.logPacket ? 'enable' : 'disable'} onChange={(v) => setE({ logPacket: v === 'enable' })}
                  options={[{ value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable', danger: true }]} />
              </div>
              <div className="flex items-center gap-4">
                <label className="w-28 text-sm text-forti-text-secondary">Status</label>
                <Segmented value={entry.item.status} onChange={(v) => setE({ status: v as IPSEntry['status'] })}
                  options={[{ value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable', danger: true }, { value: 'default', label: 'Default' }]} />
              </div>
              {entry.item.type === 'filter' ? (
                <div className="flex items-start gap-4">
                  <label className="w-28 text-sm text-forti-text-secondary pt-1">Filter (Severity)</label>
                  <div className="flex flex-col gap-1.5">
                    {SEVERITIES.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSev(s)}
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-left ${entry.item.severity.includes(s) ? 'border-forti-accent bg-forti-accent-soft' : 'border-gray-200'}`}>
                        <SeverityBar sev={s} /><span className="text-xs capitalize">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <label className="w-28 text-sm text-forti-text-secondary pt-1">Signatures</label>
                  <input className="forti-input" value={entry.item.rule.join(' ')} onChange={(e) => setE({ rule: e.target.value.split(/[\s,]+/).filter(Boolean) })} placeholder="Signature ids/names" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-forti-table-border bg-gray-50 rounded-b-lg">
              <button onClick={() => setEntry(null)} className="forti-btn-secondary">Cancel</button>
              <button onClick={saveEntry} className="forti-btn-primary">OK</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
