function Toast({ toast, onClose }) {
  if (!toast) {
    return null;
  }

  return (
    <div className="toast-wrap toast-wrap--visible" role="status" aria-live="polite">
      <div className={`toast toast-${toast.type}`}>
        <p>{toast.message}</p>
        <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss notification">
          ×
        </button>
      </div>
    </div>
  );
}

export default Toast;
