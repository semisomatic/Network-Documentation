import { create } from 'zustand';
import {
  FortigateProject,
  FortigateConfig,
  HighlightColor,
  createDefaultProject,
} from '../types/fortigate';
import {
  PATH_TO_OBJECT_TYPE,
  cascadeRename,
  findReferencesTo,
  type ObjectType,
  type ReferenceHit,
} from './referenceRegistry';

interface ProjectStore {
  project: FortigateProject;
  isDirty: boolean;
  activeSection: string;
  sidebarCollapsed: boolean;
  _previousState: FortigateProject | null;

  setProject: (project: FortigateProject) => void;
  updateConfig: (updater: (config: FortigateConfig) => FortigateConfig) => void;
  resetProject: () => void;
  setProjectMeta: (meta: Partial<Pick<FortigateProject, 'name' | 'hostname' | 'model' | 'fortiosVersion'>>) => void;

  setActiveSection: (section: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  addItem: <T>(path: string, item: T) => void;
  updateItem: <T>(path: string, index: number, item: T) => void;
  removeItem: (path: string, index: number) => void;
  reorderItems: (path: string, fromIndex: number, toIndex: number) => void;

  undo: () => void;
  canUndo: () => boolean;

  setHighlight: (path: string, key: string, color: HighlightColor | null) => void;
  getHighlight: (path: string, key: string) => HighlightColor | undefined;

  getDeleteImpact: (path: string, index: number) => ReferenceHit[];
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

function snapshot(project: FortigateProject): FortigateProject {
  return JSON.parse(JSON.stringify(project));
}

function getItemName(item: any): string | undefined {
  return item?.name ?? item?.policyid?.toString() ?? item?.seqNum?.toString() ?? item?.id?.toString();
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createDefaultProject(),
  isDirty: false,
  activeSection: 'system-settings',
  sidebarCollapsed: false,
  _previousState: null,

  setProject: (project) => set({ project, isDirty: false }),

  updateConfig: (updater) => {
    const prev = snapshot(get().project);
    set((state) => ({
      project: {
        ...state.project,
        config: updater(state.project.config),
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
      _previousState: prev,
    }));
  },

  resetProject: () => set({ project: createDefaultProject(), isDirty: false, _previousState: null }),

  setProjectMeta: (meta) => {
    const prev = snapshot(get().project);
    set((state) => ({
      project: { ...state.project, ...meta, updatedAt: new Date().toISOString() },
      isDirty: true,
      _previousState: prev,
    }));
  },

  setActiveSection: (section) => set({ activeSection: section }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  addItem: (path, item) => {
    const { project } = get();
    const prev = snapshot(project);
    const arr = [...getNestedValue(project.config, path), item];
    const newConfig = setNestedValue(project.config, path, arr);
    set({
      project: { ...project, config: newConfig, updatedAt: new Date().toISOString() },
      isDirty: true,
      _previousState: prev,
    });
  },

  updateItem: (path, index, item) => {
    const { project } = get();
    const prev = snapshot(project);
    const arr = [...getNestedValue(project.config, path)];
    const oldItem = arr[index];

    // Detect rename and cascade
    const objectType = PATH_TO_OBJECT_TYPE[path];
    if (objectType && oldItem) {
      const oldName = oldItem.name;
      const newName = (item as any).name;
      if (oldName && newName && oldName !== newName) {
        arr[index] = item;
        let newConfig = setNestedValue(project.config, path, arr);
        newConfig = cascadeRename(newConfig, objectType, oldName, newName);

        // Cascade highlight key
        const newHighlights = { ...project.highlights };
        if (newHighlights[path]?.[oldName]) {
          newHighlights[path] = { ...newHighlights[path] };
          newHighlights[path][newName] = newHighlights[path][oldName];
          delete newHighlights[path][oldName];
        }

        set({
          project: {
            ...project,
            config: newConfig,
            highlights: newHighlights,
            updatedAt: new Date().toISOString(),
          },
          isDirty: true,
          _previousState: prev,
        });
        return;
      }
    }

    arr[index] = item;
    const newConfig = setNestedValue(project.config, path, arr);
    set({
      project: { ...project, config: newConfig, updatedAt: new Date().toISOString() },
      isDirty: true,
      _previousState: prev,
    });
  },

  removeItem: (path, index) => {
    const { project } = get();
    const prev = snapshot(project);
    const arr = [...getNestedValue(project.config, path)];
    const removedItem = arr[index];
    arr.splice(index, 1);
    const newConfig = setNestedValue(project.config, path, arr);

    // Track deleted name for orphan detection
    const objectType = PATH_TO_OBJECT_TYPE[path];
    const newDeletedNames = { ...project._deletedNames };
    if (objectType && removedItem) {
      const name = getItemName(removedItem);
      if (name) {
        newDeletedNames[objectType] = [...(newDeletedNames[objectType] || []), name];
      }
    }

    // Remove highlight for deleted item
    const newHighlights = { ...project.highlights };
    if (newHighlights[path] && removedItem) {
      const key = getItemName(removedItem);
      if (key && newHighlights[path][key]) {
        newHighlights[path] = { ...newHighlights[path] };
        delete newHighlights[path][key];
      }
    }

    set({
      project: {
        ...project,
        config: newConfig,
        highlights: newHighlights,
        _deletedNames: newDeletedNames,
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
      _previousState: prev,
    });
  },

  reorderItems: (path, fromIndex, toIndex) => {
    const { project } = get();
    const prev = snapshot(project);
    const arr = [...getNestedValue(project.config, path)];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    const newConfig = setNestedValue(project.config, path, arr);
    set({
      project: { ...project, config: newConfig, updatedAt: new Date().toISOString() },
      isDirty: true,
      _previousState: prev,
    });
  },

  undo: () => {
    const { _previousState } = get();
    if (_previousState) {
      set({ project: _previousState, isDirty: true, _previousState: null });
    }
  },

  canUndo: () => get()._previousState !== null,

  setHighlight: (path, key, color) => {
    const { project } = get();
    const newHighlights = { ...project.highlights };
    if (color === null) {
      if (newHighlights[path]) {
        newHighlights[path] = { ...newHighlights[path] };
        delete newHighlights[path][key];
        if (Object.keys(newHighlights[path]).length === 0) {
          delete newHighlights[path];
        }
      }
    } else {
      newHighlights[path] = { ...newHighlights[path], [key]: color };
    }
    set({
      project: { ...project, highlights: newHighlights, updatedAt: new Date().toISOString() },
      isDirty: true,
    });
  },

  getHighlight: (path, key) => {
    return get().project.highlights?.[path]?.[key];
  },

  getDeleteImpact: (path, index) => {
    const { project } = get();
    const arr = getNestedValue(project.config, path);
    const item = arr[index];
    const objectType = PATH_TO_OBJECT_TYPE[path];
    if (!objectType || !item) return [];
    const name = getItemName(item);
    if (!name) return [];
    return findReferencesTo(project.config, objectType, name);
  },
}));
