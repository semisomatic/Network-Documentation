import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useProjectStore } from '../../store/projectStore';
import type { BGPNeighbor, BGPNetwork } from '../../types/fortigate';

const NEIGHBOR_PATH = 'router.bgp.neighbors';
const NETWORK_PATH = 'router.bgp.networks';

const defaultNeighbor: BGPNeighbor = {
  ip: '', remoteAs: 0, description: '', weight: 0, holdtimeTimer: 60, keepAliveTimer: 30,
  ebgpMultihop: 0, ebgpMultihopTtl: 255, nextHopSelf: false, softReconfiguration: false,
  routeMapIn: '', routeMapOut: '', updateSource: '', bfd: false, status: 'enable', comment: '',
};

const defaultNetwork: BGPNetwork = { id: 0, prefix: '', routeMap: '' };

export default function BGP() {
  const config = useProjectStore((s) => s.project.config);
  const neighborHighlights = useProjectStore((s) => s.project.highlights[NEIGHBOR_PATH] || {});
  const networkHighlights = useProjectStore((s) => s.project.highlights[NETWORK_PATH] || {});
  const { updateConfig, addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const bgp = config.router.bgp;

  const updateBgp = (patch: Partial<typeof bgp>) => updateConfig((c) => ({ ...c, router: { ...c.router, bgp: { ...c.router.bgp, ...patch } } }));
  const updateRedist = (patch: Partial<typeof bgp.redistribute>) => updateBgp({ redistribute: { ...bgp.redistribute, ...patch } });

  const [editingNeighbor, setEditingNeighbor] = useState<{ item: BGPNeighbor; index: number } | null>(null);
  const [isNewNeighbor, setIsNewNeighbor] = useState(false);
  const [deletingNeighbor, setDeletingNeighbor] = useState<number | null>(null);

  const [editingNetwork, setEditingNetwork] = useState<{ item: BGPNetwork; index: number } | null>(null);
  const [isNewNetwork, setIsNewNetwork] = useState(false);
  const [deletingNetwork, setDeletingNetwork] = useState<number | null>(null);

  const intfOptions = [
    { value: '', label: '-- None --' },
    ...config.system.interfaces.map(i => ({ value: i.name, label: i.name })),
  ];

  const neighborFields: FieldDef[] = [
    { key: 'ip', label: 'Neighbor IP', type: 'text', required: true, group: 'General', placeholder: '10.0.0.1' },
    { key: 'remoteAs', label: 'Remote AS', type: 'number', required: true, group: 'General' },
    { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
      { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
    ]},
    { key: 'description', label: 'Description', type: 'text', group: 'General' },
    { key: 'updateSource', label: 'Update Source', type: 'select', group: 'Peering', options: intfOptions },
    { key: 'nextHopSelf', label: 'Next-Hop Self', type: 'checkbox', group: 'Peering' },
    { key: 'softReconfiguration', label: 'Soft Reconfiguration', type: 'checkbox', group: 'Peering' },
    { key: 'bfd', label: 'BFD', type: 'checkbox', group: 'Peering' },
    { key: 'ebgpMultihop', label: 'eBGP Multihop', type: 'number', group: 'Peering' },
    { key: 'weight', label: 'Weight', type: 'number', group: 'Advanced' },
    { key: 'holdtimeTimer', label: 'Hold Time', type: 'number', group: 'Advanced', defaultValue: 60 },
    { key: 'keepAliveTimer', label: 'Keep Alive', type: 'number', group: 'Advanced', defaultValue: 30 },
    { key: 'routeMapIn', label: 'Route Map In', type: 'text', group: 'Route Maps' },
    { key: 'routeMapOut', label: 'Route Map Out', type: 'text', group: 'Route Maps' },
    { key: 'comment', label: 'Comment', type: 'textarea', group: 'Other', width: 'full' },
  ];

  const networkFields: FieldDef[] = [
    { key: 'id', label: 'ID', type: 'number', required: true, group: 'General' },
    { key: 'prefix', label: 'Prefix', type: 'text', required: true, group: 'General', placeholder: '10.0.0.0/24' },
    { key: 'routeMap', label: 'Route Map', type: 'text', group: 'General' },
  ];

  const neighborColumns: Column<BGPNeighbor>[] = [
    { key: 'ip', label: 'Neighbor IP' },
    { key: 'remoteAs', label: 'Remote AS', width: '100px' },
    { key: 'updateSource', label: 'Update Source' },
    { key: 'nextHopSelf', label: 'Next-Hop Self', width: '100px', render: (n) => n.nextHopSelf ? 'Yes' : 'No' },
    { key: 'routeMapIn', label: 'Route Map In' },
    { key: 'routeMapOut', label: 'Route Map Out' },
    { key: 'description', label: 'Description' },
  ];

  const networkColumns: Column<BGPNetwork>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'prefix', label: 'Prefix' },
    { key: 'routeMap', label: 'Route Map' },
  ];

  return (
    <div className="space-y-6">
      {/* BGP Global Settings */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">BGP Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="block text-xs text-gray-500 mb-1">AS Number</label>
            <input type="number" value={bgp.as || ''} onChange={(e) => updateBgp({ as: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Router ID</label>
            <input type="text" value={bgp.routerId} onChange={(e) => updateBgp({ routerId: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="1.1.1.1" />
          </div>
          <div className="flex items-center space-x-4 col-span-2">
            <label className="flex items-center space-x-1 text-xs">
              <input type="checkbox" checked={bgp.ebgpMultipath} onChange={(e) => updateBgp({ ebgpMultipath: e.target.checked })} />
              <span>eBGP Multipath</span>
            </label>
            <label className="flex items-center space-x-1 text-xs">
              <input type="checkbox" checked={bgp.ibgpMultipath} onChange={(e) => updateBgp({ ibgpMultipath: e.target.checked })} />
              <span>iBGP Multipath</span>
            </label>
            <label className="flex items-center space-x-1 text-xs">
              <input type="checkbox" checked={bgp.gracefulRestart} onChange={(e) => updateBgp({ gracefulRestart: e.target.checked })} />
              <span>Graceful Restart</span>
            </label>
          </div>
        </div>
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">Redistribution</h4>
          <div className="flex items-center space-x-4 text-xs">
            <label className="flex items-center space-x-1">
              <input type="checkbox" checked={bgp.redistribute.connected} onChange={(e) => updateRedist({ connected: e.target.checked })} />
              <span>Connected</span>
            </label>
            <label className="flex items-center space-x-1">
              <input type="checkbox" checked={bgp.redistribute.static} onChange={(e) => updateRedist({ static: e.target.checked })} />
              <span>Static</span>
            </label>
            <label className="flex items-center space-x-1">
              <input type="checkbox" checked={bgp.redistribute.ospf} onChange={(e) => updateRedist({ ospf: e.target.checked })} />
              <span>OSPF</span>
            </label>
          </div>
        </div>
      </div>

      {/* Neighbors Table */}
      <DataTable title="BGP Neighbors" columns={neighborColumns} data={bgp.neighbors}
        getRowKey={(item) => item.ip}
        highlights={neighborHighlights}
        onHighlight={(key, color) => setHighlight(NEIGHBOR_PATH, key, color)}
        onAdd={() => { setEditingNeighbor({ item: { ...defaultNeighbor }, index: -1 }); setIsNewNeighbor(true); }}
        onEdit={(item, index) => { setEditingNeighbor({ item: { ...item }, index }); setIsNewNeighbor(false); }}
        onDelete={(_, index) => setDeletingNeighbor(index)}
        onReorder={(from, to) => reorderItems(NEIGHBOR_PATH, from, to)}
      />

      {/* Networks Table */}
      <DataTable title="BGP Networks" columns={networkColumns} data={bgp.networks}
        getRowKey={(item) => String(item.id)}
        highlights={networkHighlights}
        onHighlight={(key, color) => setHighlight(NETWORK_PATH, key, color)}
        onAdd={() => { setEditingNetwork({ item: { ...defaultNetwork, id: bgp.networks.length > 0 ? Math.max(...bgp.networks.map(n => n.id)) + 1 : 1 }, index: -1 }); setIsNewNetwork(true); }}
        onEdit={(item, index) => { setEditingNetwork({ item: { ...item }, index }); setIsNewNetwork(false); }}
        onDelete={(_, index) => setDeletingNetwork(index)}
        onReorder={(from, to) => reorderItems(NETWORK_PATH, from, to)}
      />

      {/* Neighbor Edit Modal */}
      {editingNeighbor && (
        <EditModal title="BGP Neighbor" fields={neighborFields} values={editingNeighbor.item} isNew={isNewNeighbor}
          onChange={(key, val) => setEditingNeighbor({ ...editingNeighbor, item: { ...editingNeighbor.item, [key]: val } })}
          onSave={() => {
            if (isNewNeighbor) addItem(NEIGHBOR_PATH, editingNeighbor.item);
            else updateItem(NEIGHBOR_PATH, editingNeighbor.index, editingNeighbor.item);
            setEditingNeighbor(null);
          }}
          onCancel={() => setEditingNeighbor(null)}
        />
      )}

      {/* Network Edit Modal */}
      {editingNetwork && (
        <EditModal title="BGP Network" fields={networkFields} values={editingNetwork.item} isNew={isNewNetwork}
          onChange={(key, val) => setEditingNetwork({ ...editingNetwork, item: { ...editingNetwork.item, [key]: val } })}
          onSave={() => {
            if (isNewNetwork) addItem(NETWORK_PATH, editingNetwork.item);
            else updateItem(NETWORK_PATH, editingNetwork.index, editingNetwork.item);
            setEditingNetwork(null);
          }}
          onCancel={() => setEditingNetwork(null)}
        />
      )}

      {/* Delete Confirmations */}
      {deletingNeighbor !== null && (
        <ConfirmDialog title="Delete Neighbor" message={`Delete BGP neighbor ${bgp.neighbors[deletingNeighbor]?.ip}?`}
          onConfirm={() => { removeItem(NEIGHBOR_PATH, deletingNeighbor); setDeletingNeighbor(null); }}
          onCancel={() => setDeletingNeighbor(null)} />
      )}
      {deletingNetwork !== null && (
        <ConfirmDialog title="Delete Network" message={`Delete BGP network ${bgp.networks[deletingNetwork]?.prefix}?`}
          onConfirm={() => { removeItem(NETWORK_PATH, deletingNetwork); setDeletingNetwork(null); }}
          onCancel={() => setDeletingNetwork(null)} />
      )}
    </div>
  );
}
