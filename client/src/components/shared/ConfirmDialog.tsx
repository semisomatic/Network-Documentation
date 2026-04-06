import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  danger = true,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-2 rounded-full ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <AlertTriangle size={20} className={danger ? 'text-red-600' : 'text-yellow-600'} />
          </div>
          <h3 className="text-base font-semibold text-forti-text-primary">{title}</h3>
        </div>
        <p className="text-sm text-forti-text-secondary mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onCancel} className="forti-btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className={danger ? 'forti-btn-danger' : 'forti-btn-primary'}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
