import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card, FormSection, FieldRow, Segmented, Toggle, InlineTable, InfoDot } from '../shared/forti';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useProjectStore } from '../../store/projectStore';
import type {
  BGPNeighbor, BGPNetwork, BGPNeighborGroup, BGPNeighborRange, BGPRedistribute,
} from '../../types/fortigate';

const NEIGHBOR_PATH = 'router.bgp.neighbors';
const GROUP_PATH = 'router.bgp.neighborGroups';
const RANGE_PATH = 'router.bgp.neighborRanges';
const NETWORK_PATH = 'router.bgp.networks';

const newNeighbor = (): BGPNeighbor => ({
  ip: '', remoteAs: 0, description: '', weight: 0, holdtimeTimer: 60, keepAliveTimer: 30,
  ebgpMultihop: 0, ebgpMultihopTtl: 255, nextHopSelf: false, softReconfiguration: false,
  routeMapIn: '', routeMapOut: '', updateSource: '', bfd: false, status: 'enable', comment: '',
});
const newGroup = (): BGPNeighborGroup => ({ name: '', remoteAs: 0 });
const newRange = (): BGPNeighborRange => ({ id: 0, prefix: '', neighborGroup: '', maxNeighborNum: 0 });
const newNetwork = (): BGPNetwork => ({ id: 0, prefix: '', routeMap: '' });

const nextId = (items: { id: number }[]) => (items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1);

// Accordion-style collapsible section wrapper (FortiGate "Advanced Options" etc.)
function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-forti-table-border rounded mb-4">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-forti-text-primary bg-forti-band hover:bg-gray-100 rounded-t">
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        {title}
      </button>
      {open && <div className="px-5 py-3">{children}</div>}
    </div>
  );
}

// Small modal shell for list row editors
function RowModal({ title, onSave, onCancel, children }: { title: string; onSave: () => void; onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-forti-table-border bg-forti-table-header rounded-t-lg">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="px-6 py-4 space-y-3 overflow-y-auto">{children}</div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-forti-table-border bg-gray-50 rounded-b-lg">
          <button onClick={onCancel} className="forti-btn-secondary">Cancel</button>
          <button onClick={onSave} className="forti-btn-primary">OK</button>
        </div>
      </div>
    </div>
  );
}

function ModalRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-32 shrink-0 text-sm text-forti-text-secondary">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function BGP() {
  const config = useProjectStore((s) => s.project.config);
  const neighborHighlights = useProjectStore((s) => s.project.highlights[NEIGHBOR_PATH] || {});
  const networkHighlights = useProjectStore((s) => s.project.highlights[NETWORK_PATH] || {});
  const { updateConfig, addItem, updateItem, removeItem, setHighlight } = useProjectStore();
  const bgp = config.router.bgp;

  const updateBgp = (patch: Partial<typeof bgp>) => updateConfig((c) => ({ ...c, router: { ...c.router, bgp: { ...c.router.bgp, ...patch } } }));
  const updateRedist = (patch: Partial<BGPRedistribute>) => updateBgp({ redistribute: { ...bgp.redistribute, ...patch } });

  const [neighbor, setNeighbor] = useState<{ item: BGPNeighbor; index: number } | null>(null);
  const [group, setGroup] = useState<{ item: BGPNeighborGroup; index: number } | null>(null);
  const [range, setRange] = useState<{ item: BGPNeighborRange; index: number } | null>(null);
  const [network, setNetwork] = useState<{ item: BGPNetwork; index: number } | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ path: string; index: number; label: string } | null>(null);

  const intfOptions = ['', ...config.system.interfaces.map((i) => i.name)];

  const saveVia = <T,>(path: string, state: { item: T; index: number } | null, close: () => void) => {
    if (!state) return;
    if (state.index < 0) addItem(path, state.item);
    else updateItem(path, state.index, state.item);
    close();
  };

  // ---- Redistribute row: toggle + optional route-map ----
  const redistRow = (label: string, on: keyof BGPRedistribute, rm: keyof BGPRedistribute) => (
    <FieldRow label={label}>
      <div className="flex items-center gap-3 flex-wrap">
        <Toggle checked={bgp.redistribute[on] as boolean} onChange={(v) => updateRedist({ [on]: v } as Partial<BGPRedistribute>)} />
        {(bgp.redistribute[on] as boolean) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-forti-text-secondary">Route Map</span>
            <input className="forti-input max-w-[220px]" value={bgp.redistribute[rm] as string}
              onChange={(e) => updateRedist({ [rm]: e.target.value } as Partial<BGPRedistribute>)} placeholder="(none)" />
          </div>
        )}
      </div>
    </FieldRow>
  );

  const numField = (label: string, key: keyof typeof bgp, help?: string) => (
    <FieldRow label={label} help={help}>
      <input type="number" className="forti-input max-w-[160px]" value={(bgp[key] as number) ?? 0}
        onChange={(e) => updateBgp({ [key]: parseInt(e.target.value) || 0 } as any)} />
    </FieldRow>
  );

  const bestPath = (label: string, key: keyof typeof bgp) => (
    <FieldRow label={label}>
      <Toggle checked={bgp[key] as boolean} onChange={(v) => updateBgp({ [key]: v } as any)} />
    </FieldRow>
  );

  const neighborColumns = [
    { key: 'ip', label: 'IP' },
    { key: 'remoteAs', label: 'Remote AS', width: '100px' },
    { key: 'updateSource', label: 'Update Source' },
    { key: 'nextHopSelf', label: 'Next-Hop-Self', width: '110px', render: (n: BGPNeighbor) => (n.nextHopSelf ? 'Yes' : 'No') },
    { key: 'status', label: 'Status', width: '90px' },
  ];
  const groupColumns = [
    { key: 'name', label: 'Name' },
    { key: 'remoteAs', label: 'Remote AS' },
  ];
  const rangeColumns = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'prefix', label: 'Prefix' },
    { key: 'neighborGroup', label: 'Neighbor Group' },
    { key: 'maxNeighborNum', label: 'Max Neighbor #' },
  ];
  const networkColumns = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'prefix', label: 'Prefix' },
    { key: 'routeMap', label: 'Route Map', render: (n: BGPNetwork) => n.routeMap || '-' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-0">
        <h1 className="inline-block text-[17px] font-semibold text-forti-text-primary pb-2 border-b-2 border-forti-accent">Local BGP Options</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl">
          <Card>
            <FieldRow label="Local AS">
              <input type="number" className="forti-input max-w-[200px]" value={bgp.as || ''}
                onChange={(e) => updateBgp({ as: parseInt(e.target.value) || 0 })} placeholder="65000" />
            </FieldRow>
            <FieldRow label="Router ID">
              <input className="forti-input max-w-[200px]" value={bgp.routerId}
                onChange={(e) => updateBgp({ routerId: e.target.value })} placeholder="0.0.0.0" />
            </FieldRow>

            {/* Neighbors */}
            <FormSection title="Neighbors">
              <FieldRow label="" align="start">
                <InlineTable<BGPNeighbor> columns={neighborColumns} data={bgp.neighbors} getRowKey={(n) => n.ip} maxHeight={280}
                  onCreate={() => setNeighbor({ item: newNeighbor(), index: -1 })}
                  onEdit={(item, index) => setNeighbor({ item: { ...item }, index })}
                  onDelete={(item, index) => setConfirmDel({ path: NEIGHBOR_PATH, index, label: `neighbor ${item.ip}` })} />
              </FieldRow>
            </FormSection>

            {/* Neighbor Groups */}
            <FormSection title="Neighbor Groups">
              <FieldRow label="" align="start">
                <InlineTable<BGPNeighborGroup> columns={groupColumns} data={bgp.neighborGroups} getRowKey={(g) => g.name} maxHeight={220}
                  onCreate={() => setGroup({ item: newGroup(), index: -1 })}
                  onEdit={(item, index) => setGroup({ item: { ...item }, index })}
                  onDelete={(item, index) => setConfirmDel({ path: GROUP_PATH, index, label: `neighbor group ${item.name}` })} />
              </FieldRow>
            </FormSection>

            {/* Neighbor Ranges */}
            <FormSection title="Neighbor Ranges">
              <FieldRow label="" align="start">
                <InlineTable<BGPNeighborRange> columns={rangeColumns} data={bgp.neighborRanges} getRowKey={(r) => String(r.id)} maxHeight={220}
                  onCreate={() => setRange({ item: { ...newRange(), id: nextId(bgp.neighborRanges) }, index: -1 })}
                  onEdit={(item, index) => setRange({ item: { ...item }, index })}
                  onDelete={(item, index) => setConfirmDel({ path: RANGE_PATH, index, label: `neighbor range ${item.prefix}` })} />
              </FieldRow>
            </FormSection>

            {/* Networks */}
            <FormSection title="Networks">
              <FieldRow label="" align="start">
                <InlineTable<BGPNetwork> columns={networkColumns} data={bgp.networks} getRowKey={(n) => String(n.id)} maxHeight={280}
                  onCreate={() => setNetwork({ item: { ...newNetwork(), id: nextId(bgp.networks) }, index: -1 })}
                  onEdit={(item, index) => setNetwork({ item: { ...item }, index })}
                  onDelete={(item, index) => setConfirmDel({ path: NETWORK_PATH, index, label: `network ${item.prefix}` })} />
              </FieldRow>
            </FormSection>

            {/* IPv4 Redistribute */}
            <FormSection title="IPv4 Redistribute">
              {redistRow('Connected', 'connected', 'connectedRouteMap')}
              {redistRow('RIP', 'rip', 'ripRouteMap')}
              {redistRow('OSPF', 'ospf', 'ospfRouteMap')}
              {redistRow('Static', 'static', 'staticRouteMap')}
              {redistRow('ISIS', 'isis', 'isisRouteMap')}
            </FormSection>
          </Card>

          {/* Dampening */}
          <Collapsible title="Dampening">
            <FieldRow label="Enable dampening">
              <Toggle checked={bgp.dampening} onChange={(v) => updateBgp({ dampening: v })} />
            </FieldRow>
            {bgp.dampening && (
              <>
                <FieldRow label="Route Map">
                  <input className="forti-input max-w-[220px]" value={bgp.dampeningRouteMap} onChange={(e) => updateBgp({ dampeningRouteMap: e.target.value })} placeholder="(none)" />
                </FieldRow>
                {numField('Reachability half-life (min)', 'dampeningReachabilityHalfLife')}
                {numField('Reuse', 'dampeningReuse')}
                {numField('Suppress', 'dampeningSuppress')}
                {numField('Max suppress time (min)', 'dampeningMaxSuppressTime')}
                {numField('Unreachability half-life (min)', 'dampeningUnreachabilityHalfLife')}
              </>
            )}
          </Collapsible>

          {/* Graceful Restart */}
          <Collapsible title="Graceful Restart">
            <FieldRow label="Enable graceful restart">
              <Toggle checked={bgp.gracefulRestart} onChange={(v) => updateBgp({ gracefulRestart: v })} />
            </FieldRow>
            {bgp.gracefulRestart && (
              <>
                {numField('Restart time (sec)', 'gracefulRestartTime')}
                {numField('Stale path time (sec)', 'gracefulStalepathTime')}
                {numField('Update delay (sec)', 'gracefulUpdateDelay')}
              </>
            )}
          </Collapsible>

          {/* Advanced Options */}
          <Collapsible title="Advanced Options">
            {numField('Default local preference', 'defaultLocalPreference')}
            <FieldRow label={<span>Cluster ID <InfoDot tip="Route reflector cluster ID" /></span>}>
              <input className="forti-input max-w-[200px]" value={bgp.clusterId} onChange={(e) => updateBgp({ clusterId: e.target.value })} placeholder="0.0.0.0" />
            </FieldRow>
            {numField('Distance — External', 'distanceExternal')}
            {numField('Distance — Internal', 'distanceInternal')}
            {numField('Distance — Local', 'distanceLocal')}
            {numField('Keepalive timer (sec)', 'keepaliveTimer')}
            {numField('Holdtime timer (sec)', 'holdtimeTimer')}
            {numField('Background scan interval (sec)', 'scanTime')}
            <FieldRow label="eBGP multipath"><Toggle checked={bgp.ebgpMultipath} onChange={(v) => updateBgp({ ebgpMultipath: v })} /></FieldRow>
            <FieldRow label="iBGP multipath"><Toggle checked={bgp.ibgpMultipath} onChange={(v) => updateBgp({ ibgpMultipath: v })} /></FieldRow>
            <FieldRow label="Additional path"><Toggle checked={bgp.additionalPath} onChange={(v) => updateBgp({ additionalPath: v })} /></FieldRow>
            <FieldRow label="Enforce first AS"><Toggle checked={bgp.enforceFirstAs} onChange={(v) => updateBgp({ enforceFirstAs: v })} /></FieldRow>
            <FieldRow label="Fast external failover"><Toggle checked={bgp.fastExternalFailover} onChange={(v) => updateBgp({ fastExternalFailover: v })} /></FieldRow>
            <FieldRow label="Log neighbor changes"><Toggle checked={bgp.logNeighborChanges} onChange={(v) => updateBgp({ logNeighborChanges: v })} /></FieldRow>
            <FieldRow label="Network import check"><Toggle checked={bgp.networkImportCheck} onChange={(v) => updateBgp({ networkImportCheck: v })} /></FieldRow>
            <FieldRow label="Ignore optional capability"><Toggle checked={bgp.ignoreOptionalCapability} onChange={(v) => updateBgp({ ignoreOptionalCapability: v })} /></FieldRow>
            <FieldRow label="Client-to-client reflection"><Toggle checked={bgp.clientToClientReflection} onChange={(v) => updateBgp({ clientToClientReflection: v })} /></FieldRow>
          </Collapsible>

          {/* Best Path Selection */}
          <Collapsible title="Best Path Selection">
            {bestPath('Always compare MED', 'alwaysCompareMed')}
            {bestPath('Ignore AS path', 'bestpathAsPathIgnore')}
            {bestPath('Compare confederation AS path', 'bestpathCmpConfedAspath')}
            {bestPath('Compare router ID', 'bestpathCmpRouterid')}
            {bestPath('MED confederation', 'bestpathMedConfed')}
            {bestPath('MED missing as worst', 'bestpathMedMissingAsWorst')}
            {bestPath('Deterministic MED', 'deterministicMed')}
            {bestPath('Synchronization', 'synchronization')}
          </Collapsible>
        </div>
      </div>

      {/* ---- Neighbor modal ---- */}
      {neighbor && (
        <RowModal title={neighbor.index < 0 ? 'New Neighbor' : 'Edit Neighbor'}
          onCancel={() => setNeighbor(null)}
          onSave={() => saveVia(NEIGHBOR_PATH, neighbor, () => setNeighbor(null))}>
          <ModalRow label="IP">
            <input className="forti-input" value={neighbor.item.ip} onChange={(e) => setNeighbor({ ...neighbor, item: { ...neighbor.item, ip: e.target.value } })} placeholder="10.0.0.1" />
          </ModalRow>
          <ModalRow label="Remote AS">
            <input type="number" className="forti-input max-w-[160px]" value={neighbor.item.remoteAs || ''} onChange={(e) => setNeighbor({ ...neighbor, item: { ...neighbor.item, remoteAs: parseInt(e.target.value) || 0 } })} />
          </ModalRow>
          <ModalRow label="Status">
            <Segmented value={neighbor.item.status} onChange={(v) => setNeighbor({ ...neighbor, item: { ...neighbor.item, status: v as BGPNeighbor['status'] } })}
              options={[{ value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable', danger: true }]} />
          </ModalRow>
          <ModalRow label="Description">
            <input className="forti-input" value={neighbor.item.description} onChange={(e) => setNeighbor({ ...neighbor, item: { ...neighbor.item, description: e.target.value } })} />
          </ModalRow>
          <ModalRow label="Update Source">
            <select className="forti-select max-w-[220px]" value={neighbor.item.updateSource} onChange={(e) => setNeighbor({ ...neighbor, item: { ...neighbor.item, updateSource: e.target.value } })}>
              {intfOptions.map((o) => <option key={o} value={o}>{o || '-- None --'}</option>)}
            </select>
          </ModalRow>
          <ModalRow label="Next-Hop-Self">
            <Toggle checked={neighbor.item.nextHopSelf} onChange={(v) => setNeighbor({ ...neighbor, item: { ...neighbor.item, nextHopSelf: v } })} />
          </ModalRow>
          <ModalRow label="Soft Reconfig.">
            <Toggle checked={neighbor.item.softReconfiguration} onChange={(v) => setNeighbor({ ...neighbor, item: { ...neighbor.item, softReconfiguration: v } })} />
          </ModalRow>
          <ModalRow label="BFD">
            <Toggle checked={neighbor.item.bfd} onChange={(v) => setNeighbor({ ...neighbor, item: { ...neighbor.item, bfd: v } })} />
          </ModalRow>
          <ModalRow label="eBGP Multihop">
            <input type="number" className="forti-input max-w-[120px]" value={neighbor.item.ebgpMultihop || ''} onChange={(e) => setNeighbor({ ...neighbor, item: { ...neighbor.item, ebgpMultihop: parseInt(e.target.value) || 0 } })} />
          </ModalRow>
          <ModalRow label="Weight">
            <input type="number" className="forti-input max-w-[120px]" value={neighbor.item.weight || ''} onChange={(e) => setNeighbor({ ...neighbor, item: { ...neighbor.item, weight: parseInt(e.target.value) || 0 } })} />
          </ModalRow>
          <ModalRow label="Route Map In">
            <input className="forti-input" value={neighbor.item.routeMapIn} onChange={(e) => setNeighbor({ ...neighbor, item: { ...neighbor.item, routeMapIn: e.target.value } })} />
          </ModalRow>
          <ModalRow label="Route Map Out">
            <input className="forti-input" value={neighbor.item.routeMapOut} onChange={(e) => setNeighbor({ ...neighbor, item: { ...neighbor.item, routeMapOut: e.target.value } })} />
          </ModalRow>
        </RowModal>
      )}

      {/* ---- Neighbor Group modal ---- */}
      {group && (
        <RowModal title={group.index < 0 ? 'New Neighbor Group' : 'Edit Neighbor Group'}
          onCancel={() => setGroup(null)}
          onSave={() => saveVia(GROUP_PATH, group, () => setGroup(null))}>
          <ModalRow label="Name">
            <input className="forti-input" value={group.item.name} onChange={(e) => setGroup({ ...group, item: { ...group.item, name: e.target.value } })} />
          </ModalRow>
          <ModalRow label="Remote AS">
            <input type="number" className="forti-input max-w-[160px]" value={group.item.remoteAs || ''} onChange={(e) => setGroup({ ...group, item: { ...group.item, remoteAs: parseInt(e.target.value) || 0 } })} />
          </ModalRow>
        </RowModal>
      )}

      {/* ---- Neighbor Range modal ---- */}
      {range && (
        <RowModal title={range.index < 0 ? 'New Neighbor Range' : 'Edit Neighbor Range'}
          onCancel={() => setRange(null)}
          onSave={() => saveVia(RANGE_PATH, range, () => setRange(null))}>
          <ModalRow label="ID">
            <input type="number" className="forti-input max-w-[120px]" value={range.item.id || ''} onChange={(e) => setRange({ ...range, item: { ...range.item, id: parseInt(e.target.value) || 0 } })} />
          </ModalRow>
          <ModalRow label="Prefix">
            <input className="forti-input" value={range.item.prefix} onChange={(e) => setRange({ ...range, item: { ...range.item, prefix: e.target.value } })} placeholder="10.0.0.0/24" />
          </ModalRow>
          <ModalRow label="Neighbor Group">
            <select className="forti-select max-w-[220px]" value={range.item.neighborGroup} onChange={(e) => setRange({ ...range, item: { ...range.item, neighborGroup: e.target.value } })}>
              <option value="">-- Select --</option>
              {bgp.neighborGroups.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
            </select>
          </ModalRow>
          <ModalRow label="Max Neighbor #">
            <input type="number" className="forti-input max-w-[160px]" value={range.item.maxNeighborNum || ''} onChange={(e) => setRange({ ...range, item: { ...range.item, maxNeighborNum: parseInt(e.target.value) || 0 } })} />
          </ModalRow>
        </RowModal>
      )}

      {/* ---- Network modal ---- */}
      {network && (
        <RowModal title={network.index < 0 ? 'New Network' : 'Edit Network'}
          onCancel={() => setNetwork(null)}
          onSave={() => saveVia(NETWORK_PATH, network, () => setNetwork(null))}>
          <ModalRow label="ID">
            <input type="number" className="forti-input max-w-[120px]" value={network.item.id || ''} onChange={(e) => setNetwork({ ...network, item: { ...network.item, id: parseInt(e.target.value) || 0 } })} />
          </ModalRow>
          <ModalRow label="Prefix">
            <input className="forti-input" value={network.item.prefix} onChange={(e) => setNetwork({ ...network, item: { ...network.item, prefix: e.target.value } })} placeholder="10.0.0.0/24" />
          </ModalRow>
          <ModalRow label="Route Map">
            <input className="forti-input" value={network.item.routeMap} onChange={(e) => setNetwork({ ...network, item: { ...network.item, routeMap: e.target.value } })} placeholder="(none)" />
          </ModalRow>
        </RowModal>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <ConfirmDialog title="Delete" message={`Delete BGP ${confirmDel.label}?`}
          onConfirm={() => { removeItem(confirmDel.path, confirmDel.index); setConfirmDel(null); }}
          onCancel={() => setConfirmDel(null)} />
      )}
    </div>
  );
}
