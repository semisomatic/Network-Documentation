import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { EditorPage, Card, FormSection, FieldRow, InfoDot, Segmented, Toggle, ObjectSelect } from '../shared/forti';
import type { ObjectOption } from '../shared/forti';
import type { FirewallPolicy as FWPolicy } from '../../types/fortigate';

interface Props {
  initial: FWPolicy;
  isNew: boolean;
  onSave: (item: FWPolicy) => void;
  onCancel: () => void;
}

export default function PolicyEditor({ initial, isNew, onSave, onCancel }: Props) {
  const config = useProjectStore((s) => s.project.config);
  const [draft, setDraft] = useState<FWPolicy>(initial);
  const set = (patch: Partial<FWPolicy>) => setDraft((d) => ({ ...d, ...patch }));

  // ---- option lists ----
  const intfOptions: ObjectOption[] = [
    ...config.system.interfaces.map((i) => ({ value: i.name, label: i.name })),
    ...config.system.zones.map((z) => ({ value: z.name, label: `[Zone] ${z.name}` })),
    ...(config.sdwan?.zones || []).map((z) => ({ value: z.name, label: `[SD-WAN] ${z.name}` })),
  ];
  const addrOptions: ObjectOption[] = [
    { value: 'all', label: 'all' },
    ...config.firewallAddress.map((a) => ({ value: a.name, label: a.name })),
    ...config.firewallAddrgrp.map((g) => ({ value: g.name, label: `[Group] ${g.name}` })),
  ];
  const dstAddrOptions: ObjectOption[] = [
    ...addrOptions,
    ...config.firewallVip.map((v) => ({ value: v.name, label: `[VIP] ${v.name}` })),
  ];
  const svcOptions: ObjectOption[] = [
    { value: 'ALL', label: 'ALL' },
    ...config.firewallService.map((s) => ({ value: s.name, label: s.name })),
    ...config.firewallServiceGroup.map((g) => ({ value: g.name, label: `[Group] ${g.name}` })),
  ];
  const groupOptions: ObjectOption[] = config.user.group.map((g) => ({ value: g.name, label: g.name }));
  const poolOptions: ObjectOption[] = config.firewallIppool.map((p) => ({ value: p.name, label: p.name }));
  const schedOptions = ['always', ...config.firewallSchedule.map((s) => s.name)];

  // ---- security profile helper ----
  const profileRow = (label: string, key: keyof FWPolicy, profiles: { name: string }[]) => {
    const current = draft[key] as string;
    const opts = profiles.map((p) => p.name);
    return (
      <FieldRow label={label}>
        <div className="flex items-center gap-3">
          <Toggle
            checked={!!current}
            disabled={opts.length === 0}
            onChange={(on) => set({ [key]: on ? (current || opts[0] || '') : '' } as Partial<FWPolicy>)}
          />
          {!!current && (
            <select className="forti-select max-w-[300px]" value={current} onChange={(e) => set({ [key]: e.target.value } as Partial<FWPolicy>)}>
              {opts.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>
      </FieldRow>
    );
  };

  const logOn = draft.logtraffic !== 'disable';

  const handleSave = () => {
    const utmStatus = !!(draft.avProfile || draft.webfilterProfile || draft.dnsfilterProfile || draft.applicationList || draft.ipsSensor);
    onSave({ ...draft, utmStatus });
  };

  return (
    <EditorPage title={isNew ? 'New Policy' : 'Edit Policy'} onSave={handleSave} onCancel={onCancel}>
      <Card>
        <FieldRow label={<>Name <InfoDot tip="Policy name" /></>}>
          <input className="forti-input max-w-[360px]" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </FieldRow>
        <FieldRow label="Schedule">
          <select className="forti-select max-w-[360px]" value={draft.schedule} onChange={(e) => set({ schedule: e.target.value })}>
            {schedOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Action">
          <Segmented value={draft.action} onChange={(v) => set({ action: v as FWPolicy['action'] })}
            options={[{ value: 'accept', label: 'ACCEPT' }, { value: 'deny', label: 'DENY', danger: true }]} />
        </FieldRow>
        <FieldRow label="Incoming Interface" align="start">
          <ObjectSelect options={intfOptions} value={draft.srcintf} onChange={(v) => set({ srcintf: v })} placeholder="Select interface" />
        </FieldRow>
        <FieldRow label="Outgoing Interface" align="start">
          <ObjectSelect options={intfOptions} value={draft.dstintf} onChange={(v) => set({ dstintf: v })} placeholder="Select interface" />
        </FieldRow>

        {/* Source & Destination */}
        <FormSection title="Source & Destination">
          <FieldRow label="Source" align="start">
            <div>
              <ObjectSelect options={addrOptions} value={draft.srcaddr} onChange={(v) => set({ srcaddr: v })} placeholder="Select address" />
              <label className="flex items-center gap-2 mt-1.5 text-xs text-forti-text-secondary">
                <Toggle checked={draft.srcaddrNegate} onChange={(v) => set({ srcaddrNegate: v })} /> Negate
              </label>
            </div>
          </FieldRow>
          <FieldRow label="User/Group" align="start">
            <ObjectSelect options={groupOptions} value={draft.groups} onChange={(v) => set({ groups: v })} placeholder="Select group" />
          </FieldRow>
          <FieldRow label="Destination" align="start">
            <div>
              <ObjectSelect options={dstAddrOptions} value={draft.dstaddr} onChange={(v) => set({ dstaddr: v })} placeholder="Select address" />
              <label className="flex items-center gap-2 mt-1.5 text-xs text-forti-text-secondary">
                <Toggle checked={draft.dstaddrNegate} onChange={(v) => set({ dstaddrNegate: v })} /> Negate
              </label>
            </div>
          </FieldRow>
          <FieldRow label="Service" align="start">
            <ObjectSelect options={svcOptions} value={draft.service} onChange={(v) => set({ service: v })} placeholder="Select service" />
          </FieldRow>
        </FormSection>

        {/* Firewall / Network Options */}
        <FormSection title="Firewall / Network Options">
          <FieldRow label="Inspection mode">
            <Segmented value={draft.inspectionMode} onChange={(v) => set({ inspectionMode: v as FWPolicy['inspectionMode'] })}
              options={[{ value: 'flow', label: 'Flow-based' }, { value: 'proxy', label: 'Proxy-based' }]} />
          </FieldRow>
          <FieldRow label="NAT">
            <Toggle checked={draft.nat} onChange={(v) => set({ nat: v })} />
          </FieldRow>
          {draft.nat && (
            <>
              <FieldRow label="IP Pool Configuration">
                <Segmented value={draft.ippool ? 'pool' : 'outgoing'} onChange={(v) => set({ ippool: v === 'pool' })}
                  options={[{ value: 'outgoing', label: 'Use Outgoing Interface Address' }, { value: 'pool', label: 'Use Dynamic IP Pool' }]} />
              </FieldRow>
              {draft.ippool && (
                <FieldRow label="IP Pool" align="start">
                  <ObjectSelect options={poolOptions} value={draft.poolname} onChange={(v) => set({ poolname: v })} placeholder="Select IP pool" />
                </FieldRow>
              )}
              <FieldRow label="Fixed Port">
                <Toggle checked={draft.fixedport} onChange={(v) => set({ fixedport: v })} />
              </FieldRow>
            </>
          )}
        </FormSection>

        {/* Security Profiles */}
        <FormSection title="Security Profiles">
          {profileRow('AntiVirus', 'avProfile', config.securityProfiles.antivirus)}
          {profileRow('Web Filter', 'webfilterProfile', config.securityProfiles.webFilter)}
          {profileRow('DNS Filter', 'dnsfilterProfile', config.securityProfiles.dnsFilter)}
          {profileRow('Application Control', 'applicationList', config.securityProfiles.applicationControl)}
          {profileRow('IPS', 'ipsSensor', config.securityProfiles.ips)}
          <FieldRow label="SSL Inspection">
            <select className="forti-select max-w-[300px]" value={draft.sslSshProfile} onChange={(e) => set({ sslSshProfile: e.target.value })}>
              <option value="">no-inspection</option>
              {config.securityProfiles.sslInspection.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </FieldRow>
        </FormSection>

        {/* Logging */}
        <FormSection title="Logging Options">
          <FieldRow label="Log Allowed Traffic">
            <div className="flex items-center gap-3">
              <Toggle checked={logOn} onChange={(on) => set({ logtraffic: on ? 'utm' : 'disable' })} />
              {logOn && (
                <Segmented value={draft.logtraffic} onChange={(v) => set({ logtraffic: v as FWPolicy['logtraffic'] })}
                  options={[{ value: 'utm', label: 'Security Events' }, { value: 'all', label: 'All Sessions' }]} />
              )}
            </div>
          </FieldRow>
          <FieldRow label="Comments" align="start">
            <textarea className="forti-input min-h-[70px] max-w-[420px]" value={draft.comments} onChange={(e) => set({ comments: e.target.value })} rows={2} maxLength={1023} />
          </FieldRow>
          <FieldRow label="Enable this policy">
            <Toggle checked={draft.status === 'enable'} onChange={(v) => set({ status: v ? 'enable' : 'disable' })} />
          </FieldRow>
        </FormSection>
      </Card>
    </EditorPage>
  );
}
