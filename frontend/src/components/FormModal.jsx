import { useState } from 'react';
import Modal from './Modal.jsx';
import ErrorAlert from './ErrorAlert.jsx';

// onSubmit should throw on failure; the error is displayed inside the modal
export default function FormModal({ title, onClose, onSubmit, submitLabel = 'Save', submitDisabled = false, wide, children }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try { await onSubmit(); } catch (err) { setError(err); } finally { setBusy(false); }
  };

  return (
    <Modal title={title} onClose={onClose} wide={wide}>
      <form onSubmit={submit} className="space-y-4">
        {children}
        <ErrorAlert error={error} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy || submitDisabled}>
            {busy && <span className="loading loading-spinner loading-xs" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}