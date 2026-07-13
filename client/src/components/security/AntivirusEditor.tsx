import React from 'react';
import { useState } from 'react';
import { EditorPage, Card, FormSection, FieldRow, Segmented, Toggle } from '../shared/forti';
import type { AntivirusProfile } from '../../types/fortigate';

interface Props {
  initial: AntivirusProfile;
  isNew: boolean;
  onSave: (item: AntivirusProfile) => void;
  onCancel: () => void;
}

// Red "P" badge = proxy-based only
const ProxyBadge = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-forti-deny text-white text-[9px] font-bold ml-1" title="Proxy-based only">P</span>
);

export default function AntivirusEditor({ initial, isNew, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<AntivirusProfile>(initial);
  const set = (patch: Partial<AntivirusProfile>) => setDraft((d) => ({ ...d, ...patch }));
  const isFlow = draft.featureSet === 'flow';

  const scanOn = draft.inspectHttp || draft.inspectSmtp || draft.inspectPop3 || draft.inspectImap ||
    draft.inspectFtp || draft.inspectCifs || draft.inspectMapi || draft.inspectNntp || draft.inspectSsh;

  const protoRow = (label: string, key: keyof AntivirusProfile, proxyOnly = false) => (
    <FieldRow label={<span className="inline-flex items-center">{label}{proxyOnly && <ProxyBadge />}</span>}>
      <Toggle checked={draft[key] as boolean} disabled={proxyOnly && isFlow} onChange={(v) => set({ [key]: v } as Partial<AntivirusProfile>)} />
    </FieldRow>
  );

  return (
    <EditorPage title={isNew ? 'New AntiVirus Profile' : 'Edit AntiVirus Profile'} onSave={() => onSave(draft)} onCancel={onCancel}>
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
        <FieldRow label="AntiVirus scan">
          <div className="flex items-center gap-3">
            <Toggle checked={scanOn} onChange={(on) => set(on
              ? { inspectHttp: true, inspectSmtp: true, inspectPop3: true, inspectImap: true, inspectFtp: true }
              : { inspectHttp: false, inspectSmtp: false, inspectPop3: false, inspectImap: false, inspectFtp: false, inspectCifs: false, inspectMapi: false, inspectNntp: false, inspectSsh: false })} />
            <Segmented value={draft.scanAction} onChange={(v) => set({ scanAction: v as AntivirusProfile['scanAction'] })}
              options={[{ value: 'block', label: 'Block' }, { value: 'monitor', label: 'Monitor' }]} />
          </div>
        </FieldRow>
        <FieldRow label="Feature set">
          <Segmented value={draft.featureSet} onChange={(v) => set({ featureSet: v as AntivirusProfile['featureSet'] })}
            options={[{ value: 'flow', label: 'Flow-based' }, { value: 'proxy', label: 'Proxy-based' }]} />
        </FieldRow>

        <FormSection title="Inspected Protocols">
          {protoRow('HTTP', 'inspectHttp')}
          {protoRow('SMTP', 'inspectSmtp')}
          {protoRow('POP3', 'inspectPop3')}
          {protoRow('IMAP', 'inspectImap')}
          {protoRow('FTP', 'inspectFtp')}
          {protoRow('CIFS', 'inspectCifs')}
          {protoRow('MAPI', 'inspectMapi', true)}
          {protoRow('SSH', 'inspectSsh', true)}
        </FormSection>

        <FormSection title="APT Protection Options">
          <FieldRow label="Treat Windows executables in email attachments as viruses">
            <Toggle checked={draft.treatExeAsVirus} onChange={(v) => set({ treatExeAsVirus: v })} />
          </FieldRow>
          <FieldRow label="Include mobile malware protection">
            <Toggle checked={draft.mobileMalware} onChange={(v) => set({ mobileMalware: v })} />
          </FieldRow>
        </FormSection>

        <FormSection title="Virus Outbreak Prevention">
          <FieldRow label="Use FortiGuard outbreak prevention database">
            <Toggle checked={draft.outbreakPrevention} onChange={(v) => set({ outbreakPrevention: v })} />
          </FieldRow>
          <FieldRow label="Scan archived files for outbreak prevention">
            <Toggle checked={draft.outbreakPreventionArchiveScan} onChange={(v) => set({ outbreakPreventionArchiveScan: v })} />
          </FieldRow>
          <FieldRow label="Use external malware block list">
            <Toggle checked={draft.externalBlocklistAll} onChange={(v) => set({ externalBlocklistAll: v })} />
          </FieldRow>
          <FieldRow label="Use EMS external feed">
            <Toggle checked={draft.emsThreatFeed} onChange={(v) => set({ emsThreatFeed: v })} />
          </FieldRow>
        </FormSection>

        <FormSection title="Advanced">
          <FieldRow label="Scan Mode">
            <Segmented value={draft.scanMode} onChange={(v) => set({ scanMode: v as AntivirusProfile['scanMode'] })}
              options={[{ value: 'default', label: 'Default' }, { value: 'legacy', label: 'Legacy' }]} />
          </FieldRow>
        </FormSection>
      </Card>
    </EditorPage>
  );
}
