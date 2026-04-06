import React, { useRef } from 'react';
import { Upload, Download, FileText, Save, FolderOpen, Plus, Settings } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { parseFortiConfig } from '../../parser/configParser';
import { exportFortiConfig } from '../../parser/configExporter';

export default function TopBar() {
  const { project, setProject, setProjectMeta, isDirty, resetProject } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const config = parseFortiConfig(text);
      useProjectStore.getState().updateConfig(() => config);
      // Try to extract hostname from parsed config
      if (config.system.global.hostname) {
        setProjectMeta({ hostname: config.system.global.hostname });
      }
    } catch (err) {
      alert('Failed to parse configuration file. Please ensure it is a valid FortiOS config.');
      console.error(err);
    }

    // Reset file input
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
    // Dynamic import to avoid loading PDF libs upfront
    const { generatePDF } = await import('../../components/export/PDFExport');
    generatePDF(project);
  };

  const handleSaveProject = async () => {
    try {
      const method = project.id ? 'PUT' : 'POST';
      const url = project.id ? `/api/projects/${project.id}` : '/api/projects';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (res.ok) {
        const saved = await res.json();
        setProject(saved);
      }
    } catch {
      // If backend is not available, save to localStorage
      localStorage.setItem(`fortidoc-project-${project.id || 'current'}`, JSON.stringify(project));
    }
  };

  const handleLoadProject = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const projects = await res.json();
        if (projects.length > 0) {
          // For now, load the first project. A project picker UI can be added later.
          const res2 = await fetch(`/api/projects/${projects[0].id}`);
          if (res2.ok) {
            const loaded = await res2.json();
            setProject(loaded);
            return;
          }
        }
      }
    } catch {
      // Try localStorage
      const saved = localStorage.getItem(`fortidoc-project-${project.id || 'current'}`);
      if (saved) {
        setProject(JSON.parse(saved));
        return;
      }
    }
    alert('No saved projects found.');
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

        <button onClick={handleSaveProject} className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-green-600 rounded hover:bg-green-700 transition-colors">
          <Save size={14} />
          <span>Save</span>
        </button>

        <button onClick={handleLoadProject} className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors">
          <FolderOpen size={14} />
          <span>Load</span>
        </button>
      </div>
    </div>
  );
}
