import React from 'react';
import { X } from 'lucide-react';

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'textarea' | 'tagsinput';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  defaultValue?: any;
  width?: 'full' | 'half';
  group?: string;
}

interface EditModalProps {
  title: string;
  fields: FieldDef[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}

export default function EditModal({
  title,
  fields,
  values,
  onChange,
  onSave,
  onCancel,
  isNew = false,
}: EditModalProps) {
  // Group fields by their group property
  const groups = new Map<string, FieldDef[]>();
  fields.forEach((f) => {
    const group = f.group || 'General';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(f);
  });

  const renderField = (field: FieldDef) => {
    const val = values[field.key] ?? field.defaultValue ?? '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="forti-input"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={val}
            onChange={(e) => onChange(field.key, Number(e.target.value))}
            placeholder={field.placeholder}
            className="forti-input"
          />
        );

      case 'select':
        return (
          <select
            value={val}
            onChange={(e) => onChange(field.key, e.target.value)}
            className="forti-select"
          >
            <option value="">-- Select --</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <select
            multiple
            value={Array.isArray(val) ? val : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
              onChange(field.key, selected);
            }}
            className="forti-select min-h-[80px]"
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!val}
              onChange={(e) => onChange(field.key, e.target.checked)}
              className="w-4 h-4 text-forti-accent border-gray-300 rounded focus:ring-forti-accent"
            />
            <span className="text-sm text-forti-text-primary">{field.label}</span>
          </label>
        );

      case 'textarea':
        return (
          <textarea
            value={val}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="forti-input min-h-[80px]"
            rows={3}
          />
        );

      case 'tagsinput':
        return (
          <div>
            <div className="flex flex-wrap gap-1 mb-2">
              {(Array.isArray(val) ? val : []).map((tag: string, i: number) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                  {tag}
                  <button
                    onClick={() => {
                      const newArr = [...val];
                      newArr.splice(i, 1);
                      onChange(field.key, newArr);
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder={field.placeholder || 'Type and press Enter'}
              className="forti-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const v = input.value.trim();
                  if (v) {
                    onChange(field.key, [...(Array.isArray(val) ? val : []), v]);
                    input.value = '';
                  }
                }
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-forti-table-border bg-forti-table-header rounded-t-lg">
          <h3 className="text-base font-semibold text-forti-text-primary">
            {isNew ? 'Create' : 'Edit'} {title}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Array.from(groups.entries()).map(([groupName, groupFields]) => (
            <div key={groupName} className="mb-6">
              {groups.size > 1 && (
                <h4 className="text-sm font-semibold text-forti-text-primary border-b border-forti-table-border pb-2 mb-3">
                  {groupName}
                </h4>
              )}
              <div className="grid grid-cols-2 gap-4">
                {groupFields.map((field) => (
                  <div key={field.key} className={field.width === 'full' || field.type === 'textarea' || field.type === 'tagsinput' ? 'col-span-2' : ''}>
                    {field.type !== 'checkbox' && (
                      <label className="forti-label">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    )}
                    {renderField(field)}
                    {field.helpText && (
                      <p className="text-xs text-gray-400 mt-1">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-forti-table-border bg-gray-50 rounded-b-lg">
          <button onClick={onCancel} className="forti-btn-secondary">
            Cancel
          </button>
          <button onClick={onSave} className="forti-btn-primary">
            {isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
