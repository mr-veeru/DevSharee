import React, { ReactNode } from 'react';
import '../common/common.css';
import './ConfirmModal.css';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
  confirmDisabled?: boolean;
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onClose,
  children,
  confirmDisabled = false
}) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={() => !loading && onClose()}>
      <div className="modal-content confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={() => !loading && onClose()}>×</button>
        </div>
        <div className="modal-body confirm-modal-body">
          {description && (
            <p className={`confirm-modal-description ${children ? 'with-children' : ''}`}>{description}</p>
          )}
          {children}
          <div className="confirm-modal-actions">
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              className="btn-danger"
              onClick={onConfirm}
              disabled={loading || confirmDisabled}
            >
              {loading ? 'Please wait...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;


