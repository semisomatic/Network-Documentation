import React, { useRef, useState, useEffect } from 'react';
import { Upload, Download, FileText, Save, FolderOpen, Plus, Check, ChevronDown } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { parseFortiConfig } from '../../parser/configParser';
import { exportFortiConfig } from '../../parser/configExporter';
import { migrateProject } from '../../types/fortigate';

export default function TopBar() {
  const { project, setProject, setProjectMeta, isDirty, resetProject } = useProjectStore();
  const configInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    if (configInputRef.current) configInputRef.current.value = '';
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

  // Save project as a downloadable .fortidoc file
  const handleSaveProject = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'project'}.fortidoc`;
    a.click();
    URL.revokeObjectURL(url);

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // Load project from a .fortidoc file
  const handleLoadProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed.config) {
        setProject(migrateProject(parsed));
      } else {
        alert('Invalid project file. Expected a .fortidoc file with project data.');
      }
    } catch (err) {
      alert('Failed to read project file. Please ensure it is a valid .fortidoc file.');
      console.error(err);
    }

    if (projectInputRef.current) projectInputRef.current.value = '';
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
          <span>v{project.fortiosVersion}</span>
          {isDirty && <span className="text-yellow-400">* Unsaved</span>}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2">
        <button onClick={handleSaveProject} className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded transition-colors ${saveStatus === 'saved' ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'}`}>
          {saveStatus === 'saved' ? <Check size={14} /> : <Save size={14} />}
          <span>{saveStatus === 'saved' ? 'Saved!' : 'Save'}</span>
        </button>

        <button onClick={handleExportPDF} className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-forti-accent rounded hover:bg-forti-accent-hover transition-colors">
          <FileText size={14} />
          <span>PDF</span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          >
            <span>File</span>
            <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded shadow-lg border border-gray-600 z-50 py-1">
              <button
                onClick={() => { resetProject(); setMenuOpen(false); }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-gray-200 hover:bg-gray-700"
              >
                <Plus size={14} />
                <span>New Project</span>
              </button>
              <label className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-gray-200 hover:bg-gray-700 cursor-pointer">
                <FolderOpen size={14} />
                <span>Open Project</span>
                <input ref={projectInputRef} type="file" accept=".fortidoc,.json" onChange={(e) => { handleLoadProject(e); setMenuOpen(false); }} className="hidden" />
              </label>
              <div className="border-t border-gray-600 my-1" />
              <label className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-gray-200 hover:bg-gray-700 cursor-pointer">
                <Upload size={14} />
                <span>Import Config</span>
                <input ref={configInputRef} type="file" accept=".conf,.txt,.cfg" onChange={(e) => { handleImportConfig(e); setMenuOpen(false); }} className="hidden" />
              </label>
              <button
                onClick={() => { handleExportConfig(); setMenuOpen(false); }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-gray-200 hover:bg-gray-700"
              >
                <Download size={14} />
                <span>Export Config</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
