import { X } from 'lucide-react';

export default function Modal({ title, onClose, wide = false, children }) {
  return (
    <div className="modal modal-open" role="dialog">
      <div className={`modal-box border-2 border-base-content/20 ${wide ? 'max-w-3xl' : ''}`}>
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="font-pixel text-xs leading-relaxed">{title}</h3>
          <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}