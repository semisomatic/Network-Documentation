import React, { useState } from 'react';
import DataTable, { Column } from '../shared/DataTable';
import EditModal, { FieldDef } from '../shared/EditModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useProjectStore } from '../../store/projectStore';
import type { OSPFArea, OSPFNetwork, OSPFInterface } from '../../types/fortigate';

const AREA_PATH = 'router.ospf.areas';
const NETWORK_PATH = 'router.ospf.networks';
const INTF_PATH = 'router.ospf.ospfInterfaces';

const defaultArea: OSPFArea = {
  id: '0.0.0.0', type: 'regular', stubType: 'summary', authentication: 'none', comment: '',
};

const defaultNetwork: OSPFNetwork = { id: 0, prefix: '', area: '0.0.0.0' };

const defaultOspfIntf: OSPFInterface = {
  name: '', cost: 0, priority: 1, helloInterval: 10, deadInterval: 40, retransmitInterval: 5,
  networkType: 'broadcast', authentication: 'none', status: 'enable', comment: '',
};

export default function OSPF() {
  const config = useProjectStore((s) => s.project.config);
  const areaHighlights = useProjectStore((s) => s.project.highlights[AREA_PATH] || {});
  const networkHighlights = useProjectStore((s) => s.project.highlights[NETWORK_PATH] || {});
  const intfHighlights = useProjectStore((s) => s.project.highlights[INTF_PATH] || {});
  const { updateConfig, addItem, updateItem, removeItem, reorderItems, setHighlight } = useProjectStore();
  const ospf = config.router.ospf;

  const updateOspf = (patch: Partial<typeof ospf>) => updateConfig((c) => ({ ...c, router: { ...c.router, ospf: { ...c.router.ospf, ...patch } } }));
  const updateRedist = (patch: Partial<typeof ospf.redistribute>) => updateOspf({ redistribute: { ...ospf.redistribute, ...patch } });

  const [editingArea, setEditingArea] = useState<{ item: OSPFArea; index: number } | null>(null);
  const [isNewArea, setIsNewArea] = useState(false);
  const [deletingArea, setDeletingArea] = useState<number | null>(null);

  const [editingNetwork, setEditingNetwork] = useState<{ item: OSPFNetwork; index: number } | null>(null);
  const [isNewNetwork, setIsNewNetwork] = useState(false);
  const [deletingNetwork, setDeletingNetwork] = useState<number | null>(null);

  const [editingIntf, setEditingIntf] = useState<{ item: OSPFInterface; index: number } | null>(null);
  const [isNewIntf, setIsNewIntf] = useState(false);
  const [deletingIntf, setDeletingIntf] = useState<number | null>(null);

  const intfOptions = [
    { value: '', label: '-- Select --' },
    ...config.system.interfaces.map(i => ({ value: i.name, label: i.name })),
  ];

  const areaOptions = [
    ...ospf.areas.map(a => ({ value: a.id, label: a.id })),
  ];
  if (areaOptions.length === 0) {
    areaOptions.push({ value: '0.0.0.0', label: '0.0.0.0 (Backbone)' });
  }

  const areaFields: FieldDef[] = [
    { key: 'id', label: 'Area ID', type: 'text', required: true, group: 'General', placeholder: '0.0.0.0' },
    { key: 'type', label: 'Type', type: 'select', group: 'General', options: [
      { value: 'regular', label: 'Regular' }, { value: 'stub', label: 'Stub' }, { value: 'nssa', label: 'NSSA' },
    ]},
    { key: 'authentication', label: 'Authentication', type: 'select', group: 'General', options: [
      { value: 'none', label: 'None' }, { value: 'text', label: 'Text' }, { value: 'md5', label: 'MD5' },
    ]},
    { key: 'comment', label: 'Comment', type: 'textarea', group: 'Other', width: 'full' },
  ];

  const networkFields: FieldDef[] = [
    { key: 'id', label: 'ID', type: 'number', required: true, group: 'General' },
    { key: 'prefix', label: 'Prefix', type: 'text', required: true, group: 'General', placeholder: '10.0.0.0 255.255.255.0' },
    { key: 'area', label: 'Area', type: 'select', group: 'General', options: areaOptions },
  ];

  const intfFields: FieldDef[] = [
    { key: 'name', label: 'Interface', type: 'select', required: true, group: 'General', options: intfOptions },
    { key: 'status', label: 'Status', type: 'select', group: 'General', options: [
      { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' },
    ]},
    { key: 'cost', label: 'Cost', type: 'number', group: 'Timers' },
    { key: 'priority', label: 'Priority', type: 'number', group: 'Timers', defaultValue: 1 },
    { key: 'helloInterval', label: 'Hello Interval', type: 'number', group: 'Timers', defaultValue: 10 },
    { key: 'deadInterval', label: 'Dead Interval', type: 'number', group: 'Timers', defaultValue: 40 },
    { key: 'networkType', label: 'Network Type', type: 'select', group: 'Advanced', options: [
      { value: 'broadcast', label: 'Broadcast' }, { value: 'non-broadcast', label: 'Non-Broadcast' },
      { value: 'point-to-point', label: 'Point-to-Point' }, { value: 'point-to-multipoint', label: 'Point-to-Multipoint' },
    ]},
    { key: 'authentication', label: 'Authentication', type: 'select', group: 'Advanced', options: [
      { value: 'none', label: 'None' }, { value: 'text', label: 'Text' }, { value: 'md5', label: 'MD5' },
    ]},
    { key: 'comment', label: 'Comment', type: 'textarea', group: 'Other', width: 'full' },
  ];

  const areaColumns: Column<OSPFArea>[] = [
    { key: 'id', label: 'Area ID' },
    { key: 'type', label: 'Type', render: (a) => a.type.charAt(0).toUpperCase() + a.type.slice(1) },
    { key: 'authentication', label: 'Auth' },
    { key: 'comment', label: 'Comment' },
  ];

  const networkColumns: Column<OSPFNetwork>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'prefix', label: 'Prefix' },
    { key: 'area', label: 'Area' },
  ];

  const intfColumns: Column<OSPFInterface>[] = [
    { key: 'name', label: 'Interface' },
    { key: 'cost', label: 'Cost', width: '70px' },
    { key: 'priority', label: 'Priority', width: '70px' },
    { key: 'helloInterval', label: 'Hello', width: '70px' },
    { key: 'deadInterval', label: 'Dead', width: '70px' },
    { key: 'networkType', label: 'Network Type' },
    { key: 'comment', label: 'Comment' },
  ];

  return (
    <div className="space-y-6">
      {/* OSPF Global Settings */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">OSPF Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Router ID</label>
            <input type="text" value={ospf.routerId} onChange={(e) => updateOspf({ routerId: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="1.1.1.1" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Default Metric</label>
            <input type="number" value={ospf.defaultMetric || ''} onChange={(e) => updateOspf({ defaultMetric: parseInt(e.target.value) || 10 })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
          </div>
          <div className="flex items-center space-x-4 col-span-2">
            <label className="flex items-center space-x-1 text-xs">
              <input type="checkbox" checked={ospf.defaultInformationOriginate} onChange={(e) => updateOspf({ defaultInformationOriginate: e.target.checked })} />
              <span>Default Info Originate</span>
            </label>
            <label className="flex items-center space-x-1 text-xs">
              <input type="checkbox" checked={ospf.defaultInformationOriginateAlways} onChange={(e) => updateOspf({ defaultInformationOriginateAlways: e.target.checked })} />
              <span>Always</span>
            </label>
          </div>
        </div>
        <div className="mt-3">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">Redistribution</h4>
          <div className="flex items-center space-x-4 text-xs">
            <label className="flex items-center space-x-1">
              <input type="checkbox" checked={ospf.redistribute.connected} onChange={(e) => updateRedist({ connected: e.target.checked })} />
              <span>Connected</span>
            </label>
            <label className="flex items-center space-x-1">
              <input type="checkbox" checked={ospf.redistribute.static} onChange={(e) => updateRedist({ static: e.target.checked })} />
              <span>Static</span>
            </label>
            <label className="flex items-center space-x-1">
              <input type="checkbox" checked={ospf.redistribute.bgp} onChange={(e) => updateRedist({ bgp: e.target.checked })} />
              <span>BGP</span>
            </label>
          </div>
        </div>
      </div>

      {/* Areas Table */}
      <DataTable title="OSPF Areas" columns={areaColumns} data={ospf.areas}
        getRowKey={(item) => item.id}
        highlights={areaHighlights}
        onHighlight={(key, color) => setHighlight(AREA_PATH, key, color)}
        onAdd={() => { setEditingArea({ item: { ...defaultArea }, index: -1 }); setIsNewArea(true); }}
        onEdit={(item, index) => { setEditingArea({ item: { ...item }, index }); setIsNewArea(false); }}
        onDelete={(_, index) => setDeletingArea(index)}
        onReorder={(from, to) => reorderItems(AREA_PATH, from, to)}
      />

      {/* Networks Table */}
      <DataTable title="OSPF Networks" columns={networkColumns} data={ospf.networks}
        getRowKey={(item) => String(item.id)}
        highlights={networkHighlights}
        onHighlight={(key, color) => setHighlight(NETWORK_PATH, key, color)}
        onAdd={() => { setEditingNetwork({ item: { ...defaultNetwork, id: ospf.networks.length > 0 ? Math.max(...ospf.networks.map(n => n.id)) + 1 : 1 }, index: -1 }); setIsNewNetwork(true); }}
        onEdit={(item, index) => { setEditingNetwork({ item: { ...item }, index }); setIsNewNetwork(false); }}
        onDelete={(_, index) => setDeletingNetwork(index)}
        onReorder={(from, to) => reorderItems(NETWORK_PATH, from, to)}
      />

      {/* OSPF Interfaces Table */}
      <DataTable title="OSPF Interfaces" columns={intfColumns} data={ospf.ospfInterfaces}
        getRowKey={(item) => item.name}
        highlights={intfHighlights}
        onHighlight={(key, color) => setHighlight(INTF_PATH, key, color)}
        onAdd={() => { setEditingIntf({ item: { ...defaultOspfIntf }, index: -1 }); setIsNewIntf(true); }}
        onEdit={(item, index) => { setEditingIntf({ item: { ...item }, index }); setIsNewIntf(false); }}
        onDelete={(_, index) => setDeletingIntf(index)}
        onReorder={(from, to) => reorderItems(INTF_PATH, from, to)}
      />

      {/* Edit Modals */}
      {editingArea && (
        <EditModal title="OSPF Area" fields={areaFields} values={editingArea.item} isNew={isNewArea}
          onChange={(key, val) => setEditingArea({ ...editingArea, item: { ...editingArea.item, [key]: val } })}
          onSave={() => {
            if (isNewArea) addItem(AREA_PATH, editingArea.item);
            else updateItem(AREA_PATH, editingArea.index, editingArea.item);
            setEditingArea(null);
          }}
          onCancel={() => setEditingArea(null)}
        />
      )}
      {editingNetwork && (
        <EditModal title="OSPF Network" fields={networkFields} values={editingNetwork.item} isNew={isNewNetwork}
          onChange={(key, val) => setEditingNetwork({ ...editingNetwork, item: { ...editingNetwork.item, [key]: val } })}
          onSave={() => {
            if (isNewNetwork) addItem(NETWORK_PATH, editingNetwork.item);
            else updateItem(NETWORK_PATH, editingNetwork.index, editingNetwork.item);
            setEditingNetwork(null);
          }}
          onCancel={() => setEditingNetwork(null)}
        />
      )}
      {editingIntf && (
        <EditModal title="OSPF Interface" fields={intfFields} values={editingIntf.item} isNew={isNewIntf}
          onChange={(key, val) => setEditingIntf({ ...editingIntf, item: { ...editingIntf.item, [key]: val } })}
          onSave={() => {
            if (isNewIntf) addItem(INTF_PATH, editingIntf.item);
            else updateItem(INTF_PATH, editingIntf.index, editingIntf.item);
            setEditingIntf(null);
          }}
          onCancel={() => setEditingIntf(null)}
        />
      )}

      {/* Delete Confirmations */}
      {deletingArea !== null && (
        <ConfirmDialog title="Delete Area" message={`Delete OSPF area ${ospf.areas[deletingArea]?.id}?`}
          onConfirm={() => { removeItem(AREA_PATH, deletingArea); setDeletingArea(null); }}
          onCancel={() => setDeletingArea(null)} />
      )}
      {deletingNetwork !== null && (
        <ConfirmDialog title="Delete Network" message={`Delete OSPF network ${ospf.networks[deletingNetwork]?.prefix}?`}
          onConfirm={() => { removeItem(NETWORK_PATH, deletingNetwork); setDeletingNetwork(null); }}
          onCancel={() => setDeletingNetwork(null)} />
      )}
      {deletingIntf !== null && (
        <ConfirmDialog title="Delete Interface" message={`Delete OSPF interface ${ospf.ospfInterfaces[deletingIntf]?.name}?`}
          onConfirm={() => { removeItem(INTF_PATH, deletingIntf); setDeletingIntf(null); }}
          onCancel={() => setDeletingIntf(null)} />
      )}
    </div>
  );
}
