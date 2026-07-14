import React, { useState } from 'react';
import { EditorPage, Card, FormSection, FieldRow, Segmented, Toggle } from '../shared/forti';
import type { SSLInspectionProfile, SSLProtoBlock } from '../../types/fortigate';

interface Props {
  initial: SSLInspectionProfile;
  isNew: boolean;
  onSave: (item: SSLInspectionProfile) => void;
  onCancel: () => void;
}

type ProtoKey = 'https' | 'smtps' | 'pop3s' | 'imaps' | 'ftps' | 'dot';
const QUIC_OPTS = [{ value: 'inspect', label: 'Inspect' }, { value: 'bypass', label: 'Bypass' }, { value: 'block', label: 'Block' }];
const CERT_OPTS = [{ value: 'allow', label: 'Keep Untrusted & Allow' }, { value: 'block', label: 'Block' }, { value: 'ignore', label: 'Trust & Allow' }];

export default function SSLInspectionEditor({ initial, isNew, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<SSLInspectionProfile>(initial);
  const set = (patch: Partial<SSLInspectionProfile>) => setDraft((d) => ({ ...d, ...patch }));
  const setProto = (key: ProtoKey | 'ssh', patch: Partial<SSLProtoBlock>) => set({ [key]: { ...draft[key], ...patch } } as any);

  const method = draft.https.status === 'certificate-inspection' ? 'certificate-inspection' : 'deep-inspection';
  const inspectAll = draft.inspectAll !== '';

  // Common Options — invalid cert handling (global config ssl block)
  const allCert = (v: string) => draft.sslExpiredCert === v && draft.sslRevokedCert === v && draft.sslCertValidationFailure === v;
  const [certCustom, setCertCustom] = useState(!(allCert('allow') || allCert('') || allCert('block')));
  const certMode = certCustom ? 'custom' : allCert('block') ? 'block' : 'allow';
  const setCertMode = (m: string) => {
    if (m === 'custom') { setCertCustom(true); return; }
    setCertCustom(false);
    set({ sslExpiredCert: m, sslRevokedCert: m, sslCertValidationFailure: m });
  };

  const protoRow = (label: string, key: ProtoKey, showPort = true) => {
    const b = draft[key];
    const enabled = b.status !== 'disable' && b.status !== '';
    return (
      <FieldRow label={label}>
        <div className="flex items-center gap-3">
          <Toggle checked={enabled} onChange={(on) => setProto(key, { status: on ? method : 'disable' })} />
          {enabled && showPort && (
            <input className="forti-input max-w-[240px]" value={b.ports} onChange={(e) => setProto(key, { ports: e.target.value })} placeholder="port" />
          )}
        </div>
      </FieldRow>
    );
  };

  const sshEnabled = draft.ssh.status === 'deep-inspection';
  const sshAny = draft.ssh.ports === '' || draft.ssh.ports.toLowerCase() === 'any';

  return (
    <EditorPage title={isNew ? 'New SSL/SSH Inspection Profile' : 'Edit SSL/SSH Inspection Profile'} onSave={() => onSave(draft)} onCancel={onCancel}>
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

        <FormSection title="SSL Inspection Options">
          <FieldRow label="Inspection method">
            <Segmented value={method} onChange={(v) => setProto('https', { status: v })}
              options={[{ value: 'certificate-inspection', label: 'SSL Certificate Inspection' }, { value: 'deep-inspection', label: 'Full SSL Inspection' }]} />
          </FieldRow>
          <FieldRow label="CA certificate">
            <input className="forti-input max-w-[300px]" value={draft.caCert} onChange={(e) => set({ caCert: e.target.value })} placeholder="Fortinet_CA_SSL" />
          </FieldRow>
        </FormSection>

        <FormSection title="Protocol Port Mapping">
          <FieldRow label="Inspect all ports">
            <Toggle checked={inspectAll} onChange={(on) => set({ inspectAll: on ? method : '' })} />
          </FieldRow>
          {!inspectAll && (
            <>
              {protoRow('HTTPS', 'https')}
              {protoRow('SMTPS', 'smtps')}
              {protoRow('POP3S', 'pop3s')}
              {protoRow('IMAPS', 'imaps')}
              {protoRow('FTPS', 'ftps')}
              {protoRow('DNS over TLS', 'dot')}
            </>
          )}
          <FieldRow label="HTTP/3 (QUIC)">
            <Segmented value={draft.https.quic || 'bypass'} onChange={(v) => setProto('https', { quic: v })} options={QUIC_OPTS} />
          </FieldRow>
          <FieldRow label="DNS over QUIC">
            <Segmented value={draft.dot.quic || 'bypass'} onChange={(v) => setProto('dot', { quic: v })} options={QUIC_OPTS} />
          </FieldRow>
        </FormSection>

        <FormSection title="SSH Inspection Options">
          <FieldRow label="SSH deep scan">
            <Toggle checked={sshEnabled} onChange={(on) => setProto('ssh', { status: on ? 'deep-inspection' : 'disable' })} />
          </FieldRow>
          {sshEnabled && (
            <FieldRow label="SSH port">
              <div className="flex items-center gap-3">
                <Segmented value={sshAny ? 'any' : 'specify'} onChange={(v) => setProto('ssh', { ports: v === 'any' ? 'any' : (sshAny ? '22' : draft.ssh.ports) })}
                  options={[{ value: 'any', label: 'Any' }, { value: 'specify', label: 'Specify' }]} />
                {!sshAny && <input className="forti-input max-w-[200px]" value={draft.ssh.ports} onChange={(e) => setProto('ssh', { ports: e.target.value })} placeholder="22" />}
              </div>
            </FieldRow>
          )}
        </FormSection>

        <FormSection title="Common Options">
          <FieldRow label="Invalid SSL certificates" align="start">
            <div>
              <Segmented value={certMode} onChange={setCertMode}
                options={[{ value: 'allow', label: 'Allow' }, { value: 'block', label: 'Block' }, { value: 'custom', label: 'Custom' }]} />
              {certMode === 'custom' && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-3"><span className="w-40 text-xs text-forti-text-secondary">Expired certificates</span>
                    <Segmented value={draft.sslExpiredCert || 'block'} onChange={(v) => set({ sslExpiredCert: v })} options={CERT_OPTS} /></div>
                  <div className="flex items-center gap-3"><span className="w-40 text-xs text-forti-text-secondary">Revoked certificates</span>
                    <Segmented value={draft.sslRevokedCert || 'block'} onChange={(v) => set({ sslRevokedCert: v })} options={CERT_OPTS} /></div>
                  <div className="flex items-center gap-3"><span className="w-40 text-xs text-forti-text-secondary">Validation failed certificates</span>
                    <Segmented value={draft.sslCertValidationFailure || 'block'} onChange={(v) => set({ sslCertValidationFailure: v })} options={CERT_OPTS} /></div>
                </div>
              )}
            </div>
          </FieldRow>
          <FieldRow label="Log SSL anomalies">
            <Toggle checked={draft.logSslAnomalies} onChange={(v) => set({ logSslAnomalies: v })} />
          </FieldRow>
        </FormSection>
      </Card>
    </EditorPage>
  );
}
