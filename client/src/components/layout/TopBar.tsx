import React, { useRef, useState } from 'react';
import { Upload, Download, FileText, Save, FolderOpen, Plus, X, Check } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { parseFortiConfig } from '../../parser/configParser';
import { exportFortiConfig } from '../../parser/configExporter';

const STORAGE_INDEX_KEY = 'fortidoc-project-index';

interface SavedProjectEntry {
  id: string;
  name: string;
  hostname: string;
  updatedAt: string;
}

function getProjectIndex(): SavedProjectEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_INDEX_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToLocalStorage(project: any) {
  // Assign an ID if missing
  if (!project.id) {
    project = { ...project, id: `local-${Date.now()}` };
  }
  // Save project data
  localStorage.setItem(`fortidoc-project-${project.id}`, JSON.stringify(project));
  // Update index
  const index = getProjectIndex().filter((e) => e.id !== project.id);
  index.unshift({ id: project.id, name: project.name, hostname: project.hostname, updatedAt: project.updatedAt });
  localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
  return project;
}

function deleteFromLocalStorage(id: string) {
  localStorage.removeItem(`fortidoc-project-${id}`);
  const index = getProjectIndex().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
}

export default function TopBar() {
  const { project, setProject, setProjectMeta, isDirty, resetProject } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [showLoadModal, setShowLoadModal] = useState(false);

  const handleImportConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const config = parseFortiConfig(text);
      useProjectStore.getState().updateConfig(() => config);
      if (config.system.global.hostname) {
        setProjectMeta({ hostname: config.system.global.hostname });
      }
    } catch (err) {
      alert('Failed to parse configuration file. Please ensure it is a valid FortiOS config.');
      console.error(err);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportConfig = () => {
    const configText = exportFortiConfig(project.config);
    const blob = new Blob([configText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.hostname || 'fortigate'}_config.conf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const { generatePDF } = await import('../../components/export/PDFExport');
    generatePDF(project);
  };

  const handleSaveProject = () => {
    const saved = saveToLocalStorage(project);
    setProject(saved);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleLoadProject = () => {
    setShowLoadModal(true);
  };

  const loadProjectById = (id: string) => {
    const raw = localStorage.getItem(`fortidoc-project-${id}`);
    if (raw) {
      setProject(JSON.parse(raw));
      setShowLoadModal(false);
    }
  };

  const handleDeleteSavedProject = (id: string) => {
    deleteFromLocalStorage(id);
    // Force re-render by toggling modal
    setShowLoadModal(false);
    setTimeout(() => setShowLoadModal(true), 0);
  };

  return (
    <div className="bg-forti-header text-white h-14 flex items-center justify-between px-6 shadow-md">
      {/* Left: Project info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300">Project:</span>
          <input
            type="text"
            value={project.name}
            onChange={(e) => setProjectMeta({ name: e.target.value })}
            className="bg-transparent border-b border-gray-600 text-white text-sm px-1 py-0.5 focus:outline-none focus:border-forti-accent w-48"
          />
        </div>
        <div className="text-xs text-gray-400 flex items-center space-x-3">
          <span>{project.hostname}</span>
          <span>{project.model}</span>
          <span>v{project.fortiosVersion}</span>
          {isDirty && <span className="text-yellow-400">* Unsaved</span>}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2">
        <button onClick={resetProject} className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors">
          <Plus size={14} />
          <span>New</span>
        </button>

        <label className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors cursor-pointer">
          <Upload size={14} />
          <span>Import Config</span>
          <input ref={fileInputRef} type="file" accept=".conf,.txt,.cfg" onChange={handleImportConfig} className="hidden" />
        </label>

        <button onClick={handleExportConfig} className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors">
          <Download size={14} />
          <span>Export Config</span>
        </button>

        <button onClick={handleExportPDF} className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-forti-accent rounded hover:bg-forti-accent-hover transition-colors">
          <FileText size={14} />
          <span>Export PDF</span>
        </button>

        <button onClick={handleSaveProject} className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded transition-colors ${saveStatus === 'saved' ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'}`}>
          {saveStatus === 'saved' ? <Check size={14} /> : <Save size={14} />}
          <span>{saveStatus === 'saved' ? 'Saved!' : 'Save'}</span>
        </button>

        <button onClick={handleLoadProject} className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors">
          <FolderOpen size={14} />
          <span>Load</span>
        </button>
      </div>

      {/* Load Project Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Load Project</h3>
              <button onClick={() => setShowLoadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 max-h-80 overflow-y-auto">
              {getProjectIndex().length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No saved projects found.</p>
              ) : (
                <div className="space-y-2">
                  {getProjectIndex().map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => loadProjectById(entry.id)}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">{entry.name}</div>
                        <div className="text-xs text-gray-500">{entry.hostname} &middot; {new Date(entry.updatedAt).toLocaleString()}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSavedProject(entry.id); }}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Delete saved project"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
              <button onClick={() => setShowLoadModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
