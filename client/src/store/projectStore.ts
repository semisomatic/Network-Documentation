import { create } from 'zustand';
import { FortigateProject, FortigateConfig, createDefaultProject, createDefaultConfig } from '../types/fortigate';

interface ProjectStore {
  project: FortigateProject;
  isDirty: boolean;
  activeSection: string;
  sidebarCollapsed: boolean;

  // Project actions
  setProject: (project: FortigateProject) => void;
  updateConfig: (updater: (config: FortigateConfig) => FortigateConfig) => void;
  resetProject: () => void;
  setProjectMeta: (meta: Partial<Pick<FortigateProject, 'name' | 'hostname' | 'model' | 'fortiosVersion'>>) => void;

  // UI actions
  setActiveSection: (section: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Generic CRUD helpers
  addItem: <T>(path: string, item: T) => void;
  updateItem: <T>(path: string, index: number, item: T) => void;
  removeItem: (path: string, index: number) => void;
  reorderItems: (path: string, fromIndex: number, toIndex: number) => void;
}

function getNestedValue(obj: any, path: string): any[] {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? [];
}

function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const result = JSON.parse(JSON.stringify(obj));
  let current = result;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return result;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createDefaultProject(),
  isDirty: false,
  activeSection: 'system-settings',
  sidebarCollapsed: false,

  setProject: (project) => set({ project, isDirty: false }),

  updateConfig: (updater) =>
    set((state) => ({
      project: {
        ...state.project,
        config: updater(state.project.config),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    })),

  resetProject: () => set({ project: createDefaultProject(), isDirty: false }),

  setProjectMeta: (meta) =>
    set((state) => ({
      project: { ...state.project, ...meta, updatedAt: new Date().toISOString() },
      isDirty: true,
    })),

  setActiveSection: (section) => set({ activeSection: section }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  addItem: (path, item) => {
    const { project } = get();
    const arr = [...getNestedValue(project.config, path), item];
    const newConfig = setNestedValue(project.config, path, arr);
    set({
      project: { ...project, config: newConfig, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  updateItem: (path, index, item) => {
    const { project } = get();
    const arr = [...getNestedValue(project.config, path)];
    arr[index] = item;
    const newConfig = setNestedValue(project.config, path, arr);
    set({
      project: { ...project, config: newConfig, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  removeItem: (path, index) => {
    const { project } = get();
    const arr = [...getNestedValue(project.config, path)];
    arr.splice(index, 1);
    const newConfig = setNestedValue(project.config, path, arr);
    set({
      project: { ...project, config: newConfig, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  reorderItems: (path, fromIndex, toIndex) => {
    const { project } = get();
    const arr = [...getNestedValue(project.config, path)];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    const newConfig = setNestedValue(project.config, path, arr);
    set({
      project: { ...project, config: newConfig, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },
}));
