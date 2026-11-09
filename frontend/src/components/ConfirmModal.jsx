import { useState } from 'react';
import Modal from './Modal.jsx';

// onConfirm handles its own errors/toasts and is responsible for closing the modal
export default function ConfirmModal({ title = 'Are you sure?', message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="text-sm">{message}</div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn btn-error" onClick={go} disabled={busy}>
          {busy && <span className="loading loading-spinner loading-xs" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}